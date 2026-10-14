type ShopifyTokenResponse = {
  access_token: string
  scope?: string
  expires_in?: number
}

type GraphQLError = {
  message?: string
}

type ShopifyGraphQLResponse<T> = {
  data?: T
  errors?: GraphQLError[]
}

type ShopifyImage = {
  url: string
  altText?: string | null
  width?: number | null
  height?: number | null
}

type ShopifyMediaNode = {
  image?: ShopifyImage | null
}

type ShopifyCollectionNode = {
  id: string
  title: string
  handle: string
}

type ShopifySelectedOption = {
  name: string
  value: string
}

type ShopifyVariantNode = {
  id: string
  title: string
  sku?: string | null
  price: string
  compareAtPrice?: string | null
  inventoryQuantity?: number | null
  availableForSale: boolean
  inventoryPolicy: "CONTINUE" | "DENY"
  inventoryItem: { tracked: boolean }
  selectedOptions: ShopifySelectedOption[]
  image?: ShopifyImage | null
}

type ShopifyProductNode = {
  id: string
  title: string
  handle: string
  description?: string
  descriptionHtml?: string
  status: string
  productType?: string
  vendor?: string
  tags?: string[]
  totalInventory?: number | null
  media: { nodes: ShopifyMediaNode[] }
  variants: { nodes: ShopifyVariantNode[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } }
  collections: { nodes: ShopifyCollectionNode[] }
}

type ProductsQueryData = {
  products: {
    nodes: ShopifyProductNode[]
  }
}

export type CatalogVariant = {
  id: string
  title: string
  sku: string | null
  price: number
  compareAtPrice: number | null
  inventoryQuantity: number
  availableForSale: boolean
  inventoryLimited: boolean
  options: Record<string, string>
  image: string | null
}

export type CatalogProduct = {
  id: string
  handle: string
  title: string
  description: string
  descriptionHtml: string
  status: string
  productType: string
  vendor: string
  tags: string[]
  price: number
  compareAtPrice: number | null
  onSale: boolean
  totalInventory: number
  available: boolean
  images: string[]
  collections: Array<{ id: string; title: string; handle: string }>
  collectionTitles: string[]
  sizes: string[]
  colors: string[]
  variants: CatalogVariant[]
}

let tokenCache: { token: string; expiresAt: number } | null = null

function env(name: string) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

function shopDomain() {
  const shop = env("SHOPIFY_SHOP")
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "")
  return shop.endsWith(".myshopify.com") ? shop : `${shop}.myshopify.com`
}

function apiVersion() {
  return process.env.SHOPIFY_API_VERSION?.trim() || "2026-10"
}

async function getAccessToken() {
  const now = Date.now()
  if (tokenCache && tokenCache.expiresAt > now + 60_000) return tokenCache.token

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: env("SHOPIFY_CLIENT_ID"),
    client_secret: env("SHOPIFY_CLIENT_SECRET"),
  })

  const response = await fetch(`https://${shopDomain()}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  })

  const payload = (await response.json().catch(() => ({}))) as Partial<ShopifyTokenResponse> & {
    error?: string
    error_description?: string
  }

  if (!response.ok || !payload.access_token) {
    const message = payload.error_description || payload.error || `Shopify authentication failed (${response.status})`
    throw new Error(message)
  }

  const ttlSeconds = Math.max(Number(payload.expires_in || 3600), 300)
  tokenCache = {
    token: payload.access_token,
    expiresAt: now + ttlSeconds * 1000,
  }

  return tokenCache.token
}

export async function shopifyGraphQL<T>(query: string, variables?: Record<string, unknown>) {
  const token = await getAccessToken()
  const response = await fetch(`https://${shopDomain()}/admin/api/${apiVersion()}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  })

  const payload = (await response.json().catch(() => ({}))) as ShopifyGraphQLResponse<T>

  if (!response.ok) throw new Error(`Shopify API request failed (${response.status})`)
  if (payload.errors?.length) throw new Error(payload.errors.map((error) => error.message || "Shopify GraphQL error").join("; "))
  if (!payload.data) throw new Error("Shopify returned no data")

  return payload.data
}

