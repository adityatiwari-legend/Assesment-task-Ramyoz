"use client";

import { Task } from "@/types/task";
import { useState, useEffect } from "react";

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
    setTimeout(onClose, 200);
  };

  const handleConfirm = async () => {
    setIsDeleting(true);
    await onConfirm(task.id);
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 modal-backdrop">
      <div 
        className="absolute inset-0 bg-transparent"
        onClick={handleClose} 
      />
      <div
        className={`relative w-full max-w-md sm:max-w-sm bg-white rounded-[28px] sm:rounded-[32px] border-2 border-black p-5 sm:p-6
                   shadow-brutal-lg transition-all duration-200 text-center
                   ${isClosing ? "opacity-0 scale-95" : "animate-in fade-in zoom-in-95"}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
      >
        <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto bg-[#FCE5E2] border-2 border-[#E74C3C] text-[#E74C3C] rounded-full flex items-center justify-center mb-4 shadow-brutal-sm">
          <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <h3 id="delete-modal-title" className="text-xl sm:text-2xl font-black text-black mb-2">
          Delete Task?
        </h3>
        <p className="text-sm font-medium text-gray-500 mb-6">
            This will permanently delete &quot;{task.title}&quot;.<br />
           It cannot be undone.
        </p>

        <div className="flex flex-col-reverse sm:flex-row justify-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={isDeleting}
            className="w-full sm:flex-1 sm:max-w-[120px] py-3 rounded-2xl font-bold text-black bg-white border-2 border-black
                       shadow-brutal-sm hover:shadow-brutal hover:bg-gray-50 disabled:opacity-50
                       active:shadow-none active:translate-y-1 active:translate-x-1 transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="w-full sm:flex-1 sm:max-w-[120px] py-3 rounded-2xl font-bold text-white bg-[#E74C3C] border-2 border-black
                       shadow-brutal-sm hover:shadow-brutal hover:bg-red-600 disabled:opacity-50
                       active:shadow-none active:translate-y-1 active:translate-x-1 transition-all flex items-center justify-center gap-2"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
