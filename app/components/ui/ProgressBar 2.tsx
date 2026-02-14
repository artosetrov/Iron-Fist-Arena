"use client";

import { type HTMLAttributes, forwardRef } from "react";

type ProgressBarVariant = "primary" | "success" | "danger" | "warning" | "info" | "xp" | "stamina";

type ProgressBarProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  /** 0 – 100 */
  value: number;
  variant?: ProgressBarVariant;
  /** Show label inside the bar */
  label?: string;
  /** Height class override */
  height?: string;
};

const FILL_CLASSES: Record<ProgressBarVariant, string> = {
  primary: "bg-gradient-to-r from-amber-600 to-orange-600",
  success: "bg-gradient-to-r from-green-600 to-green-400",
  danger: "bg-gradient-to-r from-red-600 to-red-400",
  warning: "bg-gradient-to-r from-amber-600 to-amber-400",
  info: "bg-gradient-to-r from-blue-600 to-blue-400",
  xp: "bg-gradient-to-r from-green-600 to-green-400",
  stamina: "bg-gradient-to-r from-amber-600 to-amber-400",
};

const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(
  (
    {
      value,
      variant = "primary",
      label,
      height = "h-2",
      className = "",
      ...rest
    },
    ref,
  ) => {
    const clamped = Math.max(0, Math.min(100, value));

    return (
      <div
        ref={ref}
        className={[
          "relative w-full overflow-hidden rounded-full border border-slate-700/50 bg-slate-900/80",
          height,
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        {...rest}
      >
        <div
          className={[
            "h-full rounded-full transition-all duration-300",
            FILL_CLASSES[variant],
          ].join(" ")}
          style={{ width: `${clamped}%` }}
        />
        {label && (
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow">
            {label}
          </span>
        )}
      </div>
    );
  },
);

ProgressBar.displayName = "ProgressBar";
export default ProgressBar;
