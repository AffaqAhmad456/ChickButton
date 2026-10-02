# PROJECT UI REFERENCE

Evidence-based UI reconstruction package for the current ChickButton project. This describes what the checked-in React UI renders today, rather than every feature listed in the imported design brief. The implementation is concentrated in `src/App.tsx` and `src/index.css`; there are no separate page/component/style folders.

## 1. Project UI Summary

ChickButton is implemented as a premium children's clothing storefront with a marketing home page, shop/catalog, product detail, category listing, wishlist, cart, checkout/OTP, account, login and a lightweight admin mockup. The shared look uses navy blue, golden accents, pale blue surfaces, rounded cards and editorial photography. Several pages are sample-data prototypes, and many controls are visual-only; this reference separates implemented UI from the broader imported design brief.

## 2. Frontend Technology Stack

- React 19 + React DOM 19; TypeScript/TSX.
- React Router 8 (`createBrowserRouter` / `RouterProvider`).
- Vite 8 with React and Tailwind CSS v4 plugin; Tailwind utilities appear inline with custom CSS.
- No UI component, icon, animation or data-fetching package is declared.
- Formatting: oxfmt. No Tailwind config; Vite config and TS config are in repository root.

## 3. Complete Route/Page List

Routes configured in `src/App.tsx`:

| Route | Rendered screen | Notes |
|---|---|---|
| `/` | Home | Full marketing/storefront landing page. |
| `/shop` | Shop | Filter chips and static filter panel. Query strings such as `?new=1` and `?sale=1` do not alter initial state. |
| `/product/:id` | Product detail | Parameter is not read; always shows `products[0]` (Sunday Garden Dress). |
| `/categories` | Categories | Six image collection links. |
| `/wishlist` | Wishlist | Empty state on a fresh route load. Store state is route-local and resets on navigation, so likes from other routes do not carry into this route. |
| `/cart` | Cart | Two hard-coded line items. The cart count is local demo state, not a persistent cart model. |
| `/checkout` | Checkout then OTP/success | Submitting required fields swaps to standalone OTP screen inline. No new OTP URL. |
| `/account` | Account overview | Static sample data. |
| `/login` | Login | Static form, no authentication handling. |
| `/admin` | Admin dashboard/section headings | Sidebar buttons change heading and fake data label only. |
| `*` | Home | Unknown paths render the Home screen; no 404 page. |

There is no distinct `/search`, `/checkout/otp`, `/register`, `/orders`, `/admin/products`, `/admin/orders` or `/admin/inventory` route confirmed by router. Header/footer links with `#` are placeholders. Query links named new/sale remain on `/shop` without applying the chip filter.

## 4. Design System

- Brand: ChickButton, a children's clothing storefront. Visual tone is editorial and parent-facing: navy/blue structure, white and pale blue surfaces, warm yellow accents, rounded cards, fashion photography.
- The imported brief at `src/imports/pasted_text/chickbutton-design-brief.md` describes a much broader target product/design; it is source context, not proof that those screens/functions exist in the current UI.
- Reusable style primitives are mostly CSS class selectors in `src/index.css` (`.button-primary`, `.product-card`, `.page-pad`, `.summary`, etc.) combined with Tailwind utility classes directly in JSX. No component library or token package is present.
- Global custom properties: `--background #fffdf9`, `--foreground #173b67`, `--card #fff`, `--card-foreground #173b67`, `--primary #123e70`, `--primary-foreground #fff`, `--secondary #e7f3f8`, `--secondary-foreground #123e70`, `--muted #f5f5f2`, `--muted-foreground #68768a`, `--accent #f6c536`, `--accent-foreground #123e70`, `--border #dce6ed`, `--ring #2d72a9`, `--radius 1.25rem`.
- Several colors are literal CSS/Tailwind values rather than variables; see section 2.

## 5. Colors

