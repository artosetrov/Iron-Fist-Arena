import type { Metadata } from "next";
import { Suspense } from "react";
import DesignTokenProvider from "./components/DesignTokenProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Iron Fist Arena",
  description: "Browser PvP RPG",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Suspense fallback={null}>
          <DesignTokenProvider />
        </Suspense>
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
