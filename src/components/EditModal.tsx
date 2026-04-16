"use client";

import { useState, useEffect } from "react";
import { Task } from "@/types/task";

interface EditModalProps {
  task: Task;
  onClose: () => void;
  onSave: (taskId: number, title: string, description: string, tags: string[]) => Promise<void>;
}

export default function EditModal({ task, onClose, onSave }: EditModalProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [tags, setTags] = useState<string[]>(task.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  // Focus trap workaround
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 200); // Wait for exit animation
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    setError(null);
    setIsSubmitting(true);

    try {
      await onSave(task.id, title.trim(), description.trim(), tags);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div 
        className="absolute inset-0 bg-transparent"
        onClick={handleClose} 
      />
      <div
        className={`relative w-full max-w-sm bg-white rounded-[32px] border-2 border-black p-6
                   shadow-brutal-lg transition-all duration-200
                   ${isClosing ? "opacity-0 scale-95" : "animate-in fade-in zoom-in-95"}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-modal-title"
      >
        <div className="flex items-center justify-between mb-5">
           <h3 id="edit-modal-title" className="text-xl font-black text-black">
             Edit Task
           </h3>
           <div className="px-3 py-1 bg-yellow-100 border-2 border-black rounded-full text-xs font-bold shadow-brutal-sm">
             {task.status.replace("_", " ").toUpperCase()}
           </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-black mb-1.5" htmlFor="edit-title">
              Task Title
            </label>
            <input
              id="edit-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-[#F8F9FA] border-2 border-black text-black placeholder-gray-500
                         focus:outline-none focus:bg-white transition-all duration-200 font-medium shadow-brutal-sm focus:shadow-brutal"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-black mb-1.5" htmlFor="edit-desc">
              Description <span className="text-gray-500 font-medium text-xs">(optional)</span>
            </label>
            <textarea
              id="edit-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-2xl bg-[#F8F9FA] border-2 border-black text-black placeholder-gray-500
                         focus:outline-none focus:bg-white transition-all duration-200 font-medium shadow-brutal-sm focus:shadow-brutal resize-none"
              disabled={isSubmitting}
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-black mb-1.5" htmlFor="edit-tags">
              Tags <span className="text-gray-500 font-medium text-xs">(optional)</span>
            </label>
            <input
              id="edit-tags"
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  const trimmed = tagInput.trim();
                  if (trimmed && !tags.includes(trimmed)) {
                    setTags([...tags, trimmed]);
                  }
                  setTagInput("");
                }
              }}
              placeholder="Type and press Enter..."
              className="w-full px-4 py-2 rounded-xl bg-[#F8F9FA] border-2 border-black text-black placeholder-gray-500
                         focus:outline-none focus:bg-white transition-all duration-200 font-medium shadow-brutal-sm focus:shadow-brutal"
              disabled={isSubmitting}
            />
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map(t => (
                  <span key={t} className="flex items-center gap-1 px-2 py-1 text-sm font-bold bg-[#A8B8FE] border-2 border-black rounded-full">
                    {t}
                    <button type="button" onClick={() => setTags(tags.filter(xt => xt !== t))} className="text-black hover:text-red-600">&times;</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {error && (
            <p className="text-[#E74C3C] text-sm font-bold bg-[#FCE5E2] border-2 border-[#E74C3C] px-3 py-2 rounded-xl shadow-brutal-sm">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl font-bold text-black bg-white border-2 border-black
                         shadow-brutal-sm hover:shadow-brutal hover:bg-gray-50 disabled:opacity-50
                         active:shadow-none active:translate-y-1 active:translate-x-1 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl font-bold text-white bg-[#5EDA7F] border-2 border-black
                         shadow-brutal-sm hover:shadow-brutal hover:bg-green-400 disabled:opacity-50
                         active:shadow-none active:translate-y-1 active:translate-x-1 transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-black" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-black">Saving...</span>
                </>
              ) : (
                <span className="text-black inline-flex">Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
