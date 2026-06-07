import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: `Academy | ${SITE_NAME}`,
  description: "Daily fundamentals practice for learning macro concepts, risk terms, and market context.",
  alternates: {
    canonical: `${SITE_URL}/academy`,
  },
};

export default function AcademyLayout({ children }: { children: ReactNode }) {
  return children;
}
