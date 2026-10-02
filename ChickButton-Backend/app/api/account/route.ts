import { NextRequest } from "next/server"
import { dbRequest, getProfile, requireUser } from "../../../lib/supabase"
import { json, options } from "../../../lib/http"

export const dynamic = "force-dynamic"
export const OPTIONS = options

export async function GET(request: NextRequest) {
  const auth = await requireUser(request)
  if ("error" in auth) return auth.error
  const profile = await getProfile(auth.session.access_token, auth.user.id)
  const [ordersRes, addressesRes, wishlistRes] = await Promise.all([
    dbRequest(`orders?user_id=eq.${auth.user.id}&select=id,order_number,total_amount,status,payment_status,created_at,order_items(product_name,variant_name,quantity)&order=created_at.desc`, auth.session.access_token),
    dbRequest(`addresses?user_id=eq.${auth.user.id}&select=*&order=is_default.desc,created_at.desc`, auth.session.access_token),
    dbRequest(`wishlist_items?user_id=eq.${auth.user.id}&select=product_id`, auth.session.access_token),
  ])
  return json(request, {
    user: auth.user,
    profile,
    orders: ordersRes.ok ? await ordersRes.json() : [],
    addresses: addressesRes.ok ? await addressesRes.json() : [],
    wishlistCount: wishlistRes.ok ? (await wishlistRes.json()).length : 0,
  }, 200, auth.session)
}

export async function PATCH(request: NextRequest) {
  const auth = await requireUser(request)
  if ("error" in auth) return auth.error
  const { fullName, phone } = await request.json()
  const res = await dbRequest(`profiles?id=eq.${auth.user.id}`, auth.session.access_token, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ full_name: fullName || null, phone: phone || null, updated_at: new Date().toISOString() }),
  })
  const rows = await res.json()
  if (!res.ok) return json(request, { error: rows?.message || "Could not update profile." }, res.status, auth.session)
  return json(request, { profile: rows[0] }, 200, auth.session)
}
