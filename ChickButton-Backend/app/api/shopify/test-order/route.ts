import { NextRequest } from "next/server"
import { json, options } from "../../../../lib/http"
import { createShopifyTestOrder, getCatalogVariant } from "../../../../lib/shopify"

export const dynamic = "force-dynamic"
export const OPTIONS = options

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return json(request, { error: "Not found." }, 404)
  }

  try {
    const body = await request.json().catch(() => ({}))
    const variantId = String(body.shopifyVariantId || "").trim()
    const quantity = Math.max(1, Math.trunc(Number(body.quantity) || 1))
    const email = typeof body.email === "string" ? body.email.trim() : undefined

    if (!variantId.startsWith("gid://shopify/ProductVariant/")) {
      return json(request, { error: "A valid shopifyVariantId is required." }, 400)
    }

    const before = await getCatalogVariant(variantId)
    if (!before) return json(request, { error: "Shopify product variant was not found." }, 404)
    if (!before.availableForSale || before.inventoryQuantity < quantity) {
      return json(request, {
        error: "Not enough stock.",
        available: before.inventoryQuantity,
      }, 400)
    }

    const created = await createShopifyTestOrder({ variantId, quantity, email })
    const after = await getCatalogVariant(variantId).catch(() => null)

    return json(request, {
      ok: true,
      message: "Shopify test order created.",
      order: created.order,
      product: {
        title: before.product.title,
        variant: before.title,
        size: before.size,
        quantity,
      },
      inventory: {
        before: before.inventoryQuantity,
        after: after?.inventoryQuantity ?? null,
        decrementedBy: after ? before.inventoryQuantity - after.inventoryQuantity : null,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create Shopify order."
    return json(request, { error: message }, 500)
  }
}
