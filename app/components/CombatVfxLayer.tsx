"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { resolveVfx, pickPopup, STATUS_VFX } from "@/lib/game/combat-vfx-map";

/* ────────────────────────────────────────────────────────────
 * CombatVfxLayer
 *
 * Declarative VFX overlay. Parent sets a `command` prop and
 * this component spawns the correct projectile → impact → popup
 * sequence based on the VFX map.
 * ──────────────────────────────────────────────────────────── */

/* ── Public types ── */

export type VfxCommand = {
  action: string;
  actorClass: string;
  actorSide: "left" | "right";
  isCrit: boolean;
  isDodge: boolean;
  isHeal: boolean;
  isBuff: boolean;
  statusTicks?: { type: string }[];
};

/* ── Internal types ── */

type VfxElement = {
  id: number;
  kind: "projectile" | "impact" | "popup" | "status";
  src: string;
  animClass: string;
  extraClass?: string;
  /** Position side: left or right fighter card */
  side: "left" | "right";
  ttl: number;
};

let vfxIdCounter = 0;
const MAX_CONCURRENT = 8;

/* ── Single VFX sprite ── */

const VfxSprite = memo(({ el }: { el: VfxElement }) => {
  const sizeMap: Record<VfxElement["kind"], { w: number; h: number }> = {
    projectile: { w: 80, h: 80 },
    impact: { w: 140, h: 140 },
    popup: { w: 120, h: 120 },
    status: { w: 56, h: 56 },
  };

  const posMap: Record<VfxElement["kind"], React.CSSProperties> = {
    projectile: { top: "50%", left: "50%", transform: "translate(-50%, -50%)" },
    impact: { top: "25%", left: "50%", transform: "translate(-50%, -25%)" },
    popup: { top: "-10%", left: "50%", transform: "translate(-50%, 0)" },
    status: { bottom: "20%", left: "50%", transform: "translate(-50%, 0)" },
  };

  const zMap: Record<VfxElement["kind"], number> = {
    projectile: 20,
    impact: 30,
    popup: 50,
    status: 25,
  };

  const { w, h } = sizeMap[el.kind];

  return (
    <div
      className={`pointer-events-none absolute ${el.animClass} ${el.extraClass ?? ""}`}
      style={{ ...posMap[el.kind], zIndex: zMap[el.kind] }}
      aria-hidden="true"
    >
      <Image
        src={el.src}
        alt=""
        width={w}
        height={h}
        className="object-contain"
        unoptimized
        priority
      />
    </div>
  );
});
VfxSprite.displayName = "VfxSprite";

/* ── Main Layer ── */

type CombatVfxLayerProps = {
  command: VfxCommand | null;
  onScreenShake: () => void;
};

