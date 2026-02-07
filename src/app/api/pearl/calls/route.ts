// ./src/app/api/pearl/calls/route.ts
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

// Client request body (what your UI sends)
interface CallsPostBody {
  outboundId: string;
  bearerToken: string;
  skip?: number;
  limit?: number;
  sortProp?: string;
  isAscending?: boolean;
  fromDate?: string; // ISO string (optional)
  toDate?: string;   // ISO string (optional)
  tags?: Array<string | number>; // accept numbers/strings; we'll coerce to strings
  statuses?: Array<number | string>;
  conversationStatuses?: Array<number | string>;
}

// Upstream payload (what NLPEARL expects)
interface UpstreamPayload {
  skip?: number;
  limit?: number;
  sortProp?: string;
  isAscending?: boolean;
  fromDate?: string;
  toDate?: string;
  tags?: string[];
  status?: number[];
  conversationStatus?: number[];
}

const toNumArray = (value: unknown): number[] =>
  Array.isArray(value)
    ? value
      .map((v) => (typeof v === "number" ? v : Number(v)))
      .filter((v) => Number.isFinite(v))
    : [];

const toStrArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value
      .map((v) =>
        typeof v === "string"
          ? v
          : v == null
            ? ""
            : String(v),
      )
      .filter((s) => s.length > 0)
    : [];

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const raw = (await req.json()) as unknown;
    const body: Partial<CallsPostBody> =
      typeof raw === "object" && raw !== null ? (raw as Partial<CallsPostBody>) : {};

    const {
      outboundId,
      bearerToken,
      skip = 0,
      limit = 100,
      sortProp = "startTime",
      isAscending = false,
      fromDate,
      toDate,
      tags = [],
      statuses = [],
      conversationStatuses = [],
    } = body;

    if (!outboundId || !bearerToken) {
      return NextResponse.json(
        { error: "Missing outboundId or bearerToken" },
        { status: 400 },
      );
    }

    const base = requireEnv("NLPEARL_API_BASE_URL");
    // Use v2 Pearl endpoint (pearlId = outboundId)
    const url = `${base}/Pearl/${encodeURIComponent(outboundId)}/Calls`;

    const statusArr = toNumArray(statuses);
    const convArr = toNumArray(conversationStatuses);
    const tagArr = toStrArray(tags);

    const payload: UpstreamPayload = {
      skip,
      limit,
      sortProp,
      isAscending,
    };

    if (fromDate) payload.fromDate = fromDate;
    if (toDate) payload.toDate = toDate;
    if (tagArr.length > 0) payload.tags = tagArr;
    if (statusArr.length > 0) payload.status = statusArr;
    if (convArr.length > 0) payload.conversationStatus = convArr;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${String(bearerToken).replace(/^Bearer\s+/i, "")}`,
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
      body: JSON.stringify(payload),
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
    console.error("[/api/pearl/calls] proxy error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
