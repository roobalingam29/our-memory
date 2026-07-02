/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { Photo } from "../types";
import { Search, Calendar, Edit, Trash2, Eye, CalendarDays, BookOpen, Sparkles, Filter, X, ChevronLeft, ChevronRight, Download } from "lucide-react";

export default function Gallery() {
  const { apiFetch } = useAuth();
  const navigate = useNavigate();

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [selectedDateFilter, setSelectedDateFilter] = useState("");

  // Modal states
  const [activePhoto, setActivePhoto] = useState<Photo | null>(null); // View modal
  const [editPhoto, setEditPhoto] = useState<Photo | null>(null); // Edit modal
  const [deleteId, setDeleteId] = useState<string | null>(null); // Delete confirmation

  // Edit fields
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDate, setEditDate] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fetch photos on load
  const fetchPhotos = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch("/api/photos");
      setPhotos(data);
    } catch (err: any) {
      setError(err.message || "Failed to retrieve your gallery memories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  // Open Edit Modal helper
  const handleOpenEdit = (photo: Photo, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditPhoto(photo);
    setEditTitle(photo.title);
    setEditDescription(photo.description);
    setEditDate(photo.photo_date);
  };

  // Submit Edit Metadata
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPhoto) return;

    setSavingEdit(true);
    try {
      const updated = await apiFetch(`/api/photos/${editPhoto.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          photo_date: editDate,
        }),
      });

      // Update state
      setPhotos(photos.map(p => p.id === editPhoto.id ? updated.photo : p));
      
      // If currently viewing this photo in detail, update it there too
      if (activePhoto && activePhoto.id === editPhoto.id) {
        setActivePhoto(updated.photo);
      }

      setEditPhoto(null);
    } catch (err: any) {
      alert(err.message || "Could not update details.");
    } finally {
      setSavingEdit(false);
    }
  };

  // Delete Action
  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      await apiFetch(`/api/photos/${id}`, {
        method: "DELETE",
      });

      // Update state
      setPhotos(photos.filter(p => p.id !== id));
      setDeleteId(null);
      if (activePhoto && activePhoto.id === id) {
        setActivePhoto(null);
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete memory.");
    } finally {
      setDeleting(false);
    }
  };

  // Filter & Sort photos list
  const filteredPhotos = photos
    .filter((photo) => {
      const matchesSearch =
        photo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        photo.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDate = selectedDateFilter ? photo.photo_date === selectedDateFilter : true;
      return matchesSearch && matchesDate;
    })
    .sort((a, b) => {
      const dateA = new Date(a.photo_date).getTime();
      const dateB = new Date(b.photo_date).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

  // Navigate photos inside view modal
  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activePhoto) return;
    const currentIndex = filteredPhotos.findIndex(p => p.id === activePhoto.id);
    if (currentIndex > 0) {
      setActivePhoto(filteredPhotos[currentIndex - 1]);
    }
  };

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activePhoto) return;
    const currentIndex = filteredPhotos.findIndex(p => p.id === activePhoto.id);
    if (currentIndex < filteredPhotos.length - 1) {
      setActivePhoto(filteredPhotos[currentIndex + 1]);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-transparent py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-white/10 pb-6 mb-8 gap-4">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl font-light text-white flex items-center gap-2 glow-text">
              Our Gallery <span className="text-red-500 animate-pulse text-2xl sm:text-3xl">📸</span>
            </h1>
            <p className="text-gray-400 text-sm mt-1 font-light">A private visual timeline of our special moments together.</p>
          </div>
          <button
            onClick={() => navigate("/upload")}
            className="w-fit px-5 py-2.5 glass text-white hover:bg-white/10 font-semibold rounded-full text-sm transition-all duration-200 flex items-center gap-2 shadow-xl self-start"
          >
            <Calendar className="w-4 h-4" /> Add New Memory
          </button>
        </div>

        {/* Filters and Search panel */}
        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md shadow-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8">
          {/* Search bar */}
          <div className="relative flex-grow max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search title or story..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/15 focus:border-red-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sorters and Date Pickers */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Sort Order */}
            <div className="flex items-center gap-1.5 text-gray-400 text-xs">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={sortOrder}
                onChange={(e: any) => setSortOrder(e.target.value)}
                className="bg-[#121212] border border-white/10 rounded-xl px-3 py-1.5 text-xs font-medium text-white focus:outline-none focus:border-red-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>

            {/* Date filter */}
            <div className="flex items-center gap-1.5 text-gray-400 text-xs">
              <CalendarDays className="w-4 h-4 text-gray-500" />
              <input
                type="date"
                value={selectedDateFilter}
                onChange={(e) => setSelectedDateFilter(e.target.value)}
                className="bg-[#121212] border border-white/10 rounded-xl px-2 py-1 text-xs text-white focus:outline-none focus:border-red-500"
              />
              {selectedDateFilter && (
                <button
                  onClick={() => setSelectedDateFilter("")}
                  className="text-gray-400 hover:text-red-400 font-bold"
                  title="Clear Date Filter"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Gallery Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <svg className="animate-spin h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-gray-400 text-sm font-mono animate-pulse">Polishing polaroids...</p>
          </div>
        ) : error ? (
          <div className="bg-red-950/20 border border-red-500/20 rounded-2xl p-6 text-center text-red-300 max-w-md mx-auto">
            <p className="font-semibold text-base mb-2">Error Loading Gallery</p>
            <p className="text-sm mb-4">{error}</p>
            <button
              onClick={fetchPhotos}
              className="px-4 py-2 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-lg text-xs font-semibold hover:from-red-500 hover:to-orange-400"
            >
              Retry Load
            </button>
          </div>
        ) : filteredPhotos.length === 0 ? (
          <div className="text-center py-20 px-4 bg-[#121212]/50 border border-white/5 rounded-3xl max-w-xl mx-auto">
            <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="font-serif text-lg font-light text-white">No memories found</h3>
            <p className="text-gray-400 text-sm mt-1 max-w-xs mx-auto font-light">
              {photos.length === 0
                ? "Your gallery is currently empty. Start building your romantic scrapbook today!"
                : "No matching items for your search terms or filters."}
            </p>
            <button
              onClick={() => {
                if (photos.length === 0) {
                  navigate("/upload");
                } else {
                  setSearchTerm("");
                  setSelectedDateFilter("");
                }
              }}
              className="mt-6 px-5 py-2.5 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-full text-xs font-semibold hover:from-red-500 hover:to-orange-400 shadow-xl"
            >
              {photos.length === 0 ? "Upload First Memory" : "Reset Filters"}
            </button>
          </div>
        ) : (
          /* Grid of Polaroid Frame Cards */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPhotos.map((photo) => (
              <div
                key={photo.id}
                onClick={() => setActivePhoto(photo)}
                className="group bg-white/[0.02] p-4 pb-5 rounded-2xl border border-white/5 shadow-2xl hover:bg-white/[0.05] hover:border-white/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between"
              >
                {/* Image Box */}
                <div>
                  <div className="aspect-[4/3] rounded-xl overflow-hidden bg-neutral-900 border border-white/5 relative">
                    <img
                      src={photo.image_url}
                      alt={photo.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                    />
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="p-3 glass rounded-full text-white shadow-xl hover:scale-110 transition-transform">
                        <Eye className="w-5 h-5" />
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="mt-4 px-1">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="font-serif font-light italic text-white text-base truncate" title={photo.title}>
                        {photo.title}
                      </h3>
                      <span className="shrink-0 text-[10px] font-semibold text-red-400 bg-red-950/20 border border-red-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        {photo.photo_date}
                      </span>
                    </div>

                    {photo.description && (
                      <p className="text-gray-400 text-xs leading-relaxed line-clamp-2 mt-1.5 h-8 font-light">
                        {photo.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions Row */}
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-end gap-1.5 relative z-10" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setActivePhoto(photo)}
                    className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    title="View Large"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleOpenEdit(photo, e)}
                    className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    title="Edit Metadata"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteId(photo.id)}
                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Delete Memory"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --------------------------------------------------------- */}
        {/* MODAL 1: PREVIEW / polaroid details modal */}
        {/* --------------------------------------------------------- */}
        {activePhoto && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
            onClick={() => setActivePhoto(null)}
          >
            <div
              className="relative max-w-4xl w-full bg-[#0c0c0c]/95 border border-white/10 rounded-3xl p-6 pb-8 shadow-2xl flex flex-col justify-between animate-zoomIn max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setActivePhoto(null)}
                className="absolute top-4 right-4 p-1.5 bg-white/5 border border-white/10 hover:bg-red-500 hover:text-white text-gray-300 rounded-full transition-colors z-20"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Slider Controls */}
              <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none">
                <button
                  onClick={handlePrevPhoto}
                  disabled={filteredPhotos.findIndex(p => p.id === activePhoto.id) === 0}
                  className="p-2 rounded-full glass hover:bg-white/10 text-white shadow-xl pointer-events-auto disabled:opacity-20 disabled:pointer-events-none transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>

              <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                <button
                  onClick={handleNextPhoto}
                  disabled={filteredPhotos.findIndex(p => p.id === activePhoto.id) === filteredPhotos.length - 1}
                  className="p-2 rounded-full glass hover:bg-white/10 text-white shadow-xl pointer-events-auto disabled:opacity-20 disabled:pointer-events-none transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Main Photo display */}
              <div className="bg-black border border-white/5 shadow-inner flex items-center justify-center overflow-hidden rounded-2xl relative max-h-[50vh] sm:max-h-[60vh]">
                <img
                  src={activePhoto.image_url}
                  alt={activePhoto.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-auto max-h-[55vh] object-contain"
                />
              </div>

              {/* Memory description */}
              <div className="mt-6 px-2 text-white">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-white/10 pb-3 mb-3">
                  <h2 className="font-serif text-xl sm:text-2xl font-light flex items-center gap-2 glow-text">
                    <Sparkles className="w-5 h-5 text-red-500 fill-red-500 shrink-0" />
                    <span className="italic serif">{activePhoto.title}</span>
                  </h2>
                  <div className="shrink-0 flex items-center gap-3">
                    <span className="text-[11px] font-semibold text-red-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full flex items-center gap-1.5">
                      <CalendarDays className="w-4 h-4" />
                      {activePhoto.photo_date}
                    </span>
                    <a
                      href={activePhoto.image_url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 glass text-white hover:bg-white/10 rounded-lg transition-all text-xs flex items-center gap-1 font-semibold"
                      title="Open full size"
                    >
                      <Download className="w-4 h-4" /> Full size
                    </a>
                  </div>
                </div>

                {activePhoto.description ? (
                  <p className="text-gray-300 text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-sans bg-white/5 border border-white/5 p-4 rounded-2xl shadow-inner font-light">
                    {activePhoto.description}
                  </p>
                ) : (
                  <p className="text-gray-500 text-xs italic">No special story was penned for this memory yet...</p>
                )}

                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-gray-600 text-[9px] font-mono">
                  <span>ID: {activePhoto.id}</span>
                  <span>Captured Memory Space ❤️</span>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* --------------------------------------------------------- */}
        {/* MODAL 2: EDIT METADATA MODAL */}
        {/* --------------------------------------------------------- */}
        {editPhoto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
            <div className="relative max-w-md w-full bg-[#0c0c0c]/95 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl animate-zoomIn">
              <button
                onClick={() => setEditPhoto(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="mb-6">
                <h2 className="font-serif text-xl font-light text-white italic">Edit Details</h2>
                <p className="text-gray-400 text-xs mt-1 font-light">Modify your caption story or memories dates.</p>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-xs font-bold mb-1" htmlFor="editTitle">
                    Memory Title
                  </label>
                  <input
                    id="editTitle"
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/15 focus:border-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-xs font-bold mb-1" htmlFor="editDate">
                    Memory Date
                  </label>
                  <input
                    id="editDate"
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/15 focus:border-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-xs font-bold mb-1" htmlFor="editDesc">
                    Memory Story
                  </label>
                  <textarea
                    id="editDesc"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={4}
                    className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/15 focus:border-red-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setEditPhoto(null)}
                    className="px-4 py-2 border border-white/10 text-gray-300 rounded-xl text-xs font-semibold hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="px-5 py-2 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-xl text-xs font-bold hover:from-red-500 hover:to-orange-400 disabled:opacity-70 transition-all"
                  >
                    {savingEdit ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------- */}
        {/* MODAL 3: SECURE DELETION CONFIRMATION */}
        {/* --------------------------------------------------------- */}
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
            <div className="max-w-sm w-full bg-[#0c0c0c]/95 border border-white/10 rounded-3xl p-6 shadow-2xl text-center">
              <div className="w-12 h-12 rounded-full bg-red-950/20 text-red-500 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <h2 className="font-serif text-lg font-light text-white mb-2 italic">Delete this memory?</h2>
              <p className="text-gray-400 text-xs leading-relaxed mb-6 font-light">
                Are you absolutely sure you want to delete this photo memory? Once deleted, this photograph cannot be restored.
              </p>
              <div className="flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => setDeleteId(null)}
                  className="px-4 py-2 bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 rounded-xl text-xs font-semibold transition-all"
                >
                  No, Keep It
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(deleteId)}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-lg disabled:opacity-70 transition-all"
                >
                  {deleting ? "Deleting..." : "Yes, Delete Forever"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
