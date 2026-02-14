"use client";

import { memo, useCallback, useState } from "react";
import type { BodyZone, CombatStance } from "@/lib/game/types";
import { BODY_ZONES, MAX_BLOCK_POINTS, ZONE_DAMAGE_MULT } from "@/lib/game/balance";
import { defaultStance, validateStance } from "@/lib/game/body-zones";
import BodyZoneDiagram from "@/app/components/BodyZoneDiagram";
import { GameButton } from "@/app/components/ui";

/* ── Zone metadata ── */

const ZONE_LABELS: Record<BodyZone, string> = {
  head: "Head",
  torso: "Torso",
  waist: "Waist",
  legs: "Legs",
};

const ZONE_ICONS: Record<BodyZone, string> = {
  head: "👤",
  torso: "🛡",
  waist: "⚔",
  legs: "🦵",
};

/* ── Props ── */

type StanceSelectorProps = {
  /** Initial stance (from DB or default) */
  initialStance?: CombatStance;
  /** Per-zone armor values for display */
  zoneArmor?: Record<BodyZone, number>;
  /** Called when user confirms stance and wants to fight */
  onConfirm: (stance: CombatStance) => void;
  /** Called when user wants to save stance as default */
  onSaveDefault?: (stance: CombatStance) => void;
  /** Called when user wants to go back */
  onBack?: () => void;
  /** Whether the fight button is loading */
  loading?: boolean;
  /** Label for confirm button */
  confirmLabel?: string;
};

/* ── Component ── */