function toNumber(value: string | number | null | undefined) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))]
}

export function inventoryLimited(variant: { inventoryPolicy: "CONTINUE" | "DENY"; inventoryItem: { tracked: boolean } }) {
  return variant.inventoryItem.tracked && variant.inventoryPolicy === "DENY"
}

export function canPurchaseVariant(variant: { availableForSale: boolean; inventoryQuantity: number; inventoryLimited: boolean }, quantity = 1) {
  return variant.availableForSale && (!variant.inventoryLimited || variant.inventoryQuantity >= quantity)
}

function normalizeProduct(product: ShopifyProductNode): CatalogProduct {
  const variants: CatalogVariant[] = product.variants.nodes.map((variant) => ({
    id: variant.id,
    title: variant.title,
    sku: variant.sku || null,
    price: toNumber(variant.price),
    compareAtPrice: variant.compareAtPrice ? toNumber(variant.compareAtPrice) : null,
    inventoryQuantity: Math.max(toNumber(variant.inventoryQuantity), 0),
    availableForSale: Boolean(variant.availableForSale),
    inventoryLimited: inventoryLimited(variant),
    options: Object.fromEntries(variant.selectedOptions.map((option) => [option.name, option.value])),
    image: variant.image?.url || null,
  }))

  const images = unique([
    ...product.media.nodes.map((media) => media.image?.url || ""),
    ...variants.map((variant) => variant.image || ""),
  ])

  const sizes = unique(
    product.variants.nodes.flatMap((variant) =>
      variant.selectedOptions
        .filter((option) => /^(size|age)$/i.test(option.name) && option.value !== "Default Title")
        .map((option) => option.value),
    ),
  )

  const colors = unique(
    product.variants.nodes.flatMap((variant) =>
      variant.selectedOptions
        .filter((option) => /^colou?r$/i.test(option.name) && option.value !== "Default Title")
        .map((option) => option.value),
    ),
  )

  const availableVariants = variants.filter((variant) => canPurchaseVariant(variant))
  const cardVariant = [...(availableVariants.length ? availableVariants : variants)].sort((a, b) => a.price - b.price)[0]
  const price = cardVariant?.price ?? 0
  const compareAtPrice = cardVariant?.compareAtPrice ?? null

  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    description: product.description || "",
    descriptionHtml: product.descriptionHtml || "",
    status: product.status,
    productType: product.productType || "",
    vendor: product.vendor || "",
    tags: product.tags || [],
    price,
    compareAtPrice,
    onSale: Boolean(compareAtPrice && compareAtPrice > price),
    totalInventory: Math.max(toNumber(product.totalInventory), 0),
    available: variants.some((variant) => canPurchaseVariant(variant)),
    images,
    collections: product.collections.nodes,
    collectionTitles: product.collections.nodes.map((collection) => collection.title),
    sizes,
    colors,
    variants,
  }
}

const PRODUCTS_QUERY = `#graphql
  query ChickButtonProducts($first: Int!) {
    products(first: $first, query: "status:active", sortKey: TITLE) {
      nodes {
        id
        title
        handle
        description
        status
        productType
        vendor
        tags
        totalInventory
        media(first: 10) {
          nodes {
            ... on MediaImage {
              image {
                url
                altText
                width
                height
              }
            }
          }
        }
        variants(first: 100) {
          pageInfo { hasNextPage endCursor }
          nodes {
            id
            title
            sku
            price
            compareAtPrice
            inventoryQuantity
            availableForSale
            inventoryPolicy
            inventoryItem { tracked }
            selectedOptions {
              name
              value
            }
            image {
              url
              altText
              width
              height
            }
          }
        }
        collections(first: 20) {
          nodes {
            id
            title
            handle
          }
        }
      }
    }
  }
`

const MORE_VARIANTS_QUERY = `#graphql
  query ChickButtonMoreVariants($id: ID!, $after: String!) {
    product(id: $id) {
      variants(first: 100, after: $after) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id title sku price compareAtPrice inventoryQuantity availableForSale inventoryPolicy
          inventoryItem { tracked }
          selectedOptions { name value }
          image { url altText width height }
        }
      }
    }
  }
`

// Server-side catalog cache: serve instantly from memory, refresh in the background
// (stale-while-revalidate) and share one in-flight Shopify request between visitors.
const CATALOG_FRESH_MS = 30_000
const CATALOG_STALE_MS = 10 * 60_000
const catalogCache = new Map<number, { at: number; data: CatalogProduct[] }>()
const catalogInflight = new Map<number, Promise<CatalogProduct[]>>()

function fetchCatalog(first: number) {
  const existing = catalogInflight.get(first)
  if (existing) return existing
  const request = shopifyGraphQL<ProductsQueryData>(PRODUCTS_QUERY, { first })
    .then(async (data) => {
      const complete = await Promise.all(data.products.nodes.map(async (product) => {
        const nodes = [...product.variants.nodes]
        let pageInfo = product.variants.pageInfo
        while (pageInfo.hasNextPage) {
          if (!pageInfo.endCursor) throw new Error(`Shopify variant pagination missing cursor for ${product.handle}`)
          const next = await shopifyGraphQL<{ product: { variants: ShopifyProductNode["variants"] } | null }>(MORE_VARIANTS_QUERY, { id: product.id, after: pageInfo.endCursor })
          if (!next.product) throw new Error(`Shopify product disappeared during variant pagination: ${product.handle}`)
          nodes.push(...next.product.variants.nodes)
          pageInfo = next.product.variants.pageInfo
        }
        return { ...product, variants: { nodes, pageInfo } }
      }))
      const mapped = complete.map(normalizeProduct)
      catalogCache.set(first, { at: Date.now(), data: mapped })
      return mapped
    })
    .finally(() => catalogInflight.delete(first))
  catalogInflight.set(first, request)
  return request
}

export async function getCatalogProducts(limit = 100) {
  const first = Math.min(Math.max(Math.trunc(limit), 1), 100)
  const cached = catalogCache.get(first)
  const age = cached ? Date.now() - cached.at : Infinity
  if (cached && age < CATALOG_FRESH_MS) return cached.data
  if (cached && age < CATALOG_STALE_MS) {
    void fetchCatalog(first).catch((error) => console.error("Catalog background refresh failed:", error))
    return cached.data
  }
  return fetchCatalog(first)
}


export type CartShopifyVariant = {
  id: string
  title: string
  sku: string | null
  price: number
  compareAtPrice: number | null
  inventoryQuantity: number
  availableForSale: boolean
  inventoryLimited: boolean
  size: string
  color: string | null
  image: string | null
  product: {
    id: string
    title: string
    handle: string
    image: string | null
  }
}

type VariantQueryData = {
  productVariant: {
    id: string
    title: string
    sku?: string | null
    price: string
    compareAtPrice?: string | null
    inventoryQuantity?: number | null
    availableForSale: boolean
    inventoryPolicy: "CONTINUE" | "DENY"
    inventoryItem: { tracked: boolean }
    selectedOptions: ShopifySelectedOption[]
    image?: ShopifyImage | null
    product: {
      id: string
      title: string
      handle: string
      featuredMedia?: {
        preview?: {
          image?: ShopifyImage | null
        } | null
      } | null
    }
  } | null
}

const VARIANT_QUERY = `#graphql
  query ChickButtonVariant($id: ID!) {
    productVariant(id: $id) {
      id
      title
      sku
      price
      compareAtPrice
      inventoryQuantity
      availableForSale
      inventoryPolicy
      inventoryItem { tracked }
      selectedOptions {
        name
        value
      }
      image {
        url
        altText
      }
      product {
        id
        title
        handle
        featuredMedia {
          preview {
            image {
              url
              altText
            }
          }
        }
      }
    }
  }
`

