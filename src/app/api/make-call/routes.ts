import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { to, leadId, callData } = await request.json()

     console.log("Received request to make call:", { to, leadId, callData })

    if (!to) {
      return NextResponse.json(
        {
          type: "validation_error",
          title: "Missing phone number",
          status: 400,
          detail: "Phone number is required",
          instance: "/api/make-call",
          errors: { to: "Phone number is required" },
        },
        { status: 400 },
      )
    }

    const apiToken = process.env.NLPEARL_API_TOKEN
    const outboundId = process.env.NLPEARL_OUTBOUND_ID

    if (!apiToken || !outboundId) {
      return NextResponse.json(
        {
          type: "configuration_error",
          title: "API configuration missing",
          status: 500,
          detail: "NLPearl API token or outbound ID not configured",
          instance: "/api/make-call",
          errors: {},
        },
        { status: 500 },
      )
    }

    const response = await fetch(`https://api.nlpearl.ai/v1/Outbound/67d42f167f3c392c6d7a2d40/Call`, {
      method: "POST",
      headers: {
        Authorization: `Bearer 66fbc9e9d6345ec186da95b2:DyRnA7LIMEdLMTuEy9UColX8RnWTTqU2`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: to,
        callData: {
          leadId: leadId,
          timestamp: new Date().toISOString(),
          ...callData,
        },
      }),
    })

    const data = await response.json()

    if (response.ok) {
      // Success response
      return NextResponse.json(data)
    } else {
      // Error response from NLPearl API
      return NextResponse.json(data, { status: response.status })
    }
  } catch (error) {
    console.error("Error making call:", error)

    return NextResponse.json(
      {
        type: "internal_error",
        title: "Internal server error",
        status: 500,
        detail: "An unexpected error occurred while making the call",
        instance: "/api/make-call",
        errors: {},
      },
      { status: 500 },
    )
  }
}