| Role | Value | Evidence |
|---|---|---|
| Primary navy | `#123e70` | `:root --primary`; brand, text, buttons, navigation |
| Deep navy | `#0e315b` | Footer background |
| Dark button hover | `#0a2d55` | `.button-primary:hover` |
| Blue foreground | `#173b67` | `:root --foreground` |
| Secondary pale blue | `#e7f3f8` | `:root --secondary`; hero/login/OTP backgrounds |
| Sale panel blue | `#1c5e91` | `.sale-banner` |
| Accent yellow | `#f6c536` | `:root --accent`, accents and focus outline |
| Accent gold variants | `#e5a70d`, `#e3a40a`, `#eaa913`, `#f4c83e`, `#ffdf70`, `#ffd34e`, `#efb91c` | JSX and CSS literals for heading/logo accent, links, badges and highlights |
| Warm page background | `#fffdf9` | `:root --background` |
| Card white | `#ffffff` | `:root --card`; headers/forms/cards |
| Cool surface | `#f5f8f9`, `#f6f9fa`, `#f8fafb` | Benefits, filters, rows and checkout form |
| Border | `#dce6ed` | `:root --border`, dividers |
| Input border | `#cfdde5` | Inputs/selects/quantity/size |
| Main muted text | `#68768a`, `#617184`, `#718094` | Variables and component styles |
| Success | `#299565`, `#dff5e2` | Admin delta and OTP success panel |
| Warning | `#fff8dc`, text `#735b14`; status `#fff0bd`/`#8a6414` | Checkout note and order status |
| Error/sale | `#ffe1dd`, `#cc4e42`; heart `#e85d69` | Sale badge and liked heart |

Source: `src/index.css` lines 4–12 and literal Tailwind colors in `src/App.tsx`.

## 6. Typography

- Google Fonts import: `Nunito Sans` variable optical size 6–12, weights 400–900; `DM Serif Display` regular and italic. Loaded in `src/index.css` line 1. No local font files.
- Default: `'Nunito Sans', sans-serif` on `:root`.
- Display serif: DM Serif Display italic for “Big smiles.” in hero; regular for testimonial quote. Georgia is used only for the large quote mark.
- Hero heading: `clamp(3.25rem, 6vw, 6.5rem)`, weight 900, line-height `.88`, letter-spacing `-.07em`; mobile overrides to `3.5rem`.
- Main/section H1/H2: `clamp(2rem, 3.2vw, 3.4rem)`, weight 900, line-height `1.02`, letter-spacing `-.055em`.
- Page headings often use `text-4xl` (2.25rem), then `sm:text-5xl` for sale banner; OTP heading uses `text-3xl`.
- Product title: 15px, 800; body defaults Nunito Sans, common body 14–16px and 1.5–1.75 line-height; eyebrow 11.2px (0.7rem), 900, `.17em` tracking, uppercase.
- Buttons usually `.86rem` (~13.8px), weight 900. Small badges `.62rem`, 900, `.08em` tracking.
- Exact font styles beyond explicit CSS/Tailwind classes are browser/Tailwind defaults; no separate text-style/token file.

## 7. Spacing

- Shared content container `.page-pad`: max width 1380px, centered, inline padding `clamp(1.25rem, 4vw, 4rem)` (20–64px).
- Header content: max width 1380px; height 80px; horizontal padding 20px, 32px at Tailwind `lg` (1024px). Promo strip padding 16px horizontal and 8px vertical.
- Home content sections use `pt-20` (80px) for collections and `pt-24` (96px) thereafter. Footer margin-top 80px, padding top 64px.
- Main cards: collection gap 20px, product gap `clamp(1rem, 2.2vw, 2rem)`; category gap 19.2px; benefit gap 16px.
- Product card metadata padding top 16px. Feature/benefit card padding 24px. Filter panel 20px. Checkout padding `clamp(1.2rem,3vw,2rem)` (~19–32px). Buttons roughly 13–22px vertical and 20–22px horizontal.
- Desktop grids cap to 1380px for page content and 1280px for footer.

## 8. Borders / Radius / Shadows

- Root radius token: `1.25rem` (20px), but components set their own values.
- Product photo 1.35rem (21.6px); collection card 1.5rem (24px); hero label 1rem (16px); primary/secondary buttons and chips fully pill (`999px`); inputs `.8rem` (12.8px); select `.7rem`; filter/benefit/account cards 1rem; summary 1.2rem; OTP panel 2rem.
- Borders: generally 1px solid `#dce6ed` or `#cfdde5`; filter separators 1px; testimonial uses top/bottom 1px. Empty state uses dashed `#b8ccdb`.
- Shadows: sticker `0 10px 30px #123e7030`; primary-button hover `0 10px 25px #123e7030`; toast `0 15px 30px #123e7050`; auth card `0 18px 60px #123e7020`; admin stat `0 2px 6px #123e7008`; product swatch uses Tailwind `shadow`.
- Header: border-bottom, translucent white `.95`, backdrop blur; no explicit shadow.

