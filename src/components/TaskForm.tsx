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
    <div className="w-full">
      {/* Toggle Button */}
      {!isOpen && (
        <button
          id="open-task-form"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl
                     bg-gradient-to-r from-blue-600 to-indigo-600
                     hover:from-blue-500 hover:to-indigo-500
                     text-white font-medium text-sm
                     shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30
                     transition-all duration-200 cursor-pointer"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Task
        </button>
      )}

      {/* Form */}
      {isOpen && (
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-lg rounded-2xl border border-border-custom
                     bg-surface p-5 space-y-4
                     shadow-xl shadow-black/20
                     animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Create Task
            </h3>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setError(null);
              }}
              className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Title */}
          <div>
            <label
              htmlFor="task-title"
              className="block text-xs font-medium text-slate-400 mb-1.5"
            >
              Title <span className="text-red-400">*</span>
            </label>
            <input
              id="task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full px-3.5 py-2.5 rounded-lg
                         bg-slate-800/60 border border-border-custom
                         text-foreground placeholder-slate-500
                         focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30
                         transition-all duration-200 text-sm"
              autoFocus
              disabled={isSubmitting}
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="task-description"
              className="block text-xs font-medium text-slate-400 mb-1.5"
            >
              Description{" "}
              <span className="text-slate-600 font-normal">(optional)</span>
            </label>
            <textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add some details..."
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-lg resize-none
                         bg-slate-800/60 border border-border-custom
                         text-foreground placeholder-slate-500
                         focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30
                         transition-all duration-200 text-sm"
              disabled={isSubmitting}
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-400 text-xs bg-red-400/10 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              id="submit-task"
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 rounded-lg font-medium text-sm
                         bg-gradient-to-r from-blue-600 to-indigo-600
                         hover:from-blue-500 hover:to-indigo-500
                         text-white shadow-md shadow-blue-500/15
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-200 cursor-pointer"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="w-4 h-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="3"
                      className="opacity-25"
                    />
                    <path
                      d="M4 12a8 8 0 018-8"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      className="opacity-75"
                    />
                  </svg>
                  Creating…
                </span>
              ) : (
                "Create Task"
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setError(null);
              }}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-lg font-medium text-sm
                         bg-slate-800 hover:bg-slate-700
                         text-slate-300 border border-border-custom
                         transition-all duration-200 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
