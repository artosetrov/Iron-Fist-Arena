"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { GameButton } from "@/app/components/ui";

/* ────────────────── Types ────────────────── */

type FieldDef = {
  name: string;
  type: "number" | "object" | "array" | "nested_object";
  comment: string;
  value: unknown;
};

type SectionDef = {
  id: string;
  title: string;
  gddRef: string;
  fields: FieldDef[];
};

type Toast = { message: string; type: "success" | "error" };

/* ────────────────── Helpers ────────────────── */

const deepClone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

const deepEqual = (a: unknown, b: unknown): boolean =>
  JSON.stringify(a) === JSON.stringify(b);

const getStep = (val: number): string => {
  if (Number.isInteger(val)) return "1";
  const dec = String(val).split(".")[1]?.length ?? 0;
  return dec <= 1 ? "0.1" : dec === 2 ? "0.01" : "0.001";
};

/* ────────────────── Components ────────────────── */

const NumberInput = ({
  value,
  onChange,
  changed,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  changed: boolean;
  label?: string;
}) => (
  <div className="flex items-center gap-2">
    {label && (
      <span className="min-w-[100px] text-xs text-slate-400">{label}</span>
    )}
    <input
      type="number"
      step={getStep(value)}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={`w-32 rounded-lg border px-3 py-1.5 text-sm bg-slate-800 text-white outline-none transition-colors
        focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30
        ${changed ? "border-amber-500/70 bg-amber-500/5" : "border-slate-700"}`}
      aria-label={label ?? "Number input"}
    />
  </div>
);

