import { createContext, memo, useContext, useEffect, useMemo, useRef, useState } from "react"
import { createBrowserRouter, RouterProvider, Link, useLocation, useNavigate, useParams } from "react-router"
import "./index.css"
import logo from "./assets/chickbutton-logo.png"
import heroLifestyle from "./assets/chickbutton-hero-lifestyle.jpg"
import { api } from "./api"
import { deriveSectionAndCategory, getFacets, matchesCategorySelection, matchesSection } from "./catalogFacets"

type FooterLink = { label: string; href: string }
type PromotionImage = { url: string; width: number; height: number; alt: string | null }
type HomePromotion = { image: PromotionImage; mobileImage: PromotionImage | null; alt: string; link: string | null }
type SiteContent = {
  announcement: { primary: string; secondary: string }
  help: FooterLink[]
  company: FooterLink[]
  homePromotion: HomePromotion | null
}

const fallbackSiteContent: SiteContent = {
  announcement: {
    primary: "FREE DELIVERY ON ORDERS OVER PKR 4,000",
    secondary: "EASY 7-DAY EXCHANGE",
  },
  help: [
    { label: "Size Guide", href: "/info/size-guide" },
    { label: "Shipping", href: "/info/shipping" },
    { label: "Returns", href: "/info/returns" },
    { label: "Contact", href: "/info/contact" },
  ],
  company: [
    { label: "Our Story", href: "/info/our-story" },
    { label: "Privacy Policy", href: "/info/privacy" },
    { label: "Terms & Conditions", href: "/info/terms" },
    { label: "Careers", href: "/info/careers" },
  ],
  homePromotion: null,
}

const SiteContentContext = createContext<SiteContent>(fallbackSiteContent)
const useSiteContent = () => useContext(SiteContentContext)

