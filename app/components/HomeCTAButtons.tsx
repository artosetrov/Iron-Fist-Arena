"use client";

import Link from "next/link";
import { useNavigationLoader } from "./NavigationLoader";

export const HomeCTAButtons = () => {
  const loader = useNavigationLoader();
  const handleNavClick = loader ? () => loader.startNavigation() : undefined;

  return (
    <nav className="flex w-full max-w-xs flex-col gap-3">
      <Link
        href="/login"
        onClick={handleNavClick}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-3 text-base font-bold uppercase tracking-wider text-white shadow-md shadow-amber-900/30 transition-all hover:from-amber-500 hover:to-orange-500 active:scale-[0.98]"
        aria-label="Log In"
        tabIndex={0}
      >
        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 2v12M12 14l-2.5 2M12 14l2.5 2" />
          <path d="M9 14h6M10.5 14v6M13.5 14v6" />
        </svg>
        Enter the Arena
      </Link>
      <Link
        href="/register"
        onClick={handleNavClick}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-6 py-3 text-base font-bold uppercase tracking-wider text-slate-400 transition-all hover:bg-slate-700 hover:text-white"
        aria-label="Register"
        tabIndex={0}
      >
        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 2L4 6v4c0 5.5 3.5 10 8 12 4.5-2 8-6.5 8-12V6L12 2z" />
          <path d="M12 9v4M10 11h4" />
        </svg>
        Create Account
      </Link>
    </nav>
  );
};