## 9. Buttons

- Primary `.button-primary`: inline-flex, centered, 8px gap, no border, pill radius, navy background / white text, `.84rem 1.35rem` padding, `.86rem` 900. Hover darkens to `#0a2d55`, adds navy-tinted shadow and translates up 2px. Global transition applies 200ms to transform/background/shadow/color. No bespoke active/disabled styles.
- Secondary `.button-secondary`: inline-flex, 1px `#96bdd1`, pill, navy text, `.8rem 1.25rem`; hover white background.
- Icon `.icon-button`: 40×40px circular transparent control, navy, 1.35rem glyph; hover pale blue. Used for header controls and product detail wishlist.
- Other variants are local: `.chip` white outlined pill, active/hover navy; `.size-button` 1px outline and `.6rem` radius, selected navy; `.quick-add` navy pill; danger/disabled variants are not defined.
- Header search/wishlist/account icons are hidden below Tailwind `sm` (640px); cart and menu remain.
- Reusable components are not factored into separate files; see source snippets in section 19.

## 10. Forms

- Shared input appearance for `.subscribe input`, `.field input`, `.otp-row input`: width 100%, 1px `#cfdde5`, `.8rem` radius, white background, `.85rem 1rem` padding, navy text, inherited font. Global focus-visible outline is 3px yellow, offset 3px.
- `.field`: label + input grid, 5.6px gap, 16px top margin, label text 12px/900.
- Checkout includes required Full name and Phone number, Address, Area, City, Province, Postal code fields; two-column `.form-grid` collapses to one column at 640px. Browser required validation only; no inline error state is implemented.
- Newsletter email input has placeholder “Your email address”; submit prevents navigation and has no success feedback.
- Login has email/phone and password fields and Remember me checkbox; current form has no submit handler. Login action is an anchor to `/account`.
- OTP: six inputs, `maxLength=1`, numeric input mode, accessible per-digit labels; no per-character state/validation, timer logic, invalid/expired/error design, or backend call. Verify always shows success.
- Shop sort is a native `<select>`; category filters use native checkbox controls; no radio, textarea or file upload styles.

## 11. Cards

- Product card `.product-card`: no outer border/surface; photo is 0.84 aspect ratio, rounded 21.6px, background `#edf5f5`; images cover full photo. Hover crossfades from primary to second photo and scales first image 1.05. Badge top-left, heart top-right; quick-add bottom overlay appears on hover. Product info below: age label, 15px bold navy title, PKR price/optional strikethrough old price, 12px color dot. Product data is four hard-coded items.
- Collection card: image-led, relative, minimum height 360px (290px medium, 260px mobile), rounded 24px, gradient title overlay bottom; image zooms 1.06 over 600ms hover. Home collection grid weights first card 1.25fr, other two 1fr.
- Benefit: pale cool surface, 16px radius, 24px padding; yellow 42px icon tile, bold 16px title and muted copy.
- Stat: pale-blue surface, 16px radius, 20.8px padding; large 32px count.
- Cart item: pale gray-blue surface, 16px radius and 16px padding; 88×104px image, product/variant/price, quantity and remove affordance.
- Summary: pale surface, 19.2px radius, 24px padding; total row top divider and prominent checkout CTA.
- Admin stat: white, 16px radius, 19.2px padding, subtle shadow. Admin chart white with 16px radius/padding and CSS-only fake bars.
- Empty wishlist: dashed-border pale panel max-width 540px, centered, 24px radius, 64px vertical/32px horizontal padding.
- OTP success/auth panels: white; OTP has 32px radius and Tailwind blue-tinted `shadow-xl`; auth max-width 440px, 28px radius, 40px padding and custom shadow.

## 12. Navigation

