import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: `Economic Calendar | ${SITE_NAME}`,
  description: "Economic calendar events with original preparation guidance, analyst perspectives, and risk-aware event planning.",
  alternates: {
    canonical: `${SITE_URL}/calendar`,
  },
};

export default function CalendarLayout({ children }: { children: ReactNode }) {
  return children;
}
