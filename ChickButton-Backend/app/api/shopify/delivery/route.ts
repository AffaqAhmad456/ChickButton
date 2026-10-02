import { NextRequest } from "next/server"
import { json, options } from "../../../../lib/http"
import { getShopifyDeliveryRates } from "../../../../lib/shopify"

export const dynamic = "force-dynamic"
export const OPTIONS = options

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const lines = Array.isArray(body?.lines) ? body.lines : []
  const address = body?.address || {}

  if (!lines.length) return json(request, { error: "Your cart is empty." }, 400)
  if (!address.addressLine || !address.city) {
    return json(request, { error: "Enter your shipping address and city to calculate delivery." }, 400)
  }

  const safeLines = lines
    .filter((line: any) => typeof line?.variantId === "string" && line.variantId.startsWith("gid://shopify/ProductVariant/"))
    .map((line: any) => ({ variantId: line.variantId, quantity: Math.max(1, Math.trunc(Number(line.quantity) || 1)) }))
  if (safeLines.length !== lines.length) return json(request, { error: "One or more cart items are invalid." }, 400)

  try {
    const rates = await getShopifyDeliveryRates({
      lines: safeLines,
      customer: {
        fullName: String(address.fullName || "Customer"),
        phone: String(address.phone || ""),
        addressLine: String(address.addressLine),
        area: address.area ? String(address.area) : null,
        city: String(address.city),
        province: address.province ? String(address.province) : null,
        postalCode: address.postalCode ? String(address.postalCode) : null,
      },
    })
    if (!rates.length) return json(request, { error: "No Shopify delivery option is available for this address." }, 422)
    return json(request, { rate: rates[0], rates }, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not calculate Shopify delivery."
    return json(request, { error: message }, 502)
  }
}
