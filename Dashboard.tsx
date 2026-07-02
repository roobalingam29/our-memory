/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { Photo } from "../types";
import { Heart, Upload, Image as ImageIcon, User, LogOut, ArrowRight, Calendar, Sparkles } from "lucide-react";

export default function Dashboard() {
  const { user, logout, apiFetch } = useAuth();
  const navigate = useNavigate();
  const [latestPhotos, setLatestPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const photos = await apiFetch("/api/photos");
        setLatestPhotos(photos.slice(0, 3)); // show top 3 latest
      } catch (err) {
        console.error("Could not fetch latest memories:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLatest();
  }, []);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-transparent py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/10 rounded-3xl p-6 sm:p-10 text-white shadow-2xl mb-10 backdrop-blur-md">
          {/* Ambient Glow Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-orange-500/10 opacity-40" />
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full filter blur-3xl" />
          <div className="absolute bottom-0 left-10 w-32 h-32 bg-red-400/10 rounded-full filter blur-2xl" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-semibold bg-white/5 border border-white/10 text-red-400 mb-3 shadow-sm">
                <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500 animate-pulse filter drop-shadow-[0_0_4px_rgba(239,68,68,0.5)]" /> Private Couples Space
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl font-light tracking-tight text-white glow-text">
                Welcome Back, <span className="italic serif text-red-400">{user?.full_name || "Lovebirds"}</span> ❤️
              </h1>
              <p className="text-gray-300 text-sm sm:text-base mt-2 max-w-xl font-light">
                Welcome back to your safe space of memories. Here, every uploaded picture preserves a moment of your beautiful timeline.
              </p>
            </div>
            <Link
              to="/upload"
              className="px-6 py-2.5 glass text-white hover:bg-white/10 font-semibold rounded-full text-sm shadow-xl hover:-translate-y-0.5 transition-all duration-200 shrink-0 flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload New Memory
            </Link>
          </div>
        </div>

        {/* Action Grid */}
        <h2 className="font-serif text-xl font-light text-white mb-6 flex items-center gap-2 glow-text italic">
          <Sparkles className="w-5 h-5 text-red-500 fill-red-500" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Action: Upload Photo */}
          <Link
            to="/upload"
            className="group bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 hover:border-white/15 shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-red-400 w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                <Upload className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-light italic text-lg text-white mb-1">Upload Photo</h3>
              <p className="text-gray-400 text-xs leading-relaxed font-light">
                Add a new sweet moment with description, titles, and dates.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1.5 text-red-400 font-semibold text-xs tracking-wider uppercase">
              Upload Now <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Action: View Gallery */}
          <Link
            to="/gallery"
            className="group bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 hover:border-white/15 shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-orange-400 w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                <ImageIcon className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-light italic text-lg text-white mb-1">View Gallery</h3>
              <p className="text-gray-400 text-xs leading-relaxed font-light">
                Browse through all your captured events in an interactive grid.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1.5 text-orange-400 font-semibold text-xs tracking-wider uppercase">
              Browse Gallery <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Action: Profile */}
          <Link
            to="/profile"
            className="group bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 hover:border-white/15 shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-amber-500 w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                <User className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-light italic text-lg text-white mb-1">Manage Profile</h3>
              <p className="text-gray-400 text-xs leading-relaxed font-light">
                Check account details or secure your profile with a new password.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1.5 text-amber-400 font-semibold text-xs tracking-wider uppercase">
              Go to Profile <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Action: Logout */}
          <button
            onClick={() => {
              logout();
              navigate("/");
            }}
            className="group bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 hover:border-white/15 shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between text-left w-full"
          >
            <div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                <LogOut className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-light italic text-lg text-white mb-1">Logout</h3>
              <p className="text-gray-400 text-xs leading-relaxed font-light">
                Safely end your secure photo-viewing session.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1.5 text-gray-300 font-semibold text-xs tracking-wider uppercase">
              Secure Exit <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>

        {/* Latest Memories Showcase */}
        <div className="bg-[#121212]/50 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-white/5 shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-serif text-lg sm:text-xl font-light text-white flex items-center gap-2 italic">
              <ImageIcon className="w-5 h-5 text-red-500" />
              Latest Sweet Memories
            </h3>
            <Link to="/gallery" className="text-red-400 hover:text-red-300 text-xs font-semibold flex items-center gap-1">
              View All Gallery <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <svg className="animate-spin h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-gray-400 text-xs font-mono">Peeking at memories...</p>
            </div>
          ) : latestPhotos.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <p className="text-gray-300 text-sm font-medium">No photos have been uploaded yet.</p>
              <p className="text-gray-500 text-xs mt-1">Start by adding your first romantic photo together!</p>
              <Link
                to="/upload"
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-full text-xs font-semibold hover:from-red-500 hover:to-orange-400 transition-all shadow-lg"
              >
                <Upload className="w-3.5 h-3.5" /> Add First Memory
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {latestPhotos.map((photo) => (
                <div
                  key={photo.id}
                  onClick={() => navigate("/gallery")}
                  className="group bg-white/[0.02] p-3 rounded-2xl border border-white/5 cursor-pointer hover:bg-white/[0.06] hover:border-white/10 transition-all duration-300 shadow-lg"
                >
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-3 bg-neutral-900">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 opacity-80" />
                    <img
                      src={photo.image_url}
                      alt={photo.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <h4 className="font-serif font-light text-white text-sm truncate italic">{photo.title}</h4>
                  <div className="flex items-center gap-1 mt-1 text-gray-400 text-[10px]">
                    <Calendar className="w-3 h-3 text-red-400" />
                    <span>{photo.photo_date}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
