"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useMobileSidebar } from "@/app/components/MobileSidebarProvider";
import useCharacterAvatar from "@/app/hooks/useCharacterAvatar";
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
  /** Когда true — хедер пропускает клики сквозь себя, только burger/close кликабельны (для overlay над скроллом) */
  passThroughOverlay?: boolean;
  /** Navigate back via link — shows a back arrow on the left */
  leftHref?: string;
  /** Navigate back via callback — shows a back arrow on the left */
  leftOnClick?: () => void;
  /** Aria-label for the back arrow (default: "Go back") */
  leftLabel?: string;
};

const BACK_ARROW_ICON = (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

const LEFT_BTN_CLASS =
  "flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-800/80 text-slate-400 transition hover:bg-slate-700 hover:text-white";

const PageHeader = ({
  title,
  backHref = "/hub",
  actions,
  hideClose = false,
  passThroughOverlay = false,
  leftHref,
  leftOnClick,
  leftLabel = "Go back",
}: PageHeaderProps) => {
  const { toggle } = useMobileSidebar();
  const searchParams = useSearchParams();
  const characterId = searchParams.get("characterId");
  const { avatarSrc, level } = useCharacterAvatar(characterId);
  const hasLeft = !!(leftHref || leftOnClick);

  return (
    <>
      {/* ── Header bar — fixed on mobile, relative on desktop ── */}
      <div
        className={`fixed inset-x-0 top-0 z-30 border-b border-slate-800/50 bg-slate-950/95 backdrop-blur-sm lg:relative lg:z-auto lg:border-0 lg:bg-transparent lg:backdrop-blur-none ${passThroughOverlay ? "pointer-events-none" : ""}`}
      >
        <header className="flex h-14 w-full shrink-0 items-center px-3 lg:px-6">
          {/* ── Left side: burger OR back arrow (back replaces burger on nested pages) ── */}
          <div
            className={`relative z-10 flex items-center gap-1 ${passThroughOverlay ? "pointer-events-auto" : ""}`}
          >
            {hasLeft ? (
              /* Back arrow — replaces burger on nested pages */
              leftHref ? (
                <Link href={leftHref} className={LEFT_BTN_CLASS} aria-label={leftLabel} tabIndex={0}>
                  {BACK_ARROW_ICON}
                </Link>
              ) : (
                <button type="button" onClick={leftOnClick} className={LEFT_BTN_CLASS} aria-label={leftLabel} tabIndex={0}>
                  {BACK_ARROW_ICON}
                </button>
              )
            ) : (
              /* Avatar button — top-level pages only, mobile only */
              <button
                type="button"
                onClick={toggle}
                className="relative flex h-10 w-10 items-center justify-center overflow-visible rounded-lg border-2 border-amber-500/70 bg-slate-900/90 text-white backdrop-blur transition hover:border-amber-400 hover:shadow-[0_0_8px_rgba(251,191,36,0.4)] lg:hidden"
                aria-label="Open Menu"
                tabIndex={0}
              >
                <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-md">
                  {avatarSrc ? (
                    <Image
                      src={avatarSrc}
                      alt="Character avatar"
                      width={40}
                      height={40}
                      className="h-full w-full object-cover"
                      sizes="40px"
                    />
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                </span>
                {level != null && (
                  <span className="absolute -bottom-1.5 -right-1.5 z-10 flex h-5 min-w-5 items-center justify-center rounded bg-slate-800 px-0.5 font-display text-[10px] font-bold leading-none text-white ring-1 ring-amber-500/60">
                    {level}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Title — absolutely centered */}
          <h1 className="absolute inset-x-0 truncate text-center font-display text-xl font-bold uppercase tracking-wider text-amber-400 lg:text-3xl">
            {title}
          </h1>

          {/* Spacer to push actions right */}
          <div className="flex-1" />

          {/* Right side: actions */}
          {actions && (
            <div className={`relative z-10 flex items-center gap-2 ${passThroughOverlay ? "pointer-events-auto" : ""}`}>
              {actions}
            </div>
          )}

          {/* Close button — inside fixed bar on mobile, fixed to viewport corner on desktop */}
          {!hideClose && (
            <Link
              href={backHref}
              className={`relative z-10 ml-1 flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-800/80 text-slate-400 transition hover:bg-slate-700 hover:text-white lg:fixed lg:right-6 lg:top-6 lg:z-50 ${passThroughOverlay ? "pointer-events-auto" : ""}`}
              aria-label="Back to Hub"
              tabIndex={0}
            >
              ✕
            </Link>
          )}
        </header>
      </div>

      {/* Spacer — reserves space under fixed header on mobile */}
      <div className="h-14 shrink-0 lg:hidden" aria-hidden="true" />
    </>
  );
};

export default PageHeader;
