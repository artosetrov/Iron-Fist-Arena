import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter, Bangers } from "next/font/google";
import DesignTokenProvider from "./components/DesignTokenProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

const bangers = Bangers({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bangers",
  display: "swap",
});

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
    <html lang="en" className={`${inter.variable} ${bangers.variable}`}>
      <head>
        <Suspense fallback={null}>
          <DesignTokenProvider />
        </Suspense>
      </head>
      <body className="font-sans min-h-screen antialiased">{children}</body>
    </html>
  );
}
