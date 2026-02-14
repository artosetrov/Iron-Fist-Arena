import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter, Bangers, MedievalSharp } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import DesignTokenProvider from "./components/DesignTokenProvider";
import { NavigationLoaderProvider } from "./components/NavigationLoader";
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

const medievalSharp = MedievalSharp({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-medieval",
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
    <html lang="en" className={`${inter.variable} ${bangers.variable} ${medievalSharp.variable}`}>
      <head>
        <Suspense fallback={null}>
          <DesignTokenProvider />
        </Suspense>
      </head>
      <body className="font-sans min-h-screen antialiased">
        <NavigationLoaderProvider>{children}</NavigationLoaderProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
