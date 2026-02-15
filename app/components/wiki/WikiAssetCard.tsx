"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useAssetOverrides, useAssetUrl } from "@/lib/hooks/useAssetOverrides";

const ASSETS_API = "/api/admin/assets";

const formatBytes = (bytes: number): string => {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
};

type WikiAssetCardProps = {
  assetKey: string;
  defaultPath: string;
  label?: string;
  isAdmin: boolean;
  /** Preview size: default 192 (boss/class), 128 for items */
  size?: 128 | 192;
  objectFit?: "cover" | "contain";
};

export default function WikiAssetCard({
  assetKey,
  defaultPath,
  label,
  isAdmin,
  size = 192,
  objectFit = "cover",
}: WikiAssetCardProps) {
  const resolvedUrl = useAssetUrl(assetKey, defaultPath);
  const { overrides, overrideFileSizes, refetch } = useAssetOverrides();
  const [uploading, setUploading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ w: number; h: number } | null>(null);
  const [fileSizeBytes, setFileSizeBytes] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasOverride = !!overrides[assetKey];

  const overrideSize = overrideFileSizes[assetKey];

  useEffect(() => {
    setDimensions(null);
  }, [resolvedUrl]);

  useEffect(() => {
    if (overrideSize != null) {
      setFileSizeBytes(overrideSize);
      return;
    }
    setFileSizeBytes(null);
    let cancelled = false;
    fetch(resolvedUrl, { method: "HEAD" })
      .then((res) => {
        if (cancelled) return;
        const cl = res.headers.get("content-length");
        if (cl) setFileSizeBytes(parseInt(cl, 10));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [resolvedUrl, overrideSize]);

  const handleReplace = useCallback(() => {
    setError(null);
    inputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      setUploading(true);
      setError(null);
      try {
        const form = new FormData();
        form.set("file", file);
        form.set("assetKey", assetKey);
        form.set("originalPath", defaultPath);
        const res = await fetch(ASSETS_API, { method: "POST", body: form });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error ?? "Upload failed");
          return;
        }
        await refetch();
      } catch {
        setError("Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [assetKey, defaultPath, refetch]
  );

  const handleReset = useCallback(async () => {
    setError(null);
    setResetting(true);
    try {
      const res = await fetch(
        `${ASSETS_API}?assetKey=${encodeURIComponent(assetKey)}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Reset failed");
        return;
      }
      await refetch();
    } catch {
      setError("Reset failed");
    } finally {
      setResetting(false);
    }
  }, [assetKey, refetch]);

  return (
    <div className="flex flex-col gap-2">
      <div
        className={`relative shrink-0 overflow-hidden rounded-lg border bg-slate-900 ${
          hasOverride ? "border-amber-500/50" : "border-slate-700"
        }`}
        style={{ width: size, height: size }}
      >
        <Image
          src={resolvedUrl}
          alt={label ?? assetKey}
          fill
          className={objectFit === "contain" ? "object-contain p-2" : "object-cover"}
          sizes={`${size}px`}
          unoptimized={resolvedUrl.startsWith("http")}
          onLoad={(e) => {
            const el = e.currentTarget;
            if (el.naturalWidth && el.naturalHeight) {
              setDimensions({ w: el.naturalWidth, h: el.naturalHeight });
            }
          }}
        />
      </div>
      <p className="text-xs text-slate-500 break-all" title={assetKey}>
        {assetKey}
      </p>
      <p className="text-xs text-slate-500">
        {dimensions && `${dimensions.w}×${dimensions.h}`}
        {dimensions && fileSizeBytes != null && " · "}
        {fileSizeBytes != null && formatBytes(fileSizeBytes)}
        {!dimensions && fileSizeBytes == null && "—"}
      </p>
      {label && (
        <p className="text-sm font-medium text-slate-200">{label}</p>
      )}
      {error && (
        <p className="text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
      {isAdmin && (
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            aria-hidden
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={handleReplace}
            disabled={uploading}
            className="rounded border border-slate-600 bg-slate-800 px-2 py-1 text-xs text-slate-200 hover:bg-slate-700 disabled:opacity-50"
            aria-label="Replace image"
          >
            {uploading ? "Uploading…" : "Replace"}
          </button>
          {hasOverride && (
            <button
              type="button"
              onClick={handleReset}
              disabled={resetting}
              className="rounded border border-slate-600 bg-slate-800 px-2 py-1 text-xs text-slate-200 hover:bg-slate-700 disabled:opacity-50"
              aria-label="Reset to default"
            >
              {resetting ? "Resetting…" : "Reset"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
