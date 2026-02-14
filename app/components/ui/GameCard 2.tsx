"use client";

import { type HTMLAttributes, forwardRef } from "react";

type GameCardVariant = "default" | "interactive" | "selected" | "success" | "danger" | "warning";

type GameCardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: GameCardVariant;
  /** Thinner border (1px instead of 2px) */
  thin?: boolean;
};

const BASE =
  "rounded-2xl border-2 bg-slate-950/95 transition-colors";

const VARIANT_CLASSES: Record<GameCardVariant, string> = {
  default: "border-slate-700/80",
  interactive: "border-slate-700/80 hover:border-slate-600 cursor-pointer",
  selected: "border-amber-500 ring-2 ring-amber-400/50 shadow-xl shadow-amber-600/30",
  success: "border-green-700/60 bg-gradient-to-b from-green-900/30 to-slate-900/80",
  danger: "border-red-700/60 bg-gradient-to-b from-red-900/30 to-slate-900/80",
  warning: "border-amber-600/60 bg-gradient-to-b from-amber-900/30 to-slate-900/80",
};

const GameCard = forwardRef<HTMLDivElement, GameCardProps>(
  ({ variant = "default", thin = false, className = "", children, ...rest }, ref) => {
    return (
      <div
        ref={ref}
        className={[
          BASE,
          thin && "border",
          !thin && "border-2",
          VARIANT_CLASSES[variant],
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...rest}
      >
        {children}
      </div>
    );
  },
);

GameCard.displayName = "GameCard";
export default GameCard;
