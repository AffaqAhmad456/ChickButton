import { NextRequest, NextResponse } from "next/server"

export type LegacyGuestCartLine = { slug: string; size: string; quantity: number; shopifyVariantId?: never }
export type ShopifyGuestCartLine = {
  shopifyVariantId: string
  shopifyProductId?: string
  handle?: string
  size?: string
  quantity: number
  slug?: never
}
export type GuestCartLine = LegacyGuestCartLine | ShopifyGuestCartLine

const COOKIE = "cb_guest_cart"

function safeQuantity(value: unknown) {
  return Math.max(1, Math.min(20, Number(value) || 1))
}

export function readGuestCart(request: NextRequest): GuestCartLine[] {
  const raw = request.cookies.get(COOKIE)?.value
  if (!raw) return []
  try {
    const decoded = Buffer.from(raw, "base64url").toString("utf8")
    const parsed = JSON.parse(decoded)
    if (!Array.isArray(parsed)) return []

    return parsed.flatMap((line): GuestCartLine[] => {
      if (!line || typeof line !== "object") return []

      if (typeof line.shopifyVariantId === "string" && line.shopifyVariantId.startsWith("gid://shopify/ProductVariant/")) {
        return [{
          shopifyVariantId: line.shopifyVariantId,
          shopifyProductId: typeof line.shopifyProductId === "string" ? line.shopifyProductId : undefined,
          handle: typeof line.handle === "string" ? line.handle : undefined,
          size: typeof line.size === "string" ? line.size : undefined,
          quantity: safeQuantity(line.quantity),
        }]
      }

      if (typeof line.slug === "string" && typeof line.size === "string") {
        return [{ slug: line.slug, size: line.size, quantity: safeQuantity(line.quantity) }]
      }

      return []
    }).slice(0, 50)
  } catch {
    return []
  }
}

export function writeGuestCart(response: NextResponse, lines: GuestCartLine[]) {
  const secure = process.env.COOKIE_SECURE === "true"
  const value = Buffer.from(JSON.stringify(lines), "utf8").toString("base64url")
  response.cookies.set(COOKIE, value, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  })
}

export function clearGuestCart(response: NextResponse) {
  response.cookies.set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 })
}
