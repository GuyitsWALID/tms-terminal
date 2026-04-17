import { NextRequest, NextResponse } from "next/server";
import type { ImpactLevel, MarketKey, PerspectiveBias, PerspectiveConsensus, VerifiedPerspective } from "@/types";
import { buildCalendarEventKey } from "@/lib/calendarEventKey";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const isMarket = (value: string): value is MarketKey => {
  return value === "forex" || value === "crypto" || value === "commodities";
};

const isImpact = (value: string): value is ImpactLevel => {
  return value === "high" || value === "medium" || value === "low";
};

const isBias = (value: string): value is PerspectiveBias => {
  return value === "bullish" || value === "bearish" || value === "neutral";
};

type PerspectiveRow = {
  id: string;
  event_key: string;
  market: MarketKey;
  event_date: string;
  currency: string;
  event_title: string;
  impact: ImpactLevel;
  analyst_id: string;
  analyst_name: string;
  analyst_desk: string | null;
  bias: PerspectiveBias;
  confidence: number;
  thesis: string;
  created_at: string;
  updated_at: string;
};

const mapPerspectiveRow = (row: PerspectiveRow): VerifiedPerspective => ({
  id: row.id,
  eventKey: row.event_key,
  market: row.market,
  eventDate: row.event_date,
  currency: row.currency,
  eventTitle: row.event_title,
  impact: row.impact,
  analystId: row.analyst_id,
  analystName: row.analyst_name,
  analystDesk: row.analyst_desk ?? undefined,
  bias: row.bias,
  confidence: row.confidence,
  thesis: row.thesis,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const clampConfidence = (value: number) => {
  if (!Number.isFinite(value)) return 50;
  return Math.max(0, Math.min(100, Math.round(value)));
};

const createConsensus = (eventKey: string, perspectives: VerifiedPerspective[]): PerspectiveConsensus => {
  if (perspectives.length === 0) {
    return { eventKey, count: 0, averageConfidence: 0, dominantBias: "neutral" };
  }

  const avg = perspectives.reduce((acc, item) => acc + item.confidence, 0) / perspectives.length;

  const biasScore = perspectives.reduce(
    (acc, item) => {
      acc[item.bias] += 1;
      return acc;
    },
    { bullish: 0, bearish: 0, neutral: 0 }
  );

  let dominantBias: PerspectiveBias = "neutral";
  if (biasScore.bullish > biasScore.bearish && biasScore.bullish >= biasScore.neutral) dominantBias = "bullish";
  else if (biasScore.bearish > biasScore.bullish && biasScore.bearish >= biasScore.neutral) dominantBias = "bearish";

  return {
    eventKey,
    count: perspectives.length,
    averageConfidence: Math.round(avg),
    dominantBias,
  };
};

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const search = request.nextUrl.searchParams;
  const eventKey = search.get("eventKey")?.trim();
  const market = search.get("market")?.trim();

  let perspectivesQuery = supabase
    .from("verified_perspectives")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(200);

  if (eventKey) perspectivesQuery = perspectivesQuery.eq("event_key", eventKey);
  if (market && isMarket(market)) perspectivesQuery = perspectivesQuery.eq("market", market);

  const { data: perspectiveRows, error: perspectivesError } = await perspectivesQuery;

  if (perspectivesError) {
    return NextResponse.json({ error: "Unable to load verified perspectives." }, { status: 500 });
  }

  const perspectives = (perspectiveRows ?? []).map((row) => mapPerspectiveRow(row as PerspectiveRow));

  let consensusQuery = supabase.from("perspective_consensus").select("*");
  if (eventKey) consensusQuery = consensusQuery.eq("event_key", eventKey);

  const { data: consensusRows, error: consensusError } = await consensusQuery;

  const consensus: PerspectiveConsensus[] = consensusError
    ? []
    : (consensusRows ?? []).map((row) => ({
        eventKey: row.event_key as string,
        count: row.count as number,
        averageConfidence: row.average_confidence as number,
        dominantBias: row.dominant_bias as PerspectiveBias,
      }));

  return NextResponse.json(
    {
      perspectives,
      consensus,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

type CreatePerspectiveInput = {
  eventKey?: string;
  market: string;
  eventDate: string;
  currency: string;
  eventTitle: string;
  impact: string;
  bias: string;
  confidence: number;
  thesis: string;
  analystDesk?: string;
};

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, display_name, role, is_verified_analyst")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 403 });
  }

  if (!profile.is_verified_analyst) {
    return NextResponse.json({ error: "Only verified analyst accounts can submit perspectives." }, { status: 403 });
  }

  const input = (await request.json()) as CreatePerspectiveInput;

  if (!isMarket(input.market) || !isImpact(input.impact) || !isBias(input.bias) || !input.eventDate || !input.currency || !input.eventTitle) {
    return NextResponse.json(
      {
        error: "Invalid perspective payload.",
      },
      { status: 400 }
    );
  }

  if (!input.thesis || input.thesis.trim().length < 20) {
    return NextResponse.json(
      {
        error: "Thesis must be at least 20 characters.",
      },
      { status: 400 }
    );
  }

  const eventKey =
    input.eventKey?.trim() ||
    buildCalendarEventKey({
      eventDate: input.eventDate,
      currency: input.currency,
      event: input.eventTitle,
      impact: input.impact,
    });

  const analystName = (profile.display_name as string | null) || user.email || "Verified Analyst";

  const { error: eventError } = await supabase.from("economic_events").upsert(
    {
      event_key: eventKey,
      market: input.market,
      event_date: new Date(input.eventDate).toISOString(),
      currency: input.currency,
      event_title: input.eventTitle,
      impact: input.impact,
      source: "app",
    },
    { onConflict: "event_key" }
  );

  if (eventError) {
    return NextResponse.json({ error: "Unable to persist event context." }, { status: 500 });
  }

  const { data: upsertedRow, error: upsertError } = await supabase
    .from("verified_perspectives")
    .upsert(
      {
        event_key: eventKey,
        market: input.market,
        event_date: input.eventDate,
        currency: input.currency,
        event_title: input.eventTitle,
        impact: input.impact,
        analyst_id: user.id,
        analyst_name: analystName,
        analyst_desk: input.analystDesk?.trim() || null,
        bias: input.bias,
        confidence: clampConfidence(input.confidence),
        thesis: input.thesis.trim(),
      },
      { onConflict: "event_key,analyst_id" }
    )
    .select("*")
    .single();

  if (upsertError || !upsertedRow) {
    return NextResponse.json({ error: "Unable to submit perspective." }, { status: 500 });
  }

  const { data: consensusRow } = await supabase
    .from("perspective_consensus")
    .select("*")
    .eq("event_key", eventKey)
    .single();

  const consensus: PerspectiveConsensus = consensusRow
    ? {
        eventKey: consensusRow.event_key as string,
        count: consensusRow.count as number,
        averageConfidence: consensusRow.average_confidence as number,
        dominantBias: consensusRow.dominant_bias as PerspectiveBias,
      }
    : createConsensus(eventKey, [mapPerspectiveRow(upsertedRow as PerspectiveRow)]);

  return NextResponse.json({ perspective: mapPerspectiveRow(upsertedRow as PerspectiveRow), consensus }, { status: 201 });
}
