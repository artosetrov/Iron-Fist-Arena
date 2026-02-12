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
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
      <div className="text-center space-y-6 p-8">
        <Image
          src="/images/ui/wrong.png"
          alt="Something went wrong"
          width={200}
          height={200}
          className="mx-auto"
          priority
        />
        <h1 className="text-3xl font-bold">Something went wrong</h1>
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