- Shared storefront header starts with a full-width navy promo bar: “FREE DELIVERY ON ORDERS OVER PKR 4,000 • EASY 7-DAY EXCHANGE”. Sticky header at top, z-index 40, white/95 translucent with backdrop blur and bottom border.
- Brand link left: local logo cropped into 64×48px rounded image, and “ChickButton” wordmark hidden under 640px; wordmark blue with gold “Button”.
- Desktop links appear at Tailwind `lg` (1024px): Home, Shop, Categories, New Arrivals, Sale; spacing 28px. Right controls search, wishlist, account (hidden under 640px), cart count badge, menu button visible below 1024px.
- Mobile menu toggles an in-flow white nav with 2-column links: Shop all, Categories, New arrivals, Sale. No overlay/drawer.
- Footer is a navy block with brand and description, three link columns (Shop/Help/Company), social glyph placeholders, copyright.
- Breadcrumbs are static plain text (`.crumb`) on shop/product/checkout, not a navigation component.
- Account sidebar is a 225px column on wide screens; becomes a 3-column link grid under 1000px and 2 columns under 640px.
- Admin sidebar is 250px navy; hidden entirely under 1000px, with no replacement mobile nav.
- No tabs component except local filter chips/admin buttons; no sticky bottom nav.

## 13. Responsive Design

Only explicit custom media breakpoints are 1000px and 640px. Tailwind utilities also use defaults `sm=640px` and `lg=1024px` (as configured by Tailwind v4 defaults; no custom Tailwind theme breakpoint is present). No explicit tablet/large-desktop-specific breakpoint beyond these and fluid clamps.

| Width | Changes |
|---|---|
| >1000px | Hero 2 columns, product grid 4 columns, shop 230px sidebar + results, product detail 1.15/.85 split, cart/checkout 1fr + 360px summary, category 3 columns, account/admin sidebars visible. |
| ≤1000px | Hero stacks, hero image min-height 420px; product grid 2 columns; shop filter disappears; product detail/cart/checkout stack; category 2 columns; account stacks; account nav 3 columns; admin sidebar disappears and stats 2 columns. |
| ≤640px | Hero image min-height 300px and heading 3.5rem; collections/categories one column; collection cards 260px; quick-add hidden; age strip/newsletter/testimonial stack; sale image widens to 60% and opacity .45; benefits 2 columns; newsletter form stacks; product detail gap 24px/main image min-height 300px/thumbnails smaller; form grid one column; cart items wrap; account stats one column/nav 2 columns/order row 2 columns; admin padding 20px and top stacks. |
- At 640px exactly, Tailwind `sm` utilities begin to show wordmark and search/wishlist/account icons while the custom mobile CSS still applies (max-width:640px). This overlap is source behavior.
- No explicit reduced-motion handling; no image srcset/art direction. Layout and breakpoints sourced from `src/index.css` lines 11–12 and Tailwind classes in `src/App.tsx`.

## 14. Animations / Transitions

- Global `button,a` transition: `transform .2s ease, background .2s ease, box-shadow .2s ease, color .2s ease`.
- Collection image hover: `transform .6s ease`, scale 1.06.
- Product images: opacity `.45s ease`, transform `.55s ease`; hover swaps image and primary scale 1.05. Quick-add uses `.25s ease`, opacity 0→1 and translateY `.7rem`→0. It is hidden on mobile.
- Floating hero stickers: `drift` 3.5s ease-in-out infinite; midpoint translateY(-10px) rotate(8deg).
- `pop` .35s ease scales to 1.24 at midpoint; used by cart badge and selected heart.
- Toast `rise` .3s ease from opacity 0 and translate (0,15px); timeout hides it after 2600ms.
- No motion library. Not implemented despite the imported brief: page transitions, add-to-cart fly animation, modal/filter drawer, animated dropdown, skeleton, accordion animation, OTP timer/success animation beyond static success state. Reduced-motion preference is not used in CSS.

## 15. Icons

- No icon package. Icons are Unicode/emoji text glyphs: `⌕` search, `♡` wishlist, `♙` account, `🛍` cart, `☰` menu, arrows/plus/minus, hearts/stars/clouds and geometric marks. Footer uses `◎ ◉ ◌` placeholders.
- `.icon-button` is a generic span/button visual wrapper, not an SVG icon component. `Icon` helper wraps child content in a 20×20 inline flex span.
- Logo itself is a raster image, not an icon set. No custom SVG assets found.

## 16. Images / Assets

