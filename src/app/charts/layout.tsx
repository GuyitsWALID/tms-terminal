import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: `Charts | ${SITE_NAME}`,
  description: "Live charts, symbol context, and educational guidance for using market data without ignoring risk.",
  alternates: {
    canonical: `${SITE_URL}/charts`,
  },
};

export default function ChartsLayout({ children }: { children: ReactNode }) {
  return children;
}
