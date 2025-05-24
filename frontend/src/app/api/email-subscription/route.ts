import { NextResponse } from "next/server"
import { z } from "zod"

// Load environment variables
const publicationId = process.env.BEEHIIV_PUBLICATION_ID
const apiKey = process.env.BEEHIIV_API_KEY

// Schema to validate incoming subscription data
const subscriptionSchema = z.object({
  email: z.string().email(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  referring_site: z.string().optional(),
})

// GET returns the total subscriber count (uses a minimal fetch and reads meta.total_count)
export async function GET(req: Request) {
  if (!publicationId || !apiKey) {
    return NextResponse.json({ error: "Missing Beehiiv configuration" }, { status: 500 })
  }
  const url = `https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } })
  if (!res.ok) {
    const text = await res.text()
    console.error("Error fetching subscriber count:", text)
    return NextResponse.json({ error: "Failed to fetch subscriber count" }, { status: 500 })
  }
  const data = await res.json()
  let count = 0
  if (data.meta?.total_count) {
    count = data.meta.total_count
  } else if (Array.isArray(data.data)) {
    count = data.data.length
  }
  return NextResponse.json({ count })
}

// POST subscribes a new email to the publication
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const result = subscriptionSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: "Invalid subscription data", details: result.error.format() }, { status: 400 })
    }
    const { email, utm_source, utm_medium, utm_campaign, referring_site } = result.data

    if (!publicationId || !apiKey) {
      return NextResponse.json({ error: "Missing Beehiiv configuration" }, { status: 500 })
    }
    const url = `https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions`
    const apiRes = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        email,
        reactivate_existing: false,
        send_welcome_email: true,
        utm_source,
        utm_medium,
        utm_campaign,
        referring_site,
      }),
    })
    const json = await apiRes.json()
    if (!apiRes.ok) {
      return NextResponse.json({ error: json.error || "Subscription failed" }, { status: apiRes.status })
    }
    // Fetch the updated subscriber count
    const countUrl = `https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions?limit=1`
    const countRes = await fetch(countUrl, { headers: { Authorization: `Bearer ${apiKey}` } })
    if (!countRes.ok) {
      return NextResponse.json({ error: "Failed to fetch subscriber count" }, { status: 500 })
    }
    const countData = await countRes.json()
    let count = 0
    if (countData.meta?.total_count) {
      count = countData.meta.total_count
    } else if (Array.isArray(countData.data)) {
      count = countData.data.length
    }
    return NextResponse.json({ success: true, count })
  } catch (error) {
    console.error("Subscription error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
