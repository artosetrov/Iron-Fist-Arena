"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

const GlobalError = ({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) => {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
        <div className="text-center space-y-4 p-8">
          <h2 className="text-2xl font-bold text-red-400">
            Something went wrong!
          </h2>
          <button
            onClick={reset}
            type="button"
            className="rounded-lg bg-indigo-600 px-6 py-3 font-medium transition-colors hover:bg-indigo-700"
            aria-label="Try again"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
};

export default GlobalError;
