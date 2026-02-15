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

const TEXT_OVERRIDES_API = "/api/admin/text-overrides";

type TextOverridesContextValue = {
  overrides: Record<string, string>;
  loading: boolean;
  refetch: () => Promise<void>;
};

const TextOverridesContext = createContext<TextOverridesContextValue | null>(
  null
);

type TextOverridesProviderProps = {
  children: ReactNode;
};

export function TextOverridesProvider({ children }: TextOverridesProviderProps) {
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(TEXT_OVERRIDES_API);
      if (!res.ok) return;
      const data = await res.json();
      setOverrides(data.overrides ?? {});
    } catch {
      setOverrides({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const value = useMemo(
    () => ({ overrides, loading, refetch }),
    [overrides, loading, refetch]
  );

  return (
    <TextOverridesContext.Provider value={value}>
      {children}
    </TextOverridesContext.Provider>
  );
}

export function useTextOverrides(): TextOverridesContextValue {
  const ctx = useContext(TextOverridesContext);
  if (!ctx) {
    return {
      overrides: {},
      loading: false,
      refetch: async () => {},
    };
  }
  return ctx;
}

/**
 * Resolve text value: returns override if present, otherwise defaultValue.
 */
export function useTextValue(textKey: string, defaultValue: string): string {
  const { overrides } = useTextOverrides();
  return overrides[textKey] ?? defaultValue;
}
