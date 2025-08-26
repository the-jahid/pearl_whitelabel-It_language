// app/api/pearl/inbound/active/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Body = {
  inboundId?: string;
  isActive?: boolean;
};

export async function POST(req: Request) {
  try {
    const { inboundId, isActive } = (await req.json()) as Body;

    if (!inboundId) {
      return NextResponse.json({ error: "Missing 'inboundId'." }, { status: 400 });
    }
    if (typeof isActive !== "boolean") {
      return NextResponse.json({ error: "Missing 'isActive' (boolean)." }, { status: 400 });
    }

    const accountId = process.env.PEARL_ACCOUNT_ID;
    const secretKey = process.env.PEARL_SECRET_KEY;

    if (!accountId || !secretKey) {
      return NextResponse.json(
        { error: "Server is missing Pearl credentials." },
        { status: 500 }
      );
    }

    const url = `https://api.nlpearl.ai/v1/Inbound/${encodeURIComponent(
      inboundId
    )}/Active`;

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accountId}:${secretKey}`,
      },
      body: JSON.stringify({ isActive }),
    });

    const text = await resp.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    if (!resp.ok) {
      return NextResponse.json(
        { error: "Pearl API error", status: resp.status, data },
        { status: resp.status }
      );
    }

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
