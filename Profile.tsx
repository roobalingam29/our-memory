/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { User, Key, LogOut, CheckCircle2, AlertCircle, ArrowLeft, ShieldCheck, Mail, Calendar } from "lucide-react";

export default function Profile() {
  const { user, logout, apiFetch, systemHealth } = useAuth();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError("Confirm password must match your new password.");
      return;
    }

    setLoading(true);

    try {
      await apiFetch("/api/profile/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      setSuccess("Your account password has been updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err: any) {
      setError(err.message || "Failed to update password. Check your current password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-transparent py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white text-sm font-semibold mb-6 group transition-colors"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Dashboard
        </button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Account Profile Card */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-[#121212]/50 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center text-center">
              {/* Profile Icon */}
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-red-500 border border-white/10 shadow-xl mb-4">
                <User className="w-10 h-10 filter drop-shadow-[0_0_6px_rgba(239,68,68,0.4)]" />
              </div>

              <h2 className="font-serif text-xl font-light text-white italic leading-tight">
                {user?.full_name || "Lovebirds"}
              </h2>
              <p className="text-gray-400 text-xs font-medium mt-1">Our Memories Member</p>

              <div className="h-px bg-white/5 w-full my-6" />

              {/* Info Block */}
              <div className="w-full text-left space-y-4">
                <div className="flex items-center gap-3 text-gray-300 text-sm">
                  <Mail className="w-4 h-4 text-red-400 shrink-0" />
                  <span className="truncate font-light">{user?.email}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300 text-sm">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-semibold text-emerald-400">JWT Authenticated</span>
                </div>
                {systemHealth && (
                  <div className="p-3.5 bg-black/40 rounded-2xl border border-white/5 mt-4">
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider font-mono">
                      Database Connection
                    </p>
                    <p className="text-xs font-light text-gray-300 mt-1 font-mono">
                      {systemHealth.database}
                    </p>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider font-mono mt-3">
                      Storage Backend
                    </p>
                    <p className="text-xs font-light text-gray-300 mt-1 font-mono">
                      {systemHealth.storage}
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="w-full mt-6 py-2.5 glass text-white hover:bg-white/10 rounded-full text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>

          {/* Change Password Panel */}
          <div className="md:col-span-2">
            <div className="bg-[#121212]/50 backdrop-blur-md p-6 sm:p-10 rounded-3xl border border-white/5 shadow-2xl">
              <div className="border-b border-white/10 pb-4 mb-6">
                <h2 className="font-serif text-xl sm:text-2xl font-light text-white flex items-center gap-2 italic glow-text">
                  <Key className="w-5 h-5 text-red-500" />
                  Change Account Password
                </h2>
                <p className="text-gray-400 text-xs sm:text-sm mt-1 font-light">
                  Keep your digital album highly secure with a robust new password phrase.
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-950/20 border border-red-500/20 rounded-2xl flex items-start gap-3 text-sm text-red-300">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="mb-6 p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-2xl flex items-start gap-3 text-sm text-emerald-300 animate-pulse">
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
                  <span>{success}</span>
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-1.5" htmlFor="curr_pass">
                    Current Password
                  </label>
                  <input
                    id="curr_pass"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-1.5" htmlFor="new_pass">
                    New Password (min 8 chars)
                  </label>
                  <input
                    id="new_pass"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-1.5" htmlFor="confirm_new_pass">
                    Confirm New Password
                  </label>
                  <input
                    id="confirm_new_pass"
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                    required
                  />
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-full text-sm font-bold hover:from-red-500 hover:to-orange-400 transition-all duration-200 shadow-xl flex items-center gap-2 disabled:opacity-70 disabled:cursor-wait"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Securing Password...
                      </>
                    ) : (
                      <>
                        Update Password
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
