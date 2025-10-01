// ./src/app/api/pearl/campaigns/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ENV ${name}`);
  return v;
}

type Json =
  | null
  | boolean
  | number
  | string
  | Json[]
  | { [key: string]: Json };

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const email = req.nextUrl.searchParams.get("email");
    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    const base = requireEnv("WHITE_LABEL_API_BASE_URL");
    const url = `${base}/users/email/${encodeURIComponent(email)}/userdata`;

    const res = await fetch(url, {
      headers: { "Cache-Control": "no-cache", Accept: "application/json" },
      cache: "no-store",
    });

    const text = await res.text();

    let data: Json | { raw: string };
    try {
      data = JSON.parse(text) as Json;
    } catch {
      data = { raw: text };
    }

    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Proxy error";
    console.error("[/api/pearl/campaigns] proxy error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
