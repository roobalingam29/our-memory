import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import multer from "multer";
import { randomUUID } from "crypto";

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "our_memories_secret_key_123456789";

// Initialize express app
const app = express();
app.use(express.json());

// Set up local storage folders if they do not exist (fallback mode)
const DATA_DIR = path.join(process.cwd(), "data");
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
const DB_FILE = path.join(DATA_DIR, "db.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], photos: [] }, null, 2));
}

// Serve uploaded files statically
app.use("/uploads", express.static(UPLOADS_DIR));

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY);
let supabase: any = null;

if (isSupabaseConfigured) {
  console.log("Initializing Supabase Client with URL:", SUPABASE_URL);
  supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);
} else {
  console.log("Supabase credentials not fully configured. Running in Local Database / File Storage mode.");
}

// Multer storage configuration
// In local mode, store files in UPLOADS_DIR. In Supabase mode, we process the buffer directly
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only image files (jpg, jpeg, png, gif, webp) are allowed!"));
  }
});

// Helper for local Database operations (fallback)
function getLocalData() {
  try {
    const content = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    return { users: [], photos: [] };
  }
}

function saveLocalData(data: any) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Helper to generate IDs
function generateUUID() {
  return randomUUID();
}

// ---------------------------------------------------------
// JWT Middleware for Protecting APIs
// ---------------------------------------------------------
interface AuthRequest extends express.Request {
  user?: {
    id: string;
    email: string;
    full_name: string;
    supabaseToken?: string;
  };
}

const authenticateToken = (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Access token required. Please log in." });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      res.status(403).json({ error: "Session expired or invalid token. Please log in again." });
      return;
    }
    req.user = user as any;
    next();
  });
};

// Helper to get a user-scoped or standard Supabase client
function getSupabaseClient(req: AuthRequest) {
  if (isSupabaseConfigured && req.user?.supabaseToken) {
    return createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      global: {
        headers: {
          Authorization: `Bearer ${req.user.supabaseToken}`
        }
      }
    });
  }
  return supabase;
}

// ---------------------------------------------------------
// API ROUTES
// ---------------------------------------------------------

// Health & System Info
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    database: isSupabaseConfigured ? "Supabase (Cloud)" : "Local JSON (Sandbox Fallback)",
    storage: isSupabaseConfigured ? "Supabase Bucket" : "Local Disk Storage"
  });
});

// 1. User Register Route
app.post("/api/register", async (req, res) => {
  const { full_name, email, password } = req.body;

  if (!full_name || !email || !password) {
    res.status(400).json({ error: "Full Name, Email, and Password are required." });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters long." });
    return;
  }

  const lowercaseEmail = email.toLowerCase().trim();

  try {
    const password_hash = await bcrypt.hash(password, 10);
    let id = generateUUID();
    const created_at = new Date().toISOString();
    let supabaseToken = "";

    if (isSupabaseConfigured) {
      // 1. Sign up the user in Supabase Auth to get a valid auth.users.id
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: lowercaseEmail,
        password: password,
      });

      if (authError) {
        // Handle "already registered" error gracefully by trying to sign in to verify password
        if (authError.message.toLowerCase().includes("already registered") || authError.status === 400) {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: lowercaseEmail,
            password: password,
          });

          if (signInError) {
            res.status(400).json({ error: `User already registered in Supabase auth, but verification failed: ${signInError.message}` });
            return;
          }

          if (signInData.user) {
            id = signInData.user.id;
            if (signInData.session) {
              supabaseToken = signInData.session.access_token;
            }
          }
        } else {
          throw new Error(`Supabase Auth sign up failed: ${authError.message}`);
        }
      } else if (authData.user) {
        id = authData.user.id;
        if (authData.session) {
          supabaseToken = authData.session.access_token;
        }
      } else {
        throw new Error("Failed to create authenticated user in Supabase.");
      }

      // Check if user already exists in our public users table
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("email", lowercaseEmail)
        .maybeSingle();

      if (existingUser) {
        // If they already exist in our users table, update password_hash to match
        const { error: updateError } = await supabase
          .from("users")
          .update({ password_hash, full_name })
          .eq("id", id);

        if (updateError) {
          throw new Error(`Failed to update user profile: ${updateError.message}`);
        }
      } else {
        // Insert new user to our public users table with the auth.users.id
        const { error: insertError } = await supabase
          .from("users")
          .insert([{ id, full_name, email: lowercaseEmail, password_hash, created_at }]);

        if (insertError) {
          throw new Error(`Public users table insert failed: ${insertError.message}`);
        }
      }
    } else {
      // Local fallback mode
      const db = getLocalData();
      const existingUser = db.users.find((u: any) => u.email === lowercaseEmail);
      if (existingUser) {
        res.status(400).json({ error: "An account with this email already exists." });
        return;
      }

      db.users.push({ id, full_name, email: lowercaseEmail, password_hash, created_at });
      saveLocalData(db);
    }

    // Generate JWT token containing the Supabase token for client-to-server forwarding
    const token = jwt.sign({ id, email: lowercaseEmail, full_name, supabaseToken }, JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({
      message: "Registration successful!",
      token,
      user: { id, full_name, email: lowercaseEmail }
    });
  } catch (error: any) {
    console.error("Register Error:", error);
    res.status(500).json({ error: error.message || "An error occurred during registration." });
  }
});

