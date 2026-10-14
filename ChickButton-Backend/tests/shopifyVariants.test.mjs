import assert from "node:assert/strict"
import test from "node:test"
import { canPurchaseVariant, getCatalogProducts, getCatalogVariant, inventoryLimited } from "../lib/shopify.ts"

test("tracked denial caps stock; continue selling and untracked variants follow Shopify sellability", () => {
  assert.equal(inventoryLimited({ inventoryPolicy: "DENY", inventoryItem: { tracked: true } }), true)
  assert.equal(inventoryLimited({ inventoryPolicy: "CONTINUE", inventoryItem: { tracked: true } }), false)
  assert.equal(inventoryLimited({ inventoryPolicy: "DENY", inventoryItem: { tracked: false } }), false)
  assert.equal(canPurchaseVariant({ availableForSale: true, inventoryQuantity: 0, inventoryLimited: false }, 4), true)
  assert.equal(canPurchaseVariant({ availableForSale: true, inventoryQuantity: 2, inventoryLimited: true }, 3), false)
  assert.equal(canPurchaseVariant({ availableForSale: false, inventoryQuantity: 10, inventoryLimited: false }), false)
})

test("catalog paginates every variant and keeps the product available when the first color is sold out", async () => {
  const previousFetch = globalThis.fetch
  const previousEnv = {
    shop: process.env.SHOPIFY_SHOP,
    client: process.env.SHOPIFY_CLIENT_ID,
    secret: process.env.SHOPIFY_CLIENT_SECRET,
  }
  process.env.SHOPIFY_SHOP = "mock-shop"
  process.env.SHOPIFY_CLIENT_ID = "mock-client"
  process.env.SHOPIFY_CLIENT_SECRET = "mock-secret"

  const variant = (index) => ({
    id: `gid://shopify/ProductVariant/${index}`,
    title: index === 0 ? "Red / M" : `Blue / ${index}`,
    sku: `SKU-${index}`,
    price: index === 0 ? "1000" : "1200",
    compareAtPrice: null,
    inventoryQuantity: index === 0 ? 0 : 10,
    availableForSale: index !== 0,
    inventoryPolicy: "DENY",
    inventoryItem: { tracked: true },
    selectedOptions: [{ name: "Color", value: index === 0 ? "Red" : "Blue" }, { name: "Size", value: String(index) }],
    image: { url: `https://example.com/${index}.jpg` },
  })
  const firstPage = Array.from({ length: 100 }, (_, index) => variant(index))
  const secondPage = Array.from({ length: 5 }, (_, index) => variant(index + 100))
  const cursors = []
  globalThis.fetch = async (url, options) => {
    if (String(url).endsWith("/access_token")) return Response.json({ access_token: "mock-token", expires_in: 3600 })
    const { query, variables } = JSON.parse(options.body)
    if (query.includes("ChickButtonVariant")) {
      return Response.json({ data: { productVariant: {
        ...variant(2), title: "Blue", selectedOptions: [{ name: "Colour", value: "Blue" }],
        product: { id: "gid://shopify/Product/1", title: "Colorful Pants", handle: "colorful-pants", featuredMedia: null },
      } } })
    }
    if (query.includes("ChickButtonMoreVariants")) {
      cursors.push(variables.after)
      return Response.json({ data: { product: { variants: { nodes: secondPage, pageInfo: { hasNextPage: false, endCursor: null } } } } })
    }
    return Response.json({ data: { products: { nodes: [{
      id: "gid://shopify/Product/1", title: "Colorful Pants", handle: "colorful-pants", status: "ACTIVE",
      media: { nodes: [] }, collections: { nodes: [] }, totalInventory: 1040,
      variants: { nodes: firstPage, pageInfo: { hasNextPage: true, endCursor: "cursor-100" } },
    }] } } })
  }

  try {
    const [product] = await getCatalogProducts(17)
    assert.deepEqual(cursors, ["cursor-100"])
    assert.equal(product.variants.length, 105)
    assert.deepEqual(product.colors, ["Red", "Blue"])
    assert.equal(product.available, true)
    assert.equal(product.price, 1200)
    assert.equal(product.variants[104].id, "gid://shopify/ProductVariant/104")
    assert.equal(product.images.length, 105)
    const colorOnly = await getCatalogVariant("gid://shopify/ProductVariant/2")
    assert.equal(colorOnly?.color, "Blue")
    assert.equal(colorOnly?.size, "One Size")
  } finally {
    globalThis.fetch = previousFetch
    for (const [key, value] of Object.entries({ SHOPIFY_SHOP: previousEnv.shop, SHOPIFY_CLIENT_ID: previousEnv.client, SHOPIFY_CLIENT_SECRET: previousEnv.secret })) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
})
