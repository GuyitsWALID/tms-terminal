import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";

const protectedPrefixes = ["/admin"];
const adminPublicRoutes = ["/admin/login"];
const ADMIN_GATE_COOKIE = "tms_admin_gate";
const VA_ALLOWED_PATHS = ["/admin", "/admin/complaints", "/admin/create-thread"];

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

  const resolvePortalAccess = async (userId: string) => {
    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_verified_analyst")
      .eq("id", userId)
      .maybeSingle();

    const roles = (roleRows ?? []).map((row) => row.role);
    const isAdmin = roles.includes("admin") || profile?.role === "admin";
    const isVa = roles.includes("va") || profile?.is_verified_analyst === true || profile?.role === "analyst";
    return { isAdmin, isVa, allowed: isAdmin || isVa };
  };

  const pathname = request.nextUrl.pathname;
  const adminGateSecret = process.env.ADMIN_GATE_SECRET?.trim();
  const gateCookieValue = request.cookies.get(ADMIN_GATE_COOKIE)?.value;
  const isAdminRoute = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
  const isAdminPublicRoute = adminPublicRoutes.includes(pathname);

  if (isAdminRoute && adminGateSecret && gateCookieValue !== adminGateSecret) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname === "/admin/login" && user) {
    const access = await resolvePortalAccess(user.id);
    if (access.allowed) {
      return NextResponse.redirect(new URL(access.isAdmin ? "/admin" : "/admin/create-thread", request.url));
    }
  }

  if (isAdminRoute) {
    if (isAdminPublicRoute) {
      return response;
    }

    if (!user) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const access = await resolvePortalAccess(user.id);
    if (!access.allowed) {
      const deniedUrl = new URL("/admin/login", request.url);
      deniedUrl.searchParams.set("authError", "admin_or_va_required");
      deniedUrl.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(deniedUrl);
    }

    if (!access.isAdmin) {
      if (pathname === "/admin") {
        return NextResponse.redirect(new URL("/admin/create-thread", request.url));
      }
      const allowed = VA_ALLOWED_PATHS.some((route) => pathname === route || pathname.startsWith(`${route}/`));
      if (!allowed) {
        return NextResponse.redirect(new URL("/admin/create-thread", request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
