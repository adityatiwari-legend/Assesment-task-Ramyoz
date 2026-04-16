"use client";

import { useEffect } from "react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}

export default function Error({ error, unstable_retry }: ErrorPageProps) {
  useEffect(() => {
    console.error("Unhandled app error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#EAE0FB]">
      <div className="max-w-md w-full bg-white border-4 border-black rounded-3xl p-8 shadow-brutal text-center">
        <h2 className="text-2xl font-black text-black">Something went wrong</h2>
        <p className="mt-3 text-sm font-medium text-black/70">
          The board could not be rendered. Please try again.
        </p>

        {error.digest ? (
          <p className="mt-3 text-xs font-mono text-black/50">Error ID: {error.digest}</p>
        ) : null}

        <button
          onClick={() => unstable_retry()}
          className="mt-6 px-6 py-3 rounded-xl bg-[#A1F6B6] border-2 border-black font-bold text-black shadow-brutal-sm active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
