import { NextRequest } from "next/server"
import { dbRequest, getSession } from "../../../lib/supabase"
import { json, options } from "../../../lib/http"
import { clearGuestCart, readGuestCart, writeGuestCart, type GuestCartLine } from "../../../lib/guest-cart"
import { getCatalogVariant, type CartShopifyVariant } from "../../../lib/shopify"

export const dynamic = "force-dynamic"
export const OPTIONS = options

async function getOrCreateCart(token: string, userId: string) {
  let res = await dbRequest(`carts?user_id=eq.${userId}&select=id&limit=1`, token)
  let rows = res.ok ? await res.json() : []
  if (rows[0]?.id) return rows[0].id as string
  res = await dbRequest("carts?select=id", token, {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ user_id: userId }),
  })
  rows = await res.json()
  if (!res.ok) throw new Error(rows?.message || "Could not create cart")
  return rows[0].id as string
}

// Legacy Supabase catalog lookup is intentionally preserved until the storefront
// has been switched to Shopify. This keeps the current UI/cart flow working.
async function findLegacyVariant(token: string | undefined, slug: string, size?: string) {
  const productRes = await dbRequest(`products?slug=eq.${encodeURIComponent(slug)}&status=eq.active&select=id&limit=1`, token)
  const products = productRes.ok ? await productRes.json() : []
  if (!products[0]) return null
  const sizeFilter = size ? `&size=eq.${encodeURIComponent(size)}` : ""
  const variantRes = await dbRequest(
    `product_variants?product_id=eq.${products[0].id}&is_active=eq.true${sizeFilter}&select=id,size,color,price,inventory_quantity,image_url,sku,products(id,title,slug,primary_image_url,secondary_image_url)&order=created_at.asc&limit=1`,
    token,
  )
  const variants = variantRes.ok ? await variantRes.json() : []
  return variants[0] || null
}

function shopifyRow(id: string, quantity: number, variant: CartShopifyVariant) {
  return {
    id,
    quantity,
    product_variant_id: null,
    shopify_product_id: variant.product.id,
    shopify_variant_id: variant.id,
    product_handle: variant.product.handle,
    selected_size: variant.size,
    source: "shopify",
    product_variants: {
      id: variant.id,
      size: variant.size,
      color: variant.color,
      price: variant.price,
      inventory_quantity: variant.inventoryQuantity,
      image_url: variant.image,
      sku: variant.sku,
      available_for_sale: variant.availableForSale,
      shopify_variant_id: variant.id,
      products: {
        id: variant.product.id,
        title: variant.product.title,
        slug: variant.product.handle,
        primary_image_url: variant.product.image,
        secondary_image_url: null,
        shopify_product_id: variant.product.id,
      },
    },
  }
}

async function guestRows(lines: GuestCartLine[]) {
  const rows: any[] = []
  for (const line of lines) {
    if ("shopifyVariantId" in line && line.shopifyVariantId) {
      const variant = await getCatalogVariant(line.shopifyVariantId).catch(() => null)
      if (!variant) continue
      rows.push(shopifyRow(`guest:${variant.id}`, Math.max(1, line.quantity), variant))
      continue
    }

    const variant = await findLegacyVariant(undefined, line.slug!, line.size!)
    if (!variant) continue
    rows.push({
      id: `guest:${line.slug}:${line.size}`,
      quantity: Math.min(line.quantity, Number(variant.inventory_quantity) || 0),
      product_variant_id: variant.id,
      source: "supabase",
      product_variants: variant,
    })
  }
  return rows.filter((row) => row.quantity > 0)
}

