"use client";

import { useCallback, useState } from "react";
import {
  useTextOverrides,
  useTextValue,
} from "@/lib/hooks/useTextOverrides";

const TEXT_OVERRIDES_API = "/api/admin/text-overrides";

type WikiEditableTextProps = {
  textKey: string;
  defaultValue: string;
  isAdmin: boolean;
  as?: "p" | "span" | "h2";
  className?: string;
};

export default function WikiEditableText({
  textKey,
  defaultValue,
  isAdmin,
  as: As = "p",
  className = "",
}: WikiEditableTextProps) {
  const value = useTextValue(textKey, defaultValue);
  const { overrides, refetch } = useTextOverrides();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasOverride = !!overrides[textKey];

  const handleStartEdit = useCallback(() => {
    if (!isAdmin) return;
    setDraft(value);
    setError(null);
    setEditing(true);
  }, [isAdmin, value]);

  const handleCancel = useCallback(() => {
    setEditing(false);
    setDraft(value);
    setError(null);
  }, [value]);

  const handleSave = useCallback(async () => {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(TEXT_OVERRIDES_API, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          textKey,
          textValue: draft,
          originalValue: defaultValue,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Save failed");
        return;
      }
      await refetch();
      setEditing(false);
    } catch {
      setError("Save failed");
    } finally {
      setSaving(false);
    }
  }, [textKey, draft, defaultValue, refetch]);

  const handleReset = useCallback(async () => {
    setError(null);
    setResetting(true);
    try {
      const res = await fetch(
        `${TEXT_OVERRIDES_API}?textKey=${encodeURIComponent(textKey)}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Reset failed");
        return;
      }
      await refetch();
      setDraft(defaultValue);
      setEditing(false);
    } catch {
      setError("Reset failed");
    } finally {
      setResetting(false);
    }
  }, [textKey, defaultValue, refetch]);

  if (editing) {
    return (
      <div className="space-y-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className={`min-h-[80px] w-full resize-y rounded-lg border border-slate-600 bg-slate-800/80 px-3 py-2 text-sm text-white outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 ${className}`}
          aria-label={`Edit ${textKey}`}
          disabled={saving}
        />
        {error && (
          <p className="text-xs text-red-400" role="alert">
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded border border-amber-500/50 bg-amber-600/20 px-3 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-600/30 disabled:opacity-50"
            aria-label="Save"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            className="rounded border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700 disabled:opacity-50"
            aria-label="Cancel"
          >
            Cancel
          </button>
          {hasOverride && (
            <button
              type="button"
              onClick={handleReset}
              disabled={resetting}
              className="rounded border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700 disabled:opacity-50"
              aria-label="Reset to default"
            >
              {resetting ? "Resetting…" : "Reset"}
            </button>
          )}
        </div>
      </div>
    );
  }

  const wrapperClassName = [
    hasOverride ? "border-amber-500/30" : "",
    isAdmin ? "cursor-pointer rounded-lg border border-transparent hover:border-slate-600/50" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <As
      className={wrapperClassName || undefined}
      onClick={isAdmin ? handleStartEdit : undefined}
      onKeyDown={
        isAdmin
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleStartEdit();
              }
            }
          : undefined
      }
      role={isAdmin ? "button" : undefined}
      tabIndex={isAdmin ? 0 : undefined}
      aria-label={isAdmin ? `Edit: ${textKey}` : undefined}
    >
      {value}
    </As>
  );
}
