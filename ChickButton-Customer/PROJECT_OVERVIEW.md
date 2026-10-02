# ChickButton — Project Reverse-Engineering Report

**Scope:** Static inspection of the current project source and configuration. This report documents existing code and separates it from the product wishes in the imported design brief. No application source, configuration, data, or dependencies were changed. `node_modules`, lockfile internals, and generated/tool-managed internals were not treated as application code.

**Evidence labels:** **CONFIRMED** = directly present in inspected files; **INFERRED** = follows directly from the code structure but is not stated explicitly; **NOT FOUND / NOT IMPLEMENTED** = no implementation was located in the project inventory/search; **MOCK** = hard-coded or frontend-only demonstration behavior.

## 1. Executive Project Summary

ChickButton is a React storefront prototype for children's clothing. It includes home, shop, product detail, categories, wishlist, cart, checkout with a simulated OTP step, account, login and a lightweight admin dashboard. The visual system is implemented with Tailwind utilities and a single custom stylesheet.

**Most important architecture fact:** the repository is a frontend-only demo. Product data and sample account/order/admin data are hard-coded in the React application. Context state is in memory. No backend server, API client, database/ORM, authentication service or persistent browser storage was found. Screens with words such as “order”, “verified”, “login” and “admin” should not be interpreted as working backend capabilities.

## 2. Project Purpose

- **Project name:** ChickButton (brand label in `src/App.tsx`; package name is `figma-make-app`).
- **Project type:** Children's fashion e-commerce storefront prototype with an admin-style dashboard mockup.
- **Purpose represented by the UI:** browse children's clothing, view a product, select size/quantity, simulate adding to cart, and present checkout/OTP/account/admin screens.
- **Confirmed user roles:** visitor/shopper-facing UI and an admin-labeled UI are present. Authenticated shopper/admin roles are **NOT IMPLEMENTED**; there is no identity or role check.
- **Implemented features:** landing page, static catalog cards, category tiles, client-side catalog chips, in-memory heart/cart-count interactions, cart display, required checkout fields, simulated OTP success, static account overview and tab-labeled admin screen.
- **Not equivalent to a functioning shop:** no API, orders, inventory, pricing authority, actual product lookup, payment processing, customer login or admin mutation exists.
- **Evidence:** `src/App.tsx`, `src/index.css`, `package.json`; intended broader functionality is described separately in `src/imports/pasted_text/chickbutton-design-brief.md`.

## 3. Technology Stack

| Layer | Technology | Purpose | Evidence |
|---|---|---|---|
| UI | React 19 / React DOM 19 | Component rendering and client-side state | `package.json`, `src/main.tsx` |
| Language | TypeScript 5.7 / TSX | Typed React components and Vite config | `package.json`, `tsconfig.json`, `src/App.tsx` |
| Routing | React Router 8 (`react-router`) | Browser route table and page selection | `package.json`, `src/App.tsx` |
| Bundler/dev server | Vite 8 | Serves/transforms TSX and builds app | `package.json`, `vite.config.ts` |
| Styling | Tailwind CSS 4 + custom CSS | Utility classes plus app-specific design rules | `package.json`, `vite.config.ts`, `src/index.css` |
| Fonts | Google Fonts: Nunito Sans, DM Serif Display | UI/body and editorial display accents | `src/index.css` |
| Formatting | oxfmt | `format` script | `package.json` |
| Figma Make | Vite plugin helpers/config | Site metadata, preview/build integration | `vite.config.ts`, `.figma/make/*` |
| Backend | **NOT FOUND** | No server framework or backend entry point | Entire meaningful file tree; dependencies |
| Database / ORM | **NOT FOUND** | No schema, migration, driver or ORM | Entire meaningful file tree; dependencies |
| Auth | **NOT FOUND** | No auth package or session/token implementation | Source search; no auth service/routes |
| Validation | Browser native `required` only in checkout fields | Basic required-field form constraint | `Field()` in `src/App.tsx`; no validation library |
| API client | **NOT FOUND** | No fetch/axios client or `/api` call | Source search |

The direct runtime dependencies are React, React DOM and React Router. The UI does not depend on an icon, animation, form, server-state or component library. `vite.config.ts` imports React and Tailwind Vite plugins, and also contains Figma Make-specific plugins implemented in that config.

## 4. Architecture Overview

### Actual runtime path

```text
Browser
  ↓ loads index.html
src/main.tsx
  ↓ creates React root and renders <App /> in StrictMode
src/App.tsx
  ↓ creates React Router browser router
route component
  ↓ most storefront routes instantiate their own StoreProvider
page component + shared Layout/Header/Footer
  ↓ reads hard-coded products or local React state
rendered UI
```

There is no further request path: **no HTTP request → backend route → service → ORM → database** is present. “Data” is a four-item `products` array and component-local literals. `StoreProvider` contains cart count, liked product IDs and toast text in React state only.

### Conceptual diagram adapted to this repository

```text
Vite serves the frontend
        ↓
React entry and RouterProvider
        ↓
Route component → page/layout/components
        ↓
hard-coded constants + useState + StoreContext
        ↓
React renders updated UI
```

## 5. Complete Important File Tree

```text
Export to Markdown/
├── index.html                         # Vite HTML shell
├── package.json                       # scripts and direct packages
├── package-lock.json                  # npm dependency lock
├── pnpm-lock.yaml                     # pnpm dependency lock
├── vite.config.ts                     # Vite/React/Tailwind/Figma config
├── tsconfig.json                      # TypeScript compiler settings
├── .mise.toml                         # Node/pnpm tool versions
├── .gitignore                         # ignored-file rules
├── .gitattributes                     # Git/LFS/text handling rules
├── AGENTS.md                          # workspace/development instructions
├── CLAUDE.md                          # refers to AGENTS.md
├── new-file.tsx                       # empty, no UI behavior
├── UI_REFERENCE.md                    # preceding UI-focused reference
├── PROJECT_OVERVIEW.md                # this report
├── .figma/make/
│   ├── site.json                      # Figma site metadata
│   ├── dev.json                       # files triggering Figma dev restart/install
│   └── tool wrappers/scripts          # Figma Make integration helpers
└── src/
    ├── main.tsx                       # React mount
    ├── App.tsx                        # all routes, components, data and state
    ├── index.css                      # all custom/global styling
    ├── vite-env.d.ts                  # Vite ambient types
    ├── assets/
    │   ├── chickbutton-logo.png       # brand image used by UI
    │   └── attachment-2                # text copy of imported design brief
    └── imports/
        ├── image.png                  # duplicate logo image; not imported by app
        └── pasted_text/
            └── chickbutton-design-brief.md  # desired product/design specification
```

The `.figma/make` directory also includes `import-assets.mjs`, `langserver`, `install`, `format`, `dev`, `deploy-preview`, `deploy`, and `analyze-routes`. These are Figma Make tool wrappers/integration files, not product backend routes or application features. `node_modules` is generated and omitted. No `backend/`, `server/`, `api/`, `database/`, `prisma/`, `tests/`, `hooks/`, `services/`, or `repositories/` directories were found.

## 6. File-by-File Overview

### `src/App.tsx`

- **Purpose/layer/status:** Active frontend application module; it owns the route table, static data, state provider, all UI components and all screen markup. There are no separate page/component modules.
- **Main imports:** `RouterProvider`, `createBrowserRouter` from `react-router`; `createContext`, `useContext`, `useState` from React; `./index.css`; `./assets/chickbutton-logo.png`.
- **Exports:** default `App()`. Other declarations are local to the module.
- **Types/data:** `Product` has `id`, `name`, `price`, optional `old`, `image`, `image2`, optional `badge`, `color`. `products` is a literal array of four entries with PKR prices and remote Unsplash image URLs. `Store` defines `cart`, `add`, `liked`, `toggleLike`, and `toast`.
- **State:** `StoreProvider` initializes cart count to 2, liked IDs to `[]`, toast to `''`. `add(product?)` increments count and sets a message, clearing it after 2600ms. `toggleLike(id)` toggles an ID in the local array. There is no persistence or network call.
- **Components:** `Brand`, `Header`, `Footer`, `FooterColumn`, `Layout`, `SectionTitle`, `ProductCard`, `Home`, `Collection`, `Shop`, `ProductPage`, `Categories`, `Cart`, `OrderSummary`, `Checkout`, `Field`, `Otp`, `Wishlist`, `Account`, `Admin`, `Login`, `StoreProvider`; helper `Icon`, `money`, `useStore`.
- **Inputs/outputs:** page components receive router params implicitly (but `ProductPage` does not read them); reusable `ProductCard` receives `{ product: Product }`; `Layout` receives children. Components return React elements.
- **Important logic:** `Shop` filters the hard-coded array by All/New/Sale chip only. `Checkout` changes to `<Otp />` on native-valid submit. `Otp` switches to a static success message on any Verify click. `Admin` local tab state changes the heading. Route wrappers create separate providers.
- **API/database/auth:** none. No API endpoints, DB operations, credential storage, authorization, or session checks.
- **Side effects:** browser `window.setTimeout` for toast clearing. Navigation via anchors; no local/session storage, cookies, or network effects.
- **Feature status:** active UI; all data/operations are mock or local frontend-only.

### `src/main.tsx`

- **Purpose/layer/status:** active app entry.
- **Imports:** React, `createRoot` from `react-dom/client`, `App`, `./index.css`.
- **Behavior:** selects `document.getElementById('root')`, creates React root, renders `<App />` inside `<React.StrictMode>`.
- **API/database/auth/state:** no direct API/database/auth; mounts App that initializes router/state.
- **Used by:** `/src/main.tsx` is referenced from `index.html` as a Vite module entry.

### `src/index.css`

- **Purpose/layer/status:** active global and component stylesheet.
- **Imports:** Google Fonts stylesheet and Tailwind CSS v4.
- **Contains:** root palette/custom properties and Nunito Sans default; global links/buttons/focus styling; page, button, navigation, card, form, admin styles; `drift`, `pop`, `rise` keyframes; custom breakpoints at 1000px and 640px.
- **Exports/API/database/state:** CSS only; no API, state, auth or DB.
- **Used by:** imported in both `src/main.tsx` and `src/App.tsx` (the repeated import is present in source; bundler deduplication is tooling behavior, not application logic).

### `src/assets/chickbutton-logo.png`

- **Purpose/layer/status:** active raster logo.
- **Used by:** imported as `logo` in `src/App.tsx`; Brand renders in header/footer/OTP/login/admin.
- **Data/API/state:** none.

### `src/imports/image.png`

- **Purpose/status:** binary image file matching the logo file size; not imported by `src/App.tsx`. Treat as unused/duplicated asset based on source references, not necessarily safe to delete.

### `src/imports/pasted_text/chickbutton-design-brief.md`

- **Purpose/status:** imported product brief; not executable UI source. It specifies desired screens/features such as OTP/order management/admin CRUD that are not proof of implementation.
- **Duplicate:** SHA-256 matches `src/assets/attachment-2`, a text file without an extension. Both are unused at runtime.

### `src/vite-env.d.ts`

- **Purpose/layer/status:** Vite ambient type reference (`/// <reference types="vite/client" />`). No product exports or runtime behavior.

### `index.html`

- **Purpose/layer/status:** active document shell; root `<div id="root">`, viewport/charset and module script `/src/main.tsx`.
- **Figma placeholders:** title/language/head/body comment slots are transformed by Vite plugin code in `vite.config.ts` using `.figma/make/site.json`.
- **API/database/auth:** none.

### `package.json`

- **Purpose/layer/status:** active package metadata and scripts.
- **Scripts:** `dev: vite`; `build: vite build`; `preview: vite preview`; `format: oxfmt`.
- **Direct runtime dependencies:** `react`, `react-dom`, `react-router` (declared with version ranges in the manifest).
- **Development dependencies:** `@tailwindcss/vite` connects Tailwind v4 to Vite; `@vitejs/plugin-react` handles React transforms/refresh; `vite` runs dev/build/preview; `typescript` compiles/types TS; `@types/node`, `@types/react`, `@types/react-dom` provide TypeScript declarations; `tailwindcss` supplies utilities; `oxfmt` formats source.
- **Not present:** server framework, HTTP client, ORM/database driver, auth, test framework or form validation dependency.

### `vite.config.ts`

- **Purpose/layer/status:** active Vite/Figma config.
- **Imports:** Vite config/plugin types, React plugin, Tailwind plugin, `node:path`, `.figma/make/site.json`.
- **Config behavior:** base URL from `FIGMA_PUBLIC_URL`; development-mode sourcemap/minification settings; React/Tailwind and Figma-specific plugins; `@` alias to `src`; host/port read from env with defaults; strict port; preview host/port.
- **Inline plugins:** `figmaSiteConfiguration` maps site metadata into HTML/robots/favicon/social/analytics/accessibility slots; `figmaErrorOverlayReplay` replays Vite dev error payload; `figmaReactRefreshBoundaryFallback` reloads if refresh boundary disappears; `figmaMakeKitPlugin` serves Figma stories endpoint. These are build/dev integration, not business API/backend endpoints.
- **API/database/auth:** no application backend, DB or auth.

### `tsconfig.json`

- **Purpose/layer/status:** active TypeScript config; ES2020 target, ESNext modules, bundler resolution, strict mode, no emit, React JSX, alias `@/*` to `src/*`; includes `src` and `vite.config.ts`.

### `.mise.toml`

- **Purpose/layer/status:** toolchain declaration for Node 22 and pnpm 10.34.3; no UI behavior.

### `.figma/make/site.json`, `.figma/make/dev.json` and helper scripts

- **Purpose/layer/status:** Figma Make metadata and task wrappers. `site.json` contains description, no-index robots setting and accessibility flags. `dev.json` identifies package/lock files that trigger install and leaves extra restart patterns empty. Scripts are tool integration, not application API routes.
- **`import-assets.mjs`:** exports `frontendAssets()`, a Vite plugin that discovers/copies non-ignored frontend assets during build. It is not imported in the checked-in `vite.config.ts`; whether the platform invokes it externally is **NOT CONFIRMED**.

### `AGENTS.md` and `CLAUDE.md`

- **Purpose/status:** workspace instructions. `CLAUDE.md` contains `@AGENTS.md`; these are not imported by the running app.

### `.gitignore`, `.gitattributes`, `package-lock.json`, `pnpm-lock.yaml`

- **Purpose/status:** repository/tooling metadata and generated dependency resolution. Lockfiles do not establish additional application behavior. `.gitattributes` contains general Git/LFS rules; no application DB schema was found from its `.sqlite` patterns.

### `new-file.tsx`

- **Purpose/status:** zero-byte file; no exports, imports, behavior or feature dependency.

### `UI_REFERENCE.md` and this `PROJECT_OVERVIEW.md`

- Documentation outputs, not runtime application modules. `UI_REFERENCE.md` focuses on UI reconstruction; this report covers architecture, feature flow and absent backend concerns.

## 7. Frontend Architecture

- **Entry:** `index.html` → `src/main.tsx` → `App` in `StrictMode`.
- **Routing:** `createBrowserRouter` and `RouterProvider` are defined in `src/App.tsx`. The router is module-level.
- **Pages/layouts:** all page components and `Layout` are in `src/App.tsx`. Storefront layout is Header → page → Footer plus optional toast. Login is standalone; OTP is rendered from checkout as standalone content.
- **Reusable components:** `Brand`, `Header`, `Footer`, `FooterColumn`, `SectionTitle`, `ProductCard`, `Collection`, `OrderSummary`, `Field`; all local functions in App module.
- **Hooks/state:** only built-in `useState`, `useContext`, plus local `useStore()` wrapper. No external/global state package or server cache.
- **Forms/validation:** browser-native email/required/checkbox/input behavior; no schema validator. Checkout required fields use `required`; login/newsletter have no submit handling; OTP inputs are uncontrolled.
- **Storage/errors/loading:** no browser storage; no API error/loading handling, suspense, route error boundary or skeleton loaders found. The only timed effect is toast dismissal.
- **Styling/assets:** Tailwind utilities plus `src/index.css`; logo imported locally, product/editorial images are remote Unsplash URLs.
- **Parent-child example:** `App → route element → StoreProvider → page → Layout → Header/ProductCard/Footer`. `ProductCard` consumes StoreContext and updates count/liked IDs.

## 8. Frontend Routes

| Route | Page | Purpose | Auth required | Main data source |
|---|---|---|---|---|
| `/` | `Home` | Editorial home/sections | No auth check | Hard-coded copy and remote images |
| `/shop` | `Shop` | Browse sample product grid | No | Module `products` array; local `filter` state |
| `/product/:id` | `ProductPage` | Sample product detail | No | Always `products[0]`; `id` is ignored |
| `/categories` | `Categories` | Six collection tiles | No | Hard-coded tuples and image URLs |
| `/wishlist` | `Wishlist` | Saved items/empty state | No | Route-local StoreContext; resets when route component unmounts |
| `/cart` | `Cart` | Two sample lines and summary | No | Hard-coded products; local quantity state; fixed summary text |
| `/checkout` | `Checkout` | Contact/shipping demo, then OTP | No | Required form fields and static `OrderSummary` |
| `/account` | `Account` | Static user greeting/stats/order | No | Hard-coded Ayesha/sample order data |
| `/login` | `Login` | Login form presentation | No enforcement | Static form; no handler/API |
| `/admin` | `Admin` | Dashboard and section labels | No enforcement | Static order/stat data; local selected tab |
| `*` | inline Home wrapper | Fallback | No | Same hard-coded home UI |

Dynamic route `:id` is parsed by the router but never read by `ProductPage`; product cards are not linked to this path. Query strings `?new=1`/`?sale=1` are not consumed to initialize filters. No other page/API route exists in router.

## 9. Components

All components live in `src/App.tsx`:

| Component | Props/state/events | Purpose / relationships |
|---|---|---|
| `App` | No props/state | Supplies `RouterProvider` with module router. |
| `StoreProvider` | `children`; owns `cart`, `liked`, `toast`; `add`, `toggleLike` | Provides local `StoreContext`; wraps most routes individually. |
| `Brand` | None | Logo image + wordmark; used in header/footer/auth/admin. |
| `Header` | Reads `useStore`; owns mobile `open` | Promo strip, sticky nav, controls; menu button toggles in-flow nav. |
| `Footer` / `FooterColumn` | `FooterColumn`: title, links | Brand description, static link columns/social glyphs. |
| `Layout` | `children`; reads toast | Shared Header/footer/toast frame. |
| `SectionTitle` | eyebrow?, title, action? | Repeated home/product section heading. |
| `ProductCard` | `product: Product`; reads context | Images/badge/price/heart/quick-add. Events toggle liked ID or increment cart count. No product navigation. |
| `Collection` | title, subtitle, img | Image link to `/shop`. |
| `Home` | None | Marketing home sections, uses Collection/ProductCard/SectionTitle. |
| `Shop` | Owns `filter` string | Chips filter product array; native select/category/color filters are not wired to product results. |
| `ProductPage` | Owns `size`, `qty`; reads `add` | First product only; size/qty UI; add invokes shared count. Thumbnails, swatches, buy-now, accordions lack functional handlers/content. |
| `Categories` | None | Six `Collection` cards. |
| `Cart` | Reads `cart`, `add`; local `quantity` | Two static line items; only first row quantity wired; remove and second decrement are inert. |
| `OrderSummary` | None | Static subtotal/total and checkout link. |
| `Checkout` | Owns `placed` | Native required form; submit toggles to `Otp`. |
| `Field` | label, placeholder | Required labeled input. |
| `Otp` | Owns `done` | Six uncontrolled inputs; any Verify click shows static success. Resend is inert. |
| `Wishlist` | Reads `liked` | Products if liked array has ids, otherwise empty state. Route-local provider means likes don't persist across navigation. |
| `Account` | None | Static customer nav, three stats, one order. |
| `Admin` | Owns `tab` | Sidebar buttons update title; same sample table remains. |
| `Login` | None | Static fields; form has no submit handler; “Log in” anchor leads to account page. |

`Icon` is a text wrapper; `money(price)` formats as `PKR ${price.toLocaleString()}`. These are helpers, not API-backed components.

## 10. Hooks

- **Custom hook:** `useStore()` in `src/App.tsx` calls `useContext(StoreContext)!` and returns `Store`. Inputs: none. Consumers: `Header`, `Layout`, `ProductCard`, `ProductPage`, `Cart`, `Wishlist`. It has no effects, API calls or storage. The non-null assertion relies on these consumers being below a provider.
- **`useState`:** React built-in, not a project custom hook. Used for provider cart/liked/toast, Header menu, Shop filter, ProductPage size/quantity, Cart quantity, Checkout placed state, Otp done state, Admin tab. Inputs are initial literals; returned state/setter stay in each mounted component.
- **`useContext`:** React built-in used only inside `useStore`.
- No other custom hooks were found. There is no `useCart`, `useProducts`, `useAuth`, query/cache hook, effect hook, data-fetching hook or storage hook.

## 11. Context / Global State

| State mechanism | Stored data | Provider/consumers | Persistence/backend sync |
|---|---|---|---|
| `StoreContext` | `cart: number` initialized 2; `liked: number[]`; `toast: string`; add/toggle functions | `StoreProvider` route element; consumed by Header/Layout/ProductCard/ProductPage/Cart/Wishlist | In-memory only; no browser persistence/API. Provider is instantiated per route, so navigation resets it. |
| Local `useState` | Menu visibility, filters, selected size/qty, checkout step, OTP done, admin tab | Owning component only | In-memory component state; no persistence/backend. |

No Redux/Zustand/React Query/context beyond `StoreContext`. The context's `cart` is a count, not a cart item collection; static cart rows and order totals do not derive from it.

## 12. Services / Repositories

**NOT FOUND.** There are no service/repository/API client modules or service folders. No method/URL/payload/response/error contract exists to document. The nearest data layer is the module-level `products` array and component state in `src/App.tsx`; those are not repositories or remote services.

## 13. Complete API Inventory

| Method | Endpoint | Frontend caller | Backend handler | Purpose | Auth | Database |
|---|---|---|---|---|---|---|
| — | **No application API found** | — | — | No `fetch`, Axios, `/api/*`, GraphQL client/server or backend route was found. | N/A | N/A |

The custom Vite dev plugin exposes `/.figma/make/kit.html` while serving development stories. It is a Figma Make tooling endpoint, not a ChickButton product API; no story modules were found. Vite also serves configured robots output. These do not establish application backend behavior.

## 14. API End-to-End Traces

**No API traces exist**, since there are no application HTTP calls or backend handlers. The real local interaction traces are:

```text
Click ProductCard quick add
→ ProductCard onClick
→ StoreContext add(product)
→ cart count increments, toast string set
→ Layout renders toast for up to 2600ms
```

```text
Click ProductCard heart
→ ProductCard onClick
→ StoreContext toggleLike(product.id)
→ route-local liked[] updates
→ heart glyph/class rerenders
```

```text
Submit Checkout form
→ browser enforces required fields
→ onSubmit prevents default
→ Checkout setPlaced(true)
→ Checkout returns <Otp />
→ clicking Verify sets done=true
→ static confirmation is shown
```

These paths do not call remote services or create cart/order records.

## 15. Backend Architecture

**NOT FOUND / NOT IMPLEMENTED in this repository.** There is no backend entry point, server framework, API routing, controller/service/repository chain, middleware, ORM or database connection. Vite is the frontend development/build server. Figma Vite plugin middleware exists inside `vite.config.ts` but handles tooling behavior only.

No backend request lifecycle can be truthfully drawn. The product brief's desired backend/admin/order features are not implementations.

## 16. Backend File Overview

No meaningful backend files were found. No route/controller/service/auth middleware, schema validation, server error helper or DB adapter exists in the project tree. `vite.config.ts` contains dev-server middleware for Figma plugin metadata/robots and must not be mistaken for an app API.

## 17. Database Architecture

**NOT FOUND.** No database engine/config, database driver, ORM, migration, seed, schema, model/table definition or query appears in the source/dependencies. `.gitattributes` has generic SQLite file handling rules; that is Git metadata and does not confirm a database.

## 18. Models / Tables / Relationships

- No persistent database models/tables or confirmed relationships.
- `Product` is a TypeScript frontend display type, not a DB model: `id`, `name`, `price`, `old?`, `image`, `image2`, `badge?`, `color`.
- `Store` is a TypeScript context value shape: `cart`, `add`, `liked`, `toggleLike`, `toast`; not a database entity.
- No primary/foreign keys, indexes, enums, constraints or ER diagram can be confirmed.
- `products`, order rows, user `Ayesha`, statistics and statuses are static mock content.

## 19. Authentication & Authorization

- **Signup/login/password hashing/session/JWT/cookie:** NOT IMPLEMENTED/NOT FOUND.
- `/login` renders email-or-phone and password fields, remember checkbox and links, but has no submit handler. Its “Log in” anchor navigates directly to `/account`; this is navigation, not credential validation.
- `/account` is directly routable without a guard and displays hard-coded “Ayesha”.
- `/admin` is directly routable; no login, role claim, guard or permission check exists. The admin label/nav provides no security.
- No cookie name, HTTP-only/Secure/SameSite attributes, token or session store is present.
- Therefore customer/admin roles are visual labels only. UI visibility is not authorization.

## 20. Product Flow

```text
Module-level products[] in src/App.tsx
  ├─ Home → ProductCard grid
  ├─ Shop → chips filter array → ProductCard grid
  ├─ Categories → Collection cards only (no actual category-filter state)
  └─ ProductPage → always products[0], regardless of route id
```

Four sample products are hard-coded: Sunday Garden Dress (PKR 4,450, old 5,200, SALE), Cloud Pocket Set (3,950, NEW), Little Linen Co-ord (5,150), Daisy Play Set (3,650, old 4,100, SALE). `Shop` supports only in-memory chip filtering: Sale means `old` is present; New means badge is `NEW`. Sort select, sidebar checks, age/size/price/availability/colour filters do not update results. Product detail size changes local selected style only; product thumbnail, color, variant inventory, stock checks, image persistence and product-specific lookup are not implemented.

No API/service/hook/database stage exists. Image sources are fixed Unsplash URLs.

## 21. Cart Flow

```text
ProductCard Quick add or product detail Add to cart
→ StoreContext add(product?)
→ increments integer cart count and shows toast
→ header badge rerenders
```

There is no cart item state or backend persistence. `/cart` independently renders two fixed line items. Its first quantity is initialized from the count, but that count does not determine line composition or price; another item row has a hard-coded quantity. One row's increase button calls `add(products[1])` (changes badge/toast), but row quantity remains fixed. Remove buttons and second-row decrement do not have handlers. Summary is fixed at PKR 8,400, not calculated from quantities or cart context. No guest/auth cart, merge, stock cap, server ownership, remove API or stock validation exists.

## 22. Wishlist Flow

```text
ProductCard heart click
→ StoreContext toggleLike(id)
→ liked[] in current route provider changes
→ heart switches between ♡ and ♥ and liked styling
```

Wishlist screen renders an empty state when the route provider starts empty. Route providers are distinct and links/navigation remount route elements, so liked IDs are not carried from shop/home into `/wishlist`. No storage, API, customer association or guest/auth sync exists.

## 23. Checkout Flow

```text
Cart CTA → /checkout
→ checkout form (name, phone, address, area, city, province, postal)
→ browser required constraints for required fields
→ submit handler prevents default and marks placed=true
→ inline Otp component appears
```

The order summary is static. No cart verification, authoritative price calculation, payment, stock validation, backend request, order record, cart cleanup or server response. Postal code label says optional but `Field` sets `required` for every rendered field; hence the browser actually requires it. This is a discrepancy between label and validation attribute visible in code.

## 24. OTP Flow

- `Otp` is a local component in `src/App.tsx`, shown after Checkout's local `placed` state becomes true; it has no dedicated route.
- Six text inputs each have `maxLength=1` and numeric input mode, but their values are not read or checked.
- `00:48` is static text, not a countdown. “Resend OTP” has no handler.
- Any click on Verify immediately sets `done=true`; static success shows sample order `#CB-20718`.
- No OTP generation, secret/code storage, expiry, sending (SMS/email), retry, rate limit, order binding, backend verification or failure state.
- OTP is a visual simulation, not authentication or order verification.

## 25. Orders Flow

Orders exist only as display literals: account shows one recent order; Admin uses three sample rows and a static summary. No order creation, server order number generation, customer ownership, status mutation, payment record, OTP status change or lifecycle persistence is implemented. The checkout success order number is a literal.

## 26. Admin Flow

- `/admin` is directly available with no auth.
- Local `tab` starts as “Dashboard”. Sidebar buttons choose Dashboard, Orders, Products, Categories, Customers, Inventory, Discounts, Reports or Settings. The content mostly changes heading/“Manage …” label; the same hard-coded orders table stays visible.
- Dashboard displays four fixed stats, CSS fake revenue bars and three fixed orders. Add product button has no handler.
- No order details, CRUD, inventory edits, category/customer management, discount logic, report query, settings form, backend API or database interaction.
- Under 1000px the admin sidebar is hidden, and no mobile navigation replacement appears.

## 27. Browser Storage

| Key | Storage type | File | Data | Read/written by | Safety |
|---|---|---|---|---|---|
| — | None found | Source search | No localStorage/sessionStorage/IndexedDB/cookie use located | — | N/A |

Cart/wishlist state disappears on route provider teardown/reload. No malformed-storage parsing behavior is applicable.

## 28. Environment Variables

Only names are recorded; no values/secrets are disclosed.

| Name | Use | Location | Required? |
|---|---|---|---|
| `FIGMA_PUBLIC_URL` | Vite base URL prefix | `vite.config.ts` | Optional; config has fallback |
| `FIGMA_DEV_SERVER_HOST` | Vite dev/preview host | `vite.config.ts` | Optional; config has fallback |
| `PORT` | Vite dev/preview port | `vite.config.ts` | Optional; config has fallback |

No frontend API base URL, database URL, auth secret, SMS credential or payment variable was found. `mode` is a Vite config callback argument, not an environment variable; development mode controls sourcemap/minification in `vite.config.ts`.

## 29. Configuration

- **`package.json`:** dev/build/preview/format scripts and dependency declaration; see section 6 for details.
- **`vite.config.ts`:** React, Tailwind and Figma Make plugins, alias `@`, public base, server/preview ports/host, custom Figma middleware/plugins.
- **`tsconfig.json`:** strict no-emit TypeScript, ES2020, bundler module resolution, JSX transform, alias.
- **`.mise.toml`:** Node and pnpm versions.
- **`.figma/make/site.json`:** Figma site description/no-index/accessibility options.
- **`.figma/make/dev.json`:** Figma install/restart trigger lists.
- **Tailwind:** no `tailwind.config.*`; Tailwind 4 plugin in Vite.
- **Not found:** Next config, ESLint/Prettier config, Prisma config, Docker/deployment configuration, backend environment files.
- **`index.html`:** minimal Vite shell, Figma comment slots transformed by plugin.

## 30. Validation

- Checkout `Field()` renders `<input required>` for every field, including “Postal code — Optional”; browser-native required validation applies to all.
- Login form has no submit behavior; no password/email/phone validation beyond input types (inputs do not specify `type="password"` or email type in `Field`).
- Newsletter input uses `type="email"` but form handler only prevents default.
- OTP boxes have `maxLength=1` and `inputMode="numeric"`; code is not read or validated.
- Shop checkboxes/chips have no schema validation. No Zod/Yup/Joi/manual shared validation or backend validation exists.
- No validation at service/API/database layers because those layers are not present.

## 31. Security

- **Confirmed protections:** browser `required` validation on checkout fields; accessible labels on some buttons/OTP inputs; focus-visible outlines in CSS. These are usability measures, not server security.
- **Not found:** password hashing, session/JWT, HTTP-only cookie, auth/role authorization, ownership checks, CSRF protection, rate limiting, backend validation, CORS policy, server-calculated price, stock verification, API security middleware.
- **Injection/ORM safety:** not applicable to absent backend/DB. No SQL construction or DB operations found.
- **Security interpretation:** login/admin are unprotected demo views. The app does not send credential data anywhere in current code.
- Avoid using the prototype's client-displayed cart totals/statuses as authoritative transaction data.

## 32. Important Business Rules

Confirmed UI/demo rules only:

- Currency display helper prefixes formatted numbers with `PKR`.
- Product ages display as “Ages 3–8” on cards; detail says ages 3–8.
- Sale chip includes products with `old` value; New chip matches `badge === 'NEW'`.
- Product detail quantity decrement clamps to at least 1; increase has no upper bound.
- Product detail default size is `4–5Y`; selecting size updates local selected class.
- Provider's cart badge starts at 2 and increments on add.
- Toast clears after 2600ms.
- Required checkout fields use browser constraints, despite postal-code label saying optional.

No stock cap, inventory rule, user ownership, authoritative totals, discount math, payment/order rule, OTP policy or admin-only rule is implemented.

## 33. Feature Dependency Map

```text
React entry → App router
├── StoreProvider (per route)
│   ├── Header cart badge
│   ├── ProductCard quick-add → cart count/toast
│   ├── ProductCard heart → local liked IDs
│   └── Wishlist → local liked IDs (fresh provider on route)
├── Home → Collection + ProductCard + SectionTitle
├── Shop → products[] + local chip filter + ProductCard
├── Product detail → products[0] + size/qty local state + add
├── Cart → fixed product rows + fixed OrderSummary
├── Checkout → Field + OrderSummary → Otp local view
├── Account → literals
└── Admin → local tab + literals/fake chart/table
```

No dependency branch leads to an API, auth provider or database.

## 34. Feature Status Matrix

| Feature | Frontend | API | Backend | Database | Status |
|---|---|---|---|---|---|
| Home/brand browsing | Yes | None | None | None | MOCK/static UI |
| Product catalog | Four sample cards | None | None | None | MOCK |
| Product detail | Always first product | None | None | None | PARTIAL / static |
| Shop filter chips | Local in-memory filter | None | None | None | PARTIAL |
| Sort/sidebar filters | Controls displayed only | None | None | None | NOT IMPLEMENTED |
| Cart badge/add | Local count/toast | None | None | None | LOCAL FRONTEND ONLY |
| Cart line items/totals | Hard-coded | None | None | None | MOCK |
| Wishlist | Local route state | None | None | None | LOCAL FRONTEND ONLY; cross-route flow ineffective |
| Checkout | Native form -> view switch | None | None | None | MOCK |
| OTP | Inputs + unconditional success | None | None | None | MOCK |
| Customer login/account | Static views | None | None | None | NOT IMPLEMENTED (auth); MOCK screen |
| Orders | Sample labels/rows | None | None | None | MOCK |
| Admin | Static stats/table/local tab | None | None | None | MOCK |
| Persistent storage | None | N/A | N/A | N/A | NOT IMPLEMENTED |

## 35. Mock vs Real Functionality

- **Real browser UI behavior:** route selection, menu toggle, Shop chips, size selection style, product detail quantity display, local heart toggle on current route, local cart count/toast, checkout native required constraints and local checkout→OTP→success view changes.
- **Local frontend only:** `StoreProvider` cart integer, liked IDs, toast; page component state.
- **Hard-coded/mock:** all products and image URLs, cart rows/totals, account user/stats/order, OTP countdown/code/success, admin stats/chart/orders, category inventory/count copy.
- **Not implemented:** API/database, actual login/signup, order creation, payment, stock, persistent cart/wishlist, actual search, working sort/sidebar filter, resend/OTP validation, admin CRUD, status updates.

## 36. Unused / Legacy Code

- `new-file.tsx` is zero bytes and unused.
- `src/imports/image.png` duplicates the logo-sized asset and is not imported by app code.
- `src/assets/attachment-2` is an exact content copy of `src/imports/pasted_text/chickbutton-design-brief.md` (matching SHA-256); neither is imported at runtime.
- `UI_REFERENCE.md` is prior documentation, not runtime code.
- No further legacy status is asserted without evidence. `products` array is actively used, even though it is demo data.
- `package-lock.json` and `pnpm-lock.yaml` are both present; whether both are intentionally maintained is **NOT CONFIRMED**.

## 37. Observed Project Issues

Documented only; not changed:

- The route-local `StoreProvider` is recreated on navigation, so liked products do not populate a freshly opened wishlist route and cart count resets.
- `/product/:id` ignores `id`; product cards themselves are not links to the product route.
- Cart page quantities/removal/summary are not connected consistently to local cart count; one row's quantity controls are inert or only update badge.
- Product-detail thumbnails, color swatches, Buy now, and detail disclosures have no meaningful state/content handlers.
- Search icon is non-interactive; native sort/filter controls are mostly presentation only.
- Login form has no submit handler; CTA navigates directly to account. Password label is rendered through generic text `Field` without password input type.
- Checkout marks every `Field` required, including one labeled optional.
- OTP timer does not count down; resend is inert; any verify click declares success without reading input.
- Admin screen has no authentication, mutations or separate admin screens; Add product has no handler.
- Header/footer/account links with `href="#"` are placeholders; unknown routes render Home rather than 404.
- No loading/error state, route error UI, API error handling or persistence is present.

## 38. Complete Customer Journey

```text
Open / → browse editorial home
  → choose Shop or Categories
  → optionally change Shop All/New/Sale chip
  → click a card heart or Quick add (local state only)
  → manually navigate to /product/:id if desired (always same product)
  → /cart shows fixed demo rows
  → checkout link → required form
  → valid submit switches to OTP view
  → any Verify click shows fixed “Order confirmed” sample
```

No real item-to-cart checkout, payment, auth, order creation, delivery or persisted confirmation completes this journey. Card titles/photos do not route to product detail.

## 39. Complete Admin Journey

```text
Open /admin directly (no login check)
→ dashboard title, fixed metrics, CSS bars and sample orders
→ click sidebar tab
→ heading/“Manage …” text updates; same table remains
→ Add product button has no action
```

No protected admin login, order detail/status action, product CRUD, inventory flow, customer/discount/settings persistence or backend communication exists.

## 40. Project Explained in Simple Words

The browser opens a React page. The router chooses which screen to show. The screen gets example products and sample text directly from the code. A few buttons change temporary React state, such as changing a heart, increasing a cart badge, or showing an OTP success panel. That temporary state is lost when its component/provider is removed. There is no server or database behind these screens, so the demo does not create a real cart, account, OTP or order.

```text
React screen shows the button
↓
onClick changes local component/context state
↓
React redraws the visible UI
```

## 41. Most Important Files

| File | Why it matters | What would fail if it broke |
|---|---|---|
| `src/App.tsx` | All routes, page markup, data and app state | Most/all app screens and interactions |
| `src/main.tsx` | Mounts root React app | Application would not render |
| `src/index.css` | Brand style, responsive layout, component appearances | UI would lose intended styling/responsive behavior |
| `index.html` | Root DOM and entry script | Vite app shell/mount point |
| `package.json` | Runtime/tool dependencies and commands | Install/dev/build/format commands |
| `vite.config.ts` | Vite/React/Tailwind/Figma integration | Dev/build configuration and Figma integration |
| `tsconfig.json` | TS compiler behavior and `@` alias | Typechecking/editor resolution behavior |
| `src/assets/chickbutton-logo.png` | Brand mark imported by App | Logo image references |
| `.figma/make/site.json` | Figma-generated page metadata | Figma page metadata injection |
| `src/imports/pasted_text/chickbutton-design-brief.md` | Desired product scope context only | No runtime behavior; removes imported brief documentation |

## 42. Recommended Code Reading Order

1. `package.json` — understand scripts and direct dependencies.
2. `index.html` — find the app root and entry module.
3. `src/main.tsx` — see how React mounts.
4. `src/App.tsx` lines 1–28 — product type/data and StoreContext state.
5. `src/App.tsx` lines 31–54 — Brand/Header/Layout/reusable card pieces.
6. `src/App.tsx` lines 56–89 — pages and their demo interactions.
7. `src/App.tsx` lines 91–92 — route table and fallback.
8. `src/index.css` — tokens, component CSS, breakpoints and animations.
9. `vite.config.ts`, `tsconfig.json`, `.mise.toml` — build/toolchain.
10. `src/imports/pasted_text/chickbutton-design-brief.md` — separate desired feature brief; do not confuse it with implemented code.

## 43. CHATGPT PROJECT HANDOFF

```text
PROJECT: ChickButton, a React frontend-only children's fashion e-commerce prototype in C:\Users\User\Downloads\Export to Markdown.

PURPOSE/STATUS
- UI demo only. No backend, product API, auth, database, ORM, server-side validation, persistent storage, payment or real orders were found.
- Source brief `src/imports/pasted_text/chickbutton-design-brief.md` describes a much larger target product; distinguish desired functionality from current code.

STACK/STARTUP
- React 19, React DOM 19, TypeScript 5.7, React Router 8, Vite 8, Tailwind CSS v4, oxfmt.
- `npm run dev` runs Vite; `index.html` loads `/src/main.tsx`; `main.tsx` creates root and renders `<App />` in StrictMode.
- `App.tsx` exports default `App()` wrapping `RouterProvider`.
- No app API base URL or HTTP client. Vite/Figma plugin middleware in `vite.config.ts` is tooling only.

FILES
- `src/App.tsx`: all types/data/context/components/routes/screens.
- `src/index.css`: Google Fonts, color tokens, CSS component styles, responsive rules/keyframes.
- `src/main.tsx`: entry mount.
- `src/assets/chickbutton-logo.png`: active logo.
- `src/imports/pasted_text/chickbutton-design-brief.md` and `src/assets/attachment-2`: same brief, duplicate, not runtime.
- `index.html`, `package.json`, `vite.config.ts`, `tsconfig.json`, `.mise.toml` configure runtime/build.
- `new-file.tsx` empty; `src/imports/image.png` logo duplicate not imported.

ROUTES
- `/` Home; `/shop` Shop; `/product/:id` ProductPage (ignores id, always first product); `/categories`; `/wishlist`; `/cart`; `/checkout`; `/account`; `/login`; `/admin`; `*` renders Home.
- Query `?new=1`/`?sale=1` is not parsed. No distinct OTP route; Checkout conditionally returns `Otp`.

FRONTEND COMPONENTS/STATE
- Components in App.tsx: `StoreProvider`, `Brand`, `Header`, `Footer`, `FooterColumn`, `Layout`, `SectionTitle`, `ProductCard`, `Home`, `Collection`, `Shop`, `ProductPage`, `Categories`, `Cart`, `OrderSummary`, `Checkout`, `Field`, `Otp`, `Wishlist`, `Account`, `Admin`, `Login`.
- Custom hook `useStore()` wraps `useContext(StoreContext)!`; no other custom hooks.
- `Product` type: `{ id, name, price, old?, image, image2, badge?, color }`; module `products` contains four hard-coded products.
- `StoreProvider` initializes `cart=2`, `liked=[]`, `toast=''`; `add(product?)` increments count + toast and clears toast after 2600ms; `toggleLike(id)` toggles a local ID.
- Each route component instantiates a new `StoreProvider`, so state resets across route navigation; nothing persists.
- Other `useState`: header open, shop filter, product size/quantity, cart quantity, checkout placed, OTP done, admin tab.

FEATURE FLOWS
- Product cards use hard-coded array. Shop chip All/New/Sale filters local array; sort select/sidebar controls do not sort/filter.
- Quick add updates only integer badge/toast, not cart lines. Cart rows, quantities, remove controls and PKR 8,400 summary are mostly static/inconsistent.
- Wishlist heart toggles route-local state, which is lost before /wishlist is reached via navigation.
- Checkout Fields render `required`; postal code is labeled optional but required by code. Submit only swaps view to `Otp`.
- `Otp` has six uncontrolled maxLength=1 fields, static timer, inert resend; any Verify click displays hard-coded `#CB-20718` success. No OTP service.
- Login has no handler; Log in anchor navigates to `/account`. Account content is hard-coded.
- Admin `/admin` is unprotected. `Admin` tab buttons change heading only; static table remains. Add product is inert.

API/BACKEND/DATABASE/AUTH
- API inventory: none. No fetch/axios/API route/server handler.
- Backend files, DB schemas/models/migrations, ORM, auth provider, password hashing, cookies/tokens, authorization roles: NOT FOUND/NOT IMPLEMENTED.
- Browser storage: no localStorage/sessionStorage/cookies/IndexedDB.
- Forms rely only on browser-native required behavior; no Zod/Yup/Joi or shared validation.

IMPORTANT IDENTIFIERS
- Route components: `Home`, `Shop`, `ProductPage`, `Categories`, `Wishlist`, `Cart`, `Checkout`, `Account`, `Login`, `Admin`.
- Store: `StoreContext`, `StoreProvider`, `useStore`, `add`, `toggleLike`, `toast`.
- There are no confirmed backend endpoint names, ORM model names or auth function names.

CONFIG/ENV
- Environment names in `vite.config.ts`: `FIGMA_PUBLIC_URL`, `FIGMA_DEV_SERVER_HOST`, `PORT`. No API/database/auth env variable found.
- Vite React + Tailwind + Figma plugins; `@` alias points to `src`; Tailwind v4 has no config file.

DESIGN
- Brand blue #123e70, accent #f6c536, warm background #fffdf9, pale blue #e7f3f8; Nunito Sans + DM Serif Display from Google Fonts.
- Full visual/responsive tokens are documented in `UI_REFERENCE.md`.

CURRENT ISSUES/EVIDENCE
- Product route ignores id; product cards do not navigate to it.
- State is route-local, cart is only a count, wishlist cannot persist into its own route, and cart totals/rows don't derive from state.
- OTP/login/admin screens are mockups; no real orders or security checks.
- `PROJECT_OVERVIEW.md` is the complete reverse-engineering report; `UI_REFERENCE.md` is the UI blueprint.
```
