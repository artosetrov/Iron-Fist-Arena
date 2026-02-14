"use client";

import { useEffect } from "react";
import Image from "next/image";
import * as Sentry from "@sentry/nextjs";
import { GameButton } from "@/app/components/ui";

const ErrorPage = ({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) => {
  useEffect(() => {
    console.error("[ErrorPage]", error);
    Sentry.captureException(error);
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
        <GameButton
          onClick={reset}
          size="lg"
          aria-label="Try again"
        >
          Try Again
        </GameButton>
      </div>
    </div>
  );
};

export default ErrorPage;
