"use client";

import Link from "next/link";
import { useMobileSidebar } from "@/app/components/MobileSidebarProvider";
import type { ReactNode } from "react";

type PageHeaderProps = {
  /** Page title displayed in the center */
  title: string;
  /** Where the close button navigates (default: /hub) */
  backHref?: string;
  /** Extra action buttons rendered before the close button */
  actions?: ReactNode;
  /** Hide the close/back button (e.g. on Hub page) */
  hideClose?: boolean;
};

const PageHeader = ({ title, backHref = "/hub", actions, hideClose = false }: PageHeaderProps) => {
  const { toggle } = useMobileSidebar();

  return (
    <header className="relative flex h-14 w-full shrink-0 items-center px-3 lg:px-6">
      {/* Burger — mobile only */}
      <button
        type="button"
        onClick={toggle}
        className="relative z-10 flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-900/90 text-white backdrop-blur transition hover:bg-slate-800 lg:hidden"
        aria-label="Open Menu"
        tabIndex={0}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Title — absolutely centered */}
      <h1 className="absolute inset-x-0 truncate text-center font-display text-lg font-bold uppercase tracking-wider text-amber-400 lg:text-2xl">
        {title}
      </h1>

      {/* Spacer to push actions to the right */}
      <div className="flex-1" />

      {/* Right side: actions + close */}
      <div className="relative z-10 flex items-center gap-2">
        {actions}
        {!hideClose && (
          <Link
            href={backHref}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-800/80 text-slate-400 transition hover:bg-slate-700 hover:text-white"
            aria-label="Back to Hub"
            tabIndex={0}
          >
            ✕
          </Link>
        )}
      </div>
    </header>
  );
};

export default PageHeader;
