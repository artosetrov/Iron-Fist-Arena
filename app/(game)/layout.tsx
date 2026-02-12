import { Suspense } from "react";
import GameSidebar from "@/app/components/GameSidebar";

export default function GameLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen bg-slate-950">
      <Suspense fallback={null}>
        <GameSidebar />
      </Suspense>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
