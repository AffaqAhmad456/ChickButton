import { NextRequest, NextResponse } from "next/server"

const url = process.env.SUPABASE_URL!
const key = process.env.SUPABASE_PUBLISHABLE_KEY!

export type Session = {
  access_token: string
  refresh_token: string
  expires_in?: number
  user?: { id: string; email?: string; user_metadata?: Record<string, unknown> }
}

export function assertEnv() {
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY")
}

export async function authRequest(path: string, init: RequestInit = {}) {
  assertEnv()
  return fetch(`${url}/auth/v1${path}`, {
    ...init,
    headers: { apikey: key, "Content-Type": "application/json", ...(init.headers || {}) },
    cache: "no-store",
  })
}

export async function dbRequest(path: string, token?: string, init: RequestInit = {}) {
  assertEnv()
  return fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${token || key}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    cache: "no-store",
  })
}

const ACCESS_COOKIE = "cb_customer_access"
const REFRESH_COOKIE = "cb_customer_refresh"

export function setSessionCookies(response: NextResponse, session: Session) {
  const secure = process.env.COOKIE_SECURE === "true"
  const base = { httpOnly: true, secure, sameSite: "lax" as const, path: "/" }
  response.cookies.set(ACCESS_COOKIE, session.access_token, { ...base, maxAge: Math.max(session.expires_in || 3600, 300) })
  response.cookies.set(REFRESH_COOKIE, session.refresh_token, { ...base, maxAge: 60 * 60 * 24 * 30 })
}

export function clearSessionCookies(response: NextResponse) {
  response.cookies.set(ACCESS_COOKIE, "", { httpOnly: true, maxAge: 0, path: "/" })
  response.cookies.set(REFRESH_COOKIE, "", { httpOnly: true, maxAge: 0, path: "/" })
}

export async function getSession(request: NextRequest): Promise<Session | null> {
  const access = request.cookies.get(ACCESS_COOKIE)?.value
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value
  if (!access && !refresh) return null

  if (access) {
    const userRes = await authRequest("/user", { headers: { Authorization: `Bearer ${access}` } })
    if (userRes.ok) {
      const user = await userRes.json()
      return { access_token: access, refresh_token: refresh || "", user }
    }
  }

  if (!refresh) return null
  const refreshRes = await authRequest("/token?grant_type=refresh_token", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refresh }),
  })
  if (!refreshRes.ok) return null
  return (await refreshRes.json()) as Session
}

function errorResponse(request: NextRequest, message: string, status: number) {
  const response = NextResponse.json({ error: message }, { status })
  const origin = request.headers.get("origin") || ""
  if (origin && origin === process.env.CUSTOMER_ORIGIN) response.headers.set("Access-Control-Allow-Origin", origin)
  response.headers.set("Access-Control-Allow-Credentials", "true")
  response.headers.set("Vary", "Origin")
  return response
}

export async function requireUser(request: NextRequest) {
  const session = await getSession(request)
  if (!session?.user?.id) return { error: errorResponse(request, "Unauthorized", 401) }
  return { session, user: session.user }
}

export async function getProfile(token: string, userId: string) {
  const res = await dbRequest(`profiles?id=eq.${encodeURIComponent(userId)}&select=id,full_name,phone,role&limit=1`, token)
  if (!res.ok) return null
  const rows = await res.json()
  return rows[0] || null
}
