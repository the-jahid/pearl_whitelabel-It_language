// ./src/app/api/pearl/call/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ENV ${name}`);
  return v;
}

// Strict JSON type to avoid `any`
type Json =
  | null
  | boolean
  | number
  | string
  | Json[]
  | { [key: string]: Json };

export async function GET(
  req: NextRequest,
  // In newer Next.js types, `params` can be a Promise – await it
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await context.params;

    const bearerHeader = req.headers.get("x-bearer-token") ?? "";
    const bearer = bearerHeader.replace(/^Bearer\s+/i, "");

    if (!id || !bearer) {
      return NextResponse.json(
        { error: "Missing call id or x-bearer-token" },
        { status: 400 },
      );
    }

    const base = requireEnv("NLPEARL_API_BASE_URL");
    const url = `${base}/Call/${encodeURIComponent(id)}`;

    const res = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${bearer}` },
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
    console.error("[/api/pearl/call/:id] proxy error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
