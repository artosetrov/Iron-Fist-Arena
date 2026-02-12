"use client";

import { Suspense } from "react";
import PageLoader from "@/app/components/PageLoader";

function HubContent() {
  return (
    <div
      className="relative flex min-h-full items-center justify-center p-4 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/images/hub-bg.png')" }}
    >
      <div className="absolute inset-0 bg-slate-950/40" />
      <p className="relative z-10 text-sm text-slate-400 drop-shadow-lg">
        Select a section from the menu
      </p>
    </div>
  );
}

export default function HubPage() {
  return (
    <Suspense fallback={<PageLoader emoji="🏠" text="Loading hub…" />}>
      <HubContent />
    </Suspense>
  );
}
