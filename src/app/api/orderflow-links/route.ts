import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type OrderflowLinksRow = {
  gold_heat_map_url: string | null;
  gold_foot_print_url: string | null;
  bitcoin_heat_map_url: string | null;
  bitcoin_foot_print_url: string | null;
  index_nasdaq_heat_map_url: string | null;
  index_nasdaq_foot_print_url: string | null;
  index_es_heat_map_url: string | null;
  index_es_foot_print_url: string | null;
  updated_at: string;
};

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("admin_orderflow_links")
    .select(
      "gold_heat_map_url, gold_foot_print_url, bitcoin_heat_map_url, bitcoin_foot_print_url, index_nasdaq_heat_map_url, index_nasdaq_foot_print_url, index_es_heat_map_url, index_es_foot_print_url, updated_at"
    )
    .eq("id", true)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Unable to load order flow links." }, { status: 500 });
  }

  return NextResponse.json({ links: (data ?? null) as OrderflowLinksRow | null }, { status: 200 });
}
