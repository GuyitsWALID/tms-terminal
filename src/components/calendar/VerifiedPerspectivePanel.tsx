"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Loader2, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMarket } from "@/components/layout/MarketContext";
import {
  createVerifiedPerspective,
  deleteVerifiedPerspective,
  fetchAuthStatus,
  fetchEconomicCalendarWithMeta,
  fetchVerifiedPerspectives,
  updateVerifiedPerspective,
  type CreateVerifiedPerspectiveInput,
} from "@/lib/api/dataService";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { EconomicEvent, ImpactLevel, PerspectiveBias, VerifiedPerspective } from "@/types";

type PerspectiveDraft = {
  thesis: string;
  bias: PerspectiveBias;
  impact: ImpactLevel;
  confidence: number;
};

const createDraft = (event: EconomicEvent, perspective?: VerifiedPerspective): PerspectiveDraft => ({
  thesis: perspective?.thesis ?? "",
  bias: perspective?.bias ?? "neutral",
  impact: perspective?.impact ?? event.impact,
  confidence: perspective?.confidence ?? 70,
});

const eventMatchesPerspective = (event: EconomicEvent, perspective: VerifiedPerspective) => {
  if (event.eventKey && event.eventKey === perspective.eventKey) return true;
  return (
    event.eventDate === perspective.eventDate &&
    event.currency.toUpperCase() === perspective.currency.toUpperCase() &&
    event.event.trim().toLowerCase() === perspective.eventTitle.trim().toLowerCase()
  );
};

const parseEventDate = (date: string | undefined) => {
  if (!date) return null;
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const parseEventTimestamp = (event: EconomicEvent) => {
  const eventDate = parseEventDate(event.eventDate);
  if (!eventDate) return null;

  const timeMatch = event.time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!timeMatch) {
    return new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate(), 23, 59, 59, 999);
  }

  const [, hourRaw, minuteRaw, periodRaw] = timeMatch;
  const period = periodRaw.toUpperCase();
  let hour = Number(hourRaw);
  const minute = Number(minuteRaw);

  if (period === "PM" && hour < 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;

  return new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate(), hour, minute, 0, 0);
};