- `src/assets/chickbutton-logo.png` (711,775 bytes): official raster logo image; used in header, footer, OTP and admin side rail. Visual: yellow chick holding a blue button above a blue/yellow ChickButton wordmark, on a light background. Header sizes 64×48px; cropping uses `object-cover`, `object-center`, `mix-blend-multiply`; footer also `mix-blend-screen`.
- `src/imports/image.png` (same byte size as logo) is a duplicated imported asset; no direct reference in `App.tsx`.
- `src/assets/attachment-2` (16,420 bytes; no extension) is an unreferenced text copy of `src/imports/pasted_text/chickbutton-design-brief.md` (matching SHA-256), not a runtime asset.
- Remote Unsplash URLs are hard-coded for hero, products, collections/categories, sale banner and testimonial. Key photo IDs used: `1602030028438-4cf153cbae9e` hero/product; `1519238360530-d9c7b1f8003c`; `1560506840-ec148e82a604`; `1515488042361-ee00e0ddd4e4`; `1503454537195-1dcabb73ffb9`; `1607453998774-d533f65dac99`; `1519457431-44ccd64a579b`; `1599443015574-be5fe8a05783`; `1489710437720-ebb67ec84dd2`. URLs include `auto=format`, width and quality query parameters. Their availability/licensing is not confirmed from repository.
- The age band background uses an inline SVG data URI pattern inside CSS; no standalone SVG/icon/image directories.

## 17. Component Tree

```text
App (RouterProvider)
├── Route wrapper (StoreProvider on storefront/admin routes)
│   └── Layout
│       ├── Header ── Brand, Icon, cart badge, mobile nav
│       ├── Page
│       │   ├── Home ── SectionTitle, Collection, ProductCard
│       │   ├── Shop ── filter panel, chip controls, ProductCard
│       │   ├── ProductPage ── gallery, choices, ProductCard recommendations
│       │   ├── Categories ── Collection
│       │   ├── Wishlist ── ProductCard / empty state
│       │   ├── Cart ── OrderSummary
│       │   ├── Checkout ── Field, OrderSummary → Otp
│       │   ├── Account
│       │   └── Admin (separate admin-shell)
│       ├── Footer ── FooterColumn
│       └── Toast
├── Login (standalone; Field, Brand)
└── Otp (standalone content, entered from checkout)
```

All of these functions are in one file, `src/App.tsx`; there are no separate component modules.

## 18. Page-by-Page UI Blueprint

### Shared Layouts

- `Layout`: shared Header → page children → Footer → optional fixed toast. OTP and Login are standalone and omit shared header/footer.
- Main storefront page container max 1380px with responsive side padding.
- Desktop admin has full-height 250px sidebar + flexible content; only CSS/Fake dashboard widgets and table.
- No separate layout directory or route-level nested layouts.

### Home — `/`

```text
Promo strip → sticky header
Hero: split text/photo, CTA pair, rating/exchange facts, floating marks, season label
Three collection cards
Four-product “Fresh favourites” grid
Navy age-band banner with four age links
Blue sale banner + image
Four benefit cards
Testimonial with quote, stars, author and portrait
Yellow newsletter panel + email input
Footer
```

Desktop hero is 2 columns/min-height 600px; stacks at ≤1000px. Section spacing mostly 80px then 96px. Home exact text and image sources are in `Home()` lines 56–65 of `src/App.tsx`.

### Shop — `/shop`

Breadcrumb; heading “The everyday edit”, count copy and sort select; desktop filter sidebar with category checkbox list and other disclosure headings; chips All/New/Sale; product grid. At ≤1000px filter panel is hidden (no mobile drawer). Grid is 4 columns wide, 2 columns through tablet/mobile. Sort/filter checkbox controls do not all affect products; only chips filter hard-coded badge/old-price fields.

### Product detail — `/product/:id`

Breadcrumb; vertical thumbnails and large image; title/category/age, current and old price, sale badge, description; color swatches; five size buttons; quantity, add-to-cart and wishlist icon; Buy now; three collapsed disclosure rows; three recommendation cards. Gallery is 1.15/.85 split wide, stacks at ≤1000px; gallery remains horizontally arranged on mobile.

### Categories — `/categories`

Eyebrow/title then six image collection cards (Formal, Party, Casual, Traditional, Sleepwear, New Arrivals). Grid 3 columns wide, 2 through 1000px, 1 at 640px and below.

### Cart — `/cart`

Eyebrow/title; two sample product rows and order summary with subtotal, delivery placeholder, total and checkout CTA. Wide two-column layout (summary 360px); stacks ≤1000px; item rows wrap on mobile. Removal controls and one quantity control are display-only; quantities/totals are not reliably connected to summary.

### Checkout / OTP — `/checkout`