// 2. User Login Route
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }

  const lowercaseEmail = email.toLowerCase().trim();

  try {
    let userRecord: any = null;
    let id = "";
    let supabaseToken = "";

    if (isSupabaseConfigured) {
      // First check if they exist in our users table
      const { data: existingPublicUser, error: publicUserError } = await supabase
        .from("users")
        .select("*")
        .eq("email", lowercaseEmail)
        .maybeSingle();

      if (existingPublicUser) {
        // Try signing them in to Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: lowercaseEmail,
          password: password,
        });

        if (authError) {
          // If sign in fails, verify password via bcrypt to see if it's the correct password from our public table
          const isMatch = await bcrypt.compare(password, existingPublicUser.password_hash);
          if (!isMatch) {
            res.status(401).json({ error: "Invalid email or password." });
            return;
          }

          // If bcrypt matched, it means they are a valid user from before. Let's sign them up to Supabase Auth on the fly!
          const { data: newAuthData, error: newAuthError } = await supabase.auth.signUp({
            email: lowercaseEmail,
            password: password,
          });

          if (newAuthError) {
            // If they are actually registered but we got an error, maybe email confirmation is pending or similar
            res.status(401).json({ error: `Supabase login failed, and auto-registration failed: ${newAuthError.message}` });
            return;
          }

          userRecord = existingPublicUser;
          id = userRecord.id;
          if (newAuthData.session) {
            supabaseToken = newAuthData.session.access_token;
          }
        } else {
          userRecord = existingPublicUser;
          id = userRecord.id;
          if (authData.session) {
            supabaseToken = authData.session.access_token;
          }
        }
      } else {
        // Not in public users table. Try signing in directly to Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: lowercaseEmail,
          password: password,
        });

        if (authError) {
          res.status(401).json({ error: "Invalid email or password." });
          return;
        }

        id = authData.user!.id;
        if (authData.session) {
          supabaseToken = authData.session.access_token;
        }

        // Try to fetch or create public user record
        const { data: pubUser } = await supabase
          .from("users")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (pubUser) {
          userRecord = pubUser;
        } else {
          // Create user record on the fly
          const password_hash = await bcrypt.hash(password, 10);
          const created_at = new Date().toISOString();
          const newPubUser = {
            id,
            full_name: authData.user?.user_metadata?.full_name || "Lovebirds",
            email: lowercaseEmail,
            password_hash,
            created_at
          };

          const { error: insertErr } = await supabase
            .from("users")
            .insert([newPubUser]);

          if (insertErr) {
            console.error("Failed to create public user record on the fly:", insertErr);
          }
          userRecord = newPubUser;
        }
      }
    } else {
      const db = getLocalData();
      userRecord = db.users.find((u: any) => u.email === lowercaseEmail);

      if (!userRecord) {
        res.status(401).json({ error: "Invalid email or password." });
        return;
      }

      const isMatch = await bcrypt.compare(password, userRecord.password_hash);
      if (!isMatch) {
        res.status(401).json({ error: "Invalid email or password." });
        return;
      }
    }

    // Generate token containing user details and the Supabase session token
    const token = jwt.sign(
      { id: userRecord.id, email: userRecord.email, full_name: userRecord.full_name, supabaseToken },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful!",
      token,
      user: {
        id: userRecord.id,
        full_name: userRecord.full_name,
        email: userRecord.email
      }
    });
  } catch (error: any) {
    console.error("Login Error:", error);
    res.status(500).json({ error: error.message || "An error occurred during login." });
  }
});