async function mergeGuestIntoUser(request: NextRequest, token: string, userId: string) {
  const guest = readGuestCart(request)
  if (!guest.length) return false
  const cartId = await getOrCreateCart(token, userId)

  for (const line of guest) {
    if ("shopifyVariantId" in line && line.shopifyVariantId) {
      const variant = await getCatalogVariant(line.shopifyVariantId).catch(() => null)
      if (!variant || !variant.availableForSale || variant.inventoryQuantity <= 0) continue

      const encodedId = encodeURIComponent(variant.id)
      const existingRes = await dbRequest(`cart_items?cart_id=eq.${cartId}&shopify_variant_id=eq.${encodedId}&select=id,quantity&limit=1`, token)
      const existing = existingRes.ok ? (await existingRes.json())[0] : null
      const quantity = Math.min((Number(existing?.quantity) || 0) + line.quantity, variant.inventoryQuantity)

      if (existing) {
        await dbRequest(`cart_items?id=eq.${existing.id}`, token, {
          method: "PATCH",
          body: JSON.stringify({ quantity, updated_at: new Date().toISOString() }),
        })
      } else {
        await dbRequest("cart_items", token, {
          method: "POST",
          body: JSON.stringify({
            cart_id: cartId,
            product_variant_id: null,
            shopify_product_id: variant.product.id,
            shopify_variant_id: variant.id,
            product_handle: variant.product.handle,
            selected_size: variant.size,
            quantity,
          }),
        })
      }
      continue
    }

    const variant = await findLegacyVariant(token, line.slug!, line.size!)
    if (!variant || Number(variant.inventory_quantity) <= 0) continue
    const existingRes = await dbRequest(`cart_items?cart_id=eq.${cartId}&product_variant_id=eq.${variant.id}&select=id,quantity&limit=1`, token)
    const existing = existingRes.ok ? (await existingRes.json())[0] : null
    const quantity = Math.min((Number(existing?.quantity) || 0) + line.quantity, Number(variant.inventory_quantity))
    if (existing) {
      await dbRequest(`cart_items?id=eq.${existing.id}`, token, { method: "PATCH", body: JSON.stringify({ quantity, updated_at: new Date().toISOString() }) })
    } else {
      await dbRequest("cart_items", token, { method: "POST", body: JSON.stringify({ cart_id: cartId, product_variant_id: variant.id, quantity }) })
    }
  }
  return true
}

async function loadUserRows(token: string, cartId: string) {
  const migratedSelect = `cart_items?cart_id=eq.${cartId}&select=id,quantity,product_variant_id,shopify_product_id,shopify_variant_id,product_handle,selected_size,product_variants(id,size,color,price,inventory_quantity,image_url,sku,products(id,title,slug,primary_image_url,secondary_image_url))&order=created_at.asc`
  let res = await dbRequest(migratedSelect, token)

  // Backward compatibility: the old database still works before the Phase 2 SQL
  // is applied. Shopify cart writes will remain disabled until that migration runs.
  if (!res.ok) {
    res = await dbRequest(
      `cart_items?cart_id=eq.${cartId}&select=id,quantity,product_variant_id,product_variants(id,size,color,price,inventory_quantity,image_url,sku,products(id,title,slug,primary_image_url,secondary_image_url))&order=created_at.asc`,
      token,
    )
  }

  const rows = res.ok ? await res.json() : []
  if (!res.ok) return { ok: false as const, status: res.status, data: rows }

  const hydrated = await Promise.all(rows.map(async (row: any) => {
    if (!row.shopify_variant_id) return { ...row, source: "supabase" }
    const variant = await getCatalogVariant(row.shopify_variant_id).catch(() => null)
    if (!variant) return { ...row, source: "shopify", unavailable: true }
    return shopifyRow(row.id, Number(row.quantity) || 1, variant)
  }))

  return { ok: true as const, status: 200, data: hydrated }
}

export async function GET(request: NextRequest) {
  const session = await getSession(request)
  if (!session?.user?.id) {
    return json(request, { items: await guestRows(readGuestCart(request)), guest: true })
  }

  const merged = await mergeGuestIntoUser(request, session.access_token, session.user.id).catch(() => false)
  const cartId = await getOrCreateCart(session.access_token, session.user.id)
  const result = await loadUserRows(session.access_token, cartId)
  const response = result.ok
    ? json(request, { items: result.data }, 200, session)
    : json(request, { error: result.data?.message || "Could not load cart." }, result.status, session)
  if (merged) clearGuestCart(response)
  return response
}

