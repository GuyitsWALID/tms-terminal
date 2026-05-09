import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type OrderflowLinksInput = {
  gold_heat_map_url?: string;
  gold_foot_print_url?: string;
  bitcoin_heat_map_url?: string;
  bitcoin_foot_print_url?: string;
  index_nasdaq_heat_map_url?: string;
  index_nasdaq_foot_print_url?: string;
  index_es_heat_map_url?: string;
  index_es_foot_print_url?: string;
};

const ensureAdmin = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, authorized: false, status: 401 as const, error: "Authentication required." };
  }

  const { data: adminRole } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (!adminRole) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profile?.role !== "admin") {
      return { supabase, user, authorized: false, status: 403 as const, error: "Admin role required." };
    }
  }

  return { supabase, user, authorized: true as const };
};

const sanitizeUrl = (value: string | undefined) => {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return null;
  if (!/^https?:\/\//i.test(trimmed)) return null;
  return trimmed;
};

export async function GET() {
  const access = await ensureAdmin();
  if (!access.authorized) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { data, error } = await access.supabase
    .from("admin_orderflow_links")
    .select(
      "gold_heat_map_url, gold_foot_print_url, bitcoin_heat_map_url, bitcoin_foot_print_url, index_nasdaq_heat_map_url, index_nasdaq_foot_print_url, index_es_heat_map_url, index_es_foot_print_url, updated_at"
    )
    .eq("id", true)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Unable to load links." }, { status: 500 });
  }

  return NextResponse.json({ links: data ?? null }, { status: 200 });
}

export async function PUT(request: NextRequest) {
  const access = await ensureAdmin();
  if (!access.authorized) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const input = (await request.json()) as OrderflowLinksInput;
  const payload = {
    id: true,
    gold_heat_map_url: sanitizeUrl(input.gold_heat_map_url),
    gold_foot_print_url: sanitizeUrl(input.gold_foot_print_url),
    bitcoin_heat_map_url: sanitizeUrl(input.bitcoin_heat_map_url),
    bitcoin_foot_print_url: sanitizeUrl(input.bitcoin_foot_print_url),
    index_nasdaq_heat_map_url: sanitizeUrl(input.index_nasdaq_heat_map_url),
    index_nasdaq_foot_print_url: sanitizeUrl(input.index_nasdaq_foot_print_url),
    index_es_heat_map_url: sanitizeUrl(input.index_es_heat_map_url),
    index_es_foot_print_url: sanitizeUrl(input.index_es_foot_print_url),
    updated_at: new Date().toISOString(),
    updated_by: access.user?.id ?? null,
  };

  const { data, error } = await access.supabase
    .from("admin_orderflow_links")
    .upsert(payload, { onConflict: "id" })
    .select(
      "gold_heat_map_url, gold_foot_print_url, bitcoin_heat_map_url, bitcoin_foot_print_url, index_nasdaq_heat_map_url, index_nasdaq_foot_print_url, index_es_heat_map_url, index_es_foot_print_url, updated_at"
    )
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Unable to save links." }, { status: 500 });
  }

  await access.supabase.from("admin_audit_logs").insert({
    actor_id: access.user?.id ?? null,
    action: "orderflow_links_updated",
    target_type: "admin_orderflow_links",
    target_id: "singleton",
    payload,
  });

  return NextResponse.json({ links: data }, { status: 200 });
}
