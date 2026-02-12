"use client";

import { useCallback, useEffect, useState } from "react";

/* ────────────────── Types ────────────────── */

export type DisplaySettings = {
  brightness: number;
  combatAnimations: boolean;
  showDamageNumbers: boolean;
  showNotifications: boolean;
};

export type SoundSettings = {
  masterVolume: number;
  effectsVolume: number;
  ambientVolume: number;
};

/* ────────────────── Defaults ────────────────── */

const DEFAULT_DISPLAY: DisplaySettings = {
  brightness: 100,
  combatAnimations: true,
  showDamageNumbers: true,
  showNotifications: true,
};

const DEFAULT_SOUND: SoundSettings = {
  masterVolume: 50,
  effectsVolume: 50,
  ambientVolume: 50,
};

/* ────────────────── Storage keys ────────────────── */

const DISPLAY_KEY = "ifa_display_settings";
const SOUND_KEY = "ifa_sound_settings";

/* ────────────────── Helpers ────────────────── */

const readFromStorage = <T>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) } as T;
  } catch {
    return fallback;
  }
};

const writeToStorage = <T>(key: string, value: T): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full — silently ignore */
  }
};

/* ────────────────── Hooks ────────────────── */

export const useDisplaySettings = () => {
  const [settings, setSettings] = useState<DisplaySettings>(DEFAULT_DISPLAY);

  useEffect(() => {
    setSettings(readFromStorage(DISPLAY_KEY, DEFAULT_DISPLAY));
  }, []);

  const update = useCallback((patch: Partial<DisplaySettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      writeToStorage(DISPLAY_KEY, next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setSettings(DEFAULT_DISPLAY);
    writeToStorage(DISPLAY_KEY, DEFAULT_DISPLAY);
  }, []);

  return { settings, update, reset };
};

export const useSoundSettings = () => {
  const [settings, setSettings] = useState<SoundSettings>(DEFAULT_SOUND);

  useEffect(() => {
    setSettings(readFromStorage(SOUND_KEY, DEFAULT_SOUND));
  }, []);

  const update = useCallback((patch: Partial<SoundSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      writeToStorage(SOUND_KEY, next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setSettings(DEFAULT_SOUND);
    writeToStorage(SOUND_KEY, DEFAULT_SOUND);
  }, []);

  return { settings, update, reset };
};
