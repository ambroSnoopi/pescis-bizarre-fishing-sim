import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const title = "Pesci's Bizarre Fishing Simulator";
const description =
  "Plan Pesci's Fisher Man ultimate on the Golden Spirit hex battlefield: place him to see his 6-tile range, or pick a target to find every max-range casting spot.";

/*
 * Social previews need absolute URLs. Left unset, Next falls back to localhost
 * in development and to the per-deployment Vercel URL in production, which
 * changes with every preview build — so the canonical host is pinned here. If
 * the site moves, this is the one line to change.
 */
const SITE = "https://pesci.ambro.ventures";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title,
  description,
  applicationName: "Pesci",
  keywords: [
    "JoJo's Golden Spirit",
    "Pesci",
    "Fisher Man",
    "range planner",
    "hex grid",
    "PvP",
  ],
  openGraph: {
    type: "website",
    siteName: title,
    title,
    description,
    url: "/",
    locale: "en",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  /* Home-screen install: full-screen web app, dark status bar over the page. */
  appleWebApp: {
    capable: true,
    title: "Pesci",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#05070a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
