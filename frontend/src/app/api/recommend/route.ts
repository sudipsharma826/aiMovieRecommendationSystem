import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => undefined);

    const authCookie = req.cookies.get("auth_token");

    console.log("Auth token:", authCookie);

    const response = await fetch(`${BACKEND_URL}/api/recommend`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authCookie && {
          Cookie: `auth_token=${authCookie.value}`,
        }),
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });

    const data = await response.json().catch(() => ({}));

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "We couldn't reach the recommendation service. Please try again.",
        code: "RECOMMEND_PROXY_ERROR",
      },
      { status: 502 }
    );
  }
}