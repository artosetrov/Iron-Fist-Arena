"use client";

import { type HTMLAttributes, type ReactNode, forwardRef } from "react";

type GameSectionProps = HTMLAttributes<HTMLDivElement> & {
  title?: ReactNode;
  /** Right-aligned element in the header */
  headerRight?: ReactNode;
  /** Remove internal body padding */
  flush?: boolean;
};

const GameSection = forwardRef<HTMLDivElement, GameSectionProps>(
  ({ title, headerRight, flush = false, className = "", children, ...rest }, ref) => {
    return (
      <div
        ref={ref}
        className={[
          "rounded-xl border border-slate-700/50 bg-slate-900/80 overflow-hidden",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...rest}
      >
        {(title || headerRight) && (
          <div className="flex items-center justify-between border-b border-slate-700/50 px-5 py-3">
            {title && (
              <h3 className="font-display text-base font-bold text-white">
                {title}
              </h3>
            )}
            {headerRight}
          </div>
        )}
        <div className={flush ? "" : "p-5"}>{children}</div>
      </div>
    );
  },
);

GameSection.displayName = "GameSection";
export default GameSection;
