"use client";

import { useEffect, useState } from "react";

const ORIGIN_IMAGE: Record<string, string> = {
  human: "/images/origins/origin-human.png",
  orc: "/images/origins/origin-orc.png",
  skeleton: "/images/origins/origin-skeleton.png",
  demon: "/images/origins/origin-demon.png",
  dogfolk: "/images/origins/origin-dogfolk.png",
};

/**
 * Fetches character origin and returns avatar image path.
 * Used in preloaders to show character avatar instead of emoji.
 */
const useCharacterAvatar = (characterId: string | null): string | null => {
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!characterId) return;
    const controller = new AbortController();
    fetch(`/api/characters/${characterId}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((char) => {
        if (char?.origin && ORIGIN_IMAGE[char.origin]) {
          setAvatarSrc(ORIGIN_IMAGE[char.origin]);
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [characterId]);

  return avatarSrc;
};

export default useCharacterAvatar;