Checkout shows contact + shipping form, phone-confirmation note and fixed demo order summary. Submit prevents native navigation and switches component to OTP. OTP is pale-blue full viewport, centered white card with logo, six code boxes, static `00:48`, Verify and Resend buttons. Verify always switches to success panel with sample order number; resend and code validation do nothing.

### Wishlist — `/wishlist`

Eyebrow/title, then either 4-column (responsive) saved product grid or centered dashed empty state. Hearts on product cards toggle in-memory IDs shared within page provider; app route providers are separately instantiated, so navigating between route paths resets state.

### Account — `/account`

Account nav sidebar and content: greeting/title, three stats, one recent order. Static sample values; links are placeholders. Layout/sidebar responsive behavior in section 10.

### Login — `/login`

Standalone pale-blue page and centered 440px white panel; brand, heading, email/phone and password fields, remember checkbox, forgot link, login CTA and create-account link. Form auth not implemented.

### Admin — `/admin`

Sidebar with nine tab buttons and back-to-store link; heading/date and Add product button; dashboard has four stat cards, CSS bar chart and recent-orders table. Selecting another tab only changes title and “Manage …” text; same orders table remains. Sidebar hidden below 1000px. No separate management detail routes or forms confirmed.

## 19. Important Reusable Component Code

Actual implementation is monolithic. The snippets below preserve the key model/state and card primitives; see linked file for complete page JSX and imports.

`src/App.tsx` — Product data and store context:

```tsx
type Product = { id: number; name: string; price: number; old?: number; image: string; image2: string; badge?: string; color: string }

type Store = { cart: number; add: (product?: Product) => void; liked: number[]; toggleLike: (id: number) => void; toast: string }
const StoreContext = createContext<Store | null>(null)
const useStore = () => useContext(StoreContext)!

function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState(2)
  const [liked, setLiked] = useState<number[]>([])
  const [toast, setToast] = useState('')
  const add = (product?: Product) => {
    setCart((n) => n + 1)
    setToast(`${product?.name ?? 'Item'} added to your cart`)
    window.setTimeout(() => setToast(''), 2600)
  }
  const toggleLike = (id: number) => setLiked((items) =>
    items.includes(id) ? items.filter((item) => item !== id) : [...items, id])
  return <StoreContext.Provider value={{ cart, add, liked, toggleLike, toast }}>{children}</StoreContext.Provider>
}
```

`ProductCard` uses `.product-card`, `.product-photo`, `.badge`, `.heart`, `.quick-add`; full source: `src/App.tsx` line 54. Key JSX structure:

```tsx
<article className="product-card group">
  <div className="product-photo">
    <img src={product.image} alt={product.name} className="primary-img" />
    <img src={product.image2} alt="" className="secondary-img" />
    {product.badge && <span className={`badge ${product.badge === 'SALE' ? 'sale' : ''}`}>{product.badge}</span>}
    <button onClick={() => toggleLike(product.id)} className={`heart ${liked.includes(product.id) ? 'liked' : ''}`} aria-label="Save item">
      {liked.includes(product.id) ? '♥' : '♡'}
    </button>
    <button onClick={() => add(product)} className="quick-add">Quick add <span>+</span></button>
  </div>
  {/* Product age, name, PKR price, optional old price, and color dot follow. */}
</article>
```

`Field` source (`src/App.tsx` line 79):

```tsx
function Field({ label, placeholder }: { label: string; placeholder: string }) {
  return <label className="field"><span>{label}</span><input required placeholder={placeholder} /></label>
}
```

Exact full reusable source for Brand/Header/Footer/Layout/SectionTitle/Collection/OrderSummary and every page can be copied from `src/App.tsx`; no extraction into component files has happened.

## 20. Global Styling Code

Source: `src/index.css`. Imports must remain first. Core exact declarations:

```css
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Nunito+Sans:opsz,wght@6..12,400;6..12,500;6..12,600;6..12,700;6..12,800;6..12,900&display=swap');
@import 'tailwindcss';

:root {
  --background:#fffdf9; --foreground:#173b67; --card:#ffffff; --card-foreground:#173b67;
  --primary:#123e70; --primary-foreground:#fff; --secondary:#e7f3f8; --secondary-foreground:#123e70;
  --muted:#f5f5f2; --muted-foreground:#68768a; --accent:#f6c536; --accent-foreground:#123e70;
  --border:#dce6ed; --ring:#2d72a9; --radius:1.25rem;
  font-family:'Nunito Sans',sans-serif; color:var(--foreground); background:var(--background);
}
html { scroll-behavior:smooth; }
body { margin:0; background:var(--background); }
button,a { transition:transform .2s ease, background .2s ease, box-shadow .2s ease, color .2s ease; }
button:focus-visible,a:focus-visible,input:focus-visible,select:focus-visible {
  outline:3px solid #f6c536; outline-offset:3px;
}
```

