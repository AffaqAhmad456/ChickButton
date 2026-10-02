import { NextRequest, NextResponse } from "next/server"
import { clearSessionCookies, getSession, authRequest } from "../../../../lib/supabase"
import { options } from "../../../../lib/http"

export const OPTIONS = options
export async function POST(request: NextRequest) {
  const session = await getSession(request)
  if (session?.access_token) {
    await authRequest("/logout", { method: "POST", headers: { Authorization: `Bearer ${session.access_token}` } }).catch(() => null)
  }
  const response = NextResponse.json({ ok: true })
  clearSessionCookies(response)
  const origin = request.headers.get("origin") || ""
  if (origin && origin === process.env.CUSTOMER_ORIGIN) response.headers.set("Access-Control-Allow-Origin", origin)
  response.headers.set("Access-Control-Allow-Credentials", "true")
  return response
}