const ObjectEditor = ({
  value,
  original,
  onChange,
}: {
  value: Record<string, unknown>;
  original: Record<string, unknown>;
  onChange: (v: Record<string, unknown>) => void;
}) => {
  const handleChange = (key: string, newVal: unknown) => {
    onChange({ ...value, [key]: newVal });
  };

  return (
    <div className="ml-4 space-y-1.5 border-l border-slate-700/50 pl-4">
      {Object.entries(value).map(([key, val]) => {
        if (typeof val === "number") {
          return (
            <NumberInput
              key={key}
              label={key}
              value={val}
              onChange={(v) => handleChange(key, v)}
              changed={original[key] !== val}
            />
          );
        }
        if (typeof val === "string") {
          return (
            <div key={key} className="flex items-center gap-2">
              <span className="min-w-[100px] text-xs text-slate-400">{key}</span>
              <input
                type="text"
                value={val}
                onChange={(e) => handleChange(key, e.target.value)}
                className={`w-48 rounded-lg border px-3 py-1.5 text-sm bg-slate-800 text-white outline-none transition-colors
                  focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30
                  ${original[key] !== val ? "border-amber-500/70 bg-amber-500/5" : "border-slate-700"}`}
                aria-label={key}
              />
            </div>
          );
        }
        if (typeof val === "object" && val !== null && !Array.isArray(val)) {
          const changed = !deepEqual(original[key], val);
          return (
            <div key={key}>
              <div className={`flex items-center gap-2 ${changed ? "text-amber-400" : "text-slate-400"}`}>
                <span className="text-xs font-medium">{key}</span>
              </div>
              <ObjectEditor
                value={val as Record<string, unknown>}
                original={(original[key] ?? {}) as Record<string, unknown>}
                onChange={(v) => handleChange(key, v)}
              />
            </div>
          );
        }
        if (Array.isArray(val) && val.every((x) => typeof x === "number")) {
          return (
            <div key={key} className="flex items-center gap-2">
              <span className="min-w-[100px] text-xs text-slate-400">{key}</span>
              <div className="flex gap-1">
                {val.map((num, i) => (
                  <input
                    key={i}
                    type="number"
                    step={getStep(num)}
                    value={num}
                    onChange={(e) => {
                      const arr = [...val];
                      arr[i] = Number(e.target.value);
                      handleChange(key, arr);
                    }}
                    className={`w-20 rounded-lg border px-2 py-1.5 text-sm bg-slate-800 text-white outline-none transition-colors
                      focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30
                      ${!deepEqual((original[key] as number[])?.[i], num) ? "border-amber-500/70 bg-amber-500/5" : "border-slate-700"}`}
                    aria-label={`${key}[${i}]`}
                  />
                ))}
              </div>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
};

const ArrayEditor = ({
  value,
  original,
  onChange,
}: {
  value: Record<string, unknown>[];
  original: Record<string, unknown>[];
  onChange: (v: Record<string, unknown>[]) => void;
}) => {
  if (value.length === 0) return <p className="text-xs text-slate-500">Empty array</p>;

  const keys = Object.keys(value[0]);

  const handleCellChange = (rowIdx: number, key: string, newVal: unknown) => {
    const next = deepClone(value);
    next[rowIdx][key] = newVal;
    onChange(next);
  };

  return (
    <div className="overflow-x-auto custom-scrollbar">
      <table className="min-w-full text-xs">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="px-2 py-1 text-left text-slate-500">#</th>
            {keys.map((k) => (
              <th key={k} className="px-2 py-1 text-left text-slate-400 font-medium">{k}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {value.map((row, ri) => (
            <tr key={ri} className="border-b border-slate-800/50">
              <td className="px-2 py-1 text-slate-600">{ri}</td>
              {keys.map((k) => {
                const cell = row[k];
                const origCell = original[ri]?.[k];
                const changed = !deepEqual(cell, origCell);
                if (typeof cell === "number") {
                  return (
                    <td key={k} className="px-1 py-1">
                      <input
                        type="number"
                        step={getStep(cell)}
                        value={cell === 99999 ? "Infinity" : cell}
                        onChange={(e) => {
                          const v = e.target.value === "Infinity" ? 99999 : Number(e.target.value);
                          handleCellChange(ri, k, v);
                        }}
                        className={`w-24 rounded border px-2 py-1 bg-slate-800 text-white outline-none text-xs
                          focus:border-amber-500 ${changed ? "border-amber-500/70 bg-amber-500/5" : "border-slate-700"}`}
                        aria-label={`${k} row ${ri}`}
                      />
                    </td>
                  );
                }
                if (typeof cell === "string") {
                  return (
                    <td key={k} className="px-1 py-1">
                      <input
                        type="text"
                        value={cell}
                        onChange={(e) => handleCellChange(ri, k, e.target.value)}
                        className={`w-28 rounded border px-2 py-1 bg-slate-800 text-white outline-none text-xs
                          focus:border-amber-500 ${changed ? "border-amber-500/70 bg-amber-500/5" : "border-slate-700"}`}
                        aria-label={`${k} row ${ri}`}
                      />
                    </td>
                  );
                }
                if (typeof cell === "boolean") {
                  return (
                    <td key={k} className="px-1 py-1">
                      <button
                        onClick={() => handleCellChange(ri, k, !cell)}
                        className={`rounded border px-2 py-1 text-xs
                          ${cell ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400" : "border-slate-700 bg-slate-800 text-slate-400"}
                          ${changed ? "ring-1 ring-amber-500/50" : ""}`}
                        type="button"
                        aria-label={`${k} row ${ri}`}
                      >
                        {cell ? "true" : "false"}
                      </button>
                    </td>
                  );
                }
                return <td key={k} className="px-1 py-1 text-slate-500">{JSON.stringify(cell)}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const FieldEditor = ({
  field,
  originalValue,
  onChange,
}: {
  field: FieldDef;
  originalValue: unknown;
  onChange: (name: string, val: unknown) => void;
}) => {
  const val = field.value;
  const changed = !deepEqual(val, originalValue);

  if (field.type === "number" && typeof val === "number") {
    return (
      <div className="flex items-center justify-between py-1.5">
        <div className="flex items-center gap-2">
          <code className={`text-xs font-mono ${changed ? "text-amber-400" : "text-slate-300"}`}>
            {field.name}
          </code>
          {changed && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
        </div>
        <NumberInput
          value={val}
          onChange={(v) => onChange(field.name, v)}
          changed={changed}
        />
      </div>
    );
  }

  if ((field.type === "object" || field.type === "nested_object") && typeof val === "object" && val !== null && !Array.isArray(val)) {
    return (
      <div className="py-2">
        <div className="flex items-center gap-2 mb-1.5">
          <code className={`text-xs font-mono ${changed ? "text-amber-400" : "text-slate-300"}`}>
            {field.name}
          </code>
          {changed && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
        </div>
        <ObjectEditor
          value={val as Record<string, unknown>}
          original={(originalValue ?? {}) as Record<string, unknown>}
          onChange={(v) => onChange(field.name, v)}
        />
      </div>
    );
  }

  if (field.type === "array" && Array.isArray(val)) {
    return (
      <div className="py-2">
        <div className="flex items-center gap-2 mb-1.5">
          <code className={`text-xs font-mono ${changed ? "text-amber-400" : "text-slate-300"}`}>
            {field.name}
          </code>
          {changed && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
        </div>
        <ArrayEditor
          value={val as Record<string, unknown>[]}
          original={(originalValue ?? []) as Record<string, unknown>[]}
          onChange={(v) => onChange(field.name, v)}
        />
      </div>
    );
  }

  // Fallback: show JSON
  return (
    <div className="py-1.5">
      <code className="text-xs text-slate-500">{field.name}: {JSON.stringify(val)}</code>
    </div>
  );
};

/* ────────────────── Main Tab Content ────────────────── */

const BalanceEditorTab = () => {
  const [sections, setSections] = useState<SectionDef[]>([]);
  const [originalSections, setOriginalSections] = useState<SectionDef[]>([]);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const fetchBalance = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dev/balance");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setSections(data.sections);
      setOriginalSections(deepClone(data.sections));
    } catch (err) {
      setToast({ message: "Failed to load balance data", type: "error" });
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleToggleSection = useCallback((id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleExpandAll = useCallback(() => {
    setOpenSections(new Set(sections.map((s) => s.id)));
  }, [sections]);

  const handleCollapseAll = useCallback(() => {
    setOpenSections(new Set());
  }, []);

  const handleFieldChange = useCallback((sectionId: string, fieldName: string, value: unknown) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              fields: s.fields.map((f) =>
                f.name === fieldName ? { ...f, value } : f
              ),
            }
          : s
      )
    );
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const values: Record<string, unknown> = {};
      for (const s of sections) {
        for (const f of s.fields) {
          values[f.name] = f.value;
        }
      }
      const res = await fetch("/api/dev/balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Save failed");
      }
      setOriginalSections(deepClone(sections));
      setToast({ message: "Balance saved to balance.ts", type: "success" });
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : "Save failed",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  }, [sections]);

  const handleReset = useCallback(() => {
    setSections(deepClone(originalSections));
    setToast({ message: "Changes reverted", type: "success" });
  }, [originalSections]);

  const handleReload = useCallback(() => {
    fetchBalance();
  }, [fetchBalance]);

  const hasChanges = useMemo(
    () => !deepEqual(sections, originalSections),
    [sections, originalSections]
  );

  const changedCount = useMemo(() => {
    let count = 0;
    for (let i = 0; i < sections.length; i++) {
      for (let j = 0; j < sections[i].fields.length; j++) {
        if (!deepEqual(sections[i].fields[j].value, originalSections[i]?.fields[j]?.value)) {
          count++;
        }
      }
    }
    return count;
  }, [sections, originalSections]);

  const filteredSections = useMemo(() => {
    if (!search.trim()) return sections;
    const q = search.toLowerCase();
    return sections
      .map((s) => ({
        ...s,
        fields: s.fields.filter(
          (f) =>
            f.name.toLowerCase().includes(q) ||
            f.comment.toLowerCase().includes(q)
        ),
      }))
      .filter((s) => s.fields.length > 0);
  }, [sections, search]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          <p className="text-sm text-slate-400">Loading balance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search constants..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none
            focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
          aria-label="Search constants"
        />

        <GameButton variant="secondary" size="sm" onClick={handleExpandAll}>
          Expand All
        </GameButton>
        <GameButton variant="secondary" size="sm" onClick={handleCollapseAll}>
          Collapse All
        </GameButton>
        <GameButton variant="secondary" size="sm" onClick={handleReload} aria-label="Reload from file">
          Reload
        </GameButton>

        {hasChanges && (
          <GameButton variant="danger" size="sm" onClick={handleReset}>
            Reset ({changedCount})
          </GameButton>
        )}

        <GameButton
          onClick={handleSave}
          disabled={saving || !hasChanges}
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Saving...
            </span>
          ) : (
            `Save${hasChanges ? ` (${changedCount})` : ""}`
          )}
        </GameButton>
      </div>

      {/* Sections */}
      <div className="space-y-2">
        {filteredSections.map((section) => {
          const isOpen = openSections.has(section.id) || !!search.trim();
          const origSection = originalSections.find((s) => s.id === section.id);
          const sectionChanged = !deepEqual(
            section.fields.map((f) => f.value),
            origSection?.fields.map((f) => f.value)
          );

          return (
            <div
              key={section.id}
              className={`rounded-xl border transition-colors
                ${sectionChanged ? "border-amber-500/40 bg-amber-500/[0.02]" : "border-slate-700/50 bg-slate-900/80"}`}
            >
              <button
                onClick={() => handleToggleSection(section.id)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
                type="button"
                aria-expanded={isOpen}
                aria-label={`Toggle ${section.title} section`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs transition-transform ${isOpen ? "rotate-90" : ""}`}
                  >
                    ▶
                  </span>
                  <span className="text-sm font-bold text-white">
                    {section.title}
                  </span>
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-500">
                    {section.gddRef}
                  </span>
                  <span className="text-[10px] text-slate-600">
                    {section.fields.length} fields
                  </span>
                </div>
                {sectionChanged && (
                  <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-400">
                    modified
                  </span>
                )}
              </button>

              {isOpen && (
                <div className="border-t border-slate-800 px-4 py-3 space-y-0.5">
                  {section.fields.map((field) => {
                    const origField = origSection?.fields.find(
                      (f) => f.name === field.name
                    );
                    return (
                      <div key={field.name}>
                        {field.comment && (
                          <p className="text-[10px] text-slate-600 mt-2 first:mt-0">
                            {field.comment}
                          </p>
                        )}
                        <FieldEditor
                          field={field}
                          originalValue={origField?.value}
                          onChange={(name, val) =>
                            handleFieldChange(section.id, name, val)
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-sm
            animate-[slideUp_0.3s_ease-out]
            ${toast.type === "success"
              ? "border-emerald-500/30 bg-emerald-950/90 text-emerald-300"
              : "border-red-500/30 bg-red-950/90 text-red-300"
            }`}
          role="alert"
        >
          <p className="text-sm font-medium">{toast.message}</p>
        </div>
      )}
    </div>
  );
};

export default BalanceEditorTab;
