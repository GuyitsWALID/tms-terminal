import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();

    const response = NextResponse.redirect(new URL("/?logged_out=1", request.url));
    const cookieStore = await cookies();
    const hostname = new URL(request.url).hostname;
    const domainVariants = hostname.includes(".") ? [hostname, `.${hostname}`] : [hostname];

    cookieStore.getAll().forEach((cookie) => {
      response.cookies.set({ name: cookie.name, value: "", maxAge: 0, path: "/" });
      domainVariants.forEach((domain) => {
        response.cookies.set({ name: cookie.name, value: "", maxAge: 0, path: "/", domain });
      });
    });

    response.headers.set("Clear-Site-Data", '"cookies", "storage"');
    return response;
  } catch {
    return NextResponse.redirect(new URL("/?logged_out=1", request.url));
  }
}

export async function POST(request: Request) {
  return GET(request);
}
