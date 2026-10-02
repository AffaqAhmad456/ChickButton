# ChickButton Backend — Customer Only

Next.js API backend for the ChickButton customer storefront.

## Main capabilities
- Supabase email/password authentication with persistent HttpOnly JWT cookies
- Optional login / guest shopping
- Guest cart via HttpOnly cookie; automatic merge into account cart after login
- Supabase-backed cart for signed-in users
- Size-aware cart lines
- Guest and signed-in checkout
- Account profile, saved addresses, wishlist and order history

## Database migration
For the existing project, run `sql/05_customer_only_reset_and_catalog.sql` once.

## Local development
```bash
npm install
npm run dev
```
Backend: `http://localhost:3000`