function SiteContentProvider({ children }: { children: React.ReactNode }) {
  const [content, setContent] = useState<SiteContent>(fallbackSiteContent)

  useEffect(() => {
    let active = true
    const refresh = async () => {
      try {
        const data = await api("/api/shopify/site-content")
        if (!active) return
        const links = (value: unknown, fallback: FooterLink[]): FooterLink[] => {
          if (!Array.isArray(value)) return fallback
          const valid = value.flatMap((item) => typeof item?.title === "string" && typeof item?.url === "string"
            ? [{ label: item.title, href: item.url }]
            : [])
          return value.length && !valid.length ? fallback : valid
        }
        const promoImage = (value: any): PromotionImage | null =>
          typeof value?.url === "string" && value.url.startsWith("https://") &&
          Number.isFinite(value.width) && value.width > 0 && Number.isFinite(value.height) && value.height > 0
            ? { url: value.url, width: value.width, height: value.height, alt: typeof value.alt === "string" ? value.alt : null }
            : null
        const promo = data?.homePromotion
        const image = promoImage(promo?.image)
        const link = typeof promo?.link === "string" &&
          ((promo.link.startsWith("/") && !promo.link.startsWith("//")) || /^https?:\/\//i.test(promo.link))
          ? promo.link : null
        setContent({
          announcement: {
            primary: typeof data?.announcement?.primary === "string" && data.announcement.primary.trim()
              ? data.announcement.primary : fallbackSiteContent.announcement.primary,
            secondary: typeof data?.announcement?.secondary === "string" && data.announcement.secondary.trim()
              ? data.announcement.secondary : fallbackSiteContent.announcement.secondary,
          },
          help: links(data?.help, fallbackSiteContent.help),
          company: links(data?.company, fallbackSiteContent.company),
          homePromotion: image ? {
            image,
            mobileImage: promoImage(promo?.mobileImage),
            alt: typeof promo?.alt === "string" && promo.alt.trim() ? promo.alt.trim() : image.alt || "ChickButton promotion",
            link,
          } : null,
        })
      } catch {
        if (active) setContent(fallbackSiteContent)
      }
    }
    const onVisible = () => { if (document.visibilityState === "visible") void refresh() }
    void refresh()
    const timer = window.setInterval(() => void refresh(), 60_000)
    document.addEventListener("visibilitychange", onVisible)
    return () => { active = false; window.clearInterval(timer); document.removeEventListener("visibilitychange", onVisible) }
  }, [])

  return <SiteContentContext.Provider value={content}>{children}</SiteContentContext.Provider>
}

type ShopifyProductVariant = {
  id: string
  size: string
  color: string | null
  price: number
  compareAtPrice: number | null
  inventoryQuantity: number
  availableForSale: boolean
}

type Product = {
  id: number
  slug: string
  name: string
  price: number
  old?: number
  image: string
  image2: string
  badge?: string
  color: string
  colorName: string
  colorNames?: string[]
  section: string
  category: string
  ages: string[]
  sizes: string[]
  available: boolean
  totalInventory?: number
  images?: string[]
  shopifyProductId?: string
  shopifyVariants?: ShopifyProductVariant[]
  collections?: string[]
  description?: string
}

const fallbackProducts: Product[] = [
  {
    id: 1,
    slug: "mini-sailor-romper",
    name: "Mini Sailor Romper",
    price: 2450,
    badge: "NEW",
    color: "#8fb9d9",
    colorName: "Blue",
    section: "BABY",
    category: "Baby Boys",
    ages: ["0–2 Years"],
    sizes: ["0–3M", "3–6M", "6–12M"],
    available: true,
    image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=760&q=85",
    image2: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=760&q=85"
  },
  {
    id: 2,
    slug: "tiny-explorer-set",
    name: "Tiny Explorer Set",
    price: 2950,
    color: "#c9b18a",
    colorName: "Beige",
    section: "BABY",
    category: "Baby Boys",
    ages: ["0–2 Years"],
    sizes: ["3–6M", "6–12M", "12–18M"],
    available: true,
    image: "https://images.unsplash.com/photo-1602030028438-4cf153cbae9e?auto=format&fit=crop&w=760&q=85",
    image2: "https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=760&q=85"
  },
  {
    id: 3,
    slug: "blossom-baby-dress",
    name: "Blossom Baby Dress",
    price: 2750,
    badge: "NEW",
    color: "#efb7c9",
    colorName: "Pink",
    section: "BABY",
    category: "Baby Girls",
    ages: ["0–2 Years"],
    sizes: ["0–3M", "3–6M", "6–12M"],
    available: true,
    image: "https://images.unsplash.com/photo-1560506840-ec148e82a604?auto=format&fit=crop&w=760&q=85",
    image2: "https://images.unsplash.com/photo-1519238360530-d9c7b1f8003c?auto=format&fit=crop&w=760&q=85"
  },
  {
    id: 4,
    slug: "peach-petal-romper",
    name: "Peach Petal Romper",
    price: 2550,
    color: "#e8a27f",
    colorName: "Orange",
    section: "BABY",
    category: "Baby Girls",
    ages: ["0–2 Years"],
    sizes: ["3–6M", "6–12M", "12–18M"],
    available: true,
    image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=760&q=85",
    image2: "https://images.unsplash.com/photo-1560506840-ec148e82a604?auto=format&fit=crop&w=760&q=85"
  },
  {
    id: 5,
    slug: "cloud-snuggle-set",
    name: "Cloud Snuggle Set",
    price: 3250,
    color: "#9ecad9",
    colorName: "Blue",
    section: "BABY",
    category: "Baby Sets",
    ages: ["0–2 Years"],
    sizes: ["0–3M", "3–6M", "6–12M"],
    available: true,
    image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=760&q=85",
    image2: "https://images.unsplash.com/photo-1602030028438-4cf153cbae9e?auto=format&fit=crop&w=760&q=85"
  },
  {
    id: 6,
    slug: "teddy-two-piece",
    name: "Teddy Two-Piece",
    price: 3150,
    color: "#d6c0a8",
    colorName: "Beige",
    section: "BABY",
    category: "Baby Sets",
    ages: ["0–2 Years"],
    sizes: ["3–6M", "6–12M", "12–18M"],
    available: true,
    image: "https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=760&q=85",
    image2: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=760&q=85"
  },
  {
    id: 7,
    slug: "rosebud-baby-frock",
    name: "Rosebud Baby Frock",
    price: 3350,
    color: "#e4a1b9",
    colorName: "Pink",
    section: "BABY",
    category: "Baby Frocks",
    ages: ["0–2 Years"],
    sizes: ["3–6M", "6–12M", "12–18M"],
    available: true,
    image: "https://images.unsplash.com/photo-1519238360530-d9c7b1f8003c?auto=format&fit=crop&w=760&q=85",
    image2: "https://images.unsplash.com/photo-1560506840-ec148e82a604?auto=format&fit=crop&w=760&q=85"
  },
  {
    id: 8,
    slug: "lemon-daisy-frock",
    name: "Lemon Daisy Frock",
    price: 3450,
    color: "#f0cd55",
    colorName: "Yellow",
    section: "BABY",
    category: "Baby Frocks",
    ages: ["0–2 Years"],
    sizes: ["3–6M", "6–12M", "12–18M"],
    available: true,
    image: "https://images.unsplash.com/photo-1560506840-ec148e82a604?auto=format&fit=crop&w=760&q=85",
    image2: "https://images.unsplash.com/photo-1519238360530-d9c7b1f8003c?auto=format&fit=crop&w=760&q=85"
  },
  {
    id: 9,
    slug: "adventure-coord",
    name: "Adventure Co-ord",
    price: 3950,
    badge: "NEW",
    color: "#6aa5bd",
    colorName: "Blue",
    section: "BOYS",
    category: "Sets",
    ages: ["3–5 Years", "6–8 Years"],
    sizes: ["3–4Y", "4–5Y", "6–7Y"],
    available: true,
    image: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=760&q=85",
    image2: "https://images.unsplash.com/photo-1602030028438-4cf153cbae9e?auto=format&fit=crop&w=760&q=85"
  },
  {
    id: 10,
    slug: "weekend-polo-set",
    name: "Weekend Polo Set",
    price: 3650,
    color: "#7eb1a2",
    colorName: "Green",
    section: "BOYS",
    category: "Sets",
    ages: ["3–5 Years", "6–8 Years"],
    sizes: ["3–4Y", "4–5Y", "6–7Y"],
    available: true,
    image: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=760&q=85",
    image2: "https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=760&q=85"
  },
  {
    id: 11,
    slug: "sky-check-shirt",
    name: "Sky Check Shirt",
    price: 2250,
    color: "#83afd0",
    colorName: "Blue",
    section: "BOYS",
    category: "Shirts",
    ages: ["3–5 Years", "6–8 Years"],
    sizes: ["3–4Y", "4–5Y", "6–7Y"],
    available: true,
    image: "https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=760&q=85",
    image2: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=760&q=85"
  },
  {
    id: 12,
    slug: "little-oxford-shirt",
    name: "Little Oxford Shirt",
    price: 2450,
    color: "#e4e8eb",
    colorName: "Grey",
    section: "BOYS",
    category: "Shirts",
    ages: ["3–5 Years", "6–8 Years"],
    sizes: ["3–4Y", "4–5Y", "6–7Y"],
    available: true,
    image: "https://images.unsplash.com/photo-1602030028438-4cf153cbae9e?auto=format&fit=crop&w=760&q=85",
    image2: "https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=760&q=85"
  },
  {
    id: 13,
    slug: "comfy-chino-pants",
    name: "Comfy Chino Pants",
    price: 2650,
    color: "#c6ae82",
    colorName: "Beige",
    section: "BOYS",
    category: "Pants",
    ages: ["3–5 Years", "6–8 Years"],
    sizes: ["3–4Y", "4–5Y", "6–7Y"],
    available: true,
    image: "https://images.unsplash.com/photo-1607453998774-d533f65dac99?auto=format&fit=crop&w=760&q=85",
    image2: "https://images.unsplash.com/photo-1602030028438-4cf153cbae9e?auto=format&fit=crop&w=760&q=85"
  },
  {
    id: 14,
    slug: "playday-cargo-pants",
    name: "Playday Cargo Pants",
    price: 2850,
    color: "#7c8d72",
    colorName: "Green",
    section: "BOYS",
    category: "Pants",
    ages: ["3–5 Years", "6–8 Years"],
    sizes: ["3–4Y", "4–5Y", "6–7Y"],
    available: true,
    image: "https://images.unsplash.com/photo-1602030028438-4cf153cbae9e?auto=format&fit=crop&w=760&q=85",
    image2: "https://images.unsplash.com/photo-1607453998774-d533f65dac99?auto=format&fit=crop&w=760&q=85"
  },
  {
    id: 15,
    slug: "junior-blazer-set",
    name: "Junior Blazer Set",
    price: 6850,
    color: "#596675",
    colorName: "Grey",
    section: "BOYS",
    category: "Formal",
    ages: ["6–8 Years", "9–12 Years"],
    sizes: ["6–7Y", "8–9Y", "10–11Y"],
    available: true,
    image: "https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=760&q=85",
    image2: "https://images.unsplash.com/photo-1602030028438-4cf153cbae9e?auto=format&fit=crop&w=760&q=85"
  },
  {
    id: 16,
    slug: "celebration-waistcoat-set",
    name: "Celebration Waistcoat Set",
    price: 6250,
    color: "#234e6e",
    colorName: "Blue",
    section: "BOYS",
    category: "Formal",
    ages: ["6–8 Years", "9–12 Years"],
    sizes: ["6–7Y", "8–9Y", "10–11Y"],
    available: true,
    image: "https://images.unsplash.com/photo-1602030028438-4cf153cbae9e?auto=format&fit=crop&w=760&q=85",
    image2: "https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=760&q=85"
  },
  {
    id: 17,
    slug: "moonlight-kurta-set",
    name: "Moonlight Kurta Set",
    price: 5250,
    color: "#365b86",
    colorName: "Blue",
    section: "BOYS",
    category: "Traditional",
    ages: ["3–5 Years", "6–8 Years"],
    sizes: ["3–4Y", "4–5Y", "6–7Y"],
    available: true,
    image: "https://images.unsplash.com/photo-1599443015574-be5fe8a05783?auto=format&fit=crop&w=760&q=85",
    image2: "https://images.unsplash.com/photo-1602030028438-4cf153cbae9e?auto=format&fit=crop&w=760&q=85"
  },
  {
    id: 18,
    slug: "little-prince-shalwar-kameez",
    name: "Little Prince Shalwar Kameez",
    price: 4950,
    color: "#e0d2b0",
    colorName: "Beige",
    section: "BOYS",
    category: "Traditional",
    ages: ["3–5 Years", "6–8 Years"],
    sizes: ["3–4Y", "4–5Y", "6–7Y"],
    available: true,
    image: "https://images.unsplash.com/photo-1599443015574-be5fe8a05783?auto=format&fit=crop&w=760&q=85",
    image2: "https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=760&q=85"
  },
  {
    id: 19,
    slug: "daisy-play-set",
    name: "Daisy Play Set",
    price: 3650,
    old: 4100,
    badge: "SALE",
    color: "#b2d7b0",
    colorName: "Green",
    section: "GIRLS",
    category: "Sets",
    ages: ["3–5 Years", "6–8 Years"],
    sizes: ["3–4Y", "4–5Y", "6–7Y"],
    available: true,
    image: "https://images.unsplash.com/photo-1607453998774-d533f65dac99?auto=format&fit=crop&w=760&q=85",
    image2: "https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=760&q=85"
  },
  {
    id: 20,
    slug: "little-linen-coord",
    name: "Little Linen Co-ord",
    price: 5150,
    color: "#e6bd77",
    colorName: "Beige",
    section: "GIRLS",
    category: "Sets",
    ages: ["3–5 Years", "6–8 Years"],
    sizes: ["3–4Y", "4–5Y", "6–7Y"],
    available: true,
    image: "https://images.unsplash.com/photo-1607453998774-d533f65dac99?auto=format&fit=crop&w=760&q=85",
    image2: "https://images.unsplash.com/photo-1602030028438-4cf153cbae9e?auto=format&fit=crop&w=760&q=85"
  },
  {
    id: 21,
    slug: "ruffle-collar-shirt",
    name: "Ruffle Collar Shirt",
    price: 2350,
    color: "#edb7c7",
    colorName: "Pink",
    section: "GIRLS",
    category: "Shirts",
    ages: ["3–5 Years", "6–8 Years"],
    sizes: ["3–4Y", "4–5Y", "6–7Y"],
    available: true,
    image: "https://images.unsplash.com/photo-1560506840-ec148e82a604?auto=format&fit=crop&w=760&q=85",
    image2: "https://images.unsplash.com/photo-1519238360530-d9c7b1f8003c?auto=format&fit=crop&w=760&q=85"
  },
  {
    id: 22,
    slug: "sunshine-tunic-shirt",
    name: "Sunshine Tunic Shirt",
    price: 2450,
    color: "#f2cc58",
    colorName: "Yellow",
    section: "GIRLS",
    category: "Shirts",
    ages: ["3–5 Years", "6–8 Years"],
    sizes: ["3–4Y", "4–5Y", "6–7Y"],
    available: true,
    image: "https://images.unsplash.com/photo-1519238360530-d9c7b1f8003c?auto=format&fit=crop&w=760&q=85",
    image2: "https://images.unsplash.com/photo-1560506840-ec148e82a604?auto=format&fit=crop&w=760&q=85"
  },
  {
    id: 23,
    slug: "soft-twill-pants",
    name: "Soft Twill Pants",
    price: 2550,
    color: "#cda98f",
    colorName: "Beige",
    section: "GIRLS",
    category: "Pants",
    ages: ["3–5 Years", "6–8 Years"],
    sizes: ["3–4Y", "4–5Y", "6–7Y"],
    available: true,
    image: "https://images.unsplash.com/photo-1607453998774-d533f65dac99?auto=format&fit=crop&w=760&q=85",
    image2: "https://images.unsplash.com/photo-1602030028438-4cf153cbae9e?auto=format&fit=crop&w=760&q=85"
  },
  {
    id: 24,
    slug: "weekend-wide-leg-pants",
    name: "Weekend Wide-Leg Pants",
    price: 2750,
    color: "#b6b0d6",
    colorName: "Purple",
    section: "GIRLS",
    category: "Pants",
    ages: ["6–8 Years", "9–12 Years"],
    sizes: ["6–7Y", "8–9Y", "10–11Y"],
    available: true,
    image: "https://images.unsplash.com/photo-1602030028438-4cf153cbae9e?auto=format&fit=crop&w=760&q=85",
    image2: "https://images.unsplash.com/photo-1607453998774-d533f65dac99?auto=format&fit=crop&w=760&q=85"
  },
  {
    id: 25,
    slug: "sunday-garden-dress",
    name: "Sunday Garden Dress",
    price: 4450,
    old: 5200,
    badge: "SALE",
    color: "#ef9d9a",
    colorName: "Pink",
    section: "GIRLS",
    category: "Frocks",
    ages: ["3–5 Years", "6–8 Years"],
    sizes: ["3–4Y", "4–5Y", "5–6Y"],
    available: true,
    image: "https://images.unsplash.com/photo-1519238360530-d9c7b1f8003c?auto=format&fit=crop&w=760&q=85",
    image2: "https://images.unsplash.com/photo-1560506840-ec148e82a604?auto=format&fit=crop&w=760&q=85"
  },
  {
    id: 26,
    slug: "storybook-party-frock",
    name: "Storybook Party Frock",
    price: 5450,
    old: 6100,
    badge: "SALE",
    color: "#d9a9c4",
    colorName: "Pink",
    section: "GIRLS",
    category: "Frocks",
    ages: ["3–5 Years", "6–8 Years"],
    sizes: ["3–4Y", "4–5Y", "5–6Y"],
    available: true,
    image: "https://images.unsplash.com/photo-1560506840-ec148e82a604?auto=format&fit=crop&w=760&q=85",
    image2: "https://images.unsplash.com/photo-1519238360530-d9c7b1f8003c?auto=format&fit=crop&w=760&q=85"
  },
  {
    id: 27,
    slug: "celebration-tulle-dress",
    name: "Celebration Tulle Dress",
    price: 5950,
    old: 6900,
    badge: "SALE",
    color: "#e8b7c8",
    colorName: "Pink",
    section: "GIRLS",
    category: "Formal",
    ages: ["6–8 Years", "9–12 Years"],
    sizes: ["6–7Y", "8–9Y", "10–11Y"],
    available: true,
    image: "https://images.unsplash.com/photo-1560506840-ec148e82a604?auto=format&fit=crop&w=760&q=85",
    image2: "https://images.unsplash.com/photo-1519238360530-d9c7b1f8003c?auto=format&fit=crop&w=760&q=85"
  },
  {
    id: 28,
    slug: "pearl-bow-dress",
    name: "Pearl Bow Dress",
    price: 6250,
    color: "#f1e6dc",
    colorName: "Beige",
    section: "GIRLS",
    category: "Formal",
    ages: ["6–8 Years", "9–12 Years"],
    sizes: ["6–7Y", "8–9Y", "10–11Y"],
    available: true,
    image: "https://images.unsplash.com/photo-1519238360530-d9c7b1f8003c?auto=format&fit=crop&w=760&q=85",
    image2: "https://images.unsplash.com/photo-1560506840-ec148e82a604?auto=format&fit=crop&w=760&q=85"
  },
  {
    id: 29,
    slug: "noor-embroidered-suit",
    name: "Noor Embroidered Suit",
    price: 5350,
    color: "#8ab0a0",
    colorName: "Green",
    section: "GIRLS",
    category: "Traditional",
    ages: ["3–5 Years", "6–8 Years"],
    sizes: ["3–4Y", "4–5Y", "6–7Y"],
    available: true,
    image: "https://images.unsplash.com/photo-1599443015574-be5fe8a05783?auto=format&fit=crop&w=760&q=85",
    image2: "https://images.unsplash.com/photo-1560506840-ec148e82a604?auto=format&fit=crop&w=760&q=85"
  },
  {
    id: 30,
    slug: "rose-kurta-trouser",
    name: "Rose Kurta Trouser",
    price: 5150,
    color: "#d18e9e",
    colorName: "Pink",
    section: "GIRLS",
    category: "Traditional",
    ages: ["3–5 Years", "6–8 Years"],
    sizes: ["3–4Y", "4–5Y", "6–7Y"],
    available: true,
    image: "https://images.unsplash.com/photo-1599443015574-be5fe8a05783?auto=format&fit=crop&w=760&q=85",
    image2: "https://images.unsplash.com/photo-1519238360530-d9c7b1f8003c?auto=format&fit=crop&w=760&q=85"
  },
  {
    id: 31,
    slug: "sunny-cotton-set",
    name: "Sunny Cotton Set",
    price: 3350,
    badge: "NEW",
    color: "#f2c84b",
    colorName: "Yellow",
    section: "SUMMER",
    category: "Summer",
    ages: ["3–5 Years", "6–8 Years"],
    sizes: ["3–4Y", "4–5Y", "6–7Y"],
    available: true,
    image: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=760&q=85",
    image2: "https://images.unsplash.com/photo-1607453998774-d533f65dac99?auto=format&fit=crop&w=760&q=85"
  },
  {
    id: 32,
    slug: "breezy-linen-dress",
    name: "Breezy Linen Dress",
    price: 4250,
    color: "#e7c89a",
    colorName: "Beige",
    section: "SUMMER",
    category: "Summer",
    ages: ["3–5 Years", "6–8 Years"],
    sizes: ["3–4Y", "4–5Y", "6–7Y"],
    available: true,
    image: "https://images.unsplash.com/photo-1519238360530-d9c7b1f8003c?auto=format&fit=crop&w=760&q=85",
    image2: "https://images.unsplash.com/photo-1560506840-ec148e82a604?auto=format&fit=crop&w=760&q=85"
  },
  {
    id: 33,
    slug: "cozy-knit-set",
    name: "Cozy Knit Set",
    price: 4550,
    color: "#b68e76",
    colorName: "Beige",
    section: "WINTER",
    category: "Winter",
    ages: ["3–5 Years", "6–8 Years"],
    sizes: ["3–4Y", "4–5Y", "6–7Y"],
    available: true,
    image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=760&q=85",
    image2: "https://images.unsplash.com/photo-1602030028438-4cf153cbae9e?auto=format&fit=crop&w=760&q=85"
  },
  {
    id: 34,
    slug: "snowday-hoodie-set",
    name: "Snowday Hoodie Set",
    price: 4750,
    badge: "NEW",
    color: "#8797b4",
    colorName: "Blue",
    section: "WINTER",
    category: "Winter",
    ages: ["6–8 Years", "9–12 Years"],
    sizes: ["6–7Y", "8–9Y", "10–11Y"],
    available: true,
    image: "https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=760&q=85",
    image2: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=760&q=85"
  },
  {
    id: 35,
    slug: "cloud-pocket-set",
    name: "Cloud Pocket Set",
    price: 3950,
    badge: "NEW",
    color: "#99c9dc",
    colorName: "Blue",
    section: "NEW ARRIVALS",
    category: "New Arrivals",
    ages: ["0–2 Years", "3–5 Years"],
    sizes: ["2–3Y", "3–4Y", "4–5Y"],
    available: true,
    image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=760&q=85",
    image2: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=760&q=85"
  },
  {
    id: 36,
    slug: "fresh-bloom-coord",
    name: "Fresh Bloom Co-ord",
    price: 4150,
    badge: "NEW",
    color: "#e0a7b9",
    colorName: "Pink",
    section: "NEW ARRIVALS",
    category: "New Arrivals",
    ages: ["3–5 Years", "6–8 Years"],
    sizes: ["3–4Y", "4–5Y", "6–7Y"],
    available: true,
    image: "https://images.unsplash.com/photo-1607453998774-d533f65dac99?auto=format&fit=crop&w=760&q=85",
    image2: "https://images.unsplash.com/photo-1560506840-ec148e82a604?auto=format&fit=crop&w=760&q=85"
  },
  {
    id: 37,
    slug: "sweetheart-party-dress",
    name: "Sweetheart Party Dress",
    price: 3990,
    old: 5250,
    badge: "SALE",
    color: "#de8eaa",
    colorName: "Pink",
    section: "SALE",
    category: "Sale",
    ages: ["3–5 Years", "6–8 Years"],
    sizes: ["3–4Y", "4–5Y", "6–7Y"],
    available: true,
    image: "https://images.unsplash.com/photo-1560506840-ec148e82a604?auto=format&fit=crop&w=760&q=85",
    image2: "https://images.unsplash.com/photo-1519238360530-d9c7b1f8003c?auto=format&fit=crop&w=760&q=85"
  },
  {
    id: 38,
    slug: "everyday-denim-set",
    name: "Everyday Denim Set",
    price: 3290,
    old: 4150,
    badge: "SALE",
    color: "#6e8fa9",
    colorName: "Blue",
    section: "SALE",
    category: "Sale",
    ages: ["3–5 Years", "6–8 Years"],
    sizes: ["3–4Y", "4–5Y", "6–7Y"],
    available: true,
    image: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=760&q=85",
    image2: "https://images.unsplash.com/photo-1602030028438-4cf153cbae9e?auto=format&fit=crop&w=760&q=85"
  },
]


type CatalogState = {
  products: Product[]
  loading: boolean
  error: string
  refresh: () => Promise<void>
}

const CatalogContext = createContext<CatalogState>({ products: fallbackProducts, loading: true, error: "", refresh: async () => {} })
const useCatalog = () => useContext(CatalogContext)

function productNumericId(shopifyId: string) {
  const numeric = Number(shopifyId.split("/").pop())
  if (Number.isSafeInteger(numeric)) return numeric
  let hash = 0
  for (let index = 0; index < shopifyId.length; index += 1) hash = ((hash << 5) - hash + shopifyId.charCodeAt(index)) | 0
  return Math.abs(hash)
}

function ageGroupsFromSizes(sizes: string[]) {
  const groups = new Set<string>()
  sizes.forEach((size) => {
    const text = size.toLowerCase()
    if (/month|\bm\b|\d+m/.test(text)) groups.add("0–2 Years")
    const years = [...text.matchAll(/(\d+)\s*(?:-|–|to)?\s*(\d+)?\s*y/g)].flatMap((match) => [Number(match[1]), Number(match[2] || match[1])])
    years.forEach((year) => {
      if (year <= 2) groups.add("0–2 Years")
      else if (year <= 5) groups.add("3–5 Years")
      else if (year <= 8) groups.add("6–8 Years")
      else groups.add("9–12 Years")
    })
  })
  return [...groups]
}

function colorHex(name: string) {
  const colors: Record<string, string> = {
    pink: "#e7a7bd", blue: "#83afd0", green: "#7eb1a2", beige: "#c9b18a",
    purple: "#a58ac7", yellow: "#f0cd55", orange: "#e8a27f", grey: "#aab2bd",
    gray: "#aab2bd", red: "#d77f7f", black: "#252525", white: "#f4f4f4",
  }
  return colors[name.toLowerCase()] || "#c9d2dc"
}

function mapShopifyProduct(raw: any): Product {
  const collectionTitles: string[] = Array.isArray(raw?.collectionTitles) ? raw.collectionTitles : []
  const facets = getFacets({ collections: collectionTitles })
  // Section/category come from the shared collection parser so breadcrumbs, filters and Home cards always agree.
  const { section, category } = deriveSectionAndCategory(collectionTitles)
  const rawVariants = Array.isArray(raw?.variants) ? raw.variants : []
  const shopifyVariants: ShopifyProductVariant[] = rawVariants.map((variant: any) => {
    const options = variant?.options || {}
    const size = options.Size || options.size || options.Age || options.age || (variant.title && variant.title !== "Default Title" ? variant.title : "One Size")
    const color = options.Color || options.Colour || options.color || options.colour || null
    return {
      id: String(variant.id),
      size: String(size),
      color: color ? String(color) : null,
      price: Number(variant.price) || Number(raw.price) || 0,
      compareAtPrice: variant.compareAtPrice && Number(variant.compareAtPrice) > 0 ? Number(variant.compareAtPrice) : null,
      inventoryQuantity: Math.max(0, Number(variant.inventoryQuantity) || 0),
      availableForSale: Boolean(variant.availableForSale),
    }
  })
  const sizes = [...new Set(shopifyVariants.map((variant) => variant.size))]
  const colorNames = [...new Set(shopifyVariants.map((variant) => variant.color).filter(Boolean))] as string[]
  const colorName = colorNames[0] || "Default"
  const images: string[] = Array.isArray(raw?.images) ? raw.images.filter(Boolean) : []
  const image = images[0] || "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=760&q=85"
  return {
    id: productNumericId(String(raw.id)),
    slug: String(raw.handle || "product"),
    name: String(raw.title || "Product"),
    price: Number(raw.price) || 0,
    old: raw.compareAtPrice && Number(raw.compareAtPrice) > Number(raw.price) ? Number(raw.compareAtPrice) : undefined,
    badge: raw.onSale || facets.sale ? "SALE" : facets.newArrivals ? "NEW" : undefined,
    color: colorHex(colorName),
    colorName,
    colorNames,
    section,
    category,
    ages: ageGroupsFromSizes(sizes),
    sizes: sizes.length ? sizes : ["One Size"],
    available: shopifyVariants.some((variant) => variant.availableForSale && variant.inventoryQuantity > 0),
    totalInventory: shopifyVariants.reduce((sum, variant) => sum + Math.max(0, variant.inventoryQuantity), 0),
    images: images.length ? images : [image],
    image,
    image2: images[1] || image,
    shopifyProductId: String(raw.id),
    shopifyVariants,
    collections: collectionTitles,
    description: String(raw.description || ""),
  }
}

// Shopify CDN resizes images on the fly via ?width=. Serving right-sized files is the biggest image speed-up.
function shopifyImg(url: string | undefined, width: number) {
  if (!url || !/cdn\.shopify\.com/.test(url)) return url || ""
  return `${url}${url.includes("?") ? "&" : "?"}width=${width}`
}
function shopifySrcSet(url: string | undefined, widths: number[]) {
  if (!url || !/cdn\.shopify\.com/.test(url)) return undefined
  return widths.map((w) => `${shopifyImg(url, w)} ${w}w`).join(", ")
}

function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const lastRefresh = useRef(0)
  const CACHE_KEY = "cb_shopify_catalog_v3"

  const refresh = async () => {
    try {
      const data = await api(`/api/shopify/products?limit=100`)
      const mapped: Product[] = (data.products || []).map(mapShopifyProduct)
      setProducts(mapped)
      setError(mapped.length ? "" : "No active Shopify products were returned.")
      lastRefresh.current = Date.now()
      // Warm the first visible product images while the intro animation is still on screen.
      const warm = () => mapped.slice(0, 8).forEach((product) => {
        if (!product.image) return
        const image = new Image()
        image.decoding = "async"
        image.src = shopifyImg(product.image, 640)
      })
      if ("requestIdleCallback" in window) (window as any).requestIdleCallback(warm, { timeout: 700 })
      else globalThis.setTimeout(warm, 0)
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), products: data.products || [] }))
      } catch {}
    } catch (err: any) {
      console.error(err)
      setError(err?.message || "Could not load Shopify products")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let usedCache = false
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null")
      if (cached?.products?.length) {
        setProducts(cached.products.map(mapShopifyProduct))
        setLoading(false)
        usedCache = true
        lastRefresh.current = Number(cached.at) || 0
      }
    } catch {}
    if (!usedCache) setLoading(true)
    // Cache is fresh enough: skip the network call entirely. Otherwise refresh quietly in the background.
    if (!usedCache || Date.now() - lastRefresh.current > 30_000) void refresh()

    const refreshIfStale = () => {
      if (document.visibilityState === "visible" && Date.now() - lastRefresh.current > 60_000) void refresh()
    }
    window.addEventListener("focus", refreshIfStale)
    document.addEventListener("visibilitychange", refreshIfStale)
    return () => {
      window.removeEventListener("focus", refreshIfStale)
      document.removeEventListener("visibilitychange", refreshIfStale)
    }
  }, [])

  return <CatalogContext.Provider value={{ products, loading, error, refresh }}>{children}</CatalogContext.Provider>
}

