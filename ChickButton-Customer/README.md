# ChickButton Customer Storefront — Final Customer-Only Build

React + TypeScript + Vite storefront. Existing visual design is preserved.

## Final changes
- Login is optional; guest cart and guest checkout work
- Selected size is required for Quick Add and shown in cart
- All test products/sizes match real Supabase variants
- Search works from the header
- Internal navigation uses React Router (no full-page navbar reloads)
- Click-to-zoom product gallery
- Transparent ChickButton logo
- Short first-visit logo splash animation
- WhatsApp contact shortcut: +92 322 4431468

## Run
```bash
npm install
npm run dev
```
Customer: `http://localhost:5173`

The included Vite config is prepared for:
`https://caddie-unlearned-author.ngrok-free.dev`

Only one ngrok tunnel is needed:
```bash
ngrok http 5173
```
