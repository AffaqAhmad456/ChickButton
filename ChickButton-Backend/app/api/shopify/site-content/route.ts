import { NextRequest } from "next/server"
import { json, options } from "../../../../lib/http"
import { getSiteContent } from "../../../../lib/site-content"

export async function OPTIONS(request: NextRequest) {
  return options(request)
}

export async function GET(request: NextRequest) {
  try {
    const response = json(request, await getSiteContent())
    response.headers.set("Cache-Control", "public, max-age=0, s-maxage=60, stale-while-revalidate=60")
    response.headers.set("Vary", "Origin")
    return response
  } catch (error) {
    console.error("Shopify site content error:", error)
    return json(request, { error: "Unable to load site content" }, 502)
  }
}