type CartLine = { product: Product; quantity: number; size: string }
type Store = {
  cartItems: CartLine[]
  cartCount: number
  add: (product?: Product, quantity?: number, size?: string) => void
  updateQuantity: (id: number, size: string, quantity: number) => void
  remove: (id: number, size: string) => void
  liked: number[]
  toggleLike: (id: number) => void
  toast: string
  refreshCart: () => Promise<void>
}

const StoreContext = createContext<Store | null>(null)
const useStore = () => useContext(StoreContext)!
const money = (price: number) => `PKR ${price.toLocaleString()}`

function productBySlug(products: Product[], slug: string) {
  return products.find((product) => product.slug === slug)
}



const shopifyVariantForSize = (product: Product, size: string) =>
  product.shopifyVariants?.find((variant) => variant.size === size && variant.availableForSale && variant.inventoryQuantity > 0) ||
  product.shopifyVariants?.find((variant) => variant.size === size) ||
  product.shopifyVariants?.[0]


function cartLinePricing(product: Product, size: string, quantity = 1) {
  const variant = shopifyVariantForSize(product, size)
  const currentUnit = variant?.price ?? product.price
  const compareAtCandidate = variant?.compareAtPrice ?? product.old ?? null
  const originalUnit = compareAtCandidate && compareAtCandidate > currentUnit ? compareAtCandidate : currentUnit
  return {
    currentUnit,
    originalUnit,
    currentTotal: currentUnit * quantity,
    originalTotal: originalUnit * quantity,
    savings: Math.max(0, (originalUnit - currentUnit) * quantity),
  }
}

function cartPricing(lines: CartLine[]) {
  return lines.reduce((totals, line) => {
    const price = cartLinePricing(line.product, line.size, line.quantity)
    totals.currentSubtotal += price.currentTotal
    totals.originalSubtotal += price.originalTotal
    totals.saleSavings += price.savings
    return totals
  }, { currentSubtotal: 0, originalSubtotal: 0, saleSavings: 0 })
}

function StoreProvider({ children }: { children: React.ReactNode }) {
  const { products, loading: catalogLoading } = useCatalog()
  const [cartItems, setCartItems] = useState<CartLine[]>([])
  const [liked, setLiked] = useState<number[]>([])
  const [toast, setToast] = useState("")
  const quantityTimers = useRef<Record<string, number>>({})
  const cartCount = cartItems.reduce((sum, line) => sum + line.quantity, 0)

  const notify = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(""), 2400)
  }

  const refreshCart = async () => {
    try {
      const data = await api("/api/cart")
      const lines: CartLine[] = (data.items || []).flatMap((row: any) => {
        const slug = row?.product_variants?.products?.slug
        const product = productBySlug(products, slug)
        return product ? [{ product, quantity: Number(row.quantity) || 1, size: row?.product_variants?.size || product.sizes[0] }] : []
      })
      setCartItems(lines)
    } catch (error: any) {
      if (error?.status !== 401) console.error(error)
    }
  }

  const refreshWishlist = async () => {
    try {
      const data = await api("/api/wishlist")
      const ids = (data.items || []).flatMap((row: any) => {
        const product = productBySlug(products, row?.products?.slug)
        return product ? [product.id] : []
      })
      setLiked(ids)
    } catch (error: any) {
      if (error?.status !== 401) console.error(error)
    }
  }

  const hydratedStore = useRef(false)
  useEffect(() => {
    if (catalogLoading || !products.length || hydratedStore.current) return
    hydratedStore.current = true
    void refreshCart()
    void refreshWishlist()
  }, [catalogLoading, products.length])


const add = (product?: Product, quantity = 1, size?: string) => {
  if (!product) return
  const selectedSize = size || product.sizes[0]
  const shopifyVariant = shopifyVariantForSize(product, selectedSize)
  setCartItems((items) => {
    const line = items.find((item) => item.product.id === product.id && item.size === selectedSize)
    return line
      ? items.map((item) => item.product.id === product.id && item.size === selectedSize ? { ...item, quantity: item.quantity + quantity } : item)
      : [...items, { product, quantity, size: selectedSize }]
  })
  const body = shopifyVariant
    ? { shopifyVariantId: shopifyVariant.id, quantity }
    : { slug: product.slug, size: selectedSize, quantity }
  void api("/api/cart", { method: "POST", body: JSON.stringify(body) })
    .catch((error: any) => {
      notify(error?.message || "Could not update your bag")
      void refreshCart()
    })
  notify(`${product.name} · ${selectedSize} added to your bag`)
}

const updateQuantity = (id: number, size: string, quantity: number) => {
  const product = products.find((item) => item.id === id)
  if (!product) return
  const safeQuantity = Math.max(0, quantity)
  const shopifyVariant = shopifyVariantForSize(product, size)
  setCartItems((items) => safeQuantity < 1
    ? items.filter((item) => !(item.product.id === id && item.size === size))
    : items.map((item) => item.product.id === id && item.size === size ? { ...item, quantity: safeQuantity } : item))

  const key = `${product.slug}::${size}`
  if (quantityTimers.current[key]) window.clearTimeout(quantityTimers.current[key])
  quantityTimers.current[key] = window.setTimeout(() => {
    const body = shopifyVariant
      ? { shopifyVariantId: shopifyVariant.id, quantity: safeQuantity }
      : { slug: product.slug, size, quantity: safeQuantity }
    void api("/api/cart", { method: "PATCH", body: JSON.stringify(body) })
      .catch((error: any) => {
        notify(error?.message || "Could not update quantity")
        void refreshCart()
      })
    delete quantityTimers.current[key]
  }, 220)
}

const remove = (id: number, size: string) => {
  const product = products.find((item) => item.id === id)
  setCartItems((items) => items.filter((item) => !(item.product.id === id && item.size === size)))
  if (!product) return
  const shopifyVariant = shopifyVariantForSize(product, size)
  const url = shopifyVariant
    ? `/api/cart?shopifyVariantId=${encodeURIComponent(shopifyVariant.id)}`
    : `/api/cart?slug=${encodeURIComponent(product.slug)}&size=${encodeURIComponent(size)}`
  void api(url, { method: "DELETE" })
    .catch((error: any) => { notify(error?.message || "Could not remove item"); void refreshCart() })
}

const toggleLike = (id: number) => {
    const product = products.find((item) => item.id === id)
    if (!product) return
    const isLiked = liked.includes(id)
    setLiked((items) => isLiked ? items.filter((item) => item !== id) : [...items, id])
    void api(isLiked ? `/api/wishlist?slug=${encodeURIComponent(product.slug)}` : "/api/wishlist", {
      method: isLiked ? "DELETE" : "POST",
      body: isLiked ? undefined : JSON.stringify({ slug: product.slug }),
    }).catch((error: any) => {
      setLiked((items) => isLiked ? [...items, id] : items.filter((item) => item !== id))
      if (error?.status === 401) notify("Log in to save your wishlist")
      else if (error?.status === 404 && product.shopifyProductId) notify("This Shopify product could not be saved to your wishlist yet")
      else notify(error?.message || "Could not update wishlist")
    })
  }

  return (
    <StoreContext.Provider value={{ cartItems, cartCount, add, updateQuantity, remove, liked, toggleLike, toast, refreshCart }}>
      {children}
    </StoreContext.Provider>
  )
}

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="ChickButton home">
      <img src={logo} className="h-12 w-16 object-contain object-center" alt="ChickButton" />
      <span className="hidden text-xl font-black tracking-tight text-[#123e70] sm:block">
        Chick<span className="text-[#eaa913]">Button</span>
      </span>
    </Link>
  )
}

