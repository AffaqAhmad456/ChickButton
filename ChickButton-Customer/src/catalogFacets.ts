/**
 * Collection-driven catalogue facets.
 *
 * Shopify collections are the single source of truth. Every product's collection
 * titles are parsed ONCE (cached per product) into a small "facets" object, and
 * every storefront filter (sidebar, Home cards, Categories page) reads from it.
 *
 * Collections this understands (case/spacing/plural tolerant):
 *   Baby Boys, Baby Girls, Baby Sets, Baby Frocks
 *   Boys, Boys Sets|Shirts|Pants|Formal|Traditional
 *   Girls, Girls Sets|Shirts|Frocks|Pants|Formal|Traditional
 *   Summer, Winter, New Arrivals, Sale, Fresh Favourites
 *
 * Any collection you add later that follows "<Baby|Boys|Girls> <Type>" works
 * automatically; no code change needed.
 */

/**
 * Per your brief: the "Baby Boys" / "Baby Girls" sidebar filters also include the
 * plain Boys* / Girls* collections ("the boys collection goes in baby boys").
 * Set to false if you ever want Baby Boys / Baby Girls to mean ONLY products that
 * are inside the Baby Boys / Baby Girls Shopify collections.
 */
export const BABY_AUDIENCE_INCLUDES_BOYS_GIRLS = true

export const GARMENT_TYPES = ["Sets", "Shirts", "Pants", "Frocks", "Formal", "Traditional"] as const

const norm = (text: string) => text.trim().toLowerCase().replace(/\s+/g, " ")

const TYPE_ALIASES: Record<string, string> = {
  set: "sets", sets: "sets",
  shirt: "shirts", shirts: "shirts",
  pant: "pants", pants: "pants",
  frock: "frocks", frocks: "frocks",
  formal: "formal", formals: "formal",
  traditional: "traditional",
}

export type Facets = {
  /** Product sits in Baby* collection(s). */
  baby: boolean
  /** In the "Baby Boys" / "Baby Girls" collection specifically. */
  babyBoys: boolean
  babyGirls: boolean
  /** In plain "Boys" / "Boys <type>" (non-baby) collections. */
  boysSection: boolean
  girlsSection: boolean
  /** Garment types from ANY collection (Boys Formal + Girls Sets -> formal, sets). */
  types: Set<string>
  /** Garment types that come from Baby <type> collections only. */
  babyTypes: Set<string>
  summer: boolean
  winter: boolean
  newArrivals: boolean
  sale: boolean
  freshFavourites: boolean
}

type FacetSource = { collections?: string[]; old?: number }

const cache = new WeakMap<object, Facets>()

export function getFacets(product: FacetSource): Facets {
  const hit = cache.get(product)
  if (hit) return hit

  const f: Facets = {
    baby: false, babyBoys: false, babyGirls: false,
    boysSection: false, girlsSection: false,
    types: new Set(), babyTypes: new Set(),
    summer: false, winter: false, newArrivals: false,
    sale: Boolean(product.old), freshFavourites: false,
  }

  for (const title of product.collections || []) {
    const n = norm(title)
    if (n === "summer") { f.summer = true; continue }
    if (n === "winter") { f.winter = true; continue }
    if (n === "new arrivals" || n === "new arrival") { f.newArrivals = true; continue }
    if (n === "sale") { f.sale = true; continue }
    if (n === "fresh favourites" || n === "fresh favorites") { f.freshFavourites = true; continue }

    const match = /^(baby|boys?|girls?)(?: (.+))?$/.exec(n)
    if (!match) continue
    const prefix = match[1].startsWith("boy") ? "boys" : match[1].startsWith("girl") ? "girls" : "baby"
    const rest = match[2] || ""
    const type = TYPE_ALIASES[rest]

    if (prefix === "baby") {
      f.baby = true
      if (rest === "boys" || rest === "boy") f.babyBoys = true
      else if (rest === "girls" || rest === "girl") f.babyGirls = true
      else if (type) {
        f.babyTypes.add(type)
        f.types.add(type)
        if (type === "frocks") f.babyGirls = true // a frock is always a girls' piece
      }
    } else {
      if (prefix === "boys") f.boysSection = true
      else f.girlsSection = true
      if (type) f.types.add(type)
    }
  }

  cache.set(product, f)
  return f
}

/** Audience used by the "Baby Boys"/"Baby Girls" sidebar filters. */
const isBoys = (f: Facets) => f.babyBoys || (BABY_AUDIENCE_INCLUDES_BOYS_GIRLS && f.boysSection)
const isGirls = (f: Facets) => f.babyGirls || (BABY_AUDIENCE_INCLUDES_BOYS_GIRLS && f.girlsSection)

/**
 * Sidebar "Category" group.
 *
 *  - Same kind of option  -> OR   (Shirts + Pants = either)
 *  - Different kinds      -> AND  (Baby Boys + Formal = formal wear for boys;
 *                                  Girls-type + Summer = summer for girls)
 *  - Summer/Winter        -> OR between them, AND with everything else
 *  - New Arrivals/Sale    -> each one narrows (New Arrivals + Sale = new AND on sale)
 */
export function matchesCategorySelection(f: Facets, selected: string[]): boolean {
  if (!selected.length) return true

  const audience: boolean[] = []
  const types: boolean[] = []
  const seasons: boolean[] = []
  const promos: boolean[] = []

  for (const value of selected) {
    const n = norm(value)
    if (n === "baby boys") audience.push(isBoys(f))
    else if (n === "baby girls") audience.push(isGirls(f))
    else if (n === "baby sets") types.push(f.babyTypes.has("sets"))
    else if (n === "baby frocks") types.push(f.babyTypes.has("frocks"))
    else if (TYPE_ALIASES[n]) types.push(f.types.has(TYPE_ALIASES[n]))
    else if (n === "summer") seasons.push(f.summer)
    else if (n === "winter") seasons.push(f.winter)
    else if (n === "new arrivals") promos.push(f.newArrivals)
    else if (n === "sale") promos.push(f.sale)
    else if (n === "fresh favourites") promos.push(f.freshFavourites)
    else return false // unknown value (e.g. old bookmarked URL): never silently show everything
  }

  if (audience.length && !audience.some(Boolean)) return false
  if (types.length && !types.some(Boolean)) return false
  if (seasons.length && !seasons.some(Boolean)) return false
  if (promos.length && !promos.every(Boolean)) return false
  return true
}

/** Home cards / Categories page scope: ?section=BABY|BOYS|GIRLS (strict: that section's own collections). */
export function matchesSection(f: Facets, section: string): boolean {
  switch (section.trim().toUpperCase()) {
    case "": return true
    case "BABY": return f.baby
    case "BOYS": return f.boysSection
    case "GIRLS": return f.girlsSection
    default: return false
  }
}

const titleCase = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

/** Section + category label shown on product pages / breadcrumbs, derived from collections. */
export function deriveSectionAndCategory(collectionTitles: string[]) {
  const f = getFacets({ collections: collectionTitles })
  const section = f.boysSection ? "BOYS" : f.girlsSection ? "GIRLS" : f.baby ? "BABY" : "SHOP"
  const sectionLabel = titleCase(section.toLowerCase())

  const firstType = [...f.types].find((type) => !f.babyTypes.has(type)) || [...f.types][0]
  const category = firstType
    ? titleCase(firstType)
    : f.babyBoys ? "Baby Boys"
    : f.babyGirls ? "Baby Girls"
    : f.summer ? "Summer"
    : f.winter ? "Winter"
    : f.newArrivals ? "New Arrivals"
    : f.sale ? "Sale"
    : sectionLabel
  return { section, category }
}
