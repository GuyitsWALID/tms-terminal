import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: `Community Forum | ${SITE_NAME}`,
  description: "Financial Vibe community discussions with moderation, verified analyst context, and market education.",
  alternates: {
    canonical: `${SITE_URL}/forum`,
  },
};

export default function ForumLayout({ children }: { children: ReactNode }) {
  return children;
}