function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { cartItems, cartCount, updateQuantity, remove } = useStore()
  const subtotal = cartItems.reduce((sum, line) => sum + line.product.price * line.quantity, 0)
  useEffect(() => {
    if (!open) return
    const close = (event: KeyboardEvent) => event.key === "Escape" && onClose()
    window.addEventListener("keydown", close)
    return () => window.removeEventListener("keydown", close)
  }, [open, onClose])

  return (
    <div className={`drawer-layer ${open ? "is-open" : ""}`} aria-hidden={!open}>
      <button className="drawer-scrim" onClick={onClose} aria-label="Close shopping bag" tabIndex={open ? 0 : -1} />
      <aside className="cart-drawer" role="dialog" aria-modal="true" aria-label="Shopping bag">
        <div className="drawer-head">
          <div><p className="eyebrow">Your bag</p><h2>{cartCount} {cartCount === 1 ? "item" : "items"}</h2></div>
          <button className="drawer-close" onClick={onClose} aria-label="Close shopping bag">×</button>
        </div>
        <div className="drawer-body">
          {cartItems.length ? (
            cartItems.map(({ product, quantity, size }) => (
              <div className="drawer-item" key={`${product.id}-${size}`}>
                <img src={shopifyImg(product.image, 240)} alt={product.name} loading="lazy" decoding="async" />
                <div className="min-w-0 flex-1">
                  <h3>{product.name}</h3>
                  <p>Size {size} · {(shopifyVariantForSize(product, size)?.inventoryQuantity || 0) > 0 ? "In stock" : "Out of stock"}</p>
                  <strong>{money(product.price * quantity)}</strong>
                  <div className="drawer-item-actions">
                    <div className="quantity compact">
                      <button onClick={() => updateQuantity(product.id, size, quantity - 1)}>−</button>
                      <b>{quantity}</b>
                      <button onClick={() => updateQuantity(product.id, size, quantity + 1)}>+</button>
                    </div>
                    <button className="remove-link" onClick={() => remove(product.id, size)}>Remove</button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="drawer-empty"><span>Bag</span><h3>Your bag is empty</h3><p>Beautiful little things are waiting.</p></div>
          )}
        </div>
        <div className="drawer-foot">
          <div><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
          <p>Delivery and discounts are calculated at checkout.</p>
          <Link to="/checkout" onClick={onClose} className={`button-primary w-full ${!cartItems.length ? "pointer-events-none opacity-50" : ""}`}>
            Checkout <span>→</span>
          </Link>
          <Link to="/cart" onClick={onClose} className="button-secondary w-full">View shopping bag</Link>
        </div>
      </aside>
    </div>
  )
}

const authCache: { value: boolean | null; promise: Promise<boolean> | null } = { value: null, promise: null }

const categoryGroups = [
  { title: "BABY", items: ["Baby Boys", "Baby Girls", "Baby Sets", "Baby Frocks"], facet: "baby" },
  { title: "BOYS", items: ["Sets", "Shirts", "Pants", "Formal", "Traditional"], facet: "boysSection" },
  { title: "GIRLS", items: ["Sets", "Shirts", "Pants", "Frocks", "Formal", "Traditional"], facet: "girlsSection" },
] as const
const seasonalCategories = ["Summer", "Winter", "New Arrivals", "Sale"] as const
const categoryPath = (group: string, item: string) => group === "BABY"
  ? `/shop?category=${encodeURIComponent(item)}`
  : `/shop?section=${encodeURIComponent(group)}&category=${encodeURIComponent(item)}`
const seasonalCategoryPath = (item: string) => item === "New Arrivals" ? "/shop?new=1" : item === "Sale" ? "/shop?sale=1" : `/shop?category=${encodeURIComponent(item)}`

function Header() {
  const { cartCount } = useStore()
  const { announcement } = useSiteContent()
  const [menuOpen, setMenuOpen] = useState(false)
  const [shopCategoriesOpen, setShopCategoriesOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const searchInputRef = useRef<HTMLInputElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const mobileShopRef = useRef<HTMLButtonElement>(null)
  const drawerCloseRef = useRef<HTMLButtonElement>(null)
  const menuPanelRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const shopParams = new URLSearchParams(location.search)
  const saleActive = location.pathname === "/shop" && shopParams.get("sale") === "1"
  const newActive = location.pathname === "/shop" && !saleActive && shopParams.get("new") === "1"
  const navItems = [
    { label: "Home", to: "/", active: location.pathname === "/", kind: "" },
    { label: "Shop", to: "/shop", active: location.pathname === "/shop" && !saleActive && !newActive, kind: "" },
    { label: "Categories", to: "/categories", active: location.pathname === "/categories", kind: "" },
    { label: "New Arrivals", to: "/shop?new=1", active: newActive, kind: "new" },
    { label: "Sale", to: "/shop?sale=1", active: saleActive, kind: "sale" },
  ]
  const path = location.pathname
  const headerMode = path === "/cart" ? "cart"
    : path === "/checkout" ? "checkout"
    : path === "/order-success" ? "success"
    : path === "/account" ? "account"
    : path === "/wishlist" ? "wishlist"
    : path.startsWith("/info/") ? "info"
    : path === "/shop" || path === "/categories" || path.startsWith("/product/") ? "shop"
    : "home"
  const showMenu = headerMode === "home" || headerMode === "shop" || headerMode === "info"
  const showMainNav = showMenu
  const showMobileNav = headerMode === "home" || headerMode === "shop"
  const menuNavItems = headerMode === "info" ? navItems.slice(0, 3) : navItems

  const closeMenu = (restoreFocus = true) => {
    const focusTarget = shopCategoriesOpen ? mobileShopRef.current || menuButtonRef.current : menuButtonRef.current
    setMenuOpen(false)
    setShopCategoriesOpen(false)
    if (restoreFocus) window.requestAnimationFrame(() => focusTarget?.focus())
  }

  const openShopCategories = () => {
    setShopCategoriesOpen(true)
    setMenuOpen(true)
  }

  useEffect(() => {
    if (authCache.value !== null) { setAuthenticated(authCache.value); return }
    if (!authCache.promise) authCache.promise = api("/api/auth/me").then((data) => Boolean(data?.user)).catch(() => false)
    let alive = true
    void authCache.promise.then((value) => { authCache.value = value; if (alive) setAuthenticated(value) })
    return () => { alive = false }
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    drawerCloseRef.current?.focus()
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") { closeMenu(); return }
      if (event.key !== "Tab") return
      const panel = menuPanelRef.current
      if (!panel) return
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'))
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && (document.activeElement === first || !panel.contains(document.activeElement))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (document.activeElement === last || !panel.contains(document.activeElement))) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener("keydown", close)
    return () => window.removeEventListener("keydown", close)
  }, [menuOpen, shopCategoriesOpen])

  useEffect(() => {
    if (!menuOpen || !shopCategoriesOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = previousOverflow }
  }, [menuOpen, shopCategoriesOpen])

  const logout = async () => {
    await api("/api/auth/logout", { method: "POST" }).catch(() => null); authCache.value = null; authCache.promise = null
    setAuthenticated(false)
    setMenuOpen(false)
    window.history.replaceState(null, "", "/")
    window.location.replace("/")
  }

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault()
    const q = searchTerm.trim()
    if (!q) return
    navigate(`/shop?q=${encodeURIComponent(q)}`)
  }

  return (
    <>
      <div className="cb-announcement">
        <span>{announcement.primary}</span><span className="cb-announcement-dot" aria-hidden="true">•</span><span>{announcement.secondary}</span>
      </div>
      <header className={`cb-site-header cb-site-header--${headerMode}${showMenu ? "" : " cb-site-header--compact"}`}>
        <div className="cb-header-inner">
          <div className="cb-header-left">
            {showMenu && <button ref={menuButtonRef} type="button" onClick={() => { setShopCategoriesOpen(false); setMenuOpen(true) }} className="cb-header-icon cb-menu-button" aria-label="Open menu" aria-expanded={menuOpen} aria-controls="store-menu">
              <svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M5 9h22M5 16h22M5 23h22" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg>
            </button>}
            {headerMode === "cart" && <Link className="cb-header-context-link" to="/shop"><span className="cb-context-long">← Continue shopping</span><span className="cb-context-short">← Shop</span></Link>}
            {headerMode === "checkout" && <Link className="cb-header-context-link" to="/cart"><span className="cb-context-long">← Back to Cart</span><span className="cb-context-short">← Cart</span></Link>}
            {headerMode === "success" && <Link className="cb-header-context-link" to="/shop"><span className="cb-context-long">← Continue shopping</span><span className="cb-context-short">← Shop</span></Link>}
            {headerMode === "wishlist" && <Link className="cb-header-context-link" to="/shop">← Shop</Link>}
            {headerMode === "account" && <div className="cb-header-context-links"><Link className="cb-header-context-link" to="/">Home</Link><Link className="cb-header-context-link" to="/shop">Shop</Link></div>}
          </div>
          <Link to="/" className="cb-header-brand" aria-label="ChickButton home">
            <img src={logo} alt="ChickButton — Little Styles, Big Smiles" />
          </Link>
          <div className="cb-header-actions">
            {headerMode === "shop" && <form onSubmit={submitSearch} className="cb-header-search" role="search">
              <label className="sr-only" htmlFor="cb-product-search">Search products</label>
              <input id="cb-product-search" ref={searchInputRef} value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search for kids fashion, outfits & more..." />
              <button type="submit" aria-label="Search products">
                <svg viewBox="0 0 28 28" fill="none" aria-hidden="true"><circle cx="12.5" cy="12.5" r="8" stroke="currentColor" strokeWidth="1.8" /><path d="m18.5 18.5 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
              </button>
            </form>}
            <div className="cb-header-controls">
              {headerMode === "shop" && <Link className="cb-header-action cb-wishlist-action" to="/wishlist" aria-label="Wishlist">
                <svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M16 27s-11-6.7-11-14.4a6.3 6.3 0 0 1 11-4.1 6.3 6.3 0 0 1 11 4.1C27 20.3 16 27 16 27Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg>
                <span className="cb-header-action-label">Wish</span>
              </Link>}
              {(headerMode === "shop" || headerMode === "wishlist" || headerMode === "cart") && <Link className="cb-header-action cb-account-action" to={authenticated ? "/account" : "/login"} aria-label={authenticated ? "Account" : "Log in"}>
                <svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><circle cx="16" cy="10" r="5" stroke="currentColor" strokeWidth="2" /><path d="M6 27c.8-6 4.4-9 10-9s9.2 3 10 9H6Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg>
                {headerMode === "shop" && <span className="cb-header-action-label" aria-hidden="true">Account</span>}
              </Link>}
              {(headerMode === "shop" || headerMode === "wishlist" || headerMode === "account") && <button type="button" className="cb-header-action cb-cart-action" onClick={() => setCartOpen(true)} aria-label={`Open cart with ${cartCount} items`}>
                <svg viewBox="0 0 36 36" fill="none" aria-hidden="true"><path d="M4 6h4l3.2 18h18l3-13H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><circle cx="14" cy="29" r="2" stroke="currentColor" strokeWidth="2" /><circle cx="27" cy="29" r="2" stroke="currentColor" strokeWidth="2" /></svg>
                <span className="cb-cart-count">{cartCount}</span>
                {headerMode === "shop" && <span className="cb-header-action-label" aria-hidden="true">Cart</span>}
              </button>}
            </div>
            {headerMode === "checkout" && <span className="cb-header-status">Secure Checkout</span>}
          </div>
        </div>
        {showMainNav && <nav className="cb-header-nav" aria-label="Primary navigation">
          {menuNavItems.map(({ label, to, active, kind }) => (
            <Link
              key={label}
              to={to}
              aria-current={active ? "page" : undefined}
              className={`cb-header-nav-link relative inline-flex min-h-10 items-center justify-center whitespace-nowrap rounded-full border px-4 py-2 text-[.82rem] font-extrabold tracking-[.02em]${kind ? ` cb-header-nav-${kind}` : ""}${active ? " is-active" : ""}`}
            >{label}</Link>
          ))}
        </nav>}
        {showMobileNav && <nav className="cb-mobile-nav" aria-label="Mobile store navigation">
          {navItems.map(({ label, to, active, kind }) => label === "Shop" ? (
            <button ref={mobileShopRef} key={label} type="button" onClick={openShopCategories} aria-expanded={menuOpen && shopCategoriesOpen} aria-controls="store-menu" className={`cb-mobile-nav-link${active ? " is-active" : ""}`}>{label}</button>
          ) : (
            <Link key={label} to={to} aria-current={active ? "page" : undefined} className={`cb-mobile-nav-link${kind ? ` cb-mobile-nav-${kind}` : ""}${active ? " is-active" : ""}`}>{label}</Link>
          ))}
        </nav>}
      </header>

      {showMenu && <div id="store-menu" className={`store-menu-layer ${menuOpen ? "is-open" : ""}`} aria-hidden={!menuOpen}>
        <button className="store-menu-scrim" onClick={() => closeMenu()} aria-label="Close menu" tabIndex={-1} />
        <div ref={menuPanelRef} className="store-menu-panel" role="dialog" aria-modal="true" aria-label={shopCategoriesOpen ? "Shop categories" : "Store menu"}>
          <div className="drawer-head">
            <div><p className="eyebrow">{shopCategoriesOpen ? "Explore" : "Menu"}</p><h2>{shopCategoriesOpen ? "Shop Categories" : "ChickButton"}</h2></div>
            <button ref={drawerCloseRef} className="drawer-close" type="button" onClick={() => closeMenu()} aria-label={shopCategoriesOpen ? "Close shop categories" : "Close menu"}>×</button>
          </div>
          {shopCategoriesOpen ? <nav className="cb-shop-drawer-content" aria-label="Shop category links">
            <Link to={navItems[1].to} onClick={() => closeMenu(false)} className="cb-shop-drawer-all">View All Shop <span aria-hidden="true">→</span></Link>
            {categoryGroups.map((group) => <section className="cb-shop-drawer-group" key={group.title}>
              <h3>{group.title}</h3>
              {group.items.map((item) => <Link key={`${group.title}-${item}`} to={categoryPath(group.title, item)} onClick={() => closeMenu(false)}>{item}<span aria-hidden="true">→</span></Link>)}
            </section>)}
            <section className="cb-shop-drawer-group">
              <h3>SEASONAL</h3>
              {seasonalCategories.map((item) => <Link key={item} to={seasonalCategoryPath(item)} onClick={() => closeMenu(false)}>{item}<span aria-hidden="true">→</span></Link>)}
            </section>
          </nav> : <nav className="store-menu-links text-sm font-bold" aria-label="Store navigation">
            {menuNavItems.map(({ label, to, active, kind }) => label === "Shop" ? <span className="cb-menu-shop-pair" key={label}>
              <Link to={to} onClick={() => closeMenu(false)} aria-current={active ? "page" : undefined} className={`cb-menu-nav-link cb-menu-shop-desktop${active ? " is-active" : ""}`}>{label}</Link>
              <button type="button" onClick={openShopCategories} aria-expanded={shopCategoriesOpen} aria-controls="store-menu" className={`cb-menu-nav-link cb-menu-shop-mobile${active ? " is-active" : ""}`}>{label}</button>
            </span> : <Link key={label} to={to} onClick={() => closeMenu(false)} aria-current={active ? "page" : undefined} className={`cb-menu-nav-link${kind === "sale" ? " cb-menu-sale" : ""}${active ? " is-active" : ""}`}>{label}</Link>)}
            {headerMode === "shop" && <>
              <button type="button" onClick={() => { closeMenu(false); window.requestAnimationFrame(() => searchInputRef.current?.focus()) }}>Search</button>
              <Link to="/wishlist" onClick={() => closeMenu(false)}>Wishlist</Link>
              <Link to={authenticated ? "/account" : "/login"} onClick={() => closeMenu(false)}>{authenticated ? "My account" : "Log in (optional)"}</Link>
              {authenticated ? <button type="button" onClick={logout}>Log out</button> : <Link to="/signup" onClick={() => closeMenu(false)}>Create account</Link>}
            </>}
          </nav>}
        </div>
      </div>}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div>
      <h3 className="mb-4 text-sm font-extrabold text-[#ffd34e]">{title}</h3>
      <ul className="space-y-3 text-sm text-blue-100">
        {links.map((link) => (
          <li key={`${link.label}-${link.href}`} className="break-words">
            {link.href.startsWith("/") ? <Link to={link.href}>{link.label}</Link> : <a href={link.href}>{link.label}</a>}
          </li>
        ))}
      </ul>
    </div>
  )
}
function Footer() {
  const { help, company } = useSiteContent()
  return (
    <footer className="mt-20 bg-[#0e315b] px-5 pb-8 pt-16 text-white">
      <div className="mx-auto grid max-w-[1280px] gap-10 md:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div>
          <div className="flex items-center gap-2">
            <img
              src={logo}
              className="h-12 w-16 object-contain"
              alt="ChickButton"
            />
            <strong className="text-xl">ChickButton</strong>
          </div>
          <p className="mt-5 max-w-xs text-sm leading-6 text-blue-100">
            Thoughtfully chosen clothes for every little chapter. Made for
            motion, magic, and muddy knees.
          </p>
          <a className="mt-3 inline-block text-sm text-blue-100 hover:text-white" href="mailto:Chickbutton786@gmail.com">Chickbutton786@gmail.com</a>
        </div>
        <FooterColumn
          title="Shop"
          links={[{ label: "New Arrivals", href: "/shop?new=1" }, { label: "Categories", href: "/categories" }, { label: "Sale", href: "/shop?sale=1" }, { label: "Shop All", href: "/shop" }]}
        />
        <FooterColumn
          title="Help"
          links={help}
        />
        <FooterColumn
          title="Company"
          links={company}
        />
      </div>
      <div className="mx-auto mt-14 flex max-w-[1280px] flex-wrap justify-between gap-3 border-t border-white/15 pt-6 text-xs text-blue-200">
        <span>© 2026 ChickButton. Little styles, big smiles.</span>
        <span>Made with care in Pakistan</span>
      </div>
    </footer>
  )
}
function Layout({ children }: { children: React.ReactNode }) {
  const { toast } = useStore()
  const location = useLocation()

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [location.pathname, location.search])

  return (
    <>
      <Header />
      <div className="route-enter" key={`${location.pathname}${location.search}`}>{children}</div>
      <Footer />
      {toast && <div className="toast">Added &nbsp;·&nbsp; {toast}</div>}
    </>
  )
}

function SectionTitle({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string
  title: string
  action?: React.ReactNode
}) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="section-title">{title}</h2>
      </div>
      {action}
    </div>
  )
}
function ApiLoader({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="api-loader" role="status" aria-live="polite">
      <span className="api-loader-dots" aria-hidden="true"><i /><i /><i /></span>
      <span>{label}</span>
    </div>
  )
}

function ProductSkeletons({ count = 8 }: { count?: number }) {
  return (
    <div className="product-grid" aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <div className="product-card skeleton-card" key={i}>
          <div className="product-photo image-loading" />
          <div className="pt-4"><i className="skeleton-line w-1/3" /><i className="skeleton-line w-3/4" /><i className="skeleton-line w-1/4" /></div>
        </div>
      ))}
    </div>
  )
}

