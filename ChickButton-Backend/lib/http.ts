import { NextRequest, NextResponse } from "next/server"
import { Session, setSessionCookies } from "./supabase"

export function json(request: NextRequest, data: unknown, status = 200, session?: Session | null) {
  const response = NextResponse.json(data, { status })
  const origin = request.headers.get("origin") || ""
  if (origin && origin === process.env.CUSTOMER_ORIGIN) {
    response.headers.set("Access-Control-Allow-Origin", origin)
    response.headers.set("Access-Control-Allow-Credentials", "true")
    response.headers.set("Vary", "Origin")
  }
  if (session?.access_token && session.refresh_token) setSessionCookies(response, session)
  return response
}

export function options(request: NextRequest) {
  const response = new NextResponse(null, { status: 204 })
  const origin = request.headers.get("origin") || ""
  if (origin && origin === process.env.CUSTOMER_ORIGIN) response.headers.set("Access-Control-Allow-Origin", origin)
  response.headers.set("Access-Control-Allow-Credentials", "true")
  response.headers.set("Access-Control-Allow-Headers", "Content-Type")
  response.headers.set("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS")
  response.headers.set("Vary", "Origin")
  return response
}
