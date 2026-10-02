FINAL DATABASE RESET
====================
Run ONLY:
  06_full_reset_shopify_categories.sql

WARNING: This is an intentional full test reset. It deletes all existing Supabase Auth users and all application data, removes old admin-only database objects, then seeds the final customer catalog.

After running it, clear old localhost/ngrok cookies in your browser and create fresh customer accounts through the website.
