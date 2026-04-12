import type { Metadata } from "next";
import { IBM_Plex_Sans, Rajdhani, Geist } from "next/font/google";
import "./globals.css";
import GlobalLayout from "@/components/layout/GlobalLayout";
import { cn } from "@/lib/utils";

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
      className={cn("h-full", "antialiased", plexSans.variable, rajdhani.variable, "font-sans", geist.variable)}
    >
      <body className="min-h-full flex flex-col">
        <GlobalLayout>
          {children}
        </GlobalLayout>
      </body>
    </html>
  );
}
