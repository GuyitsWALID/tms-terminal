import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";

const protectedPrefixes = ["/admin"];
const adminPublicRoutes = ["/admin/login"];

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  let supabase;
  try {
    supabase = createSupabaseMiddlewareClient(request, response);
  } catch {
    return response;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const hasAdminAccess = async (userId: string) => {
    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (adminRole) {
      return true;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    return profile?.role === "admin";
  };

  const pathname = request.nextUrl.pathname;

  if (pathname === "/admin/login" && user) {
    if (await hasAdminAccess(user.id)) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  if (protectedPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    if (adminPublicRoutes.includes(pathname)) {
      return response;
    }

    if (!user) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!(await hasAdminAccess(user.id))) {
      const deniedUrl = new URL("/admin/login", request.url);
      deniedUrl.searchParams.set("authError", "admin_required");
      deniedUrl.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(deniedUrl);
    }
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
