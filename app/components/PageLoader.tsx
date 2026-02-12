"use client";

interface PageLoaderProps {
  /** Emoji displayed in the center of the spinner */
  emoji?: string;
  /** Text displayed below the spinner */
  text?: string;
}

const PageLoader = ({ emoji = "⚔️", text = "Loading…" }: PageLoaderProps) => {
  return (
    <div className="flex min-h-full items-center justify-center p-8">
      <div className="text-center">
        <div className="relative mx-auto mb-4 h-16 w-16">
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-slate-700 border-t-indigo-400" />
          <div
            className="absolute inset-2 animate-spin rounded-full border-2 border-slate-700 border-t-purple-400"
            style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
          />
          <span
            className="absolute inset-0 flex items-center justify-center text-2xl"
            role="status"
            aria-label={text}
          >
            {emoji}
          </span>
        </div>
        <p className="text-sm text-slate-400">{text}</p>
      </div>
    </div>
  );
};

export default PageLoader;
