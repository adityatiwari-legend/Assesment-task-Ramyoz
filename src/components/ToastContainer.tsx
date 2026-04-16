"use client";

import { useEffect, useState } from "react";

export type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

// Global event emitter for toasts (so we don't need complex context for a simple app)
type ToastListener = (toast: Toast) => void;
const listeners = new Set<ToastListener>();

export function showToast(message: string, type: ToastType = "info") {
  const id = Math.random().toString(36).substring(2, 9);
  listeners.forEach((listener) => listener({ id, message, type }));
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handleToast = (toast: Toast) => {
      setToasts((prev) => [...prev, toast]);
      
      // Auto-remove after 3 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 3000);
    };

    listeners.add(handleToast);
    return () => {
      listeners.delete(handleToast);
    };
  }, []);

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case "success":
        return "bg-[#5EDA7F] text-black border-2 border-black";
      case "error":
        return "bg-[#E74C3C] text-white border-2 border-black";
      default:
        return "bg-black text-white border-2 border-black";
    }
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none w-full max-w-sm px-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast-enter p-4 rounded-2xl shadow-brutal flex items-center justify-between pointer-events-auto ${getToastStyles(toast.type)}`}
        >
          <span className="text-sm font-bold truncate pr-4">
            {toast.message}
          </span>
          <button
            onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            className="text-current opacity-70 hover:opacity-100 p-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
