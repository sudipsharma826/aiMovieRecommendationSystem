import { NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/health`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      // keep it fast; don't cache health status during dev
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { status: "error", message: `Backend responded with ${response.status}` },
        { status: 502 }
      );
    }

    const data = (await response.json()) as { status?: string };
    const isOk = data.status === "ok";

    return NextResponse.json(
      { status: isOk ? "ok" : "error", backend: data },
      { status: isOk ? 200 : 502 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Failed to reach backend",
      },
      { status: 502 }
    );
  }
}
