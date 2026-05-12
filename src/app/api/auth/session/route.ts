import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const access_token = body?.access_token as string | undefined;
    const refresh_token = body?.refresh_token as string | undefined;

    if (!access_token || !refresh_token) {
      return NextResponse.json({ error: "access_token and refresh_token required" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.setSession({ access_token, refresh_token });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const response = NextResponse.json({ ok: true });
    const cookieStore = await cookies();
    const hostname = request.nextUrl.hostname;
    const domainVariants = hostname.includes(".") ? [hostname, `.${hostname}`] : [hostname];

    cookieStore.getAll().forEach((cookie) => {
      response.cookies.set({ name: cookie.name, value: "", maxAge: 0, path: "/" });
      domainVariants.forEach((domain) => {
        response.cookies.set({ name: cookie.name, value: "", maxAge: 0, path: "/", domain });
      });
    });

    response.headers.set("Clear-Site-Data", '"cookies"');

    return response;
  } catch {
    return NextResponse.json({ error: "Unable to sign out." }, { status: 500 });
  }
}