export default function VerifiedPerspectivePanel() {
  const { market } = useMarket();
  const [impactEvents, setImpactEvents] = useState<EconomicEvent[]>([]);
  const [todayKey, setTodayKey] = useState("");
  const [selectedEventKey, setSelectedEventKey] = useState<string>("");
  const [selectedEvent, setSelectedEvent] = useState<EconomicEvent | null>(null);
  const [allPerspectives, setAllPerspectives] = useState<VerifiedPerspective[]>([]);
  const [perspectives, setPerspectives] = useState<VerifiedPerspective[]>([]);
  const [isEventsLoading, setIsEventsLoading] = useState(true);
  const [isPerspectivesLoading, setIsPerspectivesLoading] = useState(false);
  const [panelError, setPanelError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [draftsByEventKey, setDraftsByEventKey] = useState<Record<string, PerspectiveDraft>>({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isVerifiedAnalyst, setIsVerifiedAnalyst] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [currentAnalystName, setCurrentAnalystName] = useState<string>("");
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 60_000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const liveEvents = useMemo(
    () =>
      impactEvents.filter((event) => {
        const timestamp = parseEventTimestamp(event);
        return timestamp ? timestamp.getTime() >= nowMs : true;
      }),
    [impactEvents, nowMs]
  );

  useEffect(() => {
    let mounted = true;

    const loadAuthStatus = async () => {
      setIsAuthLoading(true);
      try {
        const status = await fetchAuthStatus();
        if (!mounted) return;
        setIsAuthenticated(status.isAuthenticated);
        setIsVerifiedAnalyst(Boolean(status.profile?.isVerifiedAnalyst));
        setCurrentUserId(status.userId ?? "");
        setCurrentAnalystName(status.profile?.displayName ?? status.email ?? "");
      } finally {
        if (mounted) setIsAuthLoading(false);
      }
    };

    void loadAuthStatus();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadEvents = async () => {
      setIsEventsLoading(true);
      setPanelError("");

      try {
        const now = new Date();
        const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
          now.getDate()
        ).padStart(2, "0")}`;
        setTodayKey(dateKey);
        const result = await fetchEconomicCalendarWithMeta({ market, scope: "day", date: new Date() });
        if (!mounted) return;

        const events = result.events
          .filter((event) => event.eventKey && event.eventDate === dateKey)
          .slice(0, 12);

        setImpactEvents(events);

        if (events.length === 0) {
          setSelectedEventKey("");
          setSelectedEvent(null);
        }
      } catch {
        if (!mounted) return;
        setPanelError("Unable to load calendar events for verified perspectives.");
      } finally {
        if (mounted) setIsEventsLoading(false);
      }
    };

    void loadEvents();

    return () => {
      mounted = false;
    };
  }, [market]);

  useEffect(() => {
    const event = liveEvents.find((row) => row.eventKey === selectedEventKey) ?? null;
    setSelectedEvent(event);
  }, [liveEvents, selectedEventKey]);

  useEffect(() => {
    let mounted = true;

    const loadPerspectives = async () => {
      setIsPerspectivesLoading(true);
      setPanelError("");

      try {
        const result = await fetchVerifiedPerspectives(undefined, market);
        if (!mounted) return;
        const dailyPerspectives = todayKey
          ? result.perspectives.filter((row) => row.eventDate === todayKey)
          : result.perspectives;
        setAllPerspectives(dailyPerspectives);
      } catch {
        if (!mounted) return;
        setPanelError("Unable to load verified analyst perspectives.");
      } finally {
        if (mounted) setIsPerspectivesLoading(false);
      }
    };

    void loadPerspectives();

    return () => {
      mounted = false;
    };
  }, [market, todayKey]);

  useEffect(() => {
    if (!selectedEventKey) {
      setPerspectives(allPerspectives.filter((row) => liveEvents.some((event) => eventMatchesPerspective(event, row))));
      return;
    }

    const event = liveEvents.find((row) => row.eventKey === selectedEventKey);
    if (!event) {
      setPerspectives([]);
      return;
    }

    setPerspectives(allPerspectives.filter((row) => eventMatchesPerspective(event, row)));
  }, [allPerspectives, liveEvents, selectedEventKey]);

  const refreshPerspectives = async () => {
    const result = await fetchVerifiedPerspectives(undefined, market);
    const dailyPerspectives = todayKey
      ? result.perspectives.filter((row) => row.eventDate === todayKey)
      : result.perspectives;
    setAllPerspectives(dailyPerspectives);
  };

  const ownSelectedPerspective = useMemo(() => {
    if (!selectedEvent || !currentUserId) return null;
    return allPerspectives.find((row) => row.analystId === currentUserId && eventMatchesPerspective(selectedEvent, row)) ?? null;
  }, [allPerspectives, currentUserId, selectedEvent]);

  const canManagePerspective = (perspective: VerifiedPerspective) => {
    if (!isVerifiedAnalyst) return false;
    if (currentUserId && perspective.analystId === currentUserId) return true;
    return Boolean(currentAnalystName && perspective.analystName.trim().toLowerCase() === currentAnalystName.trim().toLowerCase());
  };

  const selectedDraft = selectedEventKey && selectedEvent ? draftsByEventKey[selectedEventKey] ?? createDraft(selectedEvent, ownSelectedPerspective ?? undefined) : null;

  const updateSelectedDraft = (patch: Partial<PerspectiveDraft>) => {
    if (!selectedEventKey || !selectedEvent) return;
    setDraftsByEventKey((current) => ({
      ...current,
      [selectedEventKey]: {
        ...(current[selectedEventKey] ?? createDraft(selectedEvent, ownSelectedPerspective ?? undefined)),
        ...patch,
      },
    }));
  };

  const seedDraft = (event: EconomicEvent, perspective?: VerifiedPerspective | null) => {
    const eventKey = event.eventKey ?? "";
    if (!eventKey) return;
    setDraftsByEventKey((current) => ({
      ...current,
      [eventKey]: current[eventKey] ?? createDraft(event, perspective ?? undefined),
    }));
  };

  const openComposerForEvent = (event: EconomicEvent, perspective?: VerifiedPerspective | null) => {
    seedDraft(event, perspective);
    setSelectedEventKey(event.eventKey ?? "");
    setSelectedEvent(event);
    setPanelError("");
    setIsShareModalOpen(true);
  };

  const onCalendarEventClick = (event: EconomicEvent) => {
    const eventKey = event.eventKey ?? "";
    const nextSelection = selectedEventKey === eventKey ? "" : eventKey;
    setSelectedEventKey(nextSelection);

    if (isVerifiedAnalyst && nextSelection) {
      const existingPerspective = allPerspectives.find((row) => row.analystId === currentUserId && eventMatchesPerspective(event, row));
      openComposerForEvent(event, existingPerspective);
    } else if (nextSelection) {
      setPanelError(isAuthenticated ? "Only verified analysts can post on this event." : "Sign in as a verified analyst to post.");
    }
  };

  const submitPerspective = async () => {
    if (!selectedEvent || !selectedEvent.eventDate || !selectedEvent.eventKey || !selectedDraft) return;

    if (!isVerifiedAnalyst) {
      setPanelError("Only verified analysts can publish perspectives.");
      return;
    }

    if (selectedDraft.thesis.trim().length < 20) {
      setPanelError("Perspective thesis must be at least 20 characters.");
      return;
    }

    const payload: CreateVerifiedPerspectiveInput = {
      eventKey: selectedEvent.eventKey,
      market,
      eventDate: selectedEvent.eventDate,
      currency: selectedEvent.currency,
      eventTitle: selectedEvent.event,
      impact: selectedDraft.impact,
      bias: selectedDraft.bias,
      confidence: selectedDraft.confidence,
      thesis: selectedDraft.thesis.trim(),
    };

    setIsSubmitting(true);
    setPanelError("");

    try {
      if (ownSelectedPerspective) {
        await updateVerifiedPerspective(ownSelectedPerspective.id, {
          impact: selectedDraft.impact,
          bias: selectedDraft.bias,
          confidence: selectedDraft.confidence,
          thesis: selectedDraft.thesis.trim(),
        });
      } else {
        await createVerifiedPerspective(payload);
      }
      setIsShareModalOpen(false);
      await refreshPerspectives();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to submit perspective.";
      setPanelError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deletePerspective = async (perspective: VerifiedPerspective) => {
    setIsSubmitting(true);
    setPanelError("");

    try {
      await deleteVerifiedPerspective(perspective.id);
      setDraftsByEventKey((current) => {
        const next = { ...current };
        const event = liveEvents.find((row) => eventMatchesPerspective(row, perspective));
        if (event?.eventKey) delete next[event.eventKey];
        return next;
      });
      if (ownSelectedPerspective?.id === perspective.id) setIsShareModalOpen(false);
      await refreshPerspectives();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to delete perspective.";
      setPanelError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="ff-panel overflow-hidden">
      <header className="border-b border-[var(--line-strong)] bg-[var(--surface-header)] px-3 py-2">
        <h2 className="ff-panel-title text-xs sm:text-sm text-[var(--ink-primary)]">Analyst Perspectives</h2>
      </header>

      <div className="grid grid-cols-1 gap-2 bg-[var(--surface-2)] p-2 sm:gap-3 sm:p-3 xl:grid-cols-[200px_minmax(0,1fr)]">
        <div className="rounded border border-[var(--line-soft)] bg-[var(--surface-3)] p-2">
          <p className="mb-2 text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">Today&apos;s news</p>
          <p className="mb-2 text-[10px] text-[var(--ink-muted)]">Tap an event to filter takes or write as a V.A.</p>
          {isEventsLoading ? (
            <div className="flex items-center gap-2 text-xs text-[var(--ink-muted)]">
              <Loader2 size={12} className="animate-spin" />
              Loading events...
            </div>
          ) : liveEvents.length === 0 ? (
            <p className="text-xs text-[var(--ink-muted)]">No unreleased calendar news available for this market right now.</p>
          ) : (
            <div className="max-h-[300px] space-y-2 overflow-auto pr-1">
              {liveEvents.map((event) => (
                <button
                  key={event.id}
                  onClick={() => onCalendarEventClick(event)}
                  className={cn(
                    "w-full rounded border px-2 py-2 text-left text-xs",
                    selectedEventKey === event.eventKey
                      ? "border-[var(--brand)] bg-[var(--surface-hover)] text-[var(--ink-primary)]"
                      : "border-[var(--line-soft)] bg-[var(--surface-1)] text-[var(--ink-muted)]"
                  )}
                >
                  <p className="font-semibold text-[var(--ink-primary)]">{event.currency} • {event.time}</p>
                  <p className="mt-1 line-clamp-2">{event.event}</p>
                  <span className="mt-1 inline-flex rounded border border-[var(--line-soft)] px-1.5 py-0.5 text-[9px] font-bold uppercase">
                    {event.impact}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="rounded border border-[var(--line-soft)] bg-[var(--surface-3)] p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="ff-panel-title text-xs text-[var(--ink-primary)]">Analyst takes</h3>
              {selectedEvent ? (
                <span className="text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
                  {selectedEvent.currency} {selectedEvent.time}
                </span>
              ) : (
                <span className="text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">All events</span>
              )}
            </div>

            {isAuthLoading ? (
              <div className="mb-2 text-[11px] text-[var(--ink-muted)]">Checking analyst permissions...</div>
            ) : null}

            {panelError ? (
              <div className="mb-2 inline-flex items-center gap-1 text-[11px] text-[#ffb38f]">
                <AlertTriangle size={12} />
                {panelError}
              </div>
            ) : null}

            {isPerspectivesLoading ? (
              <div className="flex items-center gap-2 text-xs text-[var(--ink-muted)]">
                <Loader2 size={12} className="animate-spin" />
                Loading perspectives...
              </div>
            ) : perspectives.length === 0 ? (
              <p className="text-xs text-[var(--ink-muted)]">No analyst takes yet for this view.</p>
            ) : (
              <div className="max-h-[360px] space-y-2 overflow-auto pr-1">
                {perspectives.map((row) => (
                  <article key={row.id} className="rounded border border-[var(--line-soft)] bg-[var(--surface-1)] p-2 text-xs">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="font-semibold text-[var(--ink-primary)]">{row.analystName}</p>
                      <div className="flex items-center gap-1">
                        <span className="rounded border border-[var(--line-soft)] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[var(--ink-muted)]">
                          {row.impact}
                        </span>
                        {row.bias !== "neutral" ? (
                          <span className={cn(
                            "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase",
                            row.bias === "bullish" ? "bg-[#2fd488] text-[#062114]" : "bg-[#ff6a6a] text-[#2f0909]"
                          )}>
                            {row.bias}
                          </span>
                        ) : null}
                        {canManagePerspective(row) ? (
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                className="rounded p-1 text-[var(--ink-muted)] hover:bg-[var(--surface-hover)]"
                                aria-label="Open perspective actions"
                              >
                                <MoreVertical size={14} />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-32 border-[var(--line-soft)] bg-[var(--surface-3)] p-1">
                              <button
                                onClick={() => {
                                  const event = liveEvents.find((candidate) => eventMatchesPerspective(candidate, row));
                                  if (!event?.eventKey) return;
                                  const eventKey = event.eventKey;
                                  setDraftsByEventKey((current) => ({
                                    ...current,
                                    [eventKey]: {
                                      thesis: row.thesis,
                                      bias: row.bias,
                                      impact: row.impact,
                                      confidence: row.confidence,
                                    },
                                  }));
                                  setSelectedEventKey(eventKey);
                                  setSelectedEvent(event);
                                  setIsShareModalOpen(true);
                                }}
                                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-[var(--ink-primary)] hover:bg-[var(--surface-hover)]"
                              >
                                <Pencil size={12} />
                                Edit
                              </button>
                              <button
                                onClick={() => void deletePerspective(row)}
                                disabled={isSubmitting}
                                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-[#ff8f8f] hover:bg-[#ff6a6a18]"
                              >
                                <Trash2 size={12} />
                                Delete
                              </button>
                            </PopoverContent>
                          </Popover>
                        ) : null}
                      </div>
                    </div>
                    {row.analystDesk ? <p className="text-[10px] uppercase tracking-wide text-[var(--ink-muted)]">{row.analystDesk}</p> : null}
                    <p className="mt-1 text-[var(--ink-muted)]">{row.thesis}</p>
                    <p className="mt-1 text-[10px] text-[var(--ink-muted)]">{new Date(row.updatedAt).toLocaleString()}</p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {isShareModalOpen && selectedEvent && selectedDraft ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 sm:items-center">
          <div className="w-full max-w-lg rounded border border-[var(--line-strong)] bg-[var(--surface-3)] p-3">
            <div className="mb-2 flex items-start justify-between gap-2">
              <div>
                <h3 className="ff-panel-title text-sm text-[var(--ink-primary)]">Share your perspective</h3>
                <p className="mt-1 text-xs text-[var(--ink-muted)]">
                  {selectedEvent.currency} | {selectedEvent.time} | {selectedEvent.event}
                </p>
              </div>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="rounded border border-[var(--line-soft)] bg-[var(--surface-1)] px-2 py-1 text-xs text-[var(--ink-muted)]"
              >
                Close
              </button>
            </div>

            <textarea
              value={selectedDraft.thesis}
              onChange={(e) => updateSelectedDraft({ thesis: e.target.value })}
              className="min-h-[120px] w-full rounded border border-[var(--line-soft)] bg-[var(--surface-1)] px-2 py-1.5 text-xs text-[var(--ink-primary)] outline-none"
              placeholder="Share your perspective..."
            />

            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <label className="text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
                Impact
                <select
                  value={selectedDraft.impact}
                  onChange={(e) => updateSelectedDraft({ impact: e.target.value as ImpactLevel })}
                  className="mt-1 w-full rounded border border-[var(--line-soft)] bg-[var(--surface-1)] px-2 py-1.5 text-xs text-[var(--ink-primary)] outline-none"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </label>
              <label className="text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
                Bias
                <select
                  value={selectedDraft.bias}
                  onChange={(e) => updateSelectedDraft({ bias: e.target.value as PerspectiveBias })}
                  className="mt-1 w-full rounded border border-[var(--line-soft)] bg-[var(--surface-1)] px-2 py-1.5 text-xs text-[var(--ink-primary)] outline-none"
                >
                  <option value="bullish">Bullish</option>
                  <option value="neutral">Neutral</option>
                  <option value="bearish">Bearish</option>
                </select>
              </label>
              <label className="text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
                Confidence
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={selectedDraft.confidence}
                  onChange={(e) => updateSelectedDraft({ confidence: Number(e.target.value) })}
                  className="mt-1 w-full rounded border border-[var(--line-soft)] bg-[var(--surface-1)] px-2 py-1.5 text-xs text-[var(--ink-primary)] outline-none"
                />
              </label>
            </div>

            <div className="mt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="rounded border border-[var(--line-soft)] bg-[var(--surface-1)] px-3 py-1.5 text-xs font-semibold text-[var(--ink-muted)]"
              >
                Cancel
              </button>
              <button
                onClick={submitPerspective}
                disabled={isSubmitting}
                className={cn(
                  "rounded border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider",
                  isSubmitting
                    ? "cursor-not-allowed border-[var(--line-soft)] bg-[var(--surface-1)] text-[var(--ink-muted)]"
                    : "border-[var(--brand)] bg-[var(--surface-hover)] text-[var(--ink-primary)]"
                )}
              >
                {isSubmitting ? "Saving..." : ownSelectedPerspective ? "Save" : "Post"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
