"use client";

import { useState, useEffect, useRef } from "react";
import { Task } from "@/types/task";

interface EditModalProps {
  task: Task;
  onClose: () => void;
  onSave: (taskId: number, title: string, description: string) => Promise<void>;
}

export default function EditModal({ task, onClose, onSave }: EditModalProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await onSave(task.id, title.trim(), description.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center p-4
                 bg-black/60 modal-backdrop"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border border-border-custom
                   bg-slate-900 p-6 space-y-5 shadow-2xl shadow-black/40"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">Edit Task</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div>
          <label htmlFor="edit-title" className="block text-xs font-medium text-slate-400 mb-1.5">
            Title <span className="text-red-400">*</span>
          </label>
          <input
            id="edit-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg bg-slate-800/70 border border-border-custom
                       text-foreground placeholder-slate-500
                       focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30
                       transition-all duration-200 text-sm"
            autoFocus
            disabled={isSaving}
          />
        </div>

        <div>
          <label htmlFor="edit-description" className="block text-xs font-medium text-slate-400 mb-1.5">
            Description
          </label>
          <textarea
            id="edit-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-3.5 py-2.5 rounded-lg resize-none bg-slate-800/70 border border-border-custom
                       text-foreground placeholder-slate-500
                       focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30
                       transition-all duration-200 text-sm"
            disabled={isSaving}
          />
        </div>

        {error && (
          <p className="text-red-400 text-xs bg-red-400/10 px-3 py-2 rounded-lg">{error}</p>
        )}

        <div className="flex gap-2 pt-1">
          <button
            id="save-edit"
            type="submit"
            disabled={isSaving}
            className="flex-1 px-4 py-2.5 rounded-lg font-medium text-sm
                       bg-gradient-to-r from-blue-600 to-indigo-600
                       hover:from-blue-500 hover:to-indigo-500
                       text-white disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200 cursor-pointer"
          >
            {isSaving ? "Saving…" : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2.5 rounded-lg font-medium text-sm
                       bg-slate-800 hover:bg-slate-700 text-slate-300
                       border border-border-custom transition-all duration-200 cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
