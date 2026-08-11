import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import PwaRegistration from "./pwa-registration";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  manifest: "/manifest.webmanifest",
  themeColor: "#17264a",
  appleWebApp: { capable: true, title: "Ochiometric", statusBarStyle: "default" },
  metadataBase: new URL("https://din-ochi.dragosfagaras.chatgpt.site"),
  title: "Ochiometric — Jocul zilnic de estimări",
  description: "Trei întrebări. Fără Google. Cât de aproape ajungi?",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <a className="skip-link" href="#main-content">Sari la conținut</a>
        <div id="main-content">{children}</div>
        <PwaRegistration />
      </body>
    </html>
  );
}
