import { NextRequest } from "next/server"
import { json, options } from "../../../../lib/http"
import { getCatalogProducts } from "../../../../lib/shopify"

export async function OPTIONS(request: NextRequest) {
  return options(request)
}

export async function GET(request: NextRequest) {
  try {
    const requestedLimit = Number(request.nextUrl.searchParams.get("limit") || "100")
    const products = await getCatalogProducts(requestedLimit)

    const collections = [...new Set(products.flatMap((product) => product.collectionTitles))].sort((a, b) =>
      a.localeCompare(b),
    )
    const sizes = [...new Set(products.flatMap((product) => product.sizes))].sort((a, b) => a.localeCompare(b))
    const colors = [...new Set(products.flatMap((product) => product.colors))].sort((a, b) => a.localeCompare(b))

    const response = json(request, {
      source: "shopify",
      count: products.length,
      products,
      filters: {
        collections,
        sizes,
        colors,
      },
    })
    response.headers.set("Cache-Control", "public, max-age=20, s-maxage=30, stale-while-revalidate=300")
    return response
  } catch (error) {
    console.error("Shopify products error:", error)
    return json(request, { error: error instanceof Error ? error.message : "Unable to load Shopify products" }, 502)
  }
}
