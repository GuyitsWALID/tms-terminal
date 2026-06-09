import type { Metadata } from "next";
import { IBM_Plex_Sans, Rajdhani, Geist } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import GlobalLayout from "@/components/layout/GlobalLayout";
import { cn } from "@/lib/utils";
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  weight: ["500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: "High-density economic calendar, live market news, analyst opinions, and trader community signals.",
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: `${SITE_NAME} | ${SITE_TAGLINE}`,
    description: "Original market education, economic calendar context, charting tools, and risk-aware trading resources.",
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
  },
  icons: {
    icon: "/finacialvibe2.png",
    shortcut: "/finacialvibe2.png",
    apple: "/finacialvibe2.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", plexSans.variable, rajdhani.variable, "font-sans", geist.variable)}
    >
      <head>
        <link rel="icon" href="/finacialvibe2.png" type="image/png" />
        <link rel="shortcut icon" href="/finacialvibe2.png" type="image/png" />
        <link rel="apple-touch-icon" href="/finacialvibe2.png" />
        <Script
          src="https://pl29681653.effectivecpmnetwork.com/b2/6d/a2/b26da29f6ef59d38cca1d63e46535276.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <GlobalLayout>
          {children}
        </GlobalLayout>
        <Analytics />
      </body>
    </html>
  );
}
