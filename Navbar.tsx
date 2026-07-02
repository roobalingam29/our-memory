/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { Heart, Image as ImageIcon, Upload, User as UserIcon, LogOut, Menu, X, ShieldAlert } from "lucide-react";

export default function Navbar() {
  const { isAuthenticated, user, logout, systemHealth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
    setIsOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-black/40 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center">
            <Link to={isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-2 group">
              <Heart className="w-6 h-6 text-red-500 fill-red-500 group-hover:scale-110 transition-transform duration-300 filter drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
              <span className="font-serif text-xl font-semibold bg-gradient-to-r from-red-500 via-orange-400 to-rose-400 bg-clip-text text-transparent glow-text">
                Our Memories
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          {isAuthenticated ? (
            <div className="hidden md:flex items-center space-x-2">
              {/* Database indicator */}
              {systemHealth && (
                <div className="mr-4 px-2.5 py-1 rounded-full text-[10px] bg-white/5 border border-white/10 text-gray-400 flex items-center gap-1.5 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {systemHealth.database === "Supabase (Cloud)" ? "Supabase" : "Sandbox"}
                </div>
              )}

              <Link
                to="/dashboard"
                className={`px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide uppercase transition-colors duration-200 ${
                  isActive("/dashboard")
                    ? "bg-white/10 text-white border border-white/10"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                Dashboard
              </Link>

              <Link
                to="/gallery"
                className={`px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide uppercase flex items-center gap-1.5 transition-colors duration-200 ${
                  isActive("/gallery")
                    ? "bg-white/10 text-white border border-white/10"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                Gallery
              </Link>

              <Link
                to="/upload"
                className={`px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide uppercase flex items-center gap-1.5 transition-colors duration-200 ${
                  isActive("/upload")
                    ? "bg-white/10 text-white border border-white/10"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                Upload Photo
              </Link>

              <Link
                to="/profile"
                className={`px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide uppercase flex items-center gap-1.5 transition-colors duration-200 ${
                  isActive("/profile")
                    ? "bg-white/10 text-white border border-white/10"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <UserIcon className="w-3.5 h-3.5" />
                Profile
              </Link>

              <div className="h-4 w-px bg-white/10 mx-2" />

              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 font-light hidden lg:inline max-w-[120px] truncate">
                  Hi, <span className="italic serif font-semibold text-white">{user?.full_name.split(" ")[0]}</span> ❤️
                </span>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors duration-200"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="hidden md:flex items-center space-x-3">
              <Link
                to="/login"
                className="px-4 py-2 rounded-lg text-xs font-medium uppercase tracking-wider text-gray-400 hover:bg-white/5 hover:text-white transition-colors duration-200"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-lg text-xs font-medium uppercase tracking-wider bg-red-600 text-white hover:bg-red-700 transition-colors duration-200 shadow-lg shadow-red-900/20"
              >
                Register
              </Link>
            </div>
          )}

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-gray-400 hover:bg-white/5 focus:outline-none"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#0c0c0c]/95 backdrop-blur-2xl px-2 pt-2 pb-4 space-y-1">
          {isAuthenticated ? (
            <>
              {systemHealth && (
                <div className="px-3 py-2 mx-1 rounded-lg text-xs bg-white/5 border border-white/10 text-gray-400 flex items-center gap-1.5 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  DB: {systemHealth.database === "Supabase (Cloud)" ? "Supabase Cloud" : "Sandbox"}
                </div>
              )}
              <Link
                to="/dashboard"
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2 rounded-lg text-base font-medium ${
                  isActive("/dashboard") ? "bg-white/10 text-white" : "text-gray-300 hover:bg-white/5"
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/gallery"
                onClick={() => setIsOpen(false)}
                className={`px-3 py-2 rounded-lg text-base font-medium flex items-center gap-2 ${
                  isActive("/gallery") ? "bg-white/10 text-white" : "text-gray-300 hover:bg-white/5"
                }`}
              >
                <ImageIcon className="w-5 h-5" />
                Gallery
              </Link>
              <Link
                to="/upload"
                onClick={() => setIsOpen(false)}
                className={`px-3 py-2 rounded-lg text-base font-medium flex items-center gap-2 ${
                  isActive("/upload") ? "bg-white/10 text-white" : "text-gray-300 hover:bg-white/5"
                }`}
              >
                <Upload className="w-5 h-5" />
                Upload Photo
              </Link>
              <Link
                to="/profile"
                onClick={() => setIsOpen(false)}
                className={`px-3 py-2 rounded-lg text-base font-medium flex items-center gap-2 ${
                  isActive("/profile") ? "bg-white/10 text-white" : "text-gray-300 hover:bg-white/5"
                }`}
              >
                <UserIcon className="w-5 h-5" />
                Profile
              </Link>
              <div className="h-px bg-white/10 my-2" />
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 rounded-lg text-base font-medium text-red-400 hover:bg-red-500/10 flex items-center gap-2"
              >
                <LogOut className="w-5 h-5" />
                Logout (Hi, {user?.full_name.split(" ")[0]} ❤️)
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-gray-300 hover:bg-white/5"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium bg-red-600 text-white hover:bg-red-700 text-center mx-1"
              >
                Register
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