export async function POST(request: NextRequest) {
  const session = await getSession(request)
  const body = await request.json()
  const qty = Math.max(1, Number(body.quantity) || 1)

  // New Shopify cart path. Frontend Phase 2B will send shopifyVariantId.
  if (body.shopifyVariantId) {
    const variant = await getCatalogVariant(String(body.shopifyVariantId)).catch(() => null)
    if (!variant) return json(request, { error: "Shopify product variant was not found." }, 404, session)
    if (!variant.availableForSale || variant.inventoryQuantity < qty) {
      return json(request, { error: "Not enough stock." }, 400, session)
    }

    if (!session?.user?.id) {
      const lines = readGuestCart(request)
      const index = lines.findIndex((line) => "shopifyVariantId" in line && line.shopifyVariantId === variant.id)
      if (index >= 0 && "shopifyVariantId" in lines[index]) {
        lines[index].quantity = Math.min(lines[index].quantity + qty, variant.inventoryQuantity)
      } else {
        lines.push({
          shopifyVariantId: variant.id,
          shopifyProductId: variant.product.id,
          handle: variant.product.handle,
          size: variant.size,
          quantity: qty,
        })
      }
      const response = json(request, { items: await guestRows(lines), guest: true })
      writeGuestCart(response, lines)
      return response
    }

    const cartId = await getOrCreateCart(session.access_token, session.user.id)
    const encodedId = encodeURIComponent(variant.id)
    const existingRes = await dbRequest(`cart_items?cart_id=eq.${cartId}&shopify_variant_id=eq.${encodedId}&select=id,quantity&limit=1`, session.access_token)
    if (!existingRes.ok) {
      return json(request, { error: "Shopify cart database migration is not installed yet. Run sql/07_shopify_cart_migration.sql first." }, 503, session)
    }
    const existing = (await existingRes.json())[0]
    const nextQuantity = (Number(existing?.quantity) || 0) + qty
    if (nextQuantity > variant.inventoryQuantity) return json(request, { error: "Not enough stock." }, 400, session)

    const res = existing
      ? await dbRequest(`cart_items?id=eq.${existing.id}`, session.access_token, {
          method: "PATCH",
          body: JSON.stringify({ quantity: nextQuantity, updated_at: new Date().toISOString() }),
        })
      : await dbRequest("cart_items", session.access_token, {
          method: "POST",
          body: JSON.stringify({
            cart_id: cartId,
            product_variant_id: null,
            shopify_product_id: variant.product.id,
            shopify_variant_id: variant.id,
            product_handle: variant.product.handle,
            selected_size: variant.size,
            quantity: qty,
          }),
        })

    if (!res.ok) return json(request, { error: "Could not update Shopify cart." }, res.status, session)
    return GET(request)
  }

  // Existing Supabase catalog path remains untouched for the current storefront.
  const { slug, size } = body
  if (!slug || !size) return json(request, { error: "Please choose a size." }, 400, session)
  const variant = await findLegacyVariant(session?.access_token, slug, size)
  if (!variant) return json(request, { error: "This size is not available yet." }, 404, session)
  if (Number(variant.inventory_quantity) < qty) return json(request, { error: "Not enough stock." }, 400, session)

  if (!session?.user?.id) {
    const lines = readGuestCart(request)
    const index = lines.findIndex((line) => "slug" in line && line.slug === slug && line.size === size)
    if (index >= 0 && "slug" in lines[index]) lines[index].quantity = Math.min(lines[index].quantity + qty, Number(variant.inventory_quantity))
    else lines.push({ slug, size, quantity: qty })
    const response = json(request, { items: await guestRows(lines), guest: true })
    writeGuestCart(response, lines)
    return response
  }

  const cartId = await getOrCreateCart(session.access_token, session.user.id)
  const existingRes = await dbRequest(`cart_items?cart_id=eq.${cartId}&product_variant_id=eq.${variant.id}&select=id,quantity&limit=1`, session.access_token)
  const existing = existingRes.ok ? (await existingRes.json())[0] : null
  const nextQuantity = (existing?.quantity || 0) + qty
  if (nextQuantity > Number(variant.inventory_quantity)) return json(request, { error: "Not enough stock." }, 400, session)
  const res = existing
    ? await dbRequest(`cart_items?id=eq.${existing.id}`, session.access_token, { method: "PATCH", body: JSON.stringify({ quantity: nextQuantity, updated_at: new Date().toISOString() }) })
    : await dbRequest("cart_items", session.access_token, { method: "POST", body: JSON.stringify({ cart_id: cartId, product_variant_id: variant.id, quantity: qty }) })
  if (!res.ok) return json(request, { error: "Could not update cart." }, res.status, session)
  return GET(request)
}

