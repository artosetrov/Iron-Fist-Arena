"use client";

import { type HTMLAttributes, type ReactNode, forwardRef } from "react";
import Image from "next/image";

type PageContainerProps = HTMLAttributes<HTMLDivElement> & {
  /** Optional background image path */
  bgImage?: string;
  /** Gradient overlay over bgImage (defaults to arena-style gradient) */
  bgGradient?: string;
  /** Constrain content width */
  maxWidth?: "4xl" | "5xl" | "6xl" | "7xl" | "full";
  children: ReactNode;
};

const MAX_W: Record<string, string> = {
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
  "7xl": "max-w-7xl",
  full: "",
};

const PageContainer = forwardRef<HTMLDivElement, PageContainerProps>(
  (
    {
      bgImage,
      bgGradient = "bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent",
      maxWidth = "full",
      className = "",
      children,
      ...rest
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={[
          "relative flex min-h-full flex-col p-4 lg:p-6",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...rest}
      >
        {/* Background image + gradient overlay */}
        {bgImage && (
          <div className="pointer-events-none absolute inset-0 z-0">
            <Image
              src={bgImage}
              alt=""
              fill
              className="object-cover opacity-20"
              priority
            />
            <div className={`absolute inset-0 ${bgGradient}`} />
          </div>
        )}

        {/* Content */}
        <div
          className={[
            "relative z-10 flex flex-1 flex-col",
            MAX_W[maxWidth] || "",
            maxWidth !== "full" && "mx-auto w-full",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {children}
        </div>
      </div>
    );
  },
);

PageContainer.displayName = "PageContainer";
export default PageContainer;