const ProductCard = memo(function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const { add, liked, toggleLike } = useStore()
  const [choosingSize, setChoosingSize] = useState(false)
  const [primaryLoaded, setPrimaryLoaded] = useState(false)
  const [hoverReady, setHoverReady] = useState(false)
  const inStockSizes = new Set((product.shopifyVariants || []).filter((v) => v.availableForSale && v.inventoryQuantity > 0).map((v) => v.size))
  const quickAdd = () => {
    if (!product.available) return
    const firstAvailable = product.sizes.find((size) => inStockSizes.has(size)) || product.sizes[0]
    if (product.sizes.length === 1) add(product, 1, firstAvailable)
    else setChoosingSize(true)
  }
  return (
    <article className={`product-card group ${!product.available ? "is-out" : ""}`} onMouseEnter={() => setHoverReady(true)} onFocus={() => setHoverReady(true)}>
      <div className={`product-photo ${primaryLoaded ? "image-ready" : "image-loading"}`}>
        <Link to={`/product/${product.id}`}>
          <img
            src={shopifyImg(product.image, 640)}
            srcSet={shopifySrcSet(product.image, [320, 480, 640, 900])}
            sizes="(max-width: 640px) 50vw, (max-width: 1000px) 33vw, 320px"
            width={640}
            height={800}
            alt={product.name}
            className={`primary-img image-fade ${primaryLoaded ? "is-loaded" : ""}`}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            decoding="async"
            onLoad={() => setPrimaryLoaded(true)}
          />
          {hoverReady && product.image2 && product.image2 !== product.image && (
            <img src={shopifyImg(product.image2, 640)} alt="" className="secondary-img image-fade is-loaded" loading="lazy" decoding="async" />
          )}
        </Link>
        {product.badge && <span className={`badge ${product.badge === "SALE" ? "sale" : ""}`}>{product.badge}</span>}
        {!product.available && <span className="stock-badge">Out of stock</span>}
        <button onClick={() => toggleLike(product.id)} className={`heart ${liked.includes(product.id) ? "liked" : ""}`} aria-label="Save item">
          {liked.includes(product.id) ? "♥" : "♡"}
        </button>
        {choosingSize ? (
          <div className="quick-size-picker">
            <div className="quick-size-head"><strong>Choose size</strong><button type="button" onClick={() => setChoosingSize(false)}>×</button></div>
            <div className="quick-size-grid">
              {product.sizes.map((size) => {
                const available = inStockSizes.size === 0 ? product.available : inStockSizes.has(size)
                return <button key={size} disabled={!available} type="button" onClick={() => { if (available) add(product, 1, size); setChoosingSize(false) }}>{size}{!available ? " · Sold" : ""}</button>
              })}
            </div>
          </div>
        ) : (
          <button onClick={quickAdd} disabled={!product.available} className="quick-add">
            {product.available ? <>Quick add <span>+</span></> : "Out of stock"}
          </button>
        )}
      </div>
      <div className="pt-4">
        <p className="text-xs font-bold uppercase tracking-[.12em] text-slate-400">{product.ages.join(" · ")}</p>
        <h3 className="mt-1 text-[15px] font-extrabold text-[#163d69]">{product.name}</h3>
        <div className="mt-2 flex items-center gap-2">
          <strong className="text-[15px] text-[#163d69]">{money(product.price)}</strong>
          {product.old && <span className="text-sm text-slate-400 line-through">{money(product.old)}</span>}
        </div>
        {!product.available && <p className="stock-copy">Currently out of stock</p>}
        <span className="mt-3 block h-3 w-3 rounded-full ring-2 ring-white shadow" style={{ backgroundColor: product.color }} />
      </div>
    </article>
  )
})

function Collection({
  title,
  subtitle,
  img,
  to = "/shop",
}: {
  title: string
  subtitle: string
  img: string
  to?: string
}) {
  return (
    <Link to={to} className="collection-card">
      <img src={shopifyImg(img, 800)} alt={title} loading="lazy" decoding="async" />
      <div>
        <p>{subtitle}</p>
        <h3>
          {title} <span>→</span>
        </h3>
      </div>
    </Link>
  )
}

