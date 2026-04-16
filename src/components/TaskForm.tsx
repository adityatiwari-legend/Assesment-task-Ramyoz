"use client";

import { useState } from "react";
import { CreateTaskPayload } from "@/types/task";

interface TaskFormProps {
  onTaskCreated: () => void;
}

export default function TaskForm({ onTaskCreated }: TaskFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: CreateTaskPayload = {
        title: title.trim(),
        ...(description.trim() && { description: description.trim() }),
      };

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create task");
      }

      // Reset form and notify parent
      setTitle("");
      setDescription("");
      setIsOpen(false);
      onTaskCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Action Button (Pink) matching the design */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 z-40 flex items-center justify-center 
                   w-14 h-14 bg-[#FDA4D4] rounded-2xl border-2 border-black
                   shadow-brutal hover:shadow-brutal active:shadow-none active:translate-y-1 active:translate-x-1
                   text-black font-medium transition-all duration-150"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-sm bg-white rounded-[32px] border-2 border-black p-6 space-y-5
                       shadow-brutal-lg animate-in fade-in duration-200"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-black tracking-tight">Create Task</h3>
              <button
                type="button"
                onClick={() => { setIsOpen(false); setError(null); }}
                className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-transparent hover:border-black hover:bg-gray-100 transition-colors"
                title="Cancel"
              >
                <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div>
              <label htmlFor="task-title" className="block text-sm font-bold text-black mb-1.5">
                Task Title
              </label>
              <input
                id="task-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                className="w-full px-4 py-3 rounded-2xl bg-[#F8F9FA] border-2 border-black text-black placeholder-gray-500
                           focus:outline-none focus:bg-white transition-all duration-200 font-medium shadow-brutal-sm focus:shadow-brutal"
                autoFocus
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="task-description" className="block text-sm font-bold text-black mb-1.5">
                Description <span className="text-gray-500 font-medium text-xs">(optional)</span>
              </label>
              <textarea
                id="task-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add some details..."
                rows={3}
                className="w-full px-4 py-3 rounded-2xl bg-[#F8F9FA] border-2 border-black text-black placeholder-gray-500
                           focus:outline-none focus:bg-white transition-all duration-200 font-medium shadow-brutal-sm focus:shadow-brutal resize-none"
                disabled={isSubmitting}
              />
            </div>

            {error && (
              <p className="text-[#E74C3C] text-sm font-bold bg-[#FCE5E2] border-2 border-[#E74C3C] px-3 py-2 rounded-xl shadow-brutal-sm">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-4 py-3.5 rounded-2xl font-black text-white bg-black border-2 border-black
                         shadow-brutal hover:shadow-brutal hover:bg-gray-800 disabled:opacity-70 disabled:cursor-not-allowed
                         active:shadow-none active:translate-y-1 active:translate-x-1 transition-all"
            >
              {isSubmitting ? "Creating..." : "Create Task"}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
