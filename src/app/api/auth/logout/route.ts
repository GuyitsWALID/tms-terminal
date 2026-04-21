import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export async function POST() {
  // This must be called from the browser, so we use the browser client
  const supabase = createSupabaseBrowserClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase client not configured" }, { status: 500 });
  }
  await supabase.auth.signOut();
  // Clear cookies if needed
  cookies().delete("sb-access-token");
  cookies().delete("sb-refresh-token");
  return NextResponse.json({ success: true });
}
