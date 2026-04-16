"use client";

import { useState, useEffect, useRef } from "react";
import { Task } from "@/types/task";

interface DeleteConfirmModalProps {
  task: Task;
  onClose: () => void;
  onConfirm: (taskId: number) => Promise<void>;
}

export default function DeleteConfirmModal({
  task,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm(task.id);
      onClose();
    } catch {
      setIsDeleting(false);
    }
  };

  return (
    <div
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center p-4
                 bg-black/60 modal-backdrop"
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-red-500/20
                   bg-slate-900 p-6 space-y-4 shadow-2xl shadow-black/40"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Warning icon */}
        <div className="flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
        </div>

        <div className="text-center space-y-2">
          <h3 className="text-base font-bold text-foreground">Delete Task?</h3>
          <p className="text-sm text-slate-400">
            This will permanently delete{" "}
            <span className="font-semibold text-slate-300">&quot;{task.title}&quot;</span>.
            This action cannot be undone.
          </p>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 rounded-lg font-medium text-sm
                       bg-slate-800 hover:bg-slate-700 text-slate-300
                       border border-border-custom transition-all duration-200 cursor-pointer"
          >
            Cancel
          </button>
          <button
            id="confirm-delete"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 rounded-lg font-medium text-sm
                       bg-red-600 hover:bg-red-500 text-white
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200 cursor-pointer"
          >
            {isDeleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
