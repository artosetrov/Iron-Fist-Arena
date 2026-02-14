"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

/* ────────────────────────────────────────────────────────────
 * NavigationLoader
 *
 * Full-screen shimmer overlay shown during route transitions.
 * Triggered on Link click or router.push() before navigation.
 * ──────────────────────────────────────────────────────────── */

interface NavigationLoaderContextValue {
  startNavigation: () => void;
  stopNavigation: () => void;
}

const NavigationLoaderContext = createContext<NavigationLoaderContextValue | null>(null);

export const useNavigationLoader = () => {
  const ctx = useContext(NavigationLoaderContext);
  return ctx;
};

interface NavigationLoaderProviderProps {
  children: ReactNode;
}

export const NavigationLoaderProvider = ({ children }: NavigationLoaderProviderProps) => {
  const [isNavigating, setIsNavigating] = useState(false);
  const pathname = usePathname();

  const startNavigation = useCallback(() => {
    setIsNavigating(true);
  }, []);

  const stopNavigation = useCallback(() => {
    setIsNavigating(false);
  }, []);

  useEffect(() => {
    if (isNavigating) {
      setIsNavigating(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const value: NavigationLoaderContextValue = {
    startNavigation,
    stopNavigation,
  };

  return (
    <NavigationLoaderContext.Provider value={value}>
      {children}
      {isNavigating && <ShimmerOverlay />}
    </NavigationLoaderContext.Provider>
  );
};

const ShimmerOverlay = () => {
  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-6 bg-slate-950"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      {/* Shimmer skeleton blocks */}
      <div className="flex flex-col items-center gap-4">
        <div className="h-20 w-20 animate-shimmer-sweep rounded-full overflow-hidden" />
        <div className="h-4 w-32 animate-shimmer-sweep rounded overflow-hidden" />
        <div className="mt-2 flex flex-col gap-2">
          <div className="h-3 w-48 animate-shimmer-sweep rounded overflow-hidden" />
          <div className="h-3 w-40 animate-shimmer-sweep rounded overflow-hidden" />
          <div className="h-3 w-36 animate-shimmer-sweep rounded overflow-hidden" />
        </div>
      </div>
      <p className="text-xs text-slate-500">Entering the arena…</p>
    </div>
  );
};
