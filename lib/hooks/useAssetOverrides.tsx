"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const ASSETS_API = "/api/admin/assets";

type AssetOverridesContextValue = {
  overrides: Record<string, string>;
  overrideFileSizes: Record<string, number>;
  loading: boolean;
  refetch: () => Promise<void>;
};

const AssetOverridesContext = createContext<AssetOverridesContextValue | null>(
  null
);

type AssetOverridesProviderProps = {
  children: ReactNode;
};

export function AssetOverridesProvider({ children }: AssetOverridesProviderProps) {
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [overrideFileSizes, setOverrideFileSizes] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(ASSETS_API);
      if (!res.ok) return;
      const data = await res.json();
      setOverrides(data.overrides ?? {});
      setOverrideFileSizes(data.overrideFileSizes ?? {});
    } catch {
      setOverrides({});
      setOverrideFileSizes({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const value = useMemo(
    () => ({ overrides, overrideFileSizes, loading, refetch }),
    [overrides, overrideFileSizes, loading, refetch]
  );

  return (
    <AssetOverridesContext.Provider value={value}>
      {children}
    </AssetOverridesContext.Provider>
  );
}

export function useAssetOverrides(): AssetOverridesContextValue {
  const ctx = useContext(AssetOverridesContext);
  if (!ctx) {
    return {
      overrides: {},
      overrideFileSizes: {},
      loading: false,
      refetch: async () => {},
    };
  }
  return ctx;
}

/**
 * Resolve image URL: returns override from Storage if present, otherwise fallback (static path).
 */
export function useAssetUrl(assetKey: string, fallbackPath: string): string {
  const { overrides } = useAssetOverrides();
  return overrides[assetKey] ?? fallbackPath;
}