export async function PATCH(request: NextRequest) {
  const session = await getSession(request)
  const body = await request.json()
  const qty = Number(body.quantity)

  if (body.shopifyVariantId) {
    const variant = await getCatalogVariant(String(body.shopifyVariantId)).catch(() => null)
    if (!variant) return json(request, { error: "Shopify product variant was not found." }, 404, session)

    if (!session?.user?.id) {
      let lines = readGuestCart(request)
      if (qty <= 0) lines = lines.filter((line) => !("shopifyVariantId" in line && line.shopifyVariantId === variant.id))
      else {
        if (!variant.availableForSale || qty > variant.inventoryQuantity) return json(request, { error: "Not enough stock." }, 400, session)
        const index = lines.findIndex((line) => "shopifyVariantId" in line && line.shopifyVariantId === variant.id)
        if (index >= 0 && "shopifyVariantId" in lines[index]) lines[index].quantity = qty
        else lines.push({ shopifyVariantId: variant.id, shopifyProductId: variant.product.id, handle: variant.product.handle, size: variant.size, quantity: qty })
      }
      const response = json(request, { items: await guestRows(lines), guest: true })
      writeGuestCart(response, lines)
      return response
    }

    const cartId = await getOrCreateCart(session.access_token, session.user.id)
    const filter = `cart_id=eq.${cartId}&shopify_variant_id=eq.${encodeURIComponent(variant.id)}`
    if (qty <= 0) {
      const res = await dbRequest(`cart_items?${filter}`, session.access_token, { method: "DELETE" })
      if (!res.ok) return json(request, { error: "Shopify cart database migration is not installed yet." }, 503, session)
    } else {
      if (!variant.availableForSale || qty > variant.inventoryQuantity) return json(request, { error: "Not enough stock." }, 400, session)
      const res = await dbRequest(`cart_items?${filter}`, session.access_token, { method: "PATCH", body: JSON.stringify({ quantity: qty, updated_at: new Date().toISOString() }) })
      if (!res.ok) return json(request, { error: "Could not update Shopify cart." }, res.status, session)
    }
    return GET(request)
  }

  const { slug, size } = body
  if (!slug || !size) return json(request, { error: "Missing product size." }, 400, session)
  const variant = await findLegacyVariant(session?.access_token, slug, size)
  if (!variant) return json(request, { error: "Product size not found." }, 404, session)

  if (!session?.user?.id) {
    let lines = readGuestCart(request)
    if (qty <= 0) lines = lines.filter((line) => !("slug" in line && line.slug === slug && line.size === size))
    else {
      if (qty > Number(variant.inventory_quantity)) return json(request, { error: "Not enough stock." }, 400)
      const index = lines.findIndex((line) => "slug" in line && line.slug === slug && line.size === size)
      if (index >= 0 && "slug" in lines[index]) lines[index].quantity = qty
      else lines.push({ slug, size, quantity: qty })
    }
    const response = json(request, { items: await guestRows(lines), guest: true })
    writeGuestCart(response, lines)
    return response
  }

  const cartId = await getOrCreateCart(session.access_token, session.user.id)
  if (qty <= 0) {
    await dbRequest(`cart_items?cart_id=eq.${cartId}&product_variant_id=eq.${variant.id}`, session.access_token, { method: "DELETE" })
  } else {
    if (qty > Number(variant.inventory_quantity)) return json(request, { error: "Not enough stock." }, 400, session)
    await dbRequest(`cart_items?cart_id=eq.${cartId}&product_variant_id=eq.${variant.id}`, session.access_token, { method: "PATCH", body: JSON.stringify({ quantity: qty, updated_at: new Date().toISOString() }) })
  }
  return GET(request)
}

export async function DELETE(request: NextRequest) {
  const session = await getSession(request)
  const shopifyVariantId = request.nextUrl.searchParams.get("shopifyVariantId")

  if (shopifyVariantId) {
    if (!session?.user?.id) {
      const lines = readGuestCart(request).filter((line) => !("shopifyVariantId" in line && line.shopifyVariantId === shopifyVariantId))
      const response = json(request, { ok: true, items: await guestRows(lines), guest: true })
      writeGuestCart(response, lines)
      return response
    }

    const cartId = await getOrCreateCart(session.access_token, session.user.id)
    const res = await dbRequest(`cart_items?cart_id=eq.${cartId}&shopify_variant_id=eq.${encodeURIComponent(shopifyVariantId)}`, session.access_token, { method: "DELETE" })
    if (!res.ok) return json(request, { error: "Shopify cart database migration is not installed yet." }, 503, session)
    return json(request, { ok: true }, 200, session)
  }

  const slug = request.nextUrl.searchParams.get("slug")
  const size = request.nextUrl.searchParams.get("size")
  if (!slug || !size) return json(request, { error: "Missing product size." }, 400, session)
  const variant = await findLegacyVariant(session?.access_token, slug, size)

  if (!session?.user?.id) {
    const lines = readGuestCart(request).filter((line) => !("slug" in line && line.slug === slug && line.size === size))
    const response = json(request, { ok: true, items: await guestRows(lines), guest: true })
    writeGuestCart(response, lines)
    return response
  }

  if (variant) {
    const cartId = await getOrCreateCart(session.access_token, session.user.id)
    await dbRequest(`cart_items?cart_id=eq.${cartId}&product_variant_id=eq.${variant.id}`, session.access_token, { method: "DELETE" })
  }
  return json(request, { ok: true }, 200, session)
}
