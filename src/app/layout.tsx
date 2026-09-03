import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AmbientBackground } from "@/components/marketing/ambient-background";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: {
    default: "BRIEVV — AI-powered AEC project delivery",
    template: "%s · BRIEVV",
  },
  description:
    "Submit the work. BRIEVV assembles the team. AI handles estimation, matching, scheduling, and workflow — qualified professionals handle the work.",
  icons: {
    icon: [
      { url: "/brand/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/brand/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "BRIEVV — AI-powered AEC project delivery",
    description: "Your project. The right team. Started now.",
    siteName: "BRIEVV",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BRIEVV — AI-powered AEC project delivery",
    description: "Your project. The right team. Started now.",
  },
  robots: { index: true, follow: true },
};

export const viewport = {
  themeColor: "#071A2D",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable} ${mono.variable}`}>
      <body>
        <AmbientBackground />
        {children}
      </body>
    </html>
  );
}
