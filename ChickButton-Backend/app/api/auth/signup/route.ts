import { NextRequest } from "next/server"
import { authRequest } from "../../../../lib/supabase"
import { json, options } from "../../../../lib/http"

export const dynamic = "force-dynamic"
export const OPTIONS = options

export async function POST(request: NextRequest) {
  const { fullName, email, phone, password } = await request.json()
  if (!fullName || !email || !password) return json(request, { error: "Full name, email and password are required." }, 400)
  if (String(password).length < 8) return json(request, { error: "Password must be at least 8 characters." }, 400)

  const res = await authRequest("/signup", {
    method: "POST",
    body: JSON.stringify({ email, password, data: { full_name: fullName, phone: phone || null } }),
  })
  const data = await res.json()
  if (!res.ok) {
    const raw = String(data?.msg || data?.error_description || "")
    const message = res.status === 429 || raw.toLowerCase().includes("rate limit")
      ? "Too many signup emails were requested. Email confirmation should stay disabled for local testing; wait for the Supabase limit to reset if this message continues."
      : raw || "Could not create account."
    return json(request, { error: message }, res.status)
  }

  // Account creation and authentication are intentionally separate.
  // Even when Supabase returns a signup session, do not persist it here.
  return json(request, {
    user: data.user,
    requiresEmailConfirmation: !(data.access_token && data.refresh_token),
  }, 201)
}
