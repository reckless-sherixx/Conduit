import type { Metadata } from "next";
import { JetBrains_Mono, DM_Sans, Outfit } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-heading",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Conduit — Agent Observability Console",
  description: "Real-time, event-sourced telemetry and control dashboard for streaming AI agents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable} ${dmSans.variable} ${outfit.variable}`}>
      <body>{children}</body>
    </html>
  );
}