The rest of `src/index.css` holds all bespoke class rules and the three keyframes `drift`, `pop`, `rise`, followed by the 1000px/640px media queries. There is no Tailwind config or separate theme file. Tailwind is enabled by `@tailwindcss/vite` in `vite.config.ts`.

## 21. UI DNA Cheat Sheet

- **Design style:** editorial premium children's fashion storefront.
- **Primary:** deep navy blue `#123e70`; deeper footer navy `#0e315b`.
- **Accents:** golden yellow `#f6c536` and warm gold variants, with pale sky-blue backgrounds.
- **Background:** warm off-white page (`#fffdf9`), white cards, pale blue-gray surfaces.
- **Typography:** Nunito Sans for UI/body; DM Serif Display italic/regular for select editorial statements.
- **Cards:** large rounded image cards, minimal borders, subtle hover image movement; neutral surfaces for forms and utility panels.
- **Buttons:** bold navy pill primary, outlined blue secondary, circular icon controls.
- **Radius:** mostly 16–28px cards; pills on CTAs; 20px root token.
- **Shadows:** soft, blue-tinted elevation only on hover, toast, auth and decorative marks.
- **Spacing:** generous 80–96px home sections; max 1380px content width; fluid page gutters.
- **Images:** large photographic child-fashion imagery, mostly remote Unsplash; paired images on product cards.
- **Icons:** Unicode text glyphs / emoji, no icon library.
- **Motion:** gentle hover scale/crossfade, floating hero sticker, quick-add reveal, toast and pop keyframes.
- **Responsive:** collapse to two product columns under 1000px, single collection/category column by 640px; hide shop filters/admin rail at 1000px.
- **Personality:** warm, polished, accessible-feeling and parent-focused, with playful accents.

## 22. File-to-UI Mapping

| File | UI responsibility |
|---|---|
| `src/App.tsx` | Product sample data; context state; all components, route table and all screen JSX. |
| `src/index.css` | Google font import; custom properties; component styles; responsive media rules and keyframes. |
| `src/main.tsx` | React root mount; imports app/global stylesheet; StrictMode. |
| `src/assets/chickbutton-logo.png` | Official brand logo rendered in header/footer/auth/admin. |
| `src/imports/image.png` | Duplicate logo-sized imported image; not referenced. |
| `src/imports/pasted_text/chickbutton-design-brief.md` | Original target/design brief; not runtime UI code. |
| `src/assets/attachment-2` | Unreferenced 16,420-byte file without extension; UI role/format not confirmed. |
| `index.html` | Root shell, viewport, Figma-injected title/language and main entry script. |
| `package.json` | React 19, React Router 8, Tailwind 4/Vite 8 toolchain; no UI/icon/motion packages. |
| `vite.config.ts` | Vite, React and Tailwind plugins; Figma Make site configuration and dev helpers. |
| `new-file.tsx` | Empty file (0 bytes); contributes no UI. |
| `.figma/make/site.json` | Figma Make site metadata (description, robots and accessibility settings); no visible storefront component. |

## 23. Exact UI Rebuild Prompt

