"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type AdminGuardState = {
  isAdmin: boolean;
  loading: boolean;
};

export const useAdminGuard = (): AdminGuardState => {
  const router = useRouter();
  const [state, setState] = useState<AdminGuardState>({
    isAdmin: false,
    loading: true,
  });

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/me", { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (controller.signal.aborted) return;
        if (!data || data.role !== "admin") {
          router.replace("/hub");
          return;
        }
        setState({ isAdmin: true, loading: false });
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        router.replace("/hub");
      });

    return () => controller.abort();
  }, [router]);

  return state;
};
