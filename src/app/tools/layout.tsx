import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: `Order Flow Tools | ${SITE_NAME}`,
  description: "Order flow resource links with educational context for liquidity, futures products, gold, and index trading.",
  alternates: {
    canonical: `${SITE_URL}/tools`,
  },
};

export default function ToolsLayout({ children }: { children: ReactNode }) {
  return children;
}
