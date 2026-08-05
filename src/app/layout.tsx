import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import { MotionProvider } from "@/components/motion/motion-provider";
import { RegisterServiceWorker } from "@/components/pwa/register-service-worker";
import { siteConfig } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [
    "pet health records",
    "pet vaccination tracker",
    "pet medical history",
    "pet weight tracker",
    "lost pet QR tag",
  ],
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    url: siteConfig.url,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
  robots: { index: true, follow: true },
  // iOS ignores most of the web app manifest, so the installed-app behaviour
  // there comes from these meta tags instead.
  appleWebApp: {
    capable: true,
    title: siteConfig.name,
    statusBarStyle: "default",
  },
  other: {
    // Next emits the standardised `mobile-web-app-capable`, which iOS only
    // honours from 17.4. The Apple-prefixed tag is what older iPhones read, so
    // both ship for full coverage.
    "apple-mobile-web-app-capable": "yes",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  // Paints the browser and installed-app chrome in the brand navy.
  themeColor: "#17375C",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  // Never block pinch-zoom — it's an accessibility requirement, and on a page
  // showing a pet's medication list somebody may genuinely need to zoom.
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="flex min-h-full flex-col font-sans">
        <MotionProvider>{children}</MotionProvider>
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
