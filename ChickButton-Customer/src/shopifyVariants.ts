export type ShopifyProductVariant = {
  id: string
  size: string
  color: string | null
  image: string | null
  sku: string | null
  price: number
  compareAtPrice: number | null
  inventoryQuantity: number
  availableForSale: boolean
  inventoryLimited: boolean
}

export function variantSellable(variant: ShopifyProductVariant) {
  return variant.availableForSale && (!variant.inventoryLimited || variant.inventoryQuantity > 0)
}

export function mapShopifyVariants(rawVariants: any[], fallbackPrice: number): ShopifyProductVariant[] {
  return rawVariants.map((variant) => {
    const options = variant?.options || {}
    const option = (names: string[]) => Object.entries(options).find(([key]) => names.includes(key.trim().toLowerCase()))?.[1]
    const size = option(["size", "age"]) || (!option(["color", "colour"]) && variant.title && variant.title !== "Default Title" ? variant.title : "One Size")
    const color = option(["color", "colour"]) || null
    return {
      id: String(variant.id),
      size: String(size),
      color: color ? String(color) : null,
      image: typeof variant.image === "string" ? variant.image : null,
      sku: typeof variant.sku === "string" ? variant.sku : null,
      price: Number.isFinite(Number(variant.price)) ? Number(variant.price) : fallbackPrice,
      compareAtPrice: variant.compareAtPrice && Number(variant.compareAtPrice) > 0 ? Number(variant.compareAtPrice) : null,
      inventoryQuantity: Math.max(0, Number(variant.inventoryQuantity) || 0),
      availableForSale: Boolean(variant.availableForSale),
      inventoryLimited: variant.inventoryLimited !== false,
    }
  })
}

export function variantForSize(variants: ShopifyProductVariant[], size: string) {
  return variants.find((variant) => variant.size === size && variantSellable(variant)) ||
    variants.find((variant) => variant.size === size)
}

export function variantForCartLine(variants: ShopifyProductVariant[], size: string, variantId?: string) {
  return variantId ? variants.find((variant) => variant.id === variantId) : variantForSize(variants, size)
}

export function variantForSelection(variants: ShopifyProductVariant[], color: string | null, size: string) {
  return variants.find((variant) => variant.color === color && variant.size === size)
}

export function firstVariantForColor(variants: ShopifyProductVariant[], color: string | null) {
  return variants.find((variant) => variant.color === color && variantSellable(variant)) ||
    variants.find((variant) => variant.color === color)
}
