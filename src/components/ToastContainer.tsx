"use client";

import { useState, useEffect, useRef } from "react";

interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

let toastId = 0;
const listeners: Set<(toast: Toast) => void> = new Set();

// Imperative toast API so any component can fire a toast without prop drilling
export function showToast(message: string, type: Toast["type"] = "info") {
  const toast: Toast = { id: ++toastId, message, type };
  listeners.forEach((fn) => fn(toast));
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<number, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    const handler = (toast: Toast) => {
      setToasts((prev) => [...prev, toast]);
      const timer = setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
        timers.current.delete(toast.id);
      }, 3500);
      timers.current.set(toast.id, timer);
    };

    listeners.add(handler);
    return () => {
      listeners.delete(handler);
      timers.current.forEach(clearTimeout);
    };
  }, []);

  if (toasts.length === 0) return null;

  const bgColors = {
    success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    error: "border-red-500/30 bg-red-500/10 text-red-300",
    info: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  };

  return (
    <div className="fixed bottom-6 right-6 z-[60] space-y-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast-enter px-4 py-3 rounded-xl border text-sm font-medium
                      shadow-lg shadow-black/20 backdrop-blur-sm max-w-xs
                      ${bgColors[t.type]}`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
