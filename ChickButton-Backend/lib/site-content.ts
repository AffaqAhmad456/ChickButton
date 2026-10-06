import { shopifyGraphQL } from "./shopify"

export type SiteLink = { title: string; url: string }
export type PromotionImage = { url: string; width: number; height: number; alt: string | null }
export type HomePromotion = {
  image: PromotionImage
  mobileImage: PromotionImage | null
  alt: string
  link: string | null
}
export type SiteContent = {
  announcement: { primary: string | null; secondary: string | null }
  help: SiteLink[] | null
  company: SiteLink[] | null
  homePromotion: HomePromotion | null
}

type MenuItem = { title: string; type: string; url: string | null }
type Menu = { handle: string; items: MenuItem[] }
type ImageReference = { image: { url: string; width: number | null; height: number | null; altText: string | null } | null; alt: string | null }
type ImageMetafield = { reference: ImageReference | null } | null
type ContentQuery = {
  shop: {
    primary: { value: string } | null
    secondary: { value: string } | null
    promoEnabled: { value: string } | null
    promoImage: ImageMetafield
    promoMobileImage: ImageMetafield
    promoAlt: { value: string } | null
    promoLink: { value: string } | null
  }
  menus: { nodes: Menu[] }
}

const HELP_HANDLE = "chickbutton-help"
const COMPANY_HANDLE = "chickbutton-company"
const infoPages: Record<string, string> = {
  "size-guide": "size-guide",
  shipping: "shipping",
  returns: "returns",
  contact: "contact",
  "our-story": "our-story",
  privacy: "privacy",
  "privacy-policy": "privacy",
  terms: "terms",
  "terms-conditions": "terms",
  careers: "careers",
}

function shopHost() {
  const shop = (process.env.SHOPIFY_SHOP || "").replace(/^https?:\/\//, "").replace(/\/$/, "")
  return shop.endsWith(".myshopify.com") ? shop : `${shop}.myshopify.com`
}

export function normalizeSiteContentUrl(raw: string | null): string | null {
  if (!raw) return null
  let url: URL
  try {
    url = new URL(raw, `https://${shopHost()}`)
  } catch {
    return null
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null

  const customerHost = process.env.CUSTOMER_ORIGIN ? new URL(process.env.CUSTOMER_ORIGIN).host : ""
  const localHosts = new Set([shopHost(), customerHost, "chickbutton.com", "www.chickbutton.com", "chick-button.vercel.app"])
  const local = localHosts.has(url.host)
  if (!local) return url.toString()

  const path = url.pathname.replace(/\/$/, "") || "/"
  const info = path.match(/^\/info\/([a-z0-9-]+)$/i)
  if (info && infoPages[info[1]]) return `/info/${infoPages[info[1]]}`
  if (path === "/shop" || path === "/categories" || path === "/") {
    return `${path}${url.search}${url.hash}`
  }
  const page = path.match(/^\/pages\/([a-z0-9-]+)$/i)
  if (page && infoPages[page[1]]) return `/info/${infoPages[page[1]]}`
  if (path === "/collections/all") return "/shop"
  const collection = path.match(/^\/collections\/([a-z0-9-]+)$/i)
  if (collection) return `/shop?q=${encodeURIComponent(collection[1].replace(/-/g, " "))}`
  if (path === "/search") return `/shop${url.search}`
  // Shopify page/product URLs with no matching ChickButton route are not safe local links.
  return null
}

function normalizeMenu(menu: Menu | undefined): SiteLink[] | null {
  if (!menu) return null
  const links = menu.items.flatMap((item) => {
    const title = item.title.trim()
    const url = normalizeSiteContentUrl(item.url)
    return title && url ? [{ title, url }] : []
  })
  return menu.items.length && !links.length ? null : links
}

function announcementText(value: string | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed || null
}

function promotionImage(metafield: ImageMetafield): PromotionImage | null {
  const source = metafield?.reference
  const image = source?.image
  if (!image || !Number.isFinite(image.width) || !Number.isFinite(image.height) ||
    Number(image.width) <= 0 || Number(image.height) <= 0) return null
  try {
    const url = new URL(image.url)
    if (url.protocol !== "https:") return null
    return {
      url: url.toString(),
      width: Number(image.width),
      height: Number(image.height),
      alt: image.altText?.trim() || source?.alt?.trim() || null,
    }
  } catch {
    return null
  }
}

function homePromotion(shop: ContentQuery["shop"]): HomePromotion | null {
  if (shop.promoEnabled?.value !== "true") return null
  const image = promotionImage(shop.promoImage)
  if (!image) return null
  return {
    image,
    mobileImage: promotionImage(shop.promoMobileImage),
    alt: shop.promoAlt?.value.trim() || image.alt || "ChickButton promotion",
    link: normalizeSiteContentUrl(shop.promoLink?.value || null),
  }
}

export async function getSiteContent(): Promise<SiteContent> {
  const data = await shopifyGraphQL<ContentQuery>(`query ChickButtonSiteContent {
    shop {
      primary: metafield(namespace: "custom", key: "chickbutton_announcement_primary") { value }
      secondary: metafield(namespace: "custom", key: "chickbutton_announcement_secondary") { value }
      promoEnabled: metafield(namespace: "custom", key: "chickbutton_home_promo_enabled") { value }
      promoImage: metafield(namespace: "custom", key: "chickbutton_home_promo_image") {
        reference { ... on MediaImage { alt image { url width height altText } } }
      }
      promoMobileImage: metafield(namespace: "custom", key: "chickbutton_home_promo_mobile_image") {
        reference { ... on MediaImage { alt image { url width height altText } } }
      }
      promoAlt: metafield(namespace: "custom", key: "chickbutton_home_promo_alt") { value }
      promoLink: metafield(namespace: "custom", key: "chickbutton_home_promo_link") { value }
    }
    menus(first: 100) {
      nodes { handle items { title type url } }
    }
  }`)
  const menus = data.menus.nodes
  return {
    announcement: {
      primary: announcementText(data.shop.primary?.value),
      secondary: announcementText(data.shop.secondary?.value),
    },
    help: normalizeMenu(menus.find((menu) => menu.handle === HELP_HANDLE)),
    company: normalizeMenu(menus.find((menu) => menu.handle === COMPANY_HANDLE)),
    homePromotion: homePromotion(data.shop),
  }
}
