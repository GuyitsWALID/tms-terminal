import type { Metadata } from "next";
import { IBM_Plex_Sans, Rajdhani } from "next/font/google";
import "./globals.css";
import GlobalLayout from "@/components/layout/GlobalLayout";

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
  title: "TMS Terminal | Forex Intelligence Grid",
  description: "High-density economic calendar, live market news, analyst opinions, and trader community signals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plexSans.variable} ${rajdhani.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <GlobalLayout>
          {children}
        </GlobalLayout>
      </body>
    </html>
  );
}
