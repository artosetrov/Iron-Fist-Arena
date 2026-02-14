"use client";

import { useEffect, useState } from "react";

const ORIGIN_IMAGE: Record<string, string> = {
  human: "/images/origins/Avatar/origin-human_avatar_1.png",
  orc: "/images/origins/Avatar/origin-orc_avatar_1.png",
  skeleton: "/images/origins/Avatar/origin-skeleton_avatar_1.png",
  demon: "/images/origins/Avatar/origin-demon_avatar_1.png",
  dogfolk: "/images/origins/Avatar/origin-dogfolk_avatar_1.png",
};

type CharacterAvatarData = {
  avatarSrc: string | null;
  level: number | null;
};

/**
 * Fetches character origin and returns avatar image path + level.
 * Used in PageHeader / preloaders to show character avatar with level badge.
 */
const useCharacterAvatar = (characterId: string | null): CharacterAvatarData => {
  const [data, setData] = useState<CharacterAvatarData>({ avatarSrc: null, level: null });

  useEffect(() => {
    if (!characterId) return;
    const controller = new AbortController();
    fetch(`/api/characters/${characterId}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((char) => {
        if (!char) return;
        setData({
          avatarSrc: char.origin && ORIGIN_IMAGE[char.origin] ? ORIGIN_IMAGE[char.origin] : null,
          level: char.level ?? null,
        });
      })
      .catch(() => {});
    return () => controller.abort();
  }, [characterId]);

  return data;
};

export default useCharacterAvatar;
