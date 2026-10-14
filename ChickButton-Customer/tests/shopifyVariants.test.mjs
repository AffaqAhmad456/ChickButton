import assert from "node:assert/strict"
import test from "node:test"
import {
  firstVariantForColor,
  mapShopifyVariants,
  variantForCartLine,
  variantForSelection,
  variantForSize,
  variantSellable,
} from "../src/shopifyVariants.ts"

const raw = (id, color, size, stock, overrides = {}) => ({
  id: `gid://shopify/ProductVariant/${id}`,
  title: `${color} / ${size}`,
  options: { Color: color, Size: size },
  price: 1000,
  inventoryQuantity: stock,
  availableForSale: stock > 0,
  image: `https://example.com/${color}.jpg`,
  sku: `${color}-${size}`,
  inventoryLimited: true,
  ...overrides,
})

test("one, two and three colors remain distinct", () => {
  for (const colors of [["Red"], ["Red", "Blue"], ["Red", "Blue", "Green"]]) {
    const variants = mapShopifyVariants(colors.map((color, index) => raw(index + 1, color, "M", 2)), 0)
    assert.deepEqual([...new Set(variants.map((variant) => variant.color))], colors)
  }
})

test("a sold-out first color does not hide the purchasable second color", () => {
  const variants = mapShopifyVariants([raw(1, "Red", "M", 0), raw(2, "Blue", "M", 10)], 0)
  assert.equal(variants.some(variantSellable), true)
  assert.equal(variantSellable(variantForSelection(variants, "Red", "M")), false)
  assert.equal(firstVariantForColor(variants, "Blue")?.id, variants[1].id)
  assert.equal(variantForSize(variants, "M")?.id, variants[1].id)
})

test("all unavailable variants leave the product unavailable", () => {
  const variants = mapShopifyVariants([raw(1, "Red", "M", 0), raw(2, "Blue", "M", 0)], 0)
  assert.equal(variants.some(variantSellable), false)
})

test("sizes are resolved within the chosen color", () => {
  const variants = mapShopifyVariants([
    raw(1, "Red", "S", 3), raw(2, "Red", "M", 0), raw(3, "Blue", "M", 8),
  ], 0)
  assert.deepEqual([...new Set(variants.filter((variant) => variant.color === "Red").map((variant) => variant.size))], ["S", "M"])
  assert.deepEqual([...new Set(variants.filter((variant) => variant.color === "Blue").map((variant) => variant.size))], ["M"])
  assert.equal(variantForSelection(variants, "Red", "M")?.availableForSale, false)
  assert.equal(variantForSelection(variants, "Blue", "M")?.availableForSale, true)
})

test("selecting the second color preserves its image, price, availability and cart ID", () => {
  const variants = mapShopifyVariants([
    raw(1, "Red", "M", 0),
    raw(2, "Blue", "M", 10, { price: 1450, compareAtPrice: 1750 }),
  ], 0)
  const selected = variantForSelection(variants, "Blue", "M")
  assert.equal(selected?.image, "https://example.com/Blue.jpg")
  assert.equal(selected?.price, 1450)
  assert.equal(selected?.compareAtPrice, 1750)
  assert.equal(variantSellable(selected), true)
  assert.equal(variantForCartLine(variants, "M", selected.id)?.id, selected.id)
  assert.equal(variantForCartLine(variants, "M", selected.id)?.color, "Blue")
})

test("a refreshed selection can resolve the same exact variant", () => {
  const variants = mapShopifyVariants([raw(1, "Red", "M", 0), raw(2, "Blue", "M", 10)], 0)
  const firstAvailable = variants.find(variantSellable)
  assert.equal(variantForSelection(variants, firstAvailable.color, firstAvailable.size)?.id, firstAvailable.id)
})

test("Shopify sellability allows untracked or continue-selling variants at zero quantity", () => {
  const variants = mapShopifyVariants([
    raw(1, "Red", "M", 0, { availableForSale: true, inventoryLimited: false }),
    raw(2, "Blue", "M", 0, { availableForSale: false, inventoryLimited: false }),
  ], 0)
  assert.equal(variantSellable(variants[0]), true)
  assert.equal(variantSellable(variants[1]), false)
})

test("a color-only variant uses One Size instead of its combined Shopify title", () => {
  const variants = mapShopifyVariants([{ ...raw(1, "Red", "M", 2), options: { Colour: "Red" } }], 0)
  assert.equal(variants[0].size, "One Size")
})
