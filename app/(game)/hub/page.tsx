"use client";

import { Suspense } from "react";
import PageLoader from "@/app/components/PageLoader";

function HubContent() {
  return (
    <div className="flex min-h-full items-center justify-center p-4">
      <p className="text-sm text-slate-500">Select a section from the menu</p>
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