```text
Rebuild the current ChickButton UI from this reference in React 19, React Router 8 and Tailwind CSS v4. Preserve its visual identity and implemented behavior: premium children's clothing editorial storefront, navy #123e70, golden yellow #f6c536, warm off-white #fffdf9 and pale blue #e7f3f8. Use Nunito Sans for UI/body and DM Serif Display for italic/editorial accents. Use the supplied `src/assets/chickbutton-logo.png` in the header, footer, auth/OTP and admin.

Implement routes `/`, `/shop`, `/product/:id`, `/categories`, `/wishlist`, `/cart`, `/checkout`, `/account`, `/login`, `/admin`, plus current catch-all-to-home behavior. Current product detail always renders the first sample product; current pages use local demo data and frontend-only store state. Keep the shared storefront header/footer/toast; login and OTP are standalone. Do not imply backend or persistent functionality.

Home screen order: navy delivery/exchange promo strip; sticky translucent white 80px header; split 600px editorial hero with copy/rating/CTAs and fashion photo; three collection cards; four product cards; navy age-strip with four age ranges; blue sale promotion/photo; four benefits; quote/testimonial; pale yellow newsletter; navy footer. Use max 1380px content width, fluid 20–64px gutters, generous 80–96px vertical section spacing.

Shop has heading/breadcrumb/sort select, 230px desktop filter panel, All/New/Sale chips and product grid. Product detail has thumbnails/main photo beside title, prices, badges, description, color and size choices, quantity/add-to-cart/wishlist, buy CTA, details disclosures and recommendation cards. Categories has six photo cards. Cart uses two sample rows + summary. Checkout has contact/shipping form and order note; submit switches to six-box OTP view and verify to success view. Wishlist has product grid or dashed empty state. Account shows nav, three stats and one order. Login is a centered white form card. Admin has navy sidebar, stats, CSS bar chart and orders table; tab buttons change only heading/label.

Components/classes: Brand, Header, Footer/FooterColumn, Layout, SectionTitle, ProductCard, Collection, OrderSummary, Field. Product image aspect ratio .84; 21.6px radius; crossfade paired image and scale on hover; overlay SALE/NEW badge, heart and hover quick-add. Buttons are pill-shaped navy/white primary or outlined secondary. Inputs use 1px #cfdde5 borders, 12.8px radius. Use the exact design tokens and CSS values in this reference and source mappings.

Responsive: custom CSS breakpoint 1000px collapses hero and product-detail/cart/checkout, changes product grid to 2 columns, hides shop filters and admin rail, stacks account. 640px changes collections/categories to one column, hides quick-add, stacks newsletter/testimonial/forms, shrinks hero image to 300px, wraps cart and account/admin contents. Tailwind `sm`=640 and `lg`=1024 visibility classes apply too. Preserve this breakpoint overlap.

Motion: global 200ms ease transitions; collection image scale 1.06/.6s; product image .45s opacity/.55s transform and scale 1.05; quick-add .25s reveal; float sticker drift 3.5s infinite; pop .35s; toast rise .3s and 2.6s timeout. No animation library or custom icon package; icons are text glyphs. Use the supplied logo and remote Unsplash image URLs from source where available. Do not invent extra screens, palettes, integrations, responsive behavior or interactions beyond this codebase.
```

## 24. Missing / Unconfirmed Information

- No screenshot or browser measurement was supplied; exact rendered dimensions may vary with viewport, font loading and image service response.
- The URL contents/rights/availability of remote Unsplash photos are not confirmed from repository files.
- `src/assets/attachment-2` has no extension and is unused; content matches the imported design brief exactly.
- No local font files, SVG icon files, icon library, animation library, Tailwind config, CSS modules, test suite, backend API, database, authentication integration or persistent cart are present in the inspected file inventory.
- The extensive design brief describes wishlist/cart/account/auth/admin management, OTP safeguards, search/filter/sort, error/empty/loading states and other production features that are not implemented in the current source. They must not be reported as existing UI. Only the empty wishlist has a coded empty state; broader loading/error/404 states are not confirmed.
- A true mobile filter drawer, functional product sort/filter controls, working search/account links, actual checkout/payment/order persistence, OTP validation/timer/resend, full admin CRUD, mobile admin navigation, and an error page are not confirmed.
- Routes with values `/shop?new=1` and `/shop?sale=1` link to Shop but route code does not consume query values. Unknown paths currently render Home.

### Source Evidence / Traceability

- Route declarations: `src/App.tsx` lines 91–92.
- Shared state and product model/data: `src/App.tsx` lines 6–28.
- Header/footer/layout and reusable elements: `src/App.tsx` lines 31–54.
- Home, shop, product, categories: `src/App.tsx` lines 56–73.
- Cart, checkout, OTP, wishlist, account, admin, login: `src/App.tsx` lines 75–89.
- Global colors, typography, reusable CSS and breakpoints: `src/index.css` lines 1–12.
- Runtime and package stack: `package.json`, `src/main.tsx`, `vite.config.ts`, `tsconfig.json`.
- Asset inventory: `src/assets/`, `src/imports/`.