export async function getCatalogVariant(variantId: string): Promise<CartShopifyVariant | null> {
  if (!variantId?.startsWith("gid://shopify/ProductVariant/")) return null
  const data = await shopifyGraphQL<VariantQueryData>(VARIANT_QUERY, { id: variantId })
  const variant = data.productVariant
  if (!variant) return null

  const sizeOption = variant.selectedOptions.find((option) => /^(size|age)$/i.test(option.name))
  const colorOption = variant.selectedOptions.find((option) => /^colou?r$/i.test(option.name))
  const fallbackSize = colorOption ? "One Size" : variant.title && variant.title !== "Default Title" ? variant.title : "One Size"

  return {
    id: variant.id,
    title: variant.title,
    sku: variant.sku || null,
    price: toNumber(variant.price),
    compareAtPrice: variant.compareAtPrice ? toNumber(variant.compareAtPrice) : null,
    inventoryQuantity: Math.max(toNumber(variant.inventoryQuantity), 0),
    availableForSale: Boolean(variant.availableForSale),
    inventoryLimited: inventoryLimited(variant),
    size: sizeOption?.value && sizeOption.value !== "Default Title" ? sizeOption.value : fallbackSize,
    color: colorOption?.value && colorOption.value !== "Default Title" ? colorOption.value : null,
    image: variant.image?.url || variant.product.featuredMedia?.preview?.image?.url || null,
    product: {
      id: variant.product.id,
      title: variant.product.title,
      handle: variant.product.handle,
      image: variant.product.featuredMedia?.preview?.image?.url || variant.image?.url || null,
    },
  }
}

export type ShopifyDeliveryRate = {
  handle: string
  title: string
  code: string
  source: string
  amount: number
  currencyCode: string
  kind: "shipping" | "local_delivery"
}

type DeliveryOptionsData = {
  draftOrderAvailableDeliveryOptions: {
    availableShippingRates: Array<{
      handle: string
      title: string
      code: string
      source: string
      price: { amount: string; currencyCode: string }
    }>
    availableLocalDeliveryRates: Array<{
      handle: string
      title: string
      code: string
      source: string
      price: { amount: string; currencyCode: string }
    }>
  }
}

const DELIVERY_OPTIONS_QUERY = `#graphql
  query ChickButtonDeliveryOptions($input: DraftOrderAvailableDeliveryOptionsInput!) {
    draftOrderAvailableDeliveryOptions(input: $input) {
      availableShippingRates {
        handle
        title
        code
        source
        price { amount currencyCode }
      }
      availableLocalDeliveryRates {
        handle
        title
        code
        source
        price { amount currencyCode }
      }
    }
  }
`

export async function getShopifyDeliveryRates(input: {
  lines: ShopifyCheckoutLine[]
  customer: ShopifyCheckoutCustomer
}) {
  if (!input.lines.length) throw new Error("Your cart is empty.")
  const { firstName, lastName } = splitName(input.customer.fullName || "Customer")
  const data = await shopifyGraphQL<DeliveryOptionsData>(DELIVERY_OPTIONS_QUERY, {
    input: {
      lineItems: input.lines.map((line) => ({
        variantId: line.variantId,
        quantity: Math.max(1, Math.trunc(Number(line.quantity) || 1)),
      })),
      shippingAddress: {
        firstName,
        lastName,
        phone: input.customer.phone || undefined,
        address1: input.customer.addressLine,
        address2: input.customer.area || undefined,
        city: input.customer.city,
        province: input.customer.province || undefined,
        zip: input.customer.postalCode || undefined,
        countryCode: "PK",
      },
      marketRegionCountryCode: "PK",
      acceptAutomaticDiscounts: false,
    },
  })

  const options = data.draftOrderAvailableDeliveryOptions
  const shipping = (options.availableShippingRates || []).map((rate) => ({
    handle: rate.handle,
    title: rate.title,
    code: rate.code,
    source: rate.source,
    amount: Math.max(0, toNumber(rate.price.amount)),
    currencyCode: rate.price.currencyCode,
    kind: "shipping" as const,
  }))
  const local = (options.availableLocalDeliveryRates || []).map((rate) => ({
    handle: rate.handle,
    title: rate.title,
    code: rate.code,
    source: rate.source,
    amount: Math.max(0, toNumber(rate.price.amount)),
    currencyCode: rate.price.currencyCode,
    kind: "local_delivery" as const,
  }))
  return [...shipping, ...local].sort((a, b) => a.amount - b.amount)
}