// 3. Get All Photos
app.get("/api/photos", authenticateToken, async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  try {
    let photosList: any[] = [];

    if (isSupabaseConfigured) {
      const clientToUse = getSupabaseClient(req);
      const { data, error } = await clientToUse
        .from("photos")
        .select("*")
        .eq("user_id", userId)
        .order("photo_date", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }
      photosList = data || [];

      // Generate secure signed URLs for private photos in Supabase Storage
      const pathsToSign = photosList
        .map((p: any) => p.image_url)
        .filter((url: string) => url && !url.startsWith("http://") && !url.startsWith("https://"));

      if (pathsToSign.length > 0) {
        const { data: signedUrls, error: signedUrlsError } = await clientToUse.storage
          .from("photos")
          .createSignedUrls(pathsToSign, 86400); // 24 hours expiry

        if (!signedUrlsError && signedUrls) {
          const signedUrlMap = new Map<string, string>();
          signedUrls.forEach((item: any) => {
            if (item.signedUrl) {
              signedUrlMap.set(item.path, item.signedUrl);
            }
          });

          photosList = photosList.map((p: any) => {
            if (p.image_url && !p.image_url.startsWith("http://") && !p.image_url.startsWith("https://")) {
              return {
                ...p,
                image_url: signedUrlMap.get(p.image_url) || p.image_url
              };
            }
            return p;
          });
        }
      }
    } else {
      const db = getLocalData();
      photosList = db.photos
        .filter((p: any) => p.user_id === userId)
        .sort((a: any, b: any) => new Date(b.photo_date).getTime() - new Date(a.photo_date).getTime());
    }

    res.json(photosList);
  } catch (error: any) {
    console.error("Fetch Photos Error:", error);
    res.status(500).json({ error: error.message || "An error occurred while fetching your gallery." });
  }
});

// 4. Get Single Photo
app.get("/api/photos/:id", authenticateToken, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const photoId = req.params.id;

  try {
    let photo: any = null;

    if (isSupabaseConfigured) {
      const clientToUse = getSupabaseClient(req);
      const { data, error } = await clientToUse
        .from("photos")
        .select("*")
        .eq("id", photoId)
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }
      photo = data;

      if (photo && photo.image_url && !photo.image_url.startsWith("http://") && !photo.image_url.startsWith("https://")) {
        const { data: signedUrlData, error: signedUrlError } = await clientToUse.storage
          .from("photos")
          .createSignedUrl(photo.image_url, 86400); // 24 hours expiry

        if (!signedUrlError && signedUrlData) {
          photo = {
            ...photo,
            image_url: signedUrlData.signedUrl
          };
        }
      }
    } else {
      const db = getLocalData();
      photo = db.photos.find((p: any) => p.id === photoId && p.user_id === userId);
    }

    if (!photo) {
      res.status(404).json({ error: "Photo not found or unauthorized access." });
      return;
    }

    res.json(photo);
  } catch (error: any) {
    console.error("Get Photo Error:", error);
    res.status(500).json({ error: error.message || "An error occurred while retrieving the photo." });
  }
});

