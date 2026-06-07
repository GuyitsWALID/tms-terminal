import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: `Market Analysis | ${SITE_NAME}`,
  description: "Market heatmaps, technical context, and original Financial Vibe guidance for reading multi-market conditions.",
  alternates: {
    canonical: `${SITE_URL}/analysis`,
  },
};

export default function AnalysisLayout({ children }: { children: ReactNode }) {
  return children;
}
