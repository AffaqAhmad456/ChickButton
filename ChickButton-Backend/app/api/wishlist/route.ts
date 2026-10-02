import { NextRequest } from "next/server"
import { dbRequest, requireUser } from "../../../lib/supabase"
import { json, options } from "../../../lib/http"

export const dynamic = "force-dynamic"
export const OPTIONS = options

async function productBySlug(token: string, slug: string) {
  const res = await dbRequest(`products?slug=eq.${encodeURIComponent(slug)}&select=id&limit=1`, token)
  const rows = res.ok ? await res.json() : []
  return rows[0] || null
}

export async function GET(request: NextRequest) {
  const auth = await requireUser(request)
  if ("error" in auth) return auth.error
  const res = await dbRequest(`wishlist_items?user_id=eq.${auth.user.id}&select=product_id,products(id,slug,title)&order=created_at.asc`, auth.session.access_token)
  const rows = res.ok ? await res.json() : []
  if (!res.ok) return json(request, { error: rows?.message || "Could not load wishlist." }, res.status, auth.session)
  return json(request, { items: rows }, 200, auth.session)
}

export async function POST(request: NextRequest) {
  const auth = await requireUser(request)
  if ("error" in auth) return auth.error
  const { slug } = await request.json()
  const product = await productBySlug(auth.session.access_token, slug)
  if (!product) return json(request, { error: "Product not found." }, 404, auth.session)
  const res = await dbRequest("wishlist_items", auth.session.access_token, {
    method: "POST",
    headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
    body: JSON.stringify({ user_id: auth.user.id, product_id: product.id }),
  })
  if (!res.ok) return json(request, { error: "Could not save wishlist item." }, res.status, auth.session)
  return json(request, { ok: true }, 201, auth.session)
}

export async function DELETE(request: NextRequest) {
  const auth = await requireUser(request)
  if ("error" in auth) return auth.error
  const slug = request.nextUrl.searchParams.get("slug")
  if (!slug) return json(request, { error: "Missing product." }, 400, auth.session)
  const product = await productBySlug(auth.session.access_token, slug)
  if (!product) return json(request, { ok: true }, 200, auth.session)
  const res = await dbRequest(`wishlist_items?user_id=eq.${auth.user.id}&product_id=eq.${product.id}`, auth.session.access_token, { method: "DELETE" })
  if (!res.ok) return json(request, { error: "Could not remove wishlist item." }, res.status, auth.session)
  return json(request, { ok: true }, 200, auth.session)
}
