"use client";

import { useEffect, useState } from "react";
import { tokensToCss, type DesignTokens } from "@/lib/design-tokens";

/**
 * Loads design tokens from the API and injects them as CSS custom properties
 * via a <style> tag in <head>. Renders nothing visible.
 */
const DesignTokenProvider = () => {
  const [css, setCss] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/design-tokens", { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { tokens: Partial<DesignTokens> } | null) => {
        if (!data?.tokens || Object.keys(data.tokens).length === 0) return;
        setCss(tokensToCss(data.tokens));
      })
      .catch(() => {
        /* silently ignore — defaults from globals.css apply */
      });

    return () => controller.abort();
  }, []);

  if (!css) return null;

  return <style dangerouslySetInnerHTML={{ __html: css }} />;
};

export default DesignTokenProvider;
