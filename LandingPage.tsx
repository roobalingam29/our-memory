/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { Heart, Lock, ShieldCheck, Sparkles, Image as ImageIcon, Calendar } from "lucide-react";

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="relative overflow-hidden min-h-[calc(100vh-4rem)] flex flex-col justify-between bg-transparent">
      {/* Decorative background shapes */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-red-500/5 rounded-full mix-blend-screen filter blur-3xl opacity-60 animate-pulse duration-10000" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-orange-500/5 rounded-full mix-blend-screen filter blur-3xl opacity-60 animate-pulse duration-8000" />

      {/* Main Hero Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 relative z-10 flex-grow flex flex-col justify-center">
        <div className="text-center max-w-3xl mx-auto">
          {/* Heart Emblem */}
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-white/5 border border-white/10 mb-6 shadow-xl">
            <Heart className="w-8 h-8 text-red-500 fill-red-500 animate-pulse filter drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl font-light text-white tracking-tight mb-6">
            Our Memories <span className="italic serif text-red-500 glow-text text-3xl sm:text-5xl">❤️</span>
          </h1>

          <p className="font-sans text-base sm:text-lg text-gray-300 font-light leading-relaxed mb-8 max-w-2xl mx-auto">
            A private, beautifully crafted digital scrapbook made exclusively for you and your significant other. 
            Keep your sweet photos, dates, and love stories safe, secure, and forever cherished.
          </p>

          {/* Action Callouts */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-xl text-sm font-semibold hover:from-red-500 hover:to-orange-400 transition-all duration-300 shadow-lg shadow-red-950/40 flex items-center justify-center gap-2 hover:-translate-y-0.5"
              >
                Go to Dashboard
                <Sparkles className="w-4 h-4 fill-white" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="w-full sm:w-auto px-8 py-3.5 glass text-white rounded-xl text-sm font-semibold hover:bg-white/10 transition-all duration-300 flex items-center justify-center gap-2 hover:-translate-y-0.5 shadow-sm"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-xl text-sm font-semibold hover:from-red-500 hover:to-orange-400 transition-all duration-300 flex items-center justify-center gap-2 hover:-translate-y-0.5 shadow-lg shadow-red-950/40"
                >
                  Create Your Gallery
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-4 max-w-5xl mx-auto">
          {/* Card 1 */}
          <div className="bg-[#121212]/50 backdrop-blur-md p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-all duration-300 flex flex-col items-start shadow-xl">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-red-400 mb-4">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-light text-white mb-2 italic">Absolute Privacy</h3>
            <p className="text-gray-400 text-sm leading-relaxed font-light">
              Protected by JWT session authentication. Only you and your significant other can access your private space.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-[#121212]/50 backdrop-blur-md p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-all duration-300 flex flex-col items-start shadow-xl">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-orange-400 mb-4">
              <ImageIcon className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-light text-white mb-2 italic">Rich Photo Details</h3>
            <p className="text-gray-400 text-sm leading-relaxed font-light">
              Add stories, sweet descriptions, titles, and calendar dates to every single memory to keep the context alive.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-[#121212]/50 backdrop-blur-md p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-all duration-300 flex flex-col items-start shadow-xl">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-rose-400 mb-4">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-light text-white mb-2 italic">Cloud Sync Ready</h3>
            <p className="text-gray-400 text-sm leading-relaxed font-light">
              High-resolution memories are safely indexed and accessible, ensuring your favorite milestones never fade.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 text-center text-xs text-gray-500 bg-transparent relative z-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Our Memories. Designed with love and protection.</p>
          <div className="flex items-center gap-2 text-gray-400 font-mono text-[10px]">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Private Secure Vault
          </div>
        </div>
      </footer>
    </div>
  );
}
