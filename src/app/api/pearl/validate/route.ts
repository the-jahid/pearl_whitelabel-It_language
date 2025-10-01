import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ENV ${name}`);
  return v;
}

/** JSON-serializable type */
type Json =
  | null
  | boolean
  | number
  | string
  | Json[]
  | { [key: string]: Json };

function parseJsonSafe(text: string): Json {
  try {
    return JSON.parse(text) as Json;
  } catch {
    return { raw: text };
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

interface CallsQuery {
  sortProp: string;
  isAscending: boolean;
  tags: string[];
  status: string[];
  statuses: string[];
  conversationStatus: string[];
  conversationStatuses: string[];
  limit: number;
  skip: number;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const bodyUnknown: unknown = await req.json();

    let outboundId: string | undefined;
    let bearerToken: string | undefined;

    if (isRecord(bodyUnknown)) {
      if (typeof bodyUnknown.outboundId === "string") {
        outboundId = bodyUnknown.outboundId;
      }
      if (typeof bodyUnknown.bearerToken === "string") {
        bearerToken = bodyUnknown.bearerToken;
      }
    }

    if (!outboundId || !bearerToken) {
      return NextResponse.json<{ error: string }>(
        { error: "Missing outboundId or bearerToken" },
        { status: 400 },
      );
    }

    const base = requireEnv("NLPEARL_API_BASE_URL");
    const url = `${base}/Outbound/${encodeURIComponent(outboundId)}/Calls`;

    const payload: CallsQuery = {
      sortProp: "startTime",
      isAscending: false,
      tags: [],
      status: [],
      statuses: [],
      conversationStatus: [],
      conversationStatuses: [],
      limit: 1,
      skip: 0,
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${bearerToken.replace(/^Bearer\s+/i, "")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const text = await res.text();
    const data: Json = parseJsonSafe(text);

    return NextResponse.json<Json>(data, { status: res.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Proxy error";
    console.error("[/api/pearl/validate] proxy error:", err);
    return NextResponse.json<{ error: string }>(
      { error: message },
      { status: 500 },
    );
  }
}