const CombatVfxLayerInner = ({
  command,
  onScreenShake,
}: CombatVfxLayerProps) => {
  const [leftElements, setLeftElements] = useState<VfxElement[]>([]);
  const [rightElements, setRightElements] = useState<VfxElement[]>([]);
  const timeoutIds = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const prevCommandRef = useRef<VfxCommand | null>(null);

  /* Cleanup on unmount */
  useEffect(() => {
    const ids = timeoutIds.current;
    return () => {
      ids.forEach(clearTimeout);
      ids.clear();
      vfxIdCounter = 0;
    };
  }, []);

  const addElement = useCallback(
    (side: "left" | "right", el: Omit<VfxElement, "id" | "side">) => {
      const id = ++vfxIdCounter;
      const full: VfxElement = { ...el, id, side };
      const setter = side === "left" ? setLeftElements : setRightElements;

      setter((prev) => {
        const next = [...prev, full];
        return next.length > MAX_CONCURRENT
          ? next.slice(next.length - MAX_CONCURRENT)
          : next;
      });

      const tid = setTimeout(() => {
        timeoutIds.current.delete(tid);
        setter((prev) => prev.filter((e) => e.id !== id));
      }, el.ttl);
      timeoutIds.current.add(tid);
    },
    [],
  );

  const scheduleTimeout = useCallback(
    (fn: () => void, ms: number) => {
      const tid = setTimeout(() => {
        timeoutIds.current.delete(tid);
        fn();
      }, ms);
      timeoutIds.current.add(tid);
    },
    [],
  );

  /* React to command changes */
  useEffect(() => {
    if (!command || command === prevCommandRef.current) return;
    prevCommandRef.current = command;

    const { action, actorClass, actorSide, isCrit, isDodge, isHeal, isBuff, statusTicks } = command;
    const targetSide: "left" | "right" = actorSide === "left" ? "right" : "left";

    /* ── Dodge ── */
    if (isDodge) {
      const dodgeVfx = resolveVfx("dodge", actorClass);
      if (dodgeVfx) {
        addElement(targetSide, {
          kind: "impact",
          src: dodgeVfx.impact,
          animClass: "animate-impact-burst",
          ttl: 600,
        });
        scheduleTimeout(() => {
          addElement(targetSide, {
            kind: "popup",
            src: pickPopup(dodgeVfx),
            animClass: "animate-pop-text",
            ttl: 1000,
          });
        }, 200);
      }
      return;
    }

    /* ── Heal/Buff (self-targeting) ── */
    if (isHeal || isBuff) {
      const key = isHeal ? "heal" : action;
      const vfx = resolveVfx(key, actorClass);
      if (vfx) {
        addElement(actorSide, {
          kind: "impact",
          src: vfx.impact,
          animClass: "animate-impact-burst",
          ttl: 600,
        });
        scheduleTimeout(() => {
          addElement(actorSide, {
            kind: "popup",
            src: pickPopup(vfx),
            animClass: "animate-pop-text",
            ttl: 1000,
          });
        }, 200);
      }
      return;
    }

    /* ── Normal attack / ability ── */
    const vfx = resolveVfx(action, actorClass);
    if (!vfx) return;

    // 0ms: Projectile
    if (vfx.projectile) {
      const direction = actorSide === "left" ? "right" : "left";
      addElement(actorSide, {
        kind: "projectile",
        src: vfx.projectile,
        animClass:
          direction === "right"
            ? "animate-projectile-right"
            : "animate-projectile-left",
        ttl: 500,
      });
    }

    // 300ms: Impact on target
    scheduleTimeout(() => {
      addElement(targetSide, {
        kind: "impact",
        src: isCrit
          ? (resolveVfx("crit", actorClass)?.impact ?? vfx.impact)
          : vfx.impact,
        animClass: "animate-impact-burst",
        extraClass: isCrit ? "combat-impact-crit" : undefined,
        ttl: 600,
      });

      // Screen shake for ultimates or crits
      if (vfx.screenShake || isCrit) {
        onScreenShake();
      }
    }, 300);

    // 400ms: Popup text
    scheduleTimeout(() => {
      const popupVfx = isCrit
        ? (resolveVfx("crit", actorClass) ?? vfx)
        : vfx;
      addElement(targetSide, {
        kind: "popup",
        src: pickPopup(popupVfx),
        animClass: "animate-pop-text",
        ttl: 1000,
      });
    }, 400);

    /* ── Status ticks ── */
    if (statusTicks && statusTicks.length > 0) {
      scheduleTimeout(() => {
        for (const tick of statusTicks) {
          const statusSrc = STATUS_VFX[tick.type];
          if (statusSrc) {
            addElement(actorSide, {
              kind: "status",
              src: statusSrc,
              animClass: "animate-status-tick",
              ttl: 800,
            });
          }
        }
      }, 100);
    }
  }, [command, addElement, scheduleTimeout, onScreenShake]);

  return (
    <>
      {/* Left fighter VFX overlay */}
      <div
        className="pointer-events-none absolute left-0 top-0 h-full w-1/2"
        style={{ zIndex: 15 }}
        aria-hidden="true"
      >
        {leftElements.map((el) => (
          <VfxSprite key={el.id} el={el} />
        ))}
      </div>

      {/* Right fighter VFX overlay */}
      <div
        className="pointer-events-none absolute right-0 top-0 h-full w-1/2"
        style={{ zIndex: 15 }}
        aria-hidden="true"
      >
        {rightElements.map((el) => (
          <VfxSprite key={el.id} el={el} />
        ))}
      </div>
    </>
  );
};

const CombatVfxLayer = memo(CombatVfxLayerInner);
export default CombatVfxLayer;
