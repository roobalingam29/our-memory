/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { Upload, ImageIcon, Calendar, FileText, CheckCircle2, AlertCircle, ArrowLeft, Trash2 } from "lucide-react";

export default function UploadPhoto() {
  const { apiFetch } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [photoDate, setPhotoDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  // Handle manual file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFile(file);
    }
  };

  // Helper to set selected file and its preview URL
  const setFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }
    setError(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  // Drag and drop event handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setFile(file);
    }
  };

  const removeSelectedFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedFile) {
      setError("Please select an image file to upload.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);
      formData.append("title", title);
      formData.append("description", description);
      formData.append("photo_date", photoDate);

      // Perform upload
      const response = await apiFetch("/api/photos", {
        method: "POST",
        body: formData, // No Content-Type header so fetch sets boundary automatically for multipart/form-data
      });

      setSuccess("Your precious memory has been preserved safely ❤️");
      setTitle("");
      setDescription("");
      setPhotoDate(new Date().toISOString().split("T")[0]);
      removeSelectedFile();

      // Redirect to gallery after a brief delay
      setTimeout(() => {
        navigate("/gallery");
      }, 1500);

    } catch (err: any) {
      setError(err.message || "An error occurred while uploading. Please check constraints.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-transparent py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        
        {/* Back Link */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white text-sm font-semibold mb-6 group transition-colors"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Dashboard
        </button>

        <div className="bg-[#121212]/50 backdrop-blur-md rounded-3xl border border-white/5 p-6 sm:p-10 shadow-2xl">
          
          <div className="border-b border-white/10 pb-6 mb-8">
            <h1 className="font-serif text-2xl sm:text-3xl font-light text-white italic glow-text">Upload New Memory</h1>
            <p className="text-gray-400 text-sm mt-1 font-light">Capture a beautiful day and lock it in your timeline forever ❤️</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-950/20 border border-red-500/20 rounded-2xl flex items-start gap-3 text-sm text-red-300 animate-fadeIn">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-2xl flex items-start gap-3 text-sm text-emerald-300 animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Image Upload Zone */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Memory Photograph
              </label>

              {!previewUrl ? (
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
                    dragActive
                      ? "border-red-500 bg-red-500/10 scale-[0.99]"
                      : "border-white/10 bg-white/[0.01] hover:border-red-500/40 hover:bg-white/[0.03]"
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-red-400 mb-4 shadow-xl">
                    <Upload className="w-8 h-8" />
                  </div>
                  <p className="font-serif font-light text-white text-base mb-1 italic">
                    Drag & Drop your photograph
                  </p>
                  <p className="text-gray-400 text-xs text-center max-w-xs font-light">
                    or <span className="text-red-400 underline font-semibold">browse files</span> from your computer. (JPG, PNG, GIF, WEBP up to 10MB)
                  </p>
                </div>
              ) : (
                <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-white/[0.01] p-3">
                  <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-black/40 shadow-inner">
                    <img
                      src={previewUrl}
                      alt="Selected preview"
                      className="w-full h-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={removeSelectedFile}
                      className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-red-600 text-white rounded-full transition-colors duration-200 backdrop-blur-sm"
                      title="Remove image"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 px-2 mt-3 text-xs text-gray-400 font-light">
                    <ImageIcon className="w-4 h-4 text-gray-500" />
                    <span className="truncate font-mono">{selectedFile?.name}</span>
                    <span className="shrink-0">•</span>
                    <span className="shrink-0 font-mono">{(selectedFile!.size / (1024 * 1024)).toFixed(2)} MB</span>
                  </div>
                </div>
              )}
            </div>

            {/* Title Input */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2" htmlFor="title">
                Memory Title (Optional)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500">
                  <ImageIcon className="w-5 h-5" />
                </span>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Anniversary Picnic in the Park, Road Trip!"
                  className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                />
              </div>
            </div>

            {/* Metadata Flex row: Date & Description */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Photo Date */}
              <div className="md:col-span-1">
                <label className="block text-gray-300 text-sm font-medium mb-2" htmlFor="photo_date">
                  Memory Date
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500">
                    <Calendar className="w-5 h-5" />
                  </span>
                  <input
                    id="photo_date"
                    type="date"
                    value={photoDate}
                    onChange={(e) => setPhotoDate(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-gray-300 text-sm font-medium mb-2" htmlFor="description">
                  Memory Story (Optional)
                </label>
                <div className="relative">
                  <span className="absolute top-3.5 left-3.5 text-gray-500">
                    <FileText className="w-5 h-5" />
                  </span>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell the beautiful story or special moment behind this photograph..."
                    rows={1}
                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all min-h-[46px] resize-y"
                  />
                </div>
              </div>

            </div>

            {/* Action buttons */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="px-5 py-2.5 border border-white/10 text-gray-300 rounded-full text-sm font-semibold hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-full text-sm font-bold hover:from-red-500 hover:to-orange-400 shadow-xl flex items-center gap-2 disabled:opacity-75 disabled:cursor-wait transition-all"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Uploading Photograph...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Lock In Memory
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