export async function getShopifyDeliveryRate(input: {
  lines: ShopifyCheckoutLine[]
  customer: ShopifyCheckoutCustomer
}) {
  const rates = await getShopifyDeliveryRates(input)
  return rates[0] || null
}

export type ShopifyCreatedOrder = {
  id: string
  name: string
  displayFinancialStatus: string
  displayFulfillmentStatus: string
  totalPriceSet?: {
    shopMoney?: {
      amount?: string
      currencyCode?: string
    } | null
  } | null
}

type OrderCreateData = {
  orderCreate: {
    order: ShopifyCreatedOrder | null
    userErrors: Array<{ field?: string[] | null; message: string }>
  }
}

const ORDER_CREATE_MUTATION = `#graphql
  mutation ChickButtonCreateOrder($order: OrderCreateOrderInput!, $options: OrderCreateOptionsInput) {
    orderCreate(order: $order, options: $options) {
      userErrors {
        field
        message
      }
      order {
        id
        name
        displayFinancialStatus
        displayFulfillmentStatus
        totalPriceSet {
          shopMoney {
            amount
            currencyCode
          }
        }
      }
    }
  }
`

export async function createShopifyTestOrder(input: {
  variantId: string
  quantity: number
  email?: string
}) {
  const variant = await getCatalogVariant(input.variantId)
  if (!variant) throw new Error("Shopify product variant was not found.")

  const quantity = Math.max(1, Math.trunc(Number(input.quantity) || 1))
  if (!variant.availableForSale) throw new Error("This Shopify variant is not available for sale.")
  if (!canPurchaseVariant(variant, quantity)) {
    throw new Error(`Not enough Shopify inventory. Available: ${variant.inventoryQuantity}.`)
  }

  const order: Record<string, unknown> = {
    lineItems: [{ variantId: variant.id, quantity }],
  }
  if (input.email?.trim()) order.email = input.email.trim()

  const data = await shopifyGraphQL<OrderCreateData>(ORDER_CREATE_MUTATION, {
    order,
    options: {
      inventoryBehaviour: "DECREMENT_OBEYING_POLICY",
      sendReceipt: false,
      sendFulfillmentReceipt: false,
    },
  })

  const result = data.orderCreate
  if (result.userErrors?.length) {
    throw new Error(result.userErrors.map((error) => error.message).join("; "))
  }
  if (!result.order) throw new Error("Shopify did not return the created order.")

  return {
    order: result.order,
    variant: {
      id: variant.id,
      productId: variant.product.id,
      productTitle: variant.product.title,
      variantTitle: variant.title,
      size: variant.size,
      quantity,
      inventoryBefore: variant.inventoryQuantity,
      expectedInventoryAfter: Math.max(variant.inventoryQuantity - quantity, 0),
    },
  }
}

export type ShopifyCheckoutLine = {
  variantId: string
  quantity: number
}

export type ShopifyCheckoutCustomer = {
  fullName: string
  phone: string
  email?: string | null
  addressLine: string
  area?: string | null
  city: string
  province?: string | null
  postalCode?: string | null
}

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  return {
    firstName: parts[0] || fullName.trim(),
    lastName: parts.slice(1).join(" ") || "Customer",
  }
}

