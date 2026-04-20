export type TimeFormatPreference = "ampm" | "24h";

export type TimePreferences = {
  timeZone: string;
  timeFormat: TimeFormatPreference;
};

export const TIME_PREFERENCES_STORAGE_KEY = "tms-time-preferences-v1";
export const TIME_PREFERENCES_EVENT = "tms-time-preferences-change";

export const TIME_ZONE_OPTIONS = [
  "UTC",
  "Europe/London",
  "Europe/Istanbul",
  "Europe/Berlin",
  "Europe/Paris",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Sao_Paulo",
  "Africa/Cairo",
  "Africa/Johannesburg",
  "Asia/Dubai",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Hong_Kong",
  "Asia/Tokyo",
  "Australia/Sydney",
];

export const getDefaultTimePreferences = (): TimePreferences => {
  const fallbackTimeZone = "UTC";

  if (typeof window === "undefined") {
    return { timeZone: fallbackTimeZone, timeFormat: "ampm" };
  }

  const detected = Intl.DateTimeFormat().resolvedOptions().timeZone || fallbackTimeZone;
  return {
    timeZone: detected,
    timeFormat: "ampm",
  };
};

const isValidTimePreferences = (value: unknown): value is TimePreferences => {
  if (!value || typeof value !== "object") return false;
  const row = value as Partial<TimePreferences>;
  return (
    typeof row.timeZone === "string" &&
    row.timeZone.length > 0 &&
    (row.timeFormat === "ampm" || row.timeFormat === "24h")
  );
};

export const readTimePreferences = (): TimePreferences => {
  const defaults = getDefaultTimePreferences();

  if (typeof window === "undefined") return defaults;

  try {
    const raw = window.localStorage.getItem(TIME_PREFERENCES_STORAGE_KEY);
    if (!raw) return defaults;

    const parsed = JSON.parse(raw) as unknown;
    if (!isValidTimePreferences(parsed)) return defaults;

    return parsed;
  } catch {
    return defaults;
  }
};

export const saveTimePreferences = (preferences: TimePreferences) => {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(TIME_PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
  window.dispatchEvent(
    new CustomEvent(TIME_PREFERENCES_EVENT, {
      detail: preferences,
    })
  );
};

const parseOffsetLabel = (label: string) => {
  const match = label.match(/(?:GMT|UTC)([+-])(\d{1,2})(?::?(\d{2}))?/i);
  if (!match) return null;

  const sign = match[1] === "+" ? 1 : -1;
  const hours = Number(match[2]);
  const minutes = Number(match[3] ?? "0");

  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return sign * (hours + minutes / 60);
};

export const getTimeZoneOffsetHours = (timeZone: string, date = new Date()): number => {
  try {
    const formatted = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "shortOffset",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(date);

    const offsetPart = formatted.find((part) => part.type === "timeZoneName")?.value ?? "";
    const parsedOffset = parseOffsetLabel(offsetPart);
    if (parsedOffset !== null) return parsedOffset;
  } catch {
    // Ignore and use fallback calculation.
  }

  try {
    const tzDate = new Date(date.toLocaleString("en-US", { timeZone }));
    const utcDate = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
    return Number(((tzDate.getTime() - utcDate.getTime()) / (60 * 60 * 1000)).toFixed(2));
  } catch {
    return 0;
  }
};

export const formatOffsetLabel = (offsetHours: number) => {
  const sign = offsetHours >= 0 ? "+" : "-";
  const absolute = Math.abs(offsetHours);
  const hours = Math.floor(absolute);
  const minutes = Math.round((absolute - hours) * 60);
  return `GMT${sign}${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

export const getTimeZoneLabel = (timeZone: string) => {
  const offset = getTimeZoneOffsetHours(timeZone);
  return `(${formatOffsetLabel(offset)}) ${timeZone}`;
};

export const formatDateWithPreferences = (
  date: Date,
  preferences: TimePreferences,
  options: Omit<Intl.DateTimeFormatOptions, "timeZone" | "hour12"> = {}
) => {
  return new Intl.DateTimeFormat("en-US", {
    ...options,
    timeZone: preferences.timeZone,
    hour12: preferences.timeFormat === "ampm",
  }).format(date);
};
