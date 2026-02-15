"use client";

import { type HTMLAttributes, type ReactNode, forwardRef, useEffect } from "react";

type GameModalSize = "sm" | "md" | "lg";

type GameModalProps = Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
  open: boolean;
  onClose?: () => void;
  size?: GameModalSize;
  title?: ReactNode;
  /** Hide the default close button */
  hideClose?: boolean;
};

const SIZE_CLASSES: Record<GameModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
};

const GameModal = forwardRef<HTMLDivElement, GameModalProps>(
  (
    {
      open,
      onClose,
      size = "md",
      title,
      hideClose = false,
      className = "",
      children,
      ...rest
    },
    ref,
  ) => {
    /* Lock body scroll when open */
    useEffect(() => {
      if (!open) return;
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }, [open]);

    if (!open) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <div
          ref={ref}
          className={[
            "relative mx-auto w-full overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/95 shadow-2xl shadow-black/40",
            SIZE_CLASSES[size],
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          style={{ animation: "scaleIn 0.2s ease-out" }}
          {...rest}
        >
          {/* Header */}
          {(title || !hideClose) && (
            <div className="flex items-center justify-between border-b border-slate-700/50 px-5 py-4">
              {title && (
                <h2 className="font-display text-xl font-bold text-white">{title}</h2>
              )}
              {!hideClose && onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white"
                  aria-label="Close"
                >
                  ✕
                </button>
              )}
            </div>
          )}

          {/* Body */}
          <div className="p-5">{children}</div>
        </div>
      </div>
    );
  },
);

GameModal.displayName = "GameModal";
export default GameModal;