export async function createShopifyCheckoutOrder(input: {
  lines: ShopifyCheckoutLine[]
  customer: ShopifyCheckoutCustomer
  shippingRate: ShopifyDeliveryRate
  checkoutKey?: string | null
}) {
  if (!input.lines.length) throw new Error("Your cart is empty.")

  const validated = [] as Array<{ variant: CartShopifyVariant; quantity: number }>
  for (const line of input.lines) {
    const quantity = Math.max(1, Math.trunc(Number(line.quantity) || 1))
    const variant = await getCatalogVariant(line.variantId)
    if (!variant) throw new Error("One or more Shopify variants no longer exist.")
    if (!canPurchaseVariant(variant, quantity)) {
      throw new Error(`${variant.product.title} (${variant.size}) does not have enough stock.`)
    }
    validated.push({ variant, quantity })
  }

  const subtotal = validated.reduce((sum, line) => sum + line.variant.price * line.quantity, 0)
  const originalSubtotal = validated.reduce((sum, line) => {
    const compareAt = line.variant.compareAtPrice && line.variant.compareAtPrice > line.variant.price
      ? line.variant.compareAtPrice
      : line.variant.price
    return sum + compareAt * line.quantity
  }, 0)
  const saleSavings = Math.max(0, originalSubtotal - subtotal)
  const deliveryFee = Math.max(0, Number(input.shippingRate.amount) || 0)
  const total = subtotal + deliveryFee
  const { firstName, lastName } = splitName(input.customer.fullName)

  const shippingAddress = {
    firstName,
    lastName,
    phone: input.customer.phone,
    address1: input.customer.addressLine,
    address2: input.customer.area || undefined,
    city: input.customer.city,
    province: input.customer.province || undefined,
    zip: input.customer.postalCode || undefined,
    countryCode: "PK",
  }

  const order: Record<string, unknown> = {
    currency: "PKR",
    financialStatus: "PENDING",
    phone: input.customer.phone,
    shippingAddress,
    billingAddress: shippingAddress,
    lineItems: validated.map(({ variant, quantity }) => ({
      variantId: variant.id,
      productId: variant.product.id,
      title: variant.product.title,
      variantTitle: variant.title,
      sku: variant.sku || undefined,
      quantity,
      requiresShipping: true,
      priceSet: {
        shopMoney: {
          amount: variant.price.toFixed(2),
          currencyCode: "PKR",
        },
      },
    })),
    shippingLines: [{
      title: input.shippingRate.title || (deliveryFee > 0 ? "Delivery" : "Free Delivery"),
      code: input.shippingRate.code || input.shippingRate.handle || "SHOPIFY_DELIVERY",
      source: input.shippingRate.source || "Shopify",
      priceSet: {
        shopMoney: {
          amount: deliveryFee.toFixed(2),
          currencyCode: input.shippingRate.currencyCode || "PKR",
        },
      },
    }],
    tags: ["ChickButton", "Cash on Delivery"],
    note: "Cash on delivery order placed through ChickButton storefront.",
    ...(input.checkoutKey ? { sourceIdentifier: input.checkoutKey } : {}),
    customAttributes: [
      { key: "Payment method", value: "Cash on delivery" },
      { key: "Source", value: "ChickButton storefront" },
    ],
  }

  if (input.customer.email?.trim()) {
    const email = input.customer.email.trim()
    order.email = email
    order.customer = {
      toUpsert: {
        email,
        firstName,
        lastName,
        phone: input.customer.phone,
        tags: ["ChickButton"],
      },
    }
  }


  const data = await shopifyGraphQL<OrderCreateData>(ORDER_CREATE_MUTATION, {
    order,
    options: {
      inventoryBehaviour: "DECREMENT_OBEYING_POLICY",
      sendReceipt: false,
      sendFulfillmentReceipt: false,
    },
  })

  const result = data.orderCreate
  if (result.userErrors?.length) {
    throw new Error(result.userErrors.map((error) => `${error.field?.join(".") || "order"}: ${error.message}`).join("; "))
  }
  if (!result.order) throw new Error("Shopify did not return the created order.")

  const shopifyTotal = Number(result.order.totalPriceSet?.shopMoney?.amount)

  return {
    order: result.order,
    subtotal,
    originalSubtotal,
    saleSavings,
    deliveryFee,
    discountAmount: saleSavings,
    shippingRate: input.shippingRate,
    total: Number.isFinite(shopifyTotal) ? shopifyTotal : total,
    lines: validated,
  }
}