// 5. Post (Upload) New Photo
app.post("/api/photos", authenticateToken, upload.single("image"), async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const userSupabaseToken = req.user?.supabaseToken;
  const { title, description, photo_date } = req.body;
  const file = req.file;

  if (!file) {
    res.status(400).json({ error: "Please select an image file to upload." });
    return;
  }

  const finalTitle = title ? title.trim() : "Untitled Memory";
  const finalDescription = description ? description.trim() : "";
  const finalDate = photo_date ? photo_date : new Date().toISOString().split("T")[0];

  try {
    let image_url = "";
    const timestamp = Date.now();
    const uniqueFilename = `${timestamp}-${generateUUID()}${path.extname(file.originalname)}`;

    let clientToUse = supabase;
    let authUserUuid = "unknown";

    if (isSupabaseConfigured) {
      if (!userSupabaseToken) {
        console.error("[AUTH ERROR] Missing userSupabaseToken. User must log in again.");
        res.status(401).json({ error: "Your session needs to be refreshed to access secure storage. Please log out and log back in." });
        return;
      }

      console.log(`[AUTH] Creating authenticated user-scoped Supabase client...`);
      clientToUse = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        global: {
          headers: {
            Authorization: `Bearer ${userSupabaseToken}`
          }
        }
      });

      // Explicitly set the session on the client as well
      await clientToUse.auth.setSession({
        access_token: userSupabaseToken,
        refresh_token: ""
      });

      // Get authenticated user details and print the authenticated user's UUID
      try {
        const { data: { user }, error: userError } = await clientToUse.auth.getUser(userSupabaseToken);
        if (user) {
          authUserUuid = user.id;
          console.log(`[AUTH] Authenticated user UUID from supabase.auth.getUser(): ${authUserUuid}`);
        } else {
          console.warn(`[AUTH] No user object returned from supabase.auth.getUser()!`);
        }
        if (userError) {
          console.error(`[AUTH] supabase.auth.getUser() returned error:`, userError.message);
        }
      } catch (e: any) {
        console.error(`[AUTH] Error calling supabase.auth.getUser():`, e.message || e);
      }
    }

    // Determine the exact upload path: user_uuid/timestamp.jpg
    const finalUserUuid = authUserUuid !== "unknown" ? authUserUuid : userId;
    const storagePath = `${finalUserUuid}/${timestamp}.jpg`;
    const bucketName = "photos";

    // Print requirements to console logs
    console.log(`[UPLOAD DETAILS] Bucket Name: ${bucketName}`);
    console.log(`[UPLOAD DETAILS] Exact Upload Path: ${storagePath}`);
    console.log(`[UPLOAD DETAILS] Authenticated User UUID: ${finalUserUuid}`);

    if (isSupabaseConfigured) {
      // 1. Upload file buffer to Supabase Storage Bucket named "photos"
      const { data: storageData, error: uploadError } = await clientToUse.storage
        .from(bucketName)
        .upload(storagePath, file.buffer, {
          contentType: file.mimetype,
          cacheControl: "3600",
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Supabase storage upload failed: ${uploadError.message}`);
      }

      // Save the bucket storage path in the database
      image_url = storagePath;
    } else {
      // Local storage fallback
      const localFilePath = path.join(UPLOADS_DIR, uniqueFilename);
      fs.writeFileSync(localFilePath, file.buffer);
      image_url = `/uploads/${uniqueFilename}`;
    }

    // Save metadata record
    const photoId = generateUUID();
    const created_at = new Date().toISOString();
    const newPhoto = {
      id: photoId,
      user_id: finalUserUuid,
      title: finalTitle,
      description: finalDescription,
      image_url,
      photo_date: finalDate,
      created_at
    };

    if (isSupabaseConfigured) {
      const { error: insertError } = await clientToUse
        .from("photos")
        .insert([newPhoto]);

      if (insertError) {
        // Clean up uploaded storage file if db insert fails
        try {
          await clientToUse.storage.from("photos").remove([storagePath]);
        } catch (cleanupErr) {
          console.error("Failed to clean up storage after db insert error:", cleanupErr);
        }
        throw new Error(`Database record insertion failed: ${insertError.message}`);
      }
    } else {
      const db = getLocalData();
      db.photos.push(newPhoto);
      saveLocalData(db);
    }

    // Prepare response photo with a signed URL for display if using Supabase
    let responsePhoto = { ...newPhoto };
    if (isSupabaseConfigured) {
      const { data: signedUrlData, error: signedUrlError } = await clientToUse.storage
        .from("photos")
        .createSignedUrl(storagePath, 86400);

      if (!signedUrlError && signedUrlData) {
        responsePhoto.image_url = signedUrlData.signedUrl;
      }
    }

    res.status(201).json({
      message: "Memory uploaded successfully ❤️",
      photo: responsePhoto
    });
  } catch (error: any) {
    console.error("Upload Photo Error:", error);
    res.status(500).json({ error: error.message || "Failed to upload photo." });
  }
});

// 6. Update Photo Metadata (PUT)
app.put("/api/photos/:id", authenticateToken, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const photoId = req.params.id;
  const { title, description, photo_date } = req.body;

  try {
    let existingPhoto: any = null;

    if (isSupabaseConfigured) {
      const clientToUse = getSupabaseClient(req);
      const { data, error } = await clientToUse
        .from("photos")
        .select("*")
        .eq("id", photoId)
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw new Error(error.message);
      existingPhoto = data;
    } else {
      const db = getLocalData();
      existingPhoto = db.photos.find((p: any) => p.id === photoId && p.user_id === userId);
    }

    if (!existingPhoto) {
      res.status(404).json({ error: "Photo not found or unauthorized edit attempt." });
      return;
    }

    const updatedPhoto = {
      ...existingPhoto,
      title: title !== undefined ? title.trim() : existingPhoto.title,
      description: description !== undefined ? description.trim() : existingPhoto.description,
      photo_date: photo_date !== undefined ? photo_date : existingPhoto.photo_date
    };

    if (isSupabaseConfigured) {
      const clientToUse = getSupabaseClient(req);
      const { error: updateError } = await clientToUse
        .from("photos")
        .update({
          title: updatedPhoto.title,
          description: updatedPhoto.description,
          photo_date: updatedPhoto.photo_date
        })
        .eq("id", photoId);

      if (updateError) throw new Error(updateError.message);
    } else {
      const db = getLocalData();
      const index = db.photos.findIndex((p: any) => p.id === photoId);
      if (index !== -1) {
        db.photos[index] = updatedPhoto;
        saveLocalData(db);
      }
    }

    res.json({
      message: "Memory updated successfully",
      photo: updatedPhoto
    });
  } catch (error: any) {
    console.error("Update Photo Error:", error);
    res.status(500).json({ error: error.message || "Failed to update memory." });
  }
});

// 7. Delete Photo
app.delete("/api/photos/:id", authenticateToken, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const photoId = req.params.id;

  try {
    let existingPhoto: any = null;

    if (isSupabaseConfigured) {
      const clientToUse = getSupabaseClient(req);
      const { data, error } = await clientToUse
        .from("photos")
        .select("*")
        .eq("id", photoId)
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw new Error(error.message);
      existingPhoto = data;
    } else {
      const db = getLocalData();
      existingPhoto = db.photos.find((p: any) => p.id === photoId && p.user_id === userId);
    }

    if (!existingPhoto) {
      res.status(404).json({ error: "Photo not found or unauthorized deletion attempt." });
      return;
    }

    // Try deleting physical file
    const imageUrl = existingPhoto.image_url;
    if (isSupabaseConfigured) {
      const clientToUse = getSupabaseClient(req);
      try {
        if (imageUrl && !imageUrl.startsWith("http://") && !imageUrl.startsWith("https://")) {
          // Direct storage path
          await clientToUse.storage.from("photos").remove([imageUrl]);
        } else if (imageUrl) {
          // Parse file name from older Supabase URL
          const urlParts = imageUrl.split("/photos/");
          if (urlParts.length > 1) {
            const storageFilename = urlParts[1];
            await clientToUse.storage.from("photos").remove([storageFilename]);
          }
        }
      } catch (e) {
        console.warn("Could not delete from Supabase storage, continuing database deletion:", e);
      }

      // Delete database record
      const { error: deleteError } = await clientToUse
        .from("photos")
        .delete()
        .eq("id", photoId);

      if (deleteError) throw new Error(deleteError.message);
    } else {
      // Local delete
      try {
        const filename = path.basename(imageUrl);
        const localFilePath = path.join(UPLOADS_DIR, filename);
        if (fs.existsSync(localFilePath)) {
          fs.unlinkSync(localFilePath);
        }
      } catch (e) {
        console.warn("Could not delete local file, continuing database deletion:", e);
      }

      const db = getLocalData();
      db.photos = db.photos.filter((p: any) => p.id !== photoId);
      saveLocalData(db);
    }

    res.json({ message: "Memory deleted successfully." });
  } catch (error: any) {
    console.error("Delete Photo Error:", error);
    res.status(500).json({ error: error.message || "Failed to delete memory." });
  }
});

// 8. Profile: Update Password
app.post("/api/profile/change-password", authenticateToken, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { current_password, new_password } = req.body;

  if (!current_password || !new_password) {
    res.status(400).json({ error: "Both current password and new password are required." });
    return;
  }

  if (new_password.length < 8) {
    res.status(400).json({ error: "New password must be at least 8 characters long." });
    return;
  }

  try {
    let userRecord: any = null;

    if (isSupabaseConfigured) {
      const clientToUse = getSupabaseClient(req);
      const { data, error } = await clientToUse
        .from("users")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw new Error(error.message);
      userRecord = data;
    } else {
      const db = getLocalData();
      userRecord = db.users.find((u: any) => u.id === userId);
    }

    if (!userRecord) {
      res.status(404).json({ error: "User account not found." });
      return;
    }

    const isMatch = await bcrypt.compare(current_password, userRecord.password_hash);
    if (!isMatch) {
      res.status(400).json({ error: "Your current password is incorrect." });
      return;
    }

    const hashedNewPassword = await bcrypt.hash(new_password, 10);

    if (isSupabaseConfigured) {
      const clientToUse = getSupabaseClient(req);
      const { error: updateError } = await clientToUse
        .from("users")
        .update({ password_hash: hashedNewPassword })
        .eq("id", userId);

      if (updateError) throw new Error(updateError.message);
    } else {
      const db = getLocalData();
      const index = db.users.findIndex((u: any) => u.id === userId);
      if (index !== -1) {
        db.users[index].password_hash = hashedNewPassword;
        saveLocalData(db);
      }
    }

    res.json({ message: "Password updated successfully!" });
  } catch (error: any) {
    console.error("Change Password Error:", error);
    res.status(500).json({ error: error.message || "Failed to change password." });
  }
});

// ---------------------------------------------------------
// VITE OR STATIC FRONTEND SERVING
// ---------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development Mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production Mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Our Memories application running on http://localhost:${PORT}`);
  });
}

startServer();