const StanceSelector = memo(({
  initialStance,
  zoneArmor,
  onConfirm,
  onSaveDefault,
  onBack,
  loading = false,
  confirmLabel = "Fight!",
}: StanceSelectorProps) => {
  const [stance, setStance] = useState<CombatStance>(
    () => initialStance ?? defaultStance(),
  );
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  /* ── Attack zone toggle ── */
  const handleToggleAttack = useCallback((zone: BodyZone) => {
    setStance((prev) => {
      const current = [...prev.attackZones];
      const idx = current.indexOf(zone);

      if (idx >= 0) {
        // Deselect — but keep at least 1
        if (current.length <= 1) return prev;
        current.splice(idx, 1);
      } else {
        // Select — max 2
        if (current.length >= 2) {
          // Replace oldest
          current.shift();
        }
        current.push(zone);
      }

      return { ...prev, attackZones: current };
    });
  }, []);

  /* ── Block allocation ── */
  const totalBlocks = BODY_ZONES.reduce(
    (sum, z) => sum + (stance.blockAllocation[z] ?? 0),
    0,
  );
  const remaining = MAX_BLOCK_POINTS - totalBlocks;

  const handleBlockChange = useCallback((zone: BodyZone, delta: number) => {
    setStance((prev) => {
      const currentVal = prev.blockAllocation[zone] ?? 0;
      const newVal = currentVal + delta;
      if (newVal < 0 || newVal > MAX_BLOCK_POINTS) return prev;

      const currentTotal = BODY_ZONES.reduce(
        (sum, z) => sum + (prev.blockAllocation[z] ?? 0),
        0,
      );
      const newTotal = currentTotal + delta;
      if (newTotal > MAX_BLOCK_POINTS || newTotal < 0) return prev;

      return {
        ...prev,
        blockAllocation: { ...prev.blockAllocation, [zone]: newVal },
      };
    });
  }, []);

  /* ── Validation ── */
  const error = validateStance(stance);
  const isValid = !error && totalBlocks === MAX_BLOCK_POINTS;

  /* ── Save as default ── */
  const handleSaveDefault = useCallback(async () => {
    if (!onSaveDefault || !isValid) return;
    setSaveStatus("saving");
    try {
      await onSaveDefault(stance);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("idle");
    }
  }, [onSaveDefault, stance, isValid]);

  /* ── Confirm ── */
  const handleConfirm = useCallback(() => {
    if (!isValid || loading) return;
    onConfirm(stance);
  }, [stance, isValid, loading, onConfirm]);

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-800/80 text-slate-400 transition hover:bg-slate-700 hover:text-white"
            aria-label="Go back"
            tabIndex={0}
          >
            ←
          </button>
        )}
        <h2 className="text-lg font-bold uppercase tracking-wider text-slate-200 lg:text-xl">
          Choose Your Stance
        </h2>
      </div>

      {/* Main layout: two-column on desktop, stacked on mobile */}
      <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
        {/* Left: Body Zone Diagram */}
        <div className="flex shrink-0 items-start justify-center lg:justify-start">
          <BodyZoneDiagram
            stance={stance}
            mode="both"
            onZoneClick={handleToggleAttack}
            zoneArmor={zoneArmor}
            size="lg"
          />
        </div>

        {/* Right: Controls */}
        <div className="flex flex-1 flex-col gap-4">
          {/* Attack Zones */}
          <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-3 lg:p-4">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-red-400">
              Attack Zones
              <span className="ml-2 text-slate-500">
                ({stance.attackZones.length}/2)
              </span>
            </h3>
            <div className="grid grid-cols-4 gap-2 lg:grid-cols-2 lg:gap-2">
              {BODY_ZONES.map((zone) => {
                const isActive = stance.attackZones.includes(zone);
                return (
                  <button
                    key={zone}
                    type="button"
                    onClick={() => handleToggleAttack(zone)}
                    tabIndex={0}
                    aria-label={`${isActive ? "Deselect" : "Select"} ${ZONE_LABELS[zone]} as attack zone`}
                    aria-pressed={isActive}
                    className={[
                      "flex min-h-[44px] flex-col items-center justify-center rounded-lg border px-2 py-2 text-xs font-semibold uppercase transition-all lg:flex-row lg:gap-2 lg:px-3",
                      isActive
                        ? "border-red-500/60 bg-red-950/40 text-red-300 shadow-inner shadow-red-900/20"
                        : "border-slate-700 bg-slate-800/60 text-slate-500 hover:border-slate-600 hover:text-slate-300",
                    ].join(" ")}
                  >
                    <span className="text-base lg:text-sm">{ZONE_ICONS[zone]}</span>
                    <span>{ZONE_LABELS[zone]}</span>
                    {isActive && (
                      <span className="text-[10px] text-red-500 lg:ml-auto">
                        x{ZONE_DAMAGE_MULT[zone]}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Block Points */}
          <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-3 lg:p-4">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-blue-400">
              Block Points
              <span className={`ml-2 ${remaining === 0 ? "text-slate-500" : "text-amber-400"}`}>
                ({remaining} left)
              </span>
            </h3>
            <div className="flex flex-col gap-2">
              {BODY_ZONES.map((zone) => {
                const blocks = stance.blockAllocation[zone] ?? 0;
                return (
                  <div
                    key={zone}
                    className="flex items-center gap-2 rounded-lg border border-slate-700/40 bg-slate-900/30 px-3 py-2"
                  >
                    <span className="w-14 text-xs font-semibold text-slate-400 lg:w-16">
                      {ZONE_LABELS[zone]}
                    </span>

                    {/* Block dots */}
                    <div className="flex flex-1 items-center gap-1">
                      {Array.from({ length: MAX_BLOCK_POINTS }).map((_, i) => (
                        <div
                          key={i}
                          className={[
                            "h-3.5 w-3.5 rounded-sm border transition-all lg:h-4 lg:w-4",
                            i < blocks
                              ? "border-blue-500/60 bg-blue-500/50"
                              : "border-slate-700 bg-slate-800",
                          ].join(" ")}
                        />
                      ))}
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleBlockChange(zone, -1)}
                        disabled={blocks <= 0}
                        tabIndex={0}
                        aria-label={`Remove block from ${ZONE_LABELS[zone]}`}
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-700 bg-slate-800 text-sm font-bold text-slate-400 transition hover:border-slate-600 hover:bg-slate-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 lg:h-7 lg:w-7"
                      >
                        −
                      </button>
                      <span className="w-5 text-center text-sm font-bold text-slate-300">
                        {blocks}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleBlockChange(zone, 1)}
                        disabled={blocks >= MAX_BLOCK_POINTS || remaining <= 0}
                        tabIndex={0}
                        aria-label={`Add block to ${ZONE_LABELS[zone]}`}
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-700 bg-slate-800 text-sm font-bold text-slate-400 transition hover:border-slate-600 hover:bg-slate-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 lg:h-7 lg:w-7"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Zone Armor Preview */}
          {zoneArmor && (
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-700/40 bg-slate-900/30 px-3 py-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-400">Zone Armor:</span>
              {BODY_ZONES.map((zone) => (
                <span key={zone}>
                  {ZONE_LABELS[zone]}{" "}
                  <span className="font-bold text-slate-300">
                    {zoneArmor[zone] ?? 0}
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Validation error */}
      {error && totalBlocks !== MAX_BLOCK_POINTS && (
        <p className="mt-3 text-center text-xs text-amber-400">
          Distribute all {MAX_BLOCK_POINTS} block points before fighting
        </p>
      )}

      {/* Action buttons */}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center sm:gap-3">
        <GameButton
          variant="action"
          size="lg"
          onClick={handleConfirm}
          disabled={!isValid || loading}
          className="min-w-[160px]"
          aria-label={confirmLabel}
        >
          {loading ? "..." : confirmLabel}
        </GameButton>

        {onSaveDefault && (
          <GameButton
            variant="secondary"
            size="md"
            onClick={handleSaveDefault}
            disabled={!isValid || saveStatus === "saving"}
            aria-label="Save as default stance"
          >
            {saveStatus === "saving"
              ? "Saving..."
              : saveStatus === "saved"
                ? "Saved!"
                : "Save as Default"}
          </GameButton>
        )}
      </div>
    </div>
  );
});

StanceSelector.displayName = "StanceSelector";

export default StanceSelector;
