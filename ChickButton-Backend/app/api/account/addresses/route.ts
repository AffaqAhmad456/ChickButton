import { NextRequest } from "next/server"
import { dbRequest, requireUser } from "../../../../lib/supabase"
import { json, options } from "../../../../lib/http"

export const OPTIONS = options
export async function POST(request: NextRequest) {
  const auth = await requireUser(request)
  if ("error" in auth) return auth.error
  const body = await request.json()
  const payload = {
    user_id: auth.user.id,
    label: body.label || "Home",
    full_name: body.fullName,
    phone: body.phone,
    address_line: body.addressLine,
    area: body.area || null,
    city: body.city,
    province: body.province || null,
    postal_code: body.postalCode || null,
    is_default: Boolean(body.isDefault),
  }
  if (!payload.full_name || !payload.phone || !payload.address_line || !payload.city) return json(request, { error: "Please complete the required address fields." }, 400, auth.session)
  if (payload.is_default) await dbRequest(`addresses?user_id=eq.${auth.user.id}`, auth.session.access_token, { method: "PATCH", body: JSON.stringify({ is_default: false }) })
  const res = await dbRequest("addresses?select=*", auth.session.access_token, { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(payload) })
  const rows = await res.json()
  if (!res.ok) return json(request, { error: rows?.message || "Could not save address." }, res.status, auth.session)
  return json(request, { address: rows[0] }, 201, auth.session)
}
