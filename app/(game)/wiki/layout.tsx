"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import GameIcon from "@/app/components/ui/GameIcon";
import { WikiAdminContext, type WikiAdminContextValue } from "./wiki-admin-context";

const WIKI_SECTIONS: { href: string; label: string; icon: "arena" | "warrior" | "tavern" | "dungeons" | "shop" | "training" }[] = [
  { href: "/wiki", label: "Overview", icon: "arena" },
  { href: "/wiki/world", label: "World", icon: "arena" },
  { href: "/wiki/onboarding", label: "Onboarding", icon: "warrior" },
  { href: "/wiki/classes", label: "Classes", icon: "warrior" },
  { href: "/wiki/origins", label: "Origins", icon: "warrior" },
  { href: "/wiki/locations", label: "Locations", icon: "tavern" },
  { href: "/wiki/dungeons", label: "Dungeons", icon: "dungeons" },
  { href: "/wiki/bosses", label: "Bosses", icon: "dungeons" },
  { href: "/wiki/items", label: "Items", icon: "shop" },
  { href: "/wiki/consumables", label: "Consumables", icon: "shop" },
  { href: "/wiki/minigames", label: "Minigames", icon: "tavern" },
  { href: "/wiki/training", label: "Training", icon: "training" },
  { href: "/wiki/npcs", label: "NPCs", icon: "tavern" },
  { href: "/wiki/seasons", label: "Seasons", icon: "arena" },
  { href: "/wiki/assets", label: "Assets", icon: "shop" },
];

export default function WikiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const characterId = searchParams.get("characterId");
  const qs = characterId ? `?characterId=${encodeURIComponent(characterId)}` : "";

  const [adminState, setAdminState] = useState<WikiAdminContextValue>({
    isAdmin: false,
    loading: true,
  });

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch("/api/me");
      const data = res.ok ? await res.json() : null;
      setAdminState({
        isAdmin: data?.role === "admin",
        loading: false,
      });
    } catch {
      setAdminState({ isAdmin: false, loading: false });
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const value = useMemo(() => adminState, [adminState]);

  return (
    <WikiAdminContext.Provider value={value}>
      <div className="flex min-h-full flex-col lg:flex-row">
        <nav
        className="flex shrink-0 flex-row flex-wrap gap-2 border-b border-slate-800 bg-slate-900/50 p-3 lg:sticky lg:top-0 lg:z-10 lg:flex-col lg:border-b-0 lg:border-r lg:w-56 lg:flex-nowrap lg:gap-1 lg:p-4"
        aria-label="Wiki sections"
      >
        {WIKI_SECTIONS.map(({ href, label, icon }) => {
          const to = `${href}${qs}`;
          const isActive = pathname === href || (href !== "/wiki" && pathname.startsWith(href + "/"));
          return (
            <Link
              key={href}
              href={to}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition lg:rounded-r-none lg:border-l-2 lg:pl-3 ${
                isActive
                  ? "bg-amber-500/20 text-amber-400 border-amber-500/60"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200 border-transparent"
              }`}
            >
              <GameIcon name={icon} size={18} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="flex-1">{children}</div>
    </div>
    </WikiAdminContext.Provider>
  );
}
