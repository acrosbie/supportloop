import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import CommandMenu from "@/components/CommandMenu";
import DemoTour from "@/components/DemoTour";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

const description =
  "A closed-loop AI customer-support platform: RAG self-service → escalation → agent-assist → knowledge generation → ops analytics → community. A reference implementation over a fictional customer, Orbit.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "SupportLoop — AI Support Showcase", template: "%s · SupportLoop" },
  description,
  openGraph: {
    title: "SupportLoop — AI Support Showcase",
    description,
    type: "website",
    siteName: "SupportLoop",
  },
  twitter: {
    card: "summary_large_image",
    title: "SupportLoop — AI Support Showcase",
    description,
  },
};

// Root layout intentionally carries no chrome — each role workspace (/user,
// /agent, /ops) and the overview (/) provide their own skin.
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <Toaster />
        <CommandMenu />
        <DemoTour />
      </body>
    </html>
  );
}
