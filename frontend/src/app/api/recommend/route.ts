import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => undefined);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Forward the auth_token cookie if present (same-origin, so it works)
    const cookie = req.cookies.get("auth_token");
    if (cookie?.value) {
      headers["Cookie"] = `auth_token=${cookie.value}`;
    }

    const response = await fetch(`${BACKEND_URL}/api/recommend`, {
      method: "POST",
      headers,
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });

    const data = await response.json().catch(() => ({}));

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      {
        error: "We couldn't reach the recommendation service. Please try again.",
        code: "RECOMMEND_PROXY_ERROR",
      },
      { status: 502 },
    );
  }
}
