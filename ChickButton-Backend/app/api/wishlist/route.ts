import { NextRequest } from "next/server"
import { dbRequest, requireUser, type Session } from "../../../lib/supabase"
import { json, options } from "../../../lib/http"
import { getCatalogProducts } from "../../../lib/shopify"

export const dynamic = "force-dynamic"
export const OPTIONS = options

type ShopifyWishlistRow = {
  shopify_product_id: string
  product_handle: string
  created_at: string
}

function validHandle(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 255 && value === value.trim()
}

async function databaseError(request: NextRequest, response: Response, session: Session) {
  const details = await response.json().catch(() => ({}))
  console.error("Wishlist database request failed", response.status, details?.code || "unknown")
  const migrationMissing = details?.code === "PGRST205" || details?.code === "42P01"
  return json(request, { error: migrationMissing ? "Shopify wishlist migration is not installed." : "Wishlist storage is unavailable." }, 503, session)
}

export async function GET(request: NextRequest) {
  const auth = await requireUser(request)
  if ("error" in auth) return auth.error

  try {
    const res = await dbRequest(
      `shopify_wishlist_items?user_id=eq.${auth.user.id}&select=shopify_product_id,product_handle,created_at&order=created_at.asc`,
      auth.session.access_token,
    )
    if (!res.ok) return databaseError(request, res, auth.session)

    const rows = (await res.json()) as ShopifyWishlistRow[]
    return json(request, {
      items: rows.map((row) => ({
        product_id: null,
        shopify_product_id: row.shopify_product_id,
        created_at: row.created_at,
        products: { id: row.shopify_product_id, slug: row.product_handle, title: null },
      })),
    }, 200, auth.session)
  } catch (error) {
    console.error("Wishlist read failed", error)
    return json(request, { error: "Could not load wishlist." }, 503, auth.session)
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireUser(request)
  if ("error" in auth) return auth.error

  const body = await request.json().catch(() => null)
  const slug = body?.slug
  if (!validHandle(slug)) return json(request, { error: "Invalid product handle." }, 400, auth.session)

  let product
  try {
    product = (await getCatalogProducts(100)).find((item) => item.handle === slug)
  } catch (error) {
    console.error("Wishlist Shopify product lookup failed", error)
    return json(request, { error: "Could not validate Shopify product." }, 503, auth.session)
  }
  if (!product) return json(request, { error: "Product not found." }, 404, auth.session)

  try {
    const res = await dbRequest("shopify_wishlist_items", auth.session.access_token, {
      method: "POST",
      headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
      body: JSON.stringify({
        user_id: auth.user.id,
        shopify_product_id: product.id,
        product_handle: product.handle,
      }),
    })
    if (!res.ok) return databaseError(request, res, auth.session)
    return json(request, { ok: true }, 201, auth.session)
  } catch (error) {
    console.error("Wishlist save failed", error)
    return json(request, { error: "Could not save wishlist item." }, 503, auth.session)
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireUser(request)
  if ("error" in auth) return auth.error

  const slug = request.nextUrl.searchParams.get("slug")
  if (!validHandle(slug)) return json(request, { error: "Invalid product handle." }, 400, auth.session)

  try {
    const res = await dbRequest(
      `shopify_wishlist_items?user_id=eq.${auth.user.id}&product_handle=eq.${encodeURIComponent(slug)}`,
      auth.session.access_token,
      { method: "DELETE" },
    )
    if (!res.ok) return databaseError(request, res, auth.session)
    return json(request, { ok: true }, 200, auth.session)
  } catch (error) {
    console.error("Wishlist removal failed", error)
    return json(request, { error: "Could not remove wishlist item." }, 503, auth.session)
  }
}
