import { NextRequest } from "next/server"
import { randomUUID } from "crypto"
import { dbRequest, getSession } from "../../../lib/supabase"
import { json, options } from "../../../lib/http"
import { clearGuestCart, readGuestCart } from "../../../lib/guest-cart"
import { createShopifyCheckoutOrder, getCatalogVariant, getShopifyDeliveryRate } from "../../../lib/shopify"

export const dynamic = "force-dynamic"
export const OPTIONS = options

function cleanShopifyOrderNumber(name: string) {
  return String(name || "").replace(/^#/, "") || `CB-${Date.now().toString().slice(-8)}`
}

function normalizePakistanPhone(value: string) {
  const raw = String(value || "").trim()
  const compact = raw.replace(/[\s()\-]/g, "")
  if (/^03\d{9}$/.test(compact)) return `+92${compact.slice(1)}`
  if (/^923\d{9}$/.test(compact)) return `+${compact}`
  if (/^\+923\d{9}$/.test(compact)) return compact
  if (/^\+\d{8,15}$/.test(compact)) return compact
  return null
}

async function phase3SchemaReady(token?: string) {
  const [ordersRes, itemsRes] = await Promise.all([
    dbRequest("orders?select=id,shopify_order_id,shopify_order_name,checkout_key&limit=1", token),
    dbRequest("order_items?select=id,shopify_product_id,shopify_variant_id&limit=1", token),
  ])
  return ordersRes.ok && itemsRes.ok
}

export async function GET(request: NextRequest) {
  const session = await getSession(request)
  if (!session?.user?.id) return json(request, { error: "Log in to view order history." }, 401)
  const res = await dbRequest(
    `orders?user_id=eq.${session.user.id}&select=id,order_number,total_amount,status,payment_status,created_at,shopify_order_id,shopify_order_name,order_items(product_name,variant_name,quantity,unit_price,line_total,shopify_product_id,shopify_variant_id)&order=created_at.desc`,
    session.access_token,
  )
  const data = res.ok ? await res.json() : []
  if (!res.ok) return json(request, { error: data?.message || "Could not load orders." }, res.status, session)
  return json(request, { orders: data }, 200, session)
}

export async function POST(request: NextRequest) {
  const session = await getSession(request)
  const body = await request.json()
  const { fullName, phone, addressLine, area, city, province, postalCode, checkoutKey } = body
  if (!fullName || !phone || !addressLine || !city) {
    return json(request, { error: "Please complete the required checkout fields." }, 400, session)
  }
  const normalizedPhone = normalizePakistanPhone(phone)
  if (!normalizedPhone) {
    return json(request, { error: "Please enter a valid phone number, for example 03310335563." }, 400, session)
  }

  const token = session?.access_token
  const userId = session?.user?.id || null

  if (!(await phase3SchemaReady(token))) {
    return json(request, {
      error: "Shopify order database migration is not installed yet. Run sql/09_checkout_hardening.sql first.",
    }, 503, session)
  }

  const safeCheckoutKey = typeof checkoutKey === "string" && checkoutKey.trim() ? checkoutKey.trim().slice(0, 120) : null
  if (safeCheckoutKey) {
    const duplicateRes = await dbRequest(`orders?checkout_key=eq.${encodeURIComponent(safeCheckoutKey)}&select=id,order_number,total_amount,status,shopify_order_id,shopify_order_name&limit=1`, token)
    if (duplicateRes.ok) {
      const duplicate = (await duplicateRes.json())[0]
      if (duplicate) return json(request, { order: duplicate, shopify: true, duplicate: true }, 200, session)
    }
  }

  let cartId: string | null = null
  const rawLines: Array<{ shopifyVariantId: string; quantity: number }> = []

  if (userId && token) {
    const cartRes = await dbRequest(`carts?user_id=eq.${userId}&select=id&limit=1`, token)
    const carts = cartRes.ok ? await cartRes.json() : []
    const cart = carts[0]
    if (!cart) return json(request, { error: "Your cart is empty." }, 400, session)
    cartId = cart.id
    const itemsRes = await dbRequest(
      `cart_items?cart_id=eq.${cart.id}&select=id,quantity,shopify_variant_id,product_variant_id&order=created_at.asc`,
      token,
    )
    const items = itemsRes.ok ? await itemsRes.json() : []
    if (!itemsRes.ok) return json(request, { error: "Could not load your cart." }, itemsRes.status, session)
    if (items.some((item: any) => !item.shopify_variant_id)) {
      return json(request, { error: "Your bag contains an old catalog item. Remove it and add the Shopify product again." }, 409, session)
    }
    for (const item of items) rawLines.push({ shopifyVariantId: item.shopify_variant_id, quantity: Number(item.quantity) || 1 })
  } else {
    const guest = readGuestCart(request)
    if (guest.some((line) => !("shopifyVariantId" in line) || !line.shopifyVariantId)) {
      return json(request, { error: "Your bag contains an old catalog item. Remove it and add the Shopify product again." }, 409, session)
    }
    for (const line of guest) {
      if ("shopifyVariantId" in line && line.shopifyVariantId) {
        rawLines.push({ shopifyVariantId: line.shopifyVariantId, quantity: Math.max(1, Number(line.quantity) || 1) })
      }
    }
  }

  if (!rawLines.length) return json(request, { error: "Your cart is empty." }, 400, session)

  // Re-check every Shopify variant immediately before creating the order.
  const checkedLines = [] as Array<{ variantId: string; quantity: number; price: number; compareAtPrice: number | null }>
  for (const line of rawLines) {
    const variant = await getCatalogVariant(line.shopifyVariantId).catch(() => null)
    if (!variant) return json(request, { error: "One or more products are no longer available." }, 409, session)
    if (!variant.availableForSale || variant.inventoryQuantity < line.quantity) {
      return json(request, { error: `${variant.product.title} (${variant.size}) is out of stock or has insufficient quantity.` }, 409, session)
    }
    checkedLines.push({ variantId: variant.id, quantity: line.quantity, price: variant.price, compareAtPrice: variant.compareAtPrice })
  }

  const customer = {
    fullName,
    phone: normalizedPhone,
    email: session?.user?.email || null,
    addressLine,
    area: area || null,
    city,
    province: province || null,
    postalCode: postalCode || null,
  }

  let shopify
  try {
    const shippingRate = await getShopifyDeliveryRate({
      lines: checkedLines.map((line) => ({ variantId: line.variantId, quantity: line.quantity })),
      customer,
    })
    if (!shippingRate) return json(request, { error: "No Shopify delivery option is available for this address." }, 422, session)

    shopify = await createShopifyCheckoutOrder({
      lines: checkedLines.map((line) => ({ variantId: line.variantId, quantity: line.quantity })),
      customer,
      shippingRate,
      checkoutKey: safeCheckoutKey,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Shopify could not create the order."
    return json(request, { error: message }, 502, session)
  }

  const orderId = randomUUID()
  const orderNumber = cleanShopifyOrderNumber(shopify.order.name)
  const total = shopify.total

  const orderRes = await dbRequest("orders", token, {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      id: orderId,
      order_number: orderNumber,
      user_id: userId,
      full_name: fullName,
      phone: normalizedPhone,
      address_line: addressLine,
      area: area || null,
      city,
      province: province || null,
      postal_code: postalCode || null,
      subtotal: shopify.originalSubtotal,
      delivery_fee: shopify.deliveryFee,
      discount_amount: shopify.saleSavings,
      total_amount: total,
      status: "confirmed",
      payment_method: "cash_on_delivery",
      payment_status: "pending",
      shopify_order_id: shopify.order.id,
      shopify_order_name: shopify.order.name,
      checkout_key: safeCheckoutKey,
    }),
  })

  let localWarning: string | null = null
  if (orderRes.ok) {
    const orderItems = shopify.lines.map(({ variant, quantity }) => ({
      order_id: orderId,
      product_variant_id: null,
      shopify_product_id: variant.product.id,
      shopify_variant_id: variant.id,
      product_name: variant.product.title,
      variant_name: [variant.size, variant.color].filter(Boolean).join(" / ") || null,
      sku: variant.sku || null,
      quantity,
      unit_price: variant.price,
      line_total: variant.price * quantity,
    }))
    const oiRes = await dbRequest("order_items", token, { method: "POST", body: JSON.stringify(orderItems) })
    if (!oiRes.ok) localWarning = "Shopify order was created, but local order items could not be saved."
    else await dbRequest("order_status_history", token, { method: "POST", body: JSON.stringify({ order_id: orderId, status: "confirmed", changed_by: userId }) })
  } else {
    localWarning = "Shopify order was created, but the local order history could not be saved."
  }

  // Shopify is now the commerce authority. Once it succeeds, clear the cart to
  // prevent a retry from creating a duplicate Shopify order.
  if (userId && token && cartId) {
    await dbRequest(`cart_items?cart_id=eq.${cartId}`, token, { method: "DELETE" })
    return json(request, {
      order: {
        id: orderId,
        order_number: orderNumber,
        total_amount: total,
        status: "confirmed",
        shopify_order_id: shopify.order.id,
        shopify_order_name: shopify.order.name,
      },
      shopify: true,
      warning: localWarning,
    }, 201, session)
  }

  const response = json(request, {
    order: {
      id: orderId,
      order_number: orderNumber,
      total_amount: total,
      status: "confirmed",
      shopify_order_id: shopify.order.id,
      shopify_order_name: shopify.order.name,
    },
    shopify: true,
    guest: true,
    warning: localWarning,
  }, 201)
  clearGuestCart(response)
  return response
}
