"use client";

import Image from "next/image";

interface PageLoaderProps {
  /** Emoji displayed in the center of the spinner (fallback when no avatar) */
  emoji?: string;
  /** Text displayed below the spinner */
  text?: string;
  /** Character origin avatar image path — overrides emoji */
  avatarSrc?: string | null;
}

const PageLoader = ({ emoji = "⚔️", text = "Loading…", avatarSrc }: PageLoaderProps) => {
  return (
    <div className="flex min-h-full items-center justify-center p-8">
      <div className="text-center">
        <div className="relative mx-auto mb-4 h-24 w-24">
          {/* Outer spinner ring */}
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-slate-700 border-t-indigo-400" />
          {/* Inner spinner ring */}
          <div
            className="absolute inset-1.5 animate-spin rounded-full border-2 border-slate-700 border-t-purple-400"
            style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
          />
          {/* Avatar or fallback emoji */}
          <div
            className="absolute inset-3 overflow-hidden rounded-full border-2 border-slate-700 bg-gradient-to-b from-slate-800 to-slate-900"
            role="status"
            aria-label={text}
          >
            {avatarSrc ? (
              <Image
                src={avatarSrc}
                alt="Character"
                width={256}
                height={256}
                className="absolute left-1/2 -top-1 w-[280%] max-w-none -translate-x-1/2"
                sizes="72px"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-2xl">
                {emoji}
              </span>
            )}
          </div>
        </div>
        <p className="text-sm text-slate-400">{text}</p>
      </div>
    </div>
  );
};

export default PageLoader;
