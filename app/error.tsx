"use client";

import { useEffect } from "react";
import Image from "next/image";

const GlobalError = ({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) => {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-900 text-white overflow-hidden">
      {/* City background */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/ui/hub-bg.png"
        alt=""
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover pointer-events-none opacity-30"
      />

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/70 to-slate-900/50 pointer-events-none" />

      <div className="relative z-10 text-center space-y-6 p-8">
        <Image
          src="/images/ui/wrong.png"
          alt="Something went wrong"
          width={200}
          height={200}
          className="mx-auto"
          priority
        />
        <h1 className="font-display text-4xl font-bold uppercase text-amber-400">Something went wrong</h1>
        <p className="text-slate-400 max-w-md">
          An unexpected error occurred. Please try refreshing the page.
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors"
          type="button"
          aria-label="Try again"
        >
          Try Again
        </button>
      </div>
    </div>
  );
};

export default GlobalError;
