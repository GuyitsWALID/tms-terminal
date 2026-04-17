import type { ImpactLevel } from "@/types";

type CalendarKeyInput = {
  eventDate?: string;
  currency: string;
  event: string;
  impact?: ImpactLevel;
};

export const normalizeEventTitle = (value: string) => {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

export const buildCalendarEventKey = ({ eventDate, currency, event, impact }: CalendarKeyInput) => {
  const datePart = (eventDate ?? "unknown-date").trim();
  const currencyPart = (currency || "N/A").toUpperCase().trim();
  const impactPart = impact ?? "low";
  const titlePart = normalizeEventTitle(event);

  return `${datePart}|${currencyPart}|${impactPart}|${titlePart}`;
};
