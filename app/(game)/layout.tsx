import { Suspense } from "react";
import GameSidebar from "@/app/components/GameSidebar";
import MobileSidebarProvider from "@/app/components/MobileSidebarProvider";
import { AssetOverridesProvider } from "@/lib/hooks/useAssetOverrides";
import { TextOverridesProvider } from "@/lib/hooks/useTextOverrides";

export default function GameLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AssetOverridesProvider>
      <TextOverridesProvider>
        <MobileSidebarProvider>
        <div className="flex min-h-screen bg-slate-950">
          <Suspense fallback={null}>
            <GameSidebar />
          </Suspense>
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </MobileSidebarProvider>
      </TextOverridesProvider>
    </AssetOverridesProvider>
  );
}
