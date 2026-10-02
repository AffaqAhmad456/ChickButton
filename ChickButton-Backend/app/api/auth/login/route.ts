import { NextRequest } from "next/server"
import { authRequest } from "../../../../lib/supabase"
import { json, options } from "../../../../lib/http"

export const dynamic = "force-dynamic"
export const OPTIONS = options

export async function POST(request: NextRequest) {
  const { email, password } = await request.json()
  if (!email || !password) return json(request, { error: "Email and password are required." }, 400)

  const res = await authRequest("/token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  if (!res.ok) return json(request, { error: data?.msg || data?.error_description || "Invalid login." }, res.status)
  return json(request, { user: data.user }, 200, data)
}
