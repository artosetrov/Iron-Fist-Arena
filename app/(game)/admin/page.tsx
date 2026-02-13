"use client";

import { Suspense, useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import PageHeader from "@/app/components/PageHeader";
import PageLoader from "@/app/components/PageLoader";
import { PageContainer } from "@/app/components/ui";
import { useAdminGuard } from "@/lib/hooks/useAdminGuard";
import GameIcon from "@/app/components/ui/GameIcon";
import type { GameIconKey } from "@/app/components/ui/GameIcon";

/* ────────────────── Lazy imports ────────────────── */

import dynamic from "next/dynamic";

const DevDashboardContent = dynamic(
  () => import("@/app/(game)/admin/_tabs/DevDashboardTab"),
  { loading: () => <PageLoader icon={<GameIcon name="admin" size={32} />} text="Loading Dev Panel..." /> }
);

const BalanceEditorContent = dynamic(
  () => import("@/app/(game)/admin/_tabs/BalanceEditorTab"),
  { loading: () => <PageLoader icon={<GameIcon name="balance" size={32} />} text="Loading Balance Editor..." /> }
);

const DesignSystemContent = dynamic(
  () => import("@/app/(game)/admin/_tabs/DesignSystemTab"),
  { loading: () => <PageLoader icon={<GameIcon name="design-system" size={32} />} text="Loading Design System..." /> }
);

/* ────────────────── Tab definitions ────────────────── */

type TabId = "dev" | "balance" | "design";

type TabDef = {
  id: TabId;
  label: string;
  icon: GameIconKey;
};

const TABS: TabDef[] = [
  { id: "dev", label: "Dev Panel", icon: "admin" },
  { id: "balance", label: "Balance", icon: "balance" },
  { id: "design", label: "Design System", icon: "design-system" },
];

/* ────────────────── Admin Page ────────────────── */

const AdminPageContent = () => {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as TabId) || "dev";
  const [activeTab, setActiveTab] = useState<TabId>(
    TABS.some((t) => t.id === initialTab) ? initialTab : "dev"
  );

  const handleTabChange = useCallback((tabId: TabId) => {
    setActiveTab(tabId);
    // Update URL without navigation for bookmarkability
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tabId);
    window.history.replaceState({}, "", url.toString());
  }, []);

  return (
    <PageContainer maxWidth="7xl">
      <PageHeader title="Admin Panel" />

      {/* Tab bar */}
      <div className="mb-4 flex flex-wrap gap-1.5 rounded-xl border border-slate-800 bg-slate-900/50 p-1.5">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition
                ${isActive
                  ? "border border-amber-500/40 bg-amber-500/15 text-white"
                  : "border border-transparent text-slate-400 hover:bg-slate-800/60 hover:text-white"
                }
              `}
              aria-label={tab.label}
              aria-selected={isActive}
              role="tab"
              tabIndex={0}
            >
              <GameIcon name={tab.icon} size={20} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <Suspense fallback={<PageLoader icon={<GameIcon name="settings" size={32} />} text="Loading..." />}>
        {activeTab === "dev" && <DevDashboardContent />}
        {activeTab === "balance" && <BalanceEditorContent />}
        {activeTab === "design" && <DesignSystemContent />}
      </Suspense>
    </PageContainer>
  );
};

const AdminPage = () => {
  const { isAdmin, loading } = useAdminGuard();

  if (loading || !isAdmin) {
    return <PageLoader icon={<GameIcon name="admin" size={32} />} text="Checking access..." />;
  }

  return (
    <Suspense fallback={<PageLoader icon={<GameIcon name="admin" size={32} />} text="Loading admin panel..." />}>
      <AdminPageContent />
    </Suspense>
  );
};

export default AdminPage;
