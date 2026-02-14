"use client";

import { type HTMLAttributes, forwardRef } from "react";

type GameBadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "premium";

type GameBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: GameBadgeVariant;
  /** Use pill shape (rounded-full) */
  pill?: boolean;
};

const VARIANT_CLASSES: Record<GameBadgeVariant, string> = {
  default: "border-slate-700/40 bg-slate-800/60 text-slate-400",
  success: "border-emerald-500/40 bg-emerald-900/30 text-emerald-400",
  warning: "border-amber-500/40 bg-amber-900/30 text-amber-300",
  danger: "border-red-500/40 bg-red-900/30 text-red-400",
  info: "border-blue-500/40 bg-blue-900/30 text-blue-400",
  premium: "border-purple-500/40 bg-purple-900/30 text-purple-300",
};

const GameBadge = forwardRef<HTMLSpanElement, GameBadgeProps>(
  ({ variant = "default", pill = false, className = "", children, ...rest }, ref) => {
    return (
      <span
        ref={ref}
        className={[
          "inline-flex items-center border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
          pill ? "rounded-full" : "rounded-md",
          VARIANT_CLASSES[variant],
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...rest}
      >
        {children}
      </span>
    );
  },
);

GameBadge.displayName = "GameBadge";
export default GameBadge;
