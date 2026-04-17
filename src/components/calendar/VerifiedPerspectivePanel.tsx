"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMarket } from "@/components/layout/MarketContext";
import {
  createVerifiedPerspective,
  fetchAuthStatus,
  fetchEconomicCalendarWithMeta,
  fetchVerifiedPerspectives,
  type CreateVerifiedPerspectiveInput,
} from "@/lib/api/dataService";
import type { EconomicEvent, PerspectiveBias, VerifiedPerspective } from "@/types";

export default function VerifiedPerspectivePanel() {
  const { market } = useMarket();
  const [highImpactEvents, setHighImpactEvents] = useState<EconomicEvent[]>([]);
  const [selectedEventKey, setSelectedEventKey] = useState<string>("");
  const [selectedEvent, setSelectedEvent] = useState<EconomicEvent | null>(null);
  const [allPerspectives, setAllPerspectives] = useState<VerifiedPerspective[]>([]);
  const [perspectives, setPerspectives] = useState<VerifiedPerspective[]>([]);
  const [isEventsLoading, setIsEventsLoading] = useState(true);
  const [isPerspectivesLoading, setIsPerspectivesLoading] = useState(false);
  const [panelError, setPanelError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [draftThesis, setDraftThesis] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isVerifiedAnalyst, setIsVerifiedAnalyst] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadAuthStatus = async () => {
      setIsAuthLoading(true);
      try {
        const status = await fetchAuthStatus();
        if (!mounted) return;
        setIsAuthenticated(status.isAuthenticated);
        setIsVerifiedAnalyst(Boolean(status.profile?.isVerifiedAnalyst));
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
        const result = await fetchEconomicCalendarWithMeta({ market: "forex", scope: "day", date: new Date() });
        if (!mounted) return;

        const highImpact = result.events
          .filter((event) => event.impact === "high" && event.eventKey)
          .slice(0, 12);

        setHighImpactEvents(highImpact);

        if (highImpact.length === 0) {
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
    const event = highImpactEvents.find((row) => row.eventKey === selectedEventKey) ?? null;
    setSelectedEvent(event);
  }, [highImpactEvents, selectedEventKey]);

  useEffect(() => {
    let mounted = true;

    const loadPerspectives = async () => {
      setIsPerspectivesLoading(true);
      setPanelError("");

      try {
        const result = await fetchVerifiedPerspectives(undefined, "forex");
        if (!mounted) return;
        setAllPerspectives(result.perspectives);
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
  }, [market]);

  useEffect(() => {
    if (!selectedEventKey) {
      setPerspectives(allPerspectives);
      return;
    }

    setPerspectives(allPerspectives.filter((row) => row.eventKey === selectedEventKey));
  }, [allPerspectives, selectedEventKey]);

  const refreshPerspectives = async () => {
    const result = await fetchVerifiedPerspectives(undefined, "forex");
    setAllPerspectives(result.perspectives);
  };

  const onHighImpactEventClick = (event: EconomicEvent) => {
    const eventKey = event.eventKey ?? "";
    const nextSelection = selectedEventKey === eventKey ? "" : eventKey;
    setSelectedEventKey(nextSelection);

    if (isVerifiedAnalyst && nextSelection) {
      setPanelError("");
      setDraftThesis("");
      setIsShareModalOpen(true);
    } else if (nextSelection) {
      setPanelError(isAuthenticated ? "Only verified analysts can post on this event." : "Sign in as a verified analyst to post.");
    }
  };

  const submitPerspective = async () => {
    if (!selectedEvent || !selectedEvent.eventDate || !selectedEvent.eventKey) return;

    if (!isVerifiedAnalyst) {
      setPanelError("Only verified analysts can publish perspectives.");
      return;
    }

    if (draftThesis.trim().length < 20) {
      setPanelError("Perspective thesis must be at least 20 characters.");
      return;
    }

    const payload: CreateVerifiedPerspectiveInput = {
      eventKey: selectedEvent.eventKey,
      market: "forex",
      eventDate: selectedEvent.eventDate,
      currency: selectedEvent.currency,
      eventTitle: selectedEvent.event,
      impact: selectedEvent.impact,
      bias: "neutral" as PerspectiveBias,
      confidence: 70,
      thesis: draftThesis.trim(),
    };

    setIsSubmitting(true);
    setPanelError("");

    try {
      await createVerifiedPerspective(payload);
      setDraftThesis("");
      setIsShareModalOpen(false);
      await refreshPerspectives();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to submit perspective.";
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
          <p className="mb-2 text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">High impact today</p>
          <p className="mb-2 text-[10px] text-[var(--ink-muted)]">Tap an event to filter takes.</p>
          {isEventsLoading ? (
            <div className="flex items-center gap-2 text-xs text-[var(--ink-muted)]">
              <Loader2 size={12} className="animate-spin" />
              Loading events...
            </div>
          ) : highImpactEvents.length === 0 ? (
            <p className="text-xs text-[var(--ink-muted)]">No high-impact events available for this market right now.</p>
          ) : (
            <div className="max-h-[300px] space-y-2 overflow-auto pr-1">
              {highImpactEvents.map((event) => (
                <button
                  key={event.id}
                  onClick={() => onHighImpactEventClick(event)}
                  className={cn(
                    "w-full rounded border px-2 py-2 text-left text-xs",
                    selectedEventKey === event.eventKey
                      ? "border-[var(--brand)] bg-[var(--surface-hover)] text-[var(--ink-primary)]"
                      : "border-[var(--line-soft)] bg-[var(--surface-1)] text-[var(--ink-muted)]"
                  )}
                >
                  <p className="font-semibold text-[var(--ink-primary)]">{event.currency} • {event.time}</p>
                  <p className="mt-1 line-clamp-2">{event.event}</p>
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
                      <span className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase",
                        row.bias === "bullish"
                          ? "bg-[#2fd488] text-[#062114]"
                          : row.bias === "bearish"
                            ? "bg-[#ff6a6a] text-[#2f0909]"
                            : "bg-[var(--surface-hover)] text-[var(--ink-primary)]"
                      )}>
                        {row.bias}
                      </span>
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

      {isShareModalOpen && selectedEvent ? (
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
              value={draftThesis}
              onChange={(e) => setDraftThesis(e.target.value)}
              className="min-h-[120px] w-full rounded border border-[var(--line-soft)] bg-[var(--surface-1)] px-2 py-1.5 text-xs text-[var(--ink-primary)] outline-none"
              placeholder="Share your perspective..."
            />

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
                {isSubmitting ? "Posting..." : "Post"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
