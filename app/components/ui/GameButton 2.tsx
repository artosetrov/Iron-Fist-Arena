"use client";

import { type ButtonHTMLAttributes, forwardRef } from "react";

/* ── Variants ── */
type GameButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "ghost"
  | "action";

type GameButtonSize = "sm" | "md" | "lg";

type GameButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: GameButtonVariant;
  size?: GameButtonSize;
  /** Full width */
  fullWidth?: boolean;
};

const SIZE_CLASSES: Record<GameButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

const VARIANT_CLASSES: Record<GameButtonVariant, string> = {
  primary: [
    "bg-gradient-to-r from-amber-600 to-orange-600",
    "text-white font-bold shadow-md shadow-amber-900/30",
    "hover:from-amber-500 hover:to-orange-500",
    "active:scale-[0.98]",
  ].join(" "),

  secondary: [
    "border border-slate-700 bg-slate-800/80",
    "text-slate-400",
    "hover:bg-slate-700 hover:text-white",
  ].join(" "),

  danger: [
    "border border-red-900/50 bg-red-950/30",
    "text-red-400",
    "hover:border-red-800 hover:bg-red-950/50 hover:text-red-300",
  ].join(" "),

  ghost: [
    "text-slate-400",
    "hover:bg-slate-800 hover:text-white",
  ].join(" "),

  action: [
    "border border-emerald-500/40 bg-gradient-to-b from-emerald-600 to-emerald-700",
    "text-white font-bold shadow-lg shadow-emerald-900/30",
    "hover:from-emerald-500 hover:to-emerald-600",
    "active:scale-[0.98]",
  ].join(" "),
};

const GameButton = forwardRef<HTMLButtonElement, GameButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      fullWidth = false,
      className = "",
      disabled,
      children,
      ...rest
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={[
          "inline-flex items-center justify-center rounded-xl font-bold uppercase tracking-wider transition-all",
          SIZE_CLASSES[size],
          VARIANT_CLASSES[variant],
          fullWidth && "w-full",
          disabled && "cursor-not-allowed opacity-50",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...rest}
      >
        {children}
      </button>
    );
  },
);

GameButton.displayName = "GameButton";
export default GameButton;