function Home() {
  const { products, loading: catalogLoading, error: catalogError } = useCatalog()
  const { homePromotion } = useSiteContent()
  const [isMobilePromo, setIsMobilePromo] = useState(() => window.matchMedia("(max-width: 640px)").matches)
  const [readyPromoUrl, setReadyPromoUrl] = useState<string | null>(null)
  const promoImage = isMobilePromo && homePromotion?.mobileImage ? homePromotion.mobileImage : homePromotion?.image
  const promoUrl = promoImage?.url

  useEffect(() => {
    const media = window.matchMedia("(max-width: 640px)")
    const update = () => setIsMobilePromo(media.matches)
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])

  useEffect(() => {
    setReadyPromoUrl(null)
    if (!promoUrl) return
    let active = true
    const preload = new Image()
    preload.onload = () => { if (active) setReadyPromoUrl(promoUrl) }
    preload.onerror = () => { if (active) setReadyPromoUrl(null) }
    preload.src = promoUrl
    return () => { active = false; preload.onload = null; preload.onerror = null }
  }, [promoUrl])

  const activePromo = homePromotion && promoImage && readyPromoUrl === promoUrl
  const displayProducts = useMemo(() => {
    const favourites = products.filter((product) =>
      (product.collections || []).some((collection) => collection.trim().toLowerCase() === "fresh favourites")
    )
    return favourites.length ? favourites : products
  }, [products])
  return (
    <Layout>
      <main>
        {activePromo ? <section className="cb-home-promo" aria-label="Homepage promotion">
          {homePromotion.link ? (homePromotion.link.startsWith("/")
            ? <Link to={homePromotion.link}><img src={promoImage.url} width={promoImage.width} height={promoImage.height} alt={homePromotion.alt} fetchPriority="high" decoding="async" onError={() => setReadyPromoUrl(null)} /></Link>
            : <a href={homePromotion.link}><img src={promoImage.url} width={promoImage.width} height={promoImage.height} alt={homePromotion.alt} fetchPriority="high" decoding="async" onError={() => setReadyPromoUrl(null)} /></a>)
            : <img src={promoImage.url} width={promoImage.width} height={promoImage.height} alt={homePromotion.alt} fetchPriority="high" decoding="async" onError={() => setReadyPromoUrl(null)} />}
        </section> : <section className="cb-home-hero" aria-labelledby="cb-home-title">
          <img className="cb-hero-photo" src={heroLifestyle} alt="Two smiling children in comfortable clothes among daisies" fetchPriority="high" decoding="async" />
          <div className="cb-hero-copy">
            <p className="cb-hero-eyebrow">Made for little moments</p>
            <h1 id="cb-home-title" className="cb-hero-title">Little styles.<br /><em>Big smiles.</em></h1>
            <p className="cb-hero-description">
              Beautifully comfortable pieces for childhood's brightest days —
              designed to play, twirl and grow with them.
            </p>
            <div className="cb-hero-actions">
              <Link to="/shop?new=1" className="button-primary cb-hero-button cb-hero-primary">
                Shop new arrivals <span>→</span>
              </Link>
              <Link to="/categories" className="button-secondary cb-hero-button cb-hero-secondary">
                Explore collections
              </Link>
            </div>
          </div>
        </section>}
        <section className="page-pad reveal pt-20">
          <SectionTitle
            eyebrow="Dress the occasion"
            title="Made for their big little days"
            action={
              <Link className="text-link" to="/categories">
                All collections →
              </Link>
            }
          />
          <div className="collection-grid">
            <Collection
              title="BABY"
              subtitle="Soft starts for tiny days"
              img={products.find((p) => getFacets(p).baby)?.image || products[0]?.image || ""}
              to="/shop?section=BABY"
            />
            <Collection
              title="BOYS"
              subtitle="Made for every adventure"
              img={products.find((p) => getFacets(p).boysSection)?.image || products[0]?.image || ""}
              to="/shop?section=BOYS"
            />
            <Collection
              title="GIRLS"
              subtitle="Playful pieces for every moment"
              img={products.find((p) => getFacets(p).girlsSection)?.image || products[0]?.image || ""}
              to="/shop?section=GIRLS"
            />
          </div>
        </section>
        <section className="page-pad reveal pt-24">
          <SectionTitle
            eyebrow="Just landed"
            title="Fresh favourites"
            action={
              <Link className="text-link" to="/shop?new=1">
                View all new arrivals →
              </Link>
            }
          />
          {catalogLoading ? <ProductSkeletons count={4} /> : catalogError && !displayProducts.length ? <p className="text-slate-500">{catalogError}</p> : (
            <div className="product-grid">
              {displayProducts.slice(0, 8).map((product, index) => (
                <ProductCard product={product} priority={index < 4} key={product.id} />
              ))}
            </div>
          )}
        </section>
        <section className="page-pad reveal pt-24">
          <div className="age-strip">
            <div>
              <p className="eyebrow text-[#f8cc43]">Shop by age</p>
              <h2 className="text-4xl font-black tracking-tight text-white">
                The perfect fit
                <br />
                for right now.
              </h2>
            </div>
            <div className="age-links">
              {["0–2 Years", "3–5 Years", "6–8 Years", "9–12 Years"].map(
                (age) => (
                  <Link to={`/shop?age=${encodeURIComponent(age)}`} key={age}>
                    {age}
                    <span>↗</span>
                  </Link>
                ),
              )}
            </div>
          </div>
        </section>
        <section className="page-pad reveal pt-24">
          <div className="sale-banner">
            <div className="relative z-10 max-w-lg">
              <p className="eyebrow text-[#ffd34e]">The sunny edit</p>
              <h2 className="mt-2 text-4xl font-black tracking-tight text-white sm:text-5xl">
                Up to 30% off
                <br />
                selected styles.
              </h2>
              <p className="mt-5 text-blue-100">
                A little extra joy for the everyday wardrobe.
              </p>
              <Link
                to="/shop?sale=1"
                className="mt-8 inline-flex rounded-full bg-[#ffd34e] px-6 py-3 text-sm font-extrabold text-[#123e70]"
              >
                Shop the sale →
              </Link>
            </div>
            <img
              src="https://images.unsplash.com/photo-1560506840-ec148e82a604?auto=format&fit=crop&w=1000&q=85" loading="lazy" decoding="async"
              alt="Happy child wearing colourful clothing"
            />
          </div>
        </section>
        <section className="page-pad reveal pt-24">
          <SectionTitle
            eyebrow="Why ChickButton"
            title="Thoughtful from thread to doorstep"
          />
          <div className="benefit-grid">
            {[
              ["✦", "Premium quality", "Pieces made to be passed down."],
              ["☁", "Comfort first", "Soft fabrics for busy little bodies."],
              ["⌁", "Easy ordering", "Simple shopping, happy days."],
              ["♡", "Carefully chosen", "A small edit of the very best."],
            ].map(([icon, title, copy]) => (
              <div className="benefit" key={title}>
                <span>{icon}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="page-pad reveal pt-24">
          <div className="newsletter">
            <div>
              <p className="eyebrow text-[#e3a40a]">A little note from us</p>
              <h2 className="section-title">
                Good things are
                <br />
                on their way.
              </h2>
            </div>
            <form onSubmit={(e) => e.preventDefault()} className="subscribe">
              <input
                type="email"
                placeholder="Your email address"
                aria-label="Email address"
              />
              <button className="button-primary">Keep me posted →</button>
            </form>
          </div>
        </section>
      </main>
    </Layout>
  )
}

const EMPTY_FILTERS = { Category: [], Age: [], Size: [], Colour: [], Price: [], Availability: [] } as Record<string, string[]>

function filtersFromUrl(search: string): Record<string, string[]> {
  const next = new URLSearchParams(search)
  return {
    ...EMPTY_FILTERS,
    Category: next.get("category") ? [next.get("category")!] : [],
    Age: next.get("age") ? [next.get("age")!] : [],
  }
}

function Shop() {
  const { products, loading: catalogLoading, error: catalogError } = useCatalog()
  const location = useLocation()
  const navigate = useNavigate()
  const params = new URLSearchParams(location.search)
  const searchQuery = (params.get("q") || "").trim().toLowerCase()
  const sectionQuery = (params.get("section") || "").trim().toUpperCase()
  const initialQuick = params.get("sale") === "1" ? "Sale" : params.get("new") === "1" ? "New" : "All"
  const [quickFilter, setQuickFilter] = useState(initialQuick)
  const [sort, setSort] = useState("featured")
  const [visibleCount, setVisibleCount] = useState(12)
  const [loadingMore, setLoadingMore] = useState(false)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  // Match the existing single-column Shop breakpoint; keep Category open on desktop.
  const [openFilterGroups, setOpenFilterGroups] = useState<Record<string, boolean>>(
    () => ({ Category: !window.matchMedia("(max-width: 1000px)").matches }),
  )
  useEffect(() => {
    const breakpoint = window.matchMedia("(max-width: 1000px)")
    const resetOpenGroups = () => setOpenFilterGroups({ Category: !breakpoint.matches })
    resetOpenGroups()
    breakpoint.addEventListener("change", resetOpenGroups)
    return () => breakpoint.removeEventListener("change", resetOpenGroups)
  }, [location.key])
  // Initialise straight from the URL so a link like /shop?section=BOYS&category=Formal never flashes unfiltered products.
  const [filters, setFilters] = useState<Record<string, string[]>>(() => filtersFromUrl(location.search))

  useEffect(() => {
    const next = new URLSearchParams(location.search)
    setQuickFilter(next.get("sale") === "1" ? "Sale" : next.get("new") === "1" ? "New" : "All")
    setFilters(filtersFromUrl(location.search))
  }, [location.search])

  useEffect(() => {
    setVisibleCount(12)
  }, [location.search, quickFilter, sort, filters])

  // Keep the original ChickButton filter taxonomy visible even when Shopify
  // currently has products in only a few collections. As the merchant adds
  // products to these Shopify collections, they automatically begin matching.
  const categoryOptions = [
    "Baby Boys", "Baby Girls", "Baby Sets", "Baby Frocks",
    "Sets", "Shirts", "Pants", "Frocks", "Formal", "Traditional",
    "Summer", "Winter", "New Arrivals", "Sale",
  ]
  const sizeOptions = Array.from(new Set(products.flatMap((product) => product.sizes)))
  const originalColourOptions = ["Pink", "Blue", "Green", "Beige", "Purple", "Yellow", "Orange", "Grey"]
  const shopifyColourOptions = products.flatMap((product) => product.colorNames || []).filter((value) => value !== "Default")
  const options: Record<string, string[]> = {
    Category: categoryOptions,
    Age: ["0–2 Years", "3–5 Years", "6–8 Years", "9–12 Years"],
    Size: sizeOptions,
    Colour: Array.from(new Set([...originalColourOptions, ...shopifyColourOptions])),
    Price: ["Under PKR 3,000", "PKR 3,000–4,999", "PKR 5,000–5,999", "PKR 6,000+"],
    Availability: ["In stock", "Out of stock"],
  }

  const toggle = (group: string, value: string) => {
    setFilters((current) => ({
      ...current,
      [group]: current[group].includes(value)
        ? current[group].filter((item) => item !== value)
        : [...current[group], value],
    }))
  }

  const matchesPrice = (product: Product, values: string[]) => {
    if (!values.length) return true
    return values.some((value) => {
      if (value === "Under PKR 3,000") return product.price < 3000
      if (value === "PKR 3,000–4,999") return product.price >= 3000 && product.price < 5000
      if (value === "PKR 5,000–5,999") return product.price >= 5000 && product.price < 6000
      return product.price >= 6000
    })
  }

  // Memoised: filtering only re-runs when the catalogue or a filter actually changes (not on every render / scroll step).
  const shown = useMemo(() => {
    const words = searchQuery.split(/\s+/).filter(Boolean)
    let list = products.filter((product) => {
      const facets = getFacets(product)
      if (!matchesSection(facets, sectionQuery)) return false
      if (words.length) {
        const haystack = [
          product.name,
          product.slug.replace(/-/g, " "),
          product.section,
          product.category,
          product.colorName,
          ...(product.colorNames || []),
          ...product.ages,
          ...product.sizes,
          ...(product.collections || []),
        ].join(" ").toLowerCase()
        if (!words.every((word) => haystack.includes(word))) return false
      }
      if (quickFilter === "Sale" && !facets.sale) return false
      if (quickFilter === "New" && !(facets.newArrivals || product.badge === "NEW")) return false
      // Baby Boys + Formal => formal for boys; Shirts + Pants => either; Summer + Sale => summer sale, etc.
      if (!matchesCategorySelection(facets, filters.Category)) return false
      if (filters.Age.length && !filters.Age.some((value) => product.ages.includes(value))) return false
      if (filters.Size.length && !filters.Size.some((value) => product.sizes.includes(value))) return false
      if (filters.Colour.length) {
        const colours = product.colorNames?.length ? product.colorNames : [product.colorName]
        if (!filters.Colour.some((value) => colours.includes(value))) return false
      }
      if (!matchesPrice(product, filters.Price)) return false
      if (filters.Availability.length) {
        const wanted = product.available ? "In stock" : "Out of stock"
        if (!filters.Availability.includes(wanted)) return false
      }
      return true
    })
    if (sort === "price-low") list = [...list].sort((a, b) => a.price - b.price)
    if (sort === "newest") list = [...list].sort((a, b) => Number(b.badge === "NEW") - Number(a.badge === "NEW") || b.id - a.id)
    return list
  }, [products, sectionQuery, searchQuery, quickFilter, filters, sort])

  const visibleProducts = shown.slice(0, visibleCount)
  const hasMoreProducts = visibleCount < shown.length

  useEffect(() => {
    const node = loadMoreRef.current
    if (!node || !hasMoreProducts || loadingMore) return
    const observer = new IntersectionObserver((entries) => {
      if (!entries[0]?.isIntersecting) return
      setLoadingMore(true)
      window.setTimeout(() => {
        setVisibleCount((count) => Math.min(count + 8, shown.length))
        setLoadingMore(false)
      }, 180)
    }, { rootMargin: "320px 0px" })
    observer.observe(node)
    return () => observer.disconnect()
  }, [hasMoreProducts, loadingMore, shown.length, visibleCount])

  if (catalogLoading) return <Layout><main className="page-pad py-10"><ProductSkeletons count={8} /></main></Layout>
  if (catalogError && !products.length) return <Layout><main className="page-pad py-10"><div className="empty-state"><h2>We couldn’t load the catalog.</h2><p>{catalogError}</p></div></main></Layout>

  return (
    <Layout>
      <main className="page-pad py-10">
        <p className="crumb">Home / Shop</p>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="page-title">{searchQuery ? `Search: “${params.get("q")}”` : "The everyday edit"}</h1>
            <p className="mt-2 text-slate-500">{shown.length} pieces ready to explore.</p>
          </div>
          <select className="select" value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort products">
            <option value="featured">Sort: Featured</option>
            <option value="price-low">Price: Low to high</option>
            <option value="newest">Newest first</option>
          </select>
        </div>
        <div className="shop-layout">
          <aside className="filter-panel">
            <strong>Filter by</strong>
            {Object.keys(options).map((group) => (
              <details key={group} open={Boolean(openFilterGroups[group])}>
                <summary onClick={(event) => {
                  event.preventDefault()
                  setOpenFilterGroups((current) => ({ ...current, [group]: !current[group] }))
                }}>{group}<span>⌄</span></summary>
                <div className="filter-list">
                  {options[group].map((value) => (
                    <label key={value}>
                      <input
                        type="checkbox"
                        checked={filters[group].includes(value)}
                        onChange={() => toggle(group, value)}
                      /> {value}
                    </label>
                  ))}
                </div>
              </details>
            ))}
          </aside>
          <section>
            <div className="mb-6 flex flex-wrap gap-2">
              {sectionQuery && (
                <button
                  className="chip active"
                  aria-label={`Remove ${sectionQuery.toLowerCase()} section filter`}
                  onClick={() => { const next = new URLSearchParams(location.search); next.delete("section"); navigate(`/shop${next.toString() ? `?${next}` : ""}`) }}
                >
                  {sectionQuery.charAt(0) + sectionQuery.slice(1).toLowerCase()} ✕
                </button>
              )}
              {["All", "New", "Sale"].map((item) => (
                <button onClick={() => setQuickFilter(item)} className={`chip ${quickFilter === item ? "active" : ""}`} key={item}>
                  {item === "All" ? "All styles" : item === "New" ? "New in" : "On sale"}
                </button>
              ))}
            </div>
            {shown.length ? (
              <div className="product-grid">
                {visibleProducts.map((product, index) => <ProductCard product={product} priority={index < 4} key={product.id} />)}
                {hasMoreProducts && (
                  <div ref={loadMoreRef} className="product-load-more-card" role="status" aria-live="polite">
                    <span>{loadingMore ? "Loading more styles" : "More styles below"}</span>
                    <i><b className={loadingMore ? "is-loading" : ""} /></i>
                  </div>
                )}
              </div>
            ) : (
              <div className="empty-state">
                <h2>No pieces match “{params.get("q") || "those filters"}”.</h2>
                <p>Try a shorter product name, category, colour or size.</p>
                <button className="button-primary" onClick={() => { setQuickFilter("All"); setFilters(EMPTY_FILTERS); if (location.search) navigate("/shop") }}>Clear filters</button>
              </div>
            )}
          </section>
        </div>
      </main>
    </Layout>
  )
}

function ProductPage() {
  const { products, loading: catalogLoading } = useCatalog()
  const location = useLocation()
  const productId = Number(location.pathname.split("/").pop())
  const foundProduct = products.find((product) => product.id === productId)
  const p = foundProduct || fallbackProducts[0]
  const { add } = useStore()
  const galleryImages = [...new Set(((p.images?.length ? p.images : [p.image, p.image2])).filter(Boolean))]
  const firstAvailableSize = p.sizes.find((candidate) => {
    const variant = p.shopifyVariants?.find((item) => item.size === candidate)
    return !variant || (variant.availableForSale && variant.inventoryQuantity > 0)
  }) || p.sizes[0]
  const [size, setSize] = useState(firstAvailableSize)
  const [qty, setQty] = useState(1)
  const [imageIndex, setImageIndex] = useState(0)
  const [showAllThumbs, setShowAllThumbs] = useState(false)
  const [zoomOpen, setZoomOpen] = useState(false)
  const [zoomKey, setZoomKey] = useState(0)

  useEffect(() => {
    const nextSize = p.sizes.find((candidate) => {
      const variant = p.shopifyVariants?.find((item) => item.size === candidate)
      return !variant || (variant.availableForSale && variant.inventoryQuantity > 0)
    }) || p.sizes[0]
    setSize(nextSize)
    setQty(1)
    setImageIndex(0)
    setShowAllThumbs(false)
  }, [p.id, p.available])

  const selectedVariant = p.shopifyVariants?.find((variant) => variant.size === size)
  const selectedAvailable = selectedVariant ? selectedVariant.availableForSale && selectedVariant.inventoryQuantity > 0 : p.available
  const selectedStock = selectedVariant?.inventoryQuantity ?? p.totalInventory ?? 0
  const selectedPrice = selectedVariant?.price ?? p.price
  const selectedOld = selectedVariant?.compareAtPrice && selectedVariant.compareAtPrice > selectedPrice
    ? selectedVariant.compareAtPrice
    : (p.old && p.old > selectedPrice ? p.old : undefined)
  const visibleThumbs = showAllThumbs ? galleryImages : galleryImages.slice(0, 2)

  useEffect(() => {
    if (selectedStock > 0 && qty > selectedStock) setQty(selectedStock)
  }, [selectedStock, size])

  const moveImage = (direction: -1 | 1) => {
    if (!galleryImages.length) return
    setImageIndex((current) => (current + direction + galleryImages.length) % galleryImages.length)
    setZoomKey((value) => value + 1)
  }

  useEffect(() => {
    if (!zoomOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setZoomOpen(false)
      if (event.key === "ArrowLeft") moveImage(-1)
      if (event.key === "ArrowRight") moveImage(1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [zoomOpen, p.id, galleryImages.length])

  if (catalogLoading) return <Layout><main className="page-pad py-10"><ApiLoader label="Loading product" /></main></Layout>
  if (!foundProduct) return <Layout><main className="page-pad py-10"><div className="empty-state"><h2>Product not found.</h2><Link className="button-primary" to="/shop">Back to shop →</Link></div></main></Layout>

  return (
    <Layout>
      <main className="page-pad py-8">
        <p className="crumb">Home / {p.section} / {p.category} / {p.name}</p>
        <div className="product-detail">
          <div className="gallery">
            <div className="thumbs">
              {visibleThumbs.map((image, index) => {
                const realIndex = galleryImages.indexOf(image)
                return (
                  <button key={`${p.id}-${realIndex}`} type="button" className={imageIndex === realIndex ? "active" : ""} onClick={() => { setImageIndex(realIndex); setZoomKey((value) => value + 1) }}>
                    <img src={shopifyImg(image, 200)} alt={`${p.name} view ${realIndex + 1}`} loading="lazy" decoding="async" />
                  </button>
                )
              })}
              {galleryImages.length > 2 && (
                <button type="button" className="thumb-show-more" onClick={() => setShowAllThumbs((current) => !current)}>
                  {showAllThumbs ? "Show less" : `Show more +${galleryImages.length - 2}`}
                </button>
              )}
            </div>
            <button type="button" className="main-product-button" onClick={() => setZoomOpen(true)} aria-label={`Zoom ${p.name}`}>
              <img key={`${p.id}-${imageIndex}`} className="main-product product-image-swap" src={shopifyImg(galleryImages[imageIndex] || p.image, 1100)} alt={p.name} decoding="async" />
              <span>Click to zoom</span>
            </button>
          </div>
          <section>
            <p className="eyebrow">{p.section} · {p.category} · {p.ages.join(" · ")}</p>
            <h1 className="page-title mt-2">{p.name}</h1>
            <div className="mt-4 flex items-center gap-3">
              <strong className="text-2xl text-[#123e70]">{money(selectedPrice)}</strong>
              {selectedOld && <span className="text-slate-400 line-through">{money(selectedOld)}</span>}
              {selectedOld && <span className="badge sale">{Math.round((1 - selectedPrice / selectedOld) * 100)}% off</span>}
            </div>
            <p className={`stock-status ${selectedAvailable ? "in" : "out"}`}>{selectedAvailable ? (selectedStock <= 5 ? `Only ${selectedStock} left in this size` : "In stock") : "Out of stock"}</p>
            <p className="mt-6 leading-7 text-slate-600">{p.description || "A thoughtfully selected piece made for everyday movement, comfort and little adventures."}</p>
            <div className="choice"><span>Colour — <b>{p.colorName}</b></span></div>
            <div className="choice">
              <div className="flex justify-between"><span>Size</span><Link to="/info/size-guide" className="text-link">Size guide</Link></div>
              <div className="mt-3 flex flex-wrap gap-2">
                {p.sizes.map((s) => {
                  const variant = p.shopifyVariants?.find((item) => item.size === s)
                  const available = variant ? variant.availableForSale && variant.inventoryQuantity > 0 : p.available
                  return <button disabled={!available} onClick={() => { setSize(s); setQty(1) }} className={`size-button ${size === s ? "selected" : ""} ${!available ? "sold-out" : ""}`} key={s}>{s}{!available ? " · Sold" : ""}</button>
                })}
              </div>
            </div>
            <div className="mt-7 flex gap-3">
              <div className="quantity"><button onClick={() => setQty(Math.max(1, qty - 1))}>−</button><b>{qty}</b><button disabled={!selectedAvailable || (selectedStock > 0 && qty >= selectedStock)} onClick={() => setQty(qty + 1)}>+</button></div>
              <button onClick={() => selectedAvailable && add(p, qty, size)} disabled={!selectedAvailable} className="button-primary flex-1">
                {selectedAvailable ? `Add to cart · ${money(selectedPrice * qty)}` : "Out of stock"}
              </button>
            </div>
          </section>
        </div>
      </main>

      {zoomOpen && (
        <div className="product-zoom-layer" role="dialog" aria-modal="true" onClick={() => setZoomOpen(false)}>
          <button className="product-zoom-close" onClick={() => setZoomOpen(false)} aria-label="Close zoom">×</button>
          {galleryImages.length > 1 && <button className="product-zoom-arrow prev" type="button" onClick={(event) => { event.stopPropagation(); moveImage(-1) }} aria-label="Previous image">‹</button>}
          <div className="product-zoom-stage" onClick={(event) => event.stopPropagation()}>
            <img key={`${p.id}-${imageIndex}-${zoomKey}`} className="product-zoom-swap" src={galleryImages[imageIndex] || p.image} alt={`${p.name} view ${imageIndex + 1}`} />
            <div className="product-zoom-count">{imageIndex + 1} / {galleryImages.length}</div>
          </div>
          {galleryImages.length > 1 && <button className="product-zoom-arrow next" type="button" onClick={(event) => { event.stopPropagation(); moveImage(1) }} aria-label="Next image">›</button>}
        </div>
      )}
    </Layout>
  )
}

function Categories() {
  const { products, loading: catalogLoading, error: catalogError } = useCatalog()
  return (
    <Layout>
      <main className="page-pad py-10">
        <p className="eyebrow">Find their thing</p>
        <h1 className="page-title">Shop by collection.</h1>
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {categoryGroups.map((group) => (
            <section className="category-group-card" key={group.title}>
              <img src={products.find((p) => getFacets(p)[group.facet])?.image || products[0]?.image || ""} alt={group.title} />
              <div>
                <p className="eyebrow">{group.title}</p>
                <div className="category-link-stack">
                  {group.items.map((item) => (
                    <Link key={`${group.title}-${item}`} to={categoryPath(group.title, item)}>
                      {item}<span>→</span>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {seasonalCategories.map((item) => (
            <Link key={item} className="season-category-card" to={seasonalCategoryPath(item)}>
              <strong>{item}</strong><span>Explore →</span>
            </Link>
          ))}
        </div>
      </main>
    </Layout>
  )
}

function OrderSummary({ cartItems }: { cartItems: CartLine[] }) {
  const pricing = cartPricing(cartItems)
  return (
    <aside className="summary">
      <h2>Order summary</h2>
      <div>
        <span>Subtotal</span>
        <strong>{money(pricing.saleSavings > 0 ? pricing.originalSubtotal : pricing.currentSubtotal)}</strong>
      </div>
      {pricing.saleSavings > 0 && (
        <div className="text-emerald-700">
          <span>Shopify sale savings</span>
          <strong>− {money(pricing.saleSavings)}</strong>
        </div>
      )}
      <div>
        <span>Delivery</span>
        <span>Calculated at checkout</span>
      </div>
      <div className="total">
        <span>Total before delivery</span>
        <strong>{money(pricing.currentSubtotal)}</strong>
      </div>
      <Link
        to="/checkout"
        className={`button-primary mt-6 w-full ${
          pricing.currentSubtotal === 0 ? "pointer-events-none opacity-50" : ""
        }`}
      >
        Proceed to checkout →
      </Link>
      <p>Secure checkout · Cash on delivery</p>
    </aside>
  )
}
function Cart() {
  const { cartItems, updateQuantity, remove } = useStore()
  return (
    <Layout>
      <main className="page-pad py-10">
        <p className="eyebrow">Your bag</p>
        <h1 className="page-title">Ready when you are.</h1>
        <div className="cart-layout mt-8">
          <section className="space-y-4">
            {cartItems.length ? (
              cartItems.map(({ product, quantity, size }) => {
                const linePricing = cartLinePricing(product, size, quantity)
                return (
                <div className="cart-item" key={`${product.id}-${size}`}>
                  <img src={shopifyImg(product.image, 240)} alt={product.name} loading="lazy" decoding="async" />
                  <div className="flex-1">
                    <h3>{product.name}</h3>
                    <p>Size {size} · {(shopifyVariantForSize(product, size)?.inventoryQuantity || 0) > 0 ? "In stock" : "Out of stock"}</p>
                    <strong>{money(linePricing.currentTotal)}</strong>
                    <small>{money(linePricing.currentUnit)} each</small>
                  </div>
                  <div className="quantity">
                    <button onClick={() => updateQuantity(product.id, size, quantity - 1)}>−</button>
                    <b>{quantity}</b>
                    <button onClick={() => updateQuantity(product.id, size, quantity + 1)}>+</button>
                  </div>
                  <button onClick={() => remove(product.id, size)} aria-label={`Remove ${product.name}`} className="remove-x">×</button>
                </div>
                )
              })
            ) : (
              <div className="empty-state">
                <h2>Your bag is empty.</h2>
                <Link to="/shop" className="button-primary">Discover the collection</Link>
              </div>
            )}
          </section>
          <OrderSummary cartItems={cartItems} />
        </div>
      </main>
    </Layout>
  )
}

function Field({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
  action,
}: {
  label: string
  placeholder: string
  type?: string
  value?: string
  onChange?: (value: string) => void
  action?: React.ReactNode
}) {
  return (
    <label className="field">
      <span>
        {label}
        {action}
      </span>
      <input
        required
        type={type}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  )
}
function Checkout() {
  const { cartItems, refreshCart } = useStore()
  const { refresh: refreshCatalog } = useCatalog()
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: "", phone: "", addressLine: "", area: "", city: "", province: "", postalCode: "" })
  const [email, setEmail] = useState("")
  const emailEdited = useRef(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deliveryQuote, setDeliveryQuote] = useState<{ amount: number; title: string } | null>(null)
  const [deliveryLoading, setDeliveryLoading] = useState(false)
  const deliveryCache = useRef(new Map<string, { amount: number; title: string }>())
  const checkoutKey = useRef(typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`)
  const pricing = cartPricing(cartItems)
  const total = pricing.currentSubtotal + (deliveryQuote?.amount ?? 0)
  const set = (key: keyof typeof form) => (value: string) => setForm((current) => ({ ...current, [key]: value }))

  useEffect(() => {
    void api("/api/account")
      .then((data) => {
        const address = (data.addresses || []).find((item: any) => item.is_default) || data.addresses?.[0]
        if (!emailEdited.current && data.user?.email) setEmail(data.user.email)
        setForm((current) => ({
          ...current,
          fullName: address?.full_name || data.profile?.full_name || current.fullName,
          phone: address?.phone || data.profile?.phone || current.phone,
          addressLine: address?.address_line || current.addressLine,
          area: address?.area || current.area,
          city: address?.city || current.city,
          province: address?.province || current.province,
          postalCode: address?.postal_code || current.postalCode,
        }))
      })
      .catch((err: any) => {
        if (err?.status !== 401) setError(err?.message || "Could not load your saved checkout details.")
      })
  }, [])

  const deliveryPayload = () => ({
    lines: cartItems.flatMap(({ product, quantity, size }) => {
      const variant = shopifyVariantForSize(product, size)
      return variant ? [{ variantId: variant.id, quantity }] : []
    }),
    address: form,
  })

  const calculateDelivery = async () => {
    if (!cartItems.length || !form.addressLine.trim() || !form.city.trim()) return null
    const payload = deliveryPayload()
    if (payload.lines.length !== cartItems.length) throw new Error("One or more cart variants could not be identified.")
    const key = JSON.stringify(payload)
    const cached = deliveryCache.current.get(key)
    if (cached) {
      setDeliveryQuote(cached)
      return cached
    }
    setDeliveryLoading(true)
    try {
      const data = await api("/api/shopify/delivery", { method: "POST", body: JSON.stringify(payload) })
      const quote = { amount: Number(data.rate?.amount) || 0, title: String(data.rate?.title || "Delivery") }
      deliveryCache.current.set(key, quote)
      setDeliveryQuote(quote)
      return quote
    } finally {
      setDeliveryLoading(false)
    }
  }

  useEffect(() => {
    setDeliveryQuote(null)
    if (!cartItems.length || !form.addressLine.trim() || !form.city.trim()) return
    const timer = window.setTimeout(() => {
      void calculateDelivery().catch(() => setDeliveryQuote(null))
    }, 550)
    return () => window.clearTimeout(timer)
  }, [form.addressLine, form.area, form.city, form.province, form.postalCode, cartItems.map((line) => `${line.product.id}:${line.size}:${line.quantity}`).join("|")])

  const placeOrder = async () => {
    if (!cartItems.length || busy) return
    setBusy(true)
    setError("")
    try {
      const data = await api("/api/orders", { method: "POST", body: JSON.stringify({ ...form, checkoutKey: checkoutKey.current }) })
      setConfirmOpen(false)
      await refreshCart()
      void refreshCatalog()
      navigate(`/order-success?order=${encodeURIComponent(data.order.order_number)}&total=${encodeURIComponent(String(data.order.total_amount))}`, { replace: true })
    } catch (err: any) {
      setConfirmOpen(false)
      setError(err?.message || "Could not place your order.")
    } finally { setBusy(false) }
  }

  return (
    <Layout>
      <main className="page-pad py-10 cb-checkout-page">
        <p className="crumb">Cart / Checkout</p>
        <h1 className="page-title">One step closer.</h1>
        <div className="checkout-contact-wrap mt-8">
          <form
            onSubmit={(event) => {
              event.preventDefault()
              if (!cartItems.length || busy) return
              setError("")
              setDeliveryLoading(true)
              void calculateDelivery()
                .then((quote) => {
                  if (!quote) throw new Error("Enter your shipping address to calculate delivery.")
                  setConfirmOpen(true)
                })
                .catch((err: any) => setError(err?.message || "Could not calculate delivery."))
                .finally(() => setDeliveryLoading(false))
            }}
            className="checkout-form checkout-form-focused"
          >
            <div className="checkout-heading-row">
              <div>
                <p className="eyebrow">Delivery details</p>
                <h2>Contact information</h2>
              </div>
              <span className="checkout-step">Secure checkout</span>
            </div>
            <div className="form-grid">
              <Field label="Full name" placeholder="Your full name" value={form.fullName} onChange={set("fullName")} />
              <Field label="Phone number" placeholder="03XX XXXXXXX" type="tel" value={form.phone} onChange={set("phone")} />
            </div>
            <Field label="Email address" placeholder="you@example.com" type="email" value={email} onChange={(value) => { emailEdited.current = true; setEmail(value) }} />
            <h2 className="mt-8">Shipping address</h2>
            <Field label="Address" placeholder="House / street / landmark" value={form.addressLine} onChange={set("addressLine")} />
            <div className="form-grid">
              <Field label="Area" placeholder="Your area" value={form.area} onChange={set("area")} />
              <Field label="City" placeholder="Your city" value={form.city} onChange={set("city")} />
              <Field label="Province" placeholder="Punjab" value={form.province} onChange={set("province")} />
              <Field label="Postal code" placeholder="Optional" value={form.postalCode} onChange={set("postalCode")} />
            </div>
            <div className="notice">We’ll show your complete order summary for confirmation before anything is placed.</div>
            {error && <p className="mt-4 text-sm font-bold text-rose-500">{error}</p>}
            <button disabled={busy || deliveryLoading || !cartItems.length} className="button-primary mt-6 w-full">{deliveryLoading ? "Calculating delivery..." : "Review & place order →"}</button>
          </form>
        </div>
      </main>

      {confirmOpen && (
        <div className="order-confirm-layer" role="presentation">
          <button type="button" className="order-confirm-scrim" aria-label="Close order confirmation" onClick={() => !busy && setConfirmOpen(false)} />
          <section className="order-confirm-card" role="dialog" aria-modal="true" aria-labelledby="confirm-order-title">
            <div className="order-confirm-icon" aria-hidden="true">✓</div>
            <p className="eyebrow">Final check</p>
            <h2 id="confirm-order-title">Confirm your order?</h2>
            <p className="order-confirm-copy">Please review the details below. Your order will only be placed after you press confirm.</p>

            <div className="confirm-items">
              {cartItems.map(({ product, quantity, size }) => (
                <div className="confirm-item" key={`${product.id}-${size}`}>
                  <img src={shopifyImg(product.image, 240)} alt="" loading="lazy" decoding="async" />
                  <div><strong>{product.name}</strong><span>Size {size} · Qty {quantity}</span></div>
                  <b>{money(product.price * quantity)}</b>
                </div>
              ))}
            </div>

            <div className="confirm-delivery">
              <span>Deliver to</span>
              <strong>{form.fullName} · {form.phone}</strong>
              <p>{[form.addressLine, form.area, form.city, form.province].filter(Boolean).join(", ")}</p>
            </div>

            <div className="confirm-totals">
              <div><span>Subtotal</span><strong>{money(pricing.saleSavings > 0 ? pricing.originalSubtotal : pricing.currentSubtotal)}</strong></div>
              {pricing.saleSavings > 0 && <div className="discount"><span>Shopify sale savings</span><strong>− {money(pricing.saleSavings)}</strong></div>}
              <div><span>Delivery</span><strong>{deliveryLoading ? "Calculating delivery..." : deliveryQuote ? (deliveryQuote.amount > 0 ? money(deliveryQuote.amount) : "Free") : "Calculated at checkout"}</strong></div>
              <div className="grand-total"><span>Total</span><strong>{deliveryQuote ? money(total) : "Calculated at checkout"}</strong></div>
            </div>

            <div className="confirm-actions">
              <button type="button" disabled={busy} className="button-primary" onClick={placeOrder}>{busy ? <><span className="button-spinner" aria-hidden="true" /> Placing order...</> : "Confirm order ✓"}</button>
              <button type="button" disabled={busy} className="button-secondary" onClick={() => setConfirmOpen(false)}>Go back &amp; edit</button>
            </div>
            <button type="button" disabled={busy} className="confirm-later" onClick={() => setConfirmOpen(false)}>Not yet — keep reviewing</button>
          </section>
        </div>
      )}
    </Layout>
  )
}

function OrderSuccess() {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const order = params.get("order") || "Confirmed"
  const total = Number(params.get("total") || 0)
  return (
    <Layout>
      <main className="order-success-page">
        <div className="order-success-card">
          <div className="success-burst" aria-hidden="true">
            <span>✓</span>
          </div>
          <p className="eyebrow">Order placed</p>
          <h1>Your order is confirmed!</h1>
          <p className="order-success-copy">Thank you for shopping with ChickButton. We’ve received your order and will prepare it for delivery.</p>
          <div className="order-success-details">
            <div><span>Order ID</span><strong>#{order}</strong></div>
            <div><span>Total</span><strong>{money(total)}</strong></div>
            <div><span>Payment</span><strong>Cash on delivery</strong></div>
          </div>
          <div className="order-success-actions">
            <Link to="/shop" className="button-primary">Continue shopping →</Link>
            <Link to="/account?tab=orders" className="button-secondary">View my orders</Link>
          </div>
        </div>
      </main>
    </Layout>
  )
}

function Wishlist() {
  const { products, loading: catalogLoading, error: catalogError } = useCatalog()
  const { liked } = useStore()
  return (
    <Layout>
      <main className="page-pad py-10">
        <p className="eyebrow">Saved for later</p>
        <h1 className="page-title">Your little wish list.</h1>
        {liked.length ? (
          <div className="product-grid mt-8">
            {products
              .filter((p) => liked.includes(p.id))
              .map((p) => (
                <ProductCard product={p} key={p.id} />
              ))}
          </div>
        ) : (
          <div className="empty-state">
            <span>♡</span>
            <h2>Your wishlist is waiting.</h2>
            <p>Save the pieces that make your heart skip a beat.</p>
            <Link to="/shop" className="button-primary">
              Find something lovely →
            </Link>
          </div>
        )}
      </main>
    </Layout>
  )
}
function Account() {
  const { products, loading: catalogLoading, error: catalogError } = useCatalog()
  const { liked } = useStore()
  const location = useLocation()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const params = new URLSearchParams(location.search)
  const tab = params.get("tab") || "overview"

  const loadAccount = () => {
    setLoading(true)
    void api("/api/account")
      .then(setData)
      .catch((error: any) => {
        if (error?.status === 401) window.location.replace("/login?next=/account")
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadAccount()
    const onPageShow = () => loadAccount()
    window.addEventListener("pageshow", onPageShow)
    return () => window.removeEventListener("pageshow", onPageShow)
  }, [])

  const profile = data?.profile || {}
  const orders = data?.orders || []
  const addresses = data?.addresses || []
  const totalOrders = orders.length
  const delivered = orders.filter((order: any) => order.status === "completed").length
  const tabs = [
    ["overview", "Overview"],
    ["orders", "My orders"],
    ["wishlist", "Wishlist"],
    ["profile", "Profile"],
    ["addresses", "Addresses"],
  ]

  const logout = async () => {
    await api("/api/auth/logout", { method: "POST" }).catch(() => null); authCache.value = null; authCache.promise = null
    window.history.replaceState(null, "", "/")
    window.location.replace("/")
  }

  return (
    <Layout>
      <main className="page-pad py-10">
        <div className="account-layout">
          <aside className="account-nav">
            <strong>Hello, {profile.full_name || data?.user?.email || "there"}</strong>
            {tabs.map(([key, label]) => (
              <Link className={tab === key ? "active" : ""} key={key} to={`/account?tab=${key}`}>
                {label}
              </Link>
            ))}
            <button className="text-left" onClick={logout}>Log out</button>
          </aside>
          <section key={tab} className="account-tab-panel">
            <p className="eyebrow">Your account</p>
            <h1 className="page-title">Good to see you.</h1>
            {loading ? (
              <p className="mt-8 text-slate-500">Loading your account...</p>
            ) : tab === "overview" ? (
              <>
                <div className="stat-grid mt-8">
                  {[
                    [String(totalOrders).padStart(2, "0"), "Total orders"],
                    [String(liked.length).padStart(2, "0"), "Wishlist items"],
                    [String(delivered).padStart(2, "0"), "Happy deliveries"],
                  ].map(([n, l]) => (
                    <div className="stat" key={l}><strong>{n}</strong><span>{l}</span></div>
                  ))}
                </div>
                <h2 className="mt-10 text-2xl font-black text-[#123e70]">Latest 3 orders</h2>
                {orders.slice(0, 3).map((order: any) => (
                  <div className="order-row" key={order.id}>
                    <span>#{order.order_number}</span>
                    <span>{new Date(order.created_at).toLocaleDateString()}</span>
                    <b>{money(Number(order.total_amount))}</b>
                    <em>{String(order.status).replace("_", " ")}</em>
                  </div>
                ))}
                {!orders.length && <div className="empty-state"><h2>No orders yet.</h2><Link className="button-primary" to="/shop">Start shopping →</Link></div>}
              </>
            ) : tab === "orders" ? (
              <>
                <h2 className="mt-8 text-2xl font-black text-[#123e70]">My orders</h2>
                {orders.length ? orders.map((order: any) => (
                  <div className="order-row" key={order.id}>
                    <span>#{order.order_number}</span>
                    <span>{new Date(order.created_at).toLocaleDateString()}</span>
                    <b>{money(Number(order.total_amount))}</b>
                    <em>{String(order.status).replace("_", " ")}</em>
                  </div>
                )) : <div className="empty-state"><h2>No orders yet.</h2><Link className="button-primary" to="/shop">Start shopping →</Link></div>}
              </>
            ) : tab === "wishlist" ? (
              liked.length ? <div className="product-grid mt-8">{products.filter((p) => liked.includes(p.id)).map((p) => <ProductCard product={p} key={p.id} />)}</div> : <div className="empty-state"><h2>Your wishlist is empty.</h2><Link className="button-primary" to="/shop">Explore products →</Link></div>
            ) : tab === "profile" ? (
              <ProfileEditor profile={profile} onSaved={(next) => setData((current: any) => ({ ...current, profile: next }))} />
            ) : (
              <AddressBook addresses={addresses} onSaved={(address) => setData((current: any) => ({ ...current, addresses: [address, ...(current.addresses || [])] }))} />
            )}
          </section>
        </div>
      </main>
    </Layout>
  )
}

function ProfileEditor({ profile, onSaved }: { profile: any; onSaved: (profile: any) => void }) {
  const [fullName, setFullName] = useState(profile?.full_name || "")
  const [phone, setPhone] = useState(profile?.phone || "")
  const [message, setMessage] = useState("")
  return (
    <form className="checkout-form mt-8" onSubmit={async (event) => {
      event.preventDefault()
      try {
        const data = await api("/api/account", { method: "PATCH", body: JSON.stringify({ fullName, phone }) })
        onSaved(data.profile)
        setMessage("Profile saved.")
      } catch (error: any) { setMessage(error?.message || "Could not save profile.") }
    }}>
      <h2>Profile</h2>
      <Field label="Full name" placeholder="Your full name" value={fullName} onChange={setFullName} />
      <Field label="Phone number" placeholder="03XX XXXXXXX" value={phone} onChange={setPhone} />
      {message && <p className="text-sm text-slate-500">{message}</p>}
      <button className="button-primary">Save profile →</button>
    </form>
  )
}

function AddressBook({ addresses, onSaved }: { addresses: any[]; onSaved: (address: any) => void }) {
  const [form, setForm] = useState({ label: "Home", fullName: "", phone: "", addressLine: "", area: "", city: "", province: "", postalCode: "" })
  const [message, setMessage] = useState("")
  const set = (key: keyof typeof form) => (value: string) => setForm((current) => ({ ...current, [key]: value }))
  return (
    <div className="mt-8">
      <h2 className="text-2xl font-black text-[#123e70]">Saved addresses</h2>
      {addresses.map((address) => (
        <div className="order-row" key={address.id}><span>{address.label || "Address"}</span><span>{address.address_line}</span><b>{address.city}</b><em>{address.is_default ? "Default" : "Saved"}</em></div>
      ))}
      <form className="checkout-form mt-8" onSubmit={async (event) => {
        event.preventDefault()
        try {
          const data = await api("/api/account/addresses", { method: "POST", body: JSON.stringify({ ...form, isDefault: addresses.length === 0 }) })
          onSaved(data.address)
          setMessage("Address saved.")
        } catch (error: any) { setMessage(error?.message || "Could not save address.") }
      }}>
        <h2>Add address</h2>
        <div className="form-grid">
          <Field label="Full name" placeholder="Your full name" value={form.fullName} onChange={set("fullName")} />
          <Field label="Phone" placeholder="03XX XXXXXXX" value={form.phone} onChange={set("phone")} />
        </div>
        <Field label="Address" placeholder="House / street / landmark" value={form.addressLine} onChange={set("addressLine")} />
        <div className="form-grid">
          <Field label="Area" placeholder="Your area" value={form.area} onChange={set("area")} />
          <Field label="City" placeholder="Your city" value={form.city} onChange={set("city")} />
          <Field label="Province" placeholder="Province" value={form.province} onChange={set("province")} />
          <Field label="Postal code" placeholder="Optional" value={form.postalCode} onChange={set("postalCode")} />
        </div>
        {message && <p className="text-sm text-slate-500">{message}</p>}
        <button className="button-primary">Save address →</button>
      </form>
    </div>
  )
}

function InfoPage() {
  const { page: key = "" } = useParams()
  const pages: Record<string, { title: string; text: string; email?: string }> = {
    "size-guide": { title: "Size Guide", text: "Choose the age and size shown on each product. If your child is between sizes, choose the larger size for extra room." },
    shipping: { title: "Shipping", text: "Orders are prepared carefully and delivery details are shown during checkout." },
    returns: { title: "Returns & Exchanges", text: "Eligible items can be exchanged within 7 days when returned unused and in original condition." },
    contact: { title: "Contact Us", text: "Need help? Contact the ChickButton team and we’ll help with products, orders, sizing, or delivery.", email: "Chickbutton786@gmail.com" },
    "our-story": { title: "Our Story", text: "ChickButton is built around playful, practical styles and little everyday moments.", email: "Chickbutton786@gmail.com" },
    privacy: { title: "Privacy Policy", text: "We use account and order information only to provide and improve your shopping experience." },
    terms: { title: "Terms & Conditions", text: "By shopping with ChickButton you agree to the order, payment, delivery, exchange, and account terms shown during checkout." },
    careers: { title: "Careers", text: "We’re growing. Future opportunities will be shared here as the ChickButton team expands." },
    "order-placed": { title: "Order confirmed", text: "Thank you. Your order has been placed successfully. Keep your phone available in case the delivery team needs to contact you." },
  }
  const page = pages[key] || pages["our-story"]
  return <Layout><main className="mx-auto min-h-[55vh] max-w-[900px] px-5 py-16 lg:px-8"><p className="eyebrow">ChickButton</p><h1 className="page-title">{page.title}</h1><p className="mt-6 max-w-2xl text-base leading-8 text-slate-600">{page.text}</p>{page.email && <a className="text-link mt-4 inline-block" href={`mailto:${page.email}`}>{page.email}</a>}<br /><Link className="button-primary mt-8 inline-flex" to="/">Back home →</Link></main></Layout>
}

function PasswordField({
  label = "Password",
  confirm = false,
  value,
  onChange,
}: {
  label?: string
  confirm?: boolean
  value: string
  onChange: (value: string) => void
}) {
  const [visible, setVisible] = useState(false)
  return (
    <Field
      label={label}
      placeholder={confirm ? "Repeat your password" : "At least 8 characters"}
      type={visible ? "text" : "password"}
      value={value}
      onChange={onChange}
      action={<button type="button" className="password-toggle" onClick={() => setVisible(!visible)}>{visible ? "Hide" : "Show"}</button>}
    />
  )
}
function AuthLayout({ mode }: { mode: "login" | "signup" }) {
  const login = mode === "login"
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "", confirm: "" })
  const [error, setError] = useState("")
  const [notice] = useState(() => login && new URLSearchParams(window.location.search).get("created") === "1" ? "Account created successfully. Please log in." : "")
  const [busy, setBusy] = useState(false)
  const set = (key: keyof typeof form) => (value: string) => setForm((current) => ({ ...current, [key]: value }))

  useEffect(() => {
    if (!login) return
    void api("/api/auth/me")
      .then((data) => {
        if (!data?.user) return
        const next = new URLSearchParams(window.location.search).get("next") || "/account"
        window.location.replace(next)
      })
      .catch(() => null)
  }, [login])

  return (
    <main className="auth-page">
      <div className="auth-shell">
        <section className="auth-story">
          <Link to="/"><img src={logo} alt="ChickButton" /></Link>
          <div>
            <p className="eyebrow text-[#f6c536]">ChickButton family</p>
            <h1>{login ? "Welcome back to their little world." : "Make every little chapter special."}</h1>
            <p>Save favourites, track every order and enjoy a smoother checkout designed for busy parents.</p>
          </div>
          <span>Premium pieces · Thoughtful service</span>
        </section>
        <section className="auth-panel">
          <div className="lg:hidden"><Brand /></div>
          <p className="eyebrow">{login ? "Welcome back" : "Join ChickButton"}</p>
          <h2 className="page-title">{login ? "Hello again." : "Create your account."}</h2>
          <p className="mt-3 text-sm text-slate-500">{login ? "Log in only if you want saved addresses, wishlist and order history. Shopping and checkout also work as a guest." : "Create an account for saved addresses and order history — or keep shopping as a guest."}</p>
          <div className="auth-trust-row" aria-label="Shopping benefits">
            <span>✓ Secure account</span><span>♡ Saved favourites</span><span>↺ Faster checkout</span>
          </div>
          <form
            onSubmit={async (event) => {
              event.preventDefault()
              if (busy) return
              setError("")
              if (!login && form.password !== form.confirm) return setError("Passwords do not match.")
              setBusy(true)
              try {
                const path = login ? "/api/auth/login" : "/api/auth/signup"
                const payload = login ? { email: form.email, password: form.password } : { fullName: form.fullName, email: form.email, phone: form.phone, password: form.password }
                const data = await api(path, { method: "POST", body: JSON.stringify(payload) })
                if (!login) {
                  const next = new URLSearchParams(window.location.search).get("next") || "/account"
                  const params = new URLSearchParams({ created: "1", next })
                  if (data.requiresEmailConfirmation) params.set("confirm", "1")
                  window.location.replace(`/login?${params.toString()}`)
                } else {
                  const next = new URLSearchParams(window.location.search).get("next") || "/account"
                  window.location.replace(next)
                }
              } catch (err: any) {
                setError(err?.message || "Authentication failed.")
              } finally { setBusy(false) }
            }}
            className="mt-7 space-y-4"
          >
            {!login && <Field label="Full name" placeholder="Your full name" value={form.fullName} onChange={set("fullName")} />}
            {!login && (
              <div className="form-grid">
                <Field label="Email" placeholder="you@email.com" type="email" value={form.email} onChange={set("email")} />
                <Field label="Phone number" placeholder="03XX XXXXXXX" type="tel" value={form.phone} onChange={set("phone")} />
              </div>
            )}
            {login && <Field label="Email" placeholder="you@email.com" type="email" value={form.email} onChange={set("email")} />}
            <PasswordField value={form.password} onChange={set("password")} />
            {!login && <PasswordField label="Confirm password" confirm value={form.confirm} onChange={set("confirm")} />}
            {login && (
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-slate-500">Your login stays active securely.</span>
                <a className="text-link" href="#">Forgot password?</a>
              </div>
            )}
            {notice && <p className="text-sm font-bold text-emerald-700">{notice}</p>}
            {error && <p className="text-sm font-bold text-rose-500">{error}</p>}
            <button disabled={busy} className="button-primary w-full">{busy ? "Please wait..." : login ? "Log in →" : "Create account →"}</button>
            <Link to="/shop" className="button-secondary w-full">Continue as guest →</Link>
            <p className="auth-switch">{login ? <>New here? <Link to="/signup">Create an account</Link></> : <>Already have an account? <Link to="/login">Log in</Link></>}</p>
          </form>
        </section>
      </div>
    </main>
  )
}

function IntroSplash() {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    if (!visible) return
    const timer = window.setTimeout(() => setVisible(false), 1650)
    return () => window.clearTimeout(timer)
  }, [visible])
  if (!visible) return null
  return (
    <div className="intro-splash" aria-hidden="true">
      <div className="intro-glow intro-glow-one" />
      <div className="intro-glow intro-glow-two" />
      <img src={logo} alt="" />
      <strong>Little styles, big smiles.</strong>
    </div>
  )
}

function WhatsAppButton() {
  return (
    <a className="whatsapp-float" href="https://wa.me/923234021100?text=Hi%20ChickButton%2C%20I%20need%20help%20with%20your%20products." target="_blank" rel="noreferrer" aria-label="Chat with ChickButton on WhatsApp" title="Chat on WhatsApp">
      <span aria-hidden="true"><svg viewBox="0 0 32 32" width="17" height="17" fill="currentColor"><path d="M16 3a12.7 12.7 0 0 0-10.9 19.2L3.5 28.5l6.5-1.7A12.8 12.8 0 1 0 16 3Zm0 2.3a10.5 10.5 0 0 1 0 21 10.4 10.4 0 0 1-5.3-1.4l-.8-.5-3.1.8.8-3-.5-.8A10.5 10.5 0 0 1 16 5.3Zm-5.2 5.2c-.3 0-.7.1-1 .5-.4.4-1.3 1.3-1.3 3.1s1.3 3.6 1.5 3.8c.2.3 2.6 4.1 6.4 5.5 3.2 1.2 3.9 1 4.6.9.7-.1 2.3-.9 2.6-1.9.3-.9.3-1.7.2-1.9-.1-.2-.4-.3-.8-.5l-2.7-1.3c-.4-.1-.7-.2-1 .2l-1.2 1.5c-.2.3-.5.3-.9.1a8.7 8.7 0 0 1-2.6-1.6 9.7 9.7 0 0 1-1.8-2.2c-.2-.4 0-.6.1-.8l.7-.8c.2-.2.3-.4.4-.7.1-.2 0-.5 0-.7l-1.2-2.8c-.3-.8-.7-.7-1-.7Z"/></svg></span><b>WhatsApp</b>
    </a>
  )
}

const router = createBrowserRouter([
  { path: "/", Component: Home },
  { path: "/shop", Component: Shop },
  { path: "/product/:id", Component: ProductPage },
  { path: "/categories", Component: Categories },
  { path: "/wishlist", Component: Wishlist },
  { path: "/cart", Component: Cart },
  { path: "/checkout", Component: Checkout },
  { path: "/order-success", Component: OrderSuccess },
  { path: "/account", Component: Account },
  { path: "/login", Component: () => <AuthLayout mode="login" /> },
  { path: "/signup", Component: () => <AuthLayout mode="signup" /> },
  { path: "/info/:page", Component: InfoPage },
  { path: "*", Component: Home },
])

export default function App() {
  return (
    <CatalogProvider>
      <StoreProvider>
        <SiteContentProvider>
          <IntroSplash />
          <RouterProvider router={router} />
          <WhatsAppButton />
        </SiteContentProvider>
      </StoreProvider>
    </CatalogProvider>
  )
}
