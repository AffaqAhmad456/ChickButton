import { NextRequest } from "next/server"
import { getProfile, getSession } from "../../../../lib/supabase"
import { json, options } from "../../../../lib/http"

export const dynamic = "force-dynamic"
export const OPTIONS = options
export async function GET(request: NextRequest) {
  const session = await getSession(request)
  if (!session?.user?.id) return json(request, { user: null, profile: null }, 200)
  const profile = await getProfile(session.access_token, session.user.id)
  return json(request, { user: session.user, profile }, 200, session)
}
