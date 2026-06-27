import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, context: RouteContext) {
  return proxy(req, context, "GET");
}

export async function POST(req: NextRequest, context: RouteContext) {
  return proxy(req, context, "POST");
}

async function proxy(req: NextRequest, context: RouteContext, method: string) {
  try {
    const { path } = await context.params;
    const subPath = path.join("/");
    const body = method === "POST" ? await req.json().catch(() => undefined) : undefined;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Forward the auth_token cookie if present
    const cookie = req.cookies.get("auth_token");
    if (cookie?.value) {
      headers["Cookie"] = `auth_token=${cookie.value}`;
    }

    const response = await fetch(`${BACKEND_URL}/api/auth/${subPath}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });

    // Forward Set-Cookie from the backend to the client
    const setCookie = response.headers.get("set-cookie");
    const data = await response.json().catch(() => ({}));

    const nextResponse = NextResponse.json(data, { status: response.status });

    if (setCookie) {
      nextResponse.headers.set("set-cookie", setCookie);
    }

    return nextResponse;
  } catch (error) {
    return NextResponse.json(
      {
        error: "We couldn't reach the authentication service. Please try again.",
        code: "AUTH_PROXY_ERROR",
      },
      { status: 502 },
    );
  }
}