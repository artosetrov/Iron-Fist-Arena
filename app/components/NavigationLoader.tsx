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
import PageLoader from "./PageLoader";

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
      className="fixed inset-0 z-[9999] bg-slate-950"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <PageLoader emoji="⚔️" text="Entering the arena…" />
    </div>
  );
};
