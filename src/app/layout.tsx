import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FlowSaaS | Production-Ready n8n Workflows & Automations",
  description: "Scale your agency and business workflows with plug-and-play n8n automations.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning={true}>
      <body suppressHydrationWarning={true}>
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <NuqsAdapter>{children}</NuqsAdapter>
        <div id="toast-region" aria-live="polite" aria-atomic="true" />
      </body>
    </html>
  );
}