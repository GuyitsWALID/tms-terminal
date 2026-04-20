import { NextResponse } from "next/server";

type ProviderPayload = {
  usersOnline?: unknown;
  onlineUsers?: unknown;
  activeUsers?: unknown;
  value?: unknown;
  data?: {
    usersOnline?: unknown;
    onlineUsers?: unknown;
    activeUsers?: unknown;
    value?: unknown;
  };
};

const parseUsersOnline = (payload: ProviderPayload): number | null => {
  const candidates = [
    payload.usersOnline,
    payload.onlineUsers,
    payload.activeUsers,
    payload.value,
    payload.data?.usersOnline,
    payload.data?.onlineUsers,
    payload.data?.activeUsers,
    payload.data?.value,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "number" && Number.isFinite(candidate) && candidate >= 0) {
      return Math.round(candidate);
    }

    if (typeof candidate === "string") {
      const parsed = Number(candidate);
      if (Number.isFinite(parsed) && parsed >= 0) {
        return Math.round(parsed);
      }
    }
  }

  return null;
};

export async function GET() {
  const endpoint = process.env.VERCEL_ANALYTICS_USERS_ONLINE_URL;
  const deployedOnVercel = Boolean(process.env.VERCEL);

  if (!endpoint) {
    return NextResponse.json(
      {
        usersOnline: null,
        source: "unconfigured",
        requiredEnv: ["VERCEL_ANALYTICS_USERS_ONLINE_URL", "VERCEL_ACCESS_TOKEN"],
        deployedOnVercel,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const token = process.env.VERCEL_ACCESS_TOKEN;
    const response = await fetch(endpoint, {
      cache: "no-store",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          usersOnline: null,
          source: "provider-error",
          statusCode: response.status,
          deployedOnVercel,
        },
        { headers: { "Cache-Control": "no-store" }, status: 200 }
      );
    }

    const payload = (await response.json()) as ProviderPayload;
    const usersOnline = parseUsersOnline(payload);

    return NextResponse.json(
      { usersOnline, source: usersOnline === null ? "provider-unmapped" : "provider", deployedOnVercel },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { usersOnline: null, source: "provider-error", deployedOnVercel },
      { headers: { "Cache-Control": "no-store" }, status: 200 }
    );
  }
}
