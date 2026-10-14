"""Browser integration test for variant-to-cart-to-checkout behavior.

Run with a local Vite server at http://127.0.0.1:5173 and Playwright installed.
All API responses and writes are handled in memory; every other external host is aborted.
"""

import json
import os
import re
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright


BASE_URL = os.environ.get("CHICKBUTTON_LOCAL_URL", "http://127.0.0.1:5173")
PRODUCT_ID = "gid://shopify/Product/910000000001"
RED_M = "gid://shopify/ProductVariant/910000000011"
RED_L = "gid://shopify/ProductVariant/910000000012"
BLUE_M = "gid://shopify/ProductVariant/910000000013"
BLUE_L = "gid://shopify/ProductVariant/910000000014"


def variant(variant_id, color, size, price, quantity, image):
    return {
        "id": variant_id,
        "title": f"{color} / {size}",
        "sku": f"TEST-{color}-{size}",
        "price": price,
        "compareAtPrice": None,
        "inventoryQuantity": quantity,
        "availableForSale": quantity > 0,
        "inventoryLimited": True,
        "options": {"Color": color, "Size": size},
        "image": image,
    }


RED_IMAGE = "https://images.mock.test/red.png"
BLUE_IMAGE = "https://images.mock.test/blue.png"
PRODUCT = {
    "id": PRODUCT_ID,
    "handle": "mock-color-variant-test",
    "title": "Mock Color Variant Test",
    "description": "Isolated browser test product",
    "status": "ACTIVE",
    "price": 1100,
    "compareAtPrice": None,
    "onSale": False,
    "totalInventory": 11,
    "available": True,
    "images": [RED_IMAGE, BLUE_IMAGE],
    "collections": [],
    "collectionTitles": ["Girls Dresses"],
    "sizes": ["M", "L"],
    "colors": ["Red", "Blue"],
    "variants": [
        variant(RED_M, "Red", "M", 1000, 0, RED_IMAGE),
        variant(RED_L, "Red", "L", 1100, 3, RED_IMAGE),
        variant(BLUE_M, "Blue", "M", 1500, 8, BLUE_IMAGE),
        variant(BLUE_L, "Blue", "L", 1550, 0, BLUE_IMAGE),
    ],
}


def main():
    cart = []
    request_log = []
    blocked_hosts = []
    delivery_payloads = []
    mocked_orders = []

    def row_for(variant_id, quantity):
        selected = next(v for v in PRODUCT["variants"] if v["id"] == variant_id)
        return {
            "id": f"mock:{variant_id}",
            "quantity": quantity,
            "shopify_variant_id": variant_id,
            "product_handle": PRODUCT["handle"],
            "product_variants": {
                "id": variant_id,
                "shopify_variant_id": variant_id,
                "size": selected["options"]["Size"],
                "color": selected["options"]["Color"],
                "price": selected["price"],
                "inventory_quantity": selected["inventoryQuantity"],
                "available_for_sale": selected["availableForSale"],
                "image_url": selected["image"],
                "products": {
                    "id": PRODUCT_ID,
                    "title": PRODUCT["title"],
                    "slug": PRODUCT["handle"],
                    "primary_image_url": selected["image"],
                },
            },
        }

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1365, "height": 900})
        page = context.new_page()
        page.set_default_timeout(8000)

        def handle_route(route):
            request = route.request
            parsed = urlparse(request.url)
            method = request.method
            path = parsed.path

            if parsed.hostname == "images.mock.test":
                # A tiny in-memory SVG lets the real browser load the test images.
                route.fulfill(status=200, content_type="image/svg+xml", body="<svg xmlns='http://www.w3.org/2000/svg' width='8' height='8'><rect width='8' height='8' fill='#7aa'/></svg>")
                return

            if parsed.hostname not in {"127.0.0.1", "localhost"}:
                blocked_hosts.append((parsed.hostname, method))
                route.abort()
                return

            if path.startswith("/api/"):
                request_log.append((method, path))
                body = request.post_data_json if request.post_data else {}
                if path == "/api/shopify/products" and method == "GET":
                    route.fulfill(json={"source": "mock", "count": 1, "products": [PRODUCT], "filters": {"collections": ["Girls Dresses"], "sizes": ["M", "L"], "colors": ["Red", "Blue"]}})
                elif path == "/api/shopify/site-content" and method == "GET":
                    route.fulfill(json={})
                elif path == "/api/wishlist" and method == "GET":
                    route.fulfill(json={"items": [], "guest": True})
                elif path == "/api/cart" and method == "GET":
                    route.fulfill(json={"items": list(cart), "guest": True})
                elif path == "/api/cart" and method == "POST":
                    selected_id = body.get("shopifyVariantId")
                    if not selected_id:
                        route.fulfill(status=400, json={"error": "Missing Shopify variant ID in mock cart write"})
                        return
                    request_log.append(("MOCK_CART_VARIANT", selected_id))
                    existing = next((line for line in cart if line["shopify_variant_id"] == selected_id), None)
                    if existing:
                        existing["quantity"] += body.get("quantity", 1)
                    else:
                        cart.append(row_for(selected_id, body.get("quantity", 1)))
                    route.fulfill(json={"items": list(cart), "guest": True})
                elif path == "/api/cart" and method == "PATCH":
                    selected_id = body.get("shopifyVariantId")
                    request_log.append(("MOCK_CART_VARIANT", selected_id))
                    for line in cart:
                        if line["shopify_variant_id"] == selected_id:
                            line["quantity"] = body["quantity"]
                    route.fulfill(json={"items": list(cart), "guest": True})
                elif path == "/api/account" and method == "GET":
                    route.fulfill(status=401, json={"error": "Guest mock"})
                elif path == "/api/shopify/delivery" and method == "POST":
                    delivery_payloads.append(body)
                    route.fulfill(json={"rate": {"amount": 0, "title": "Mock free delivery", "currencyCode": "PKR"}})
                elif path == "/api/orders" and method == "POST":
                    # This is an in-memory stand-in. It checks the cart state passed to the
                    # mocked checkout boundary; no order service or database is contacted.
                    mocked_orders.append({"body": body, "cart_variant_ids": [line["shopify_variant_id"] for line in cart]})
                    route.fulfill(json={"order": {"order_number": "MOCK-ORDER", "total_amount": 1500}})
                else:
                    route.fulfill(status=404, json={"error": f"Unexpected mocked API call: {method} {path}"})
                return

            # Local Vite modules, assets and navigation only.
            route.continue_()

        context.route("**/*", handle_route)
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto(BASE_URL + "/shop", wait_until="networkidle")
        page.goto(BASE_URL + "/product/910000000001", wait_until="networkidle")
        page.get_by_role("button", name="Blue", exact=True).click()

        assert page.get_by_text("Colour — Blue").is_visible()
        assert page.get_by_role("main").get_by_text("PKR 1,500", exact=True).first.is_visible()
        assert page.get_by_text("In stock", exact=True).is_visible()
        assert page.locator("img.main-product").get_attribute("src").startswith(BLUE_IMAGE)
        sold_size = page.get_by_role("button", name="L · Sold")
        assert sold_size.is_disabled()
        page.get_by_role("button", name="M", exact=True).click()
        page.get_by_role("button", name=re.compile(r"Add to cart.*PKR 1,500")).click()
        page.wait_for_timeout(250)

        assert cart and cart[0]["shopify_variant_id"] == BLUE_M
        assert ("MOCK_CART_VARIANT", BLUE_M) in request_log
        page.reload(wait_until="networkidle")
        page.goto(BASE_URL + "/cart", wait_until="networkidle")
        assert page.get_by_role("main").get_by_text("Blue · Size M · In stock").is_visible()
        assert page.get_by_role("main").get_by_text("PKR 1,500", exact=True).first.is_visible()

        page.get_by_role("link", name="Proceed to checkout").click()
        page.get_by_placeholder("Your full name").fill("Mock Customer")
        page.get_by_placeholder("03XX XXXXXXX").fill("03000000000")
        page.get_by_placeholder("you@example.com").fill("mock@example.test")
        page.get_by_placeholder("House / street / landmark").fill("1 Mock Lane")
        page.get_by_placeholder("Your area").fill("Mock Area")
        page.get_by_placeholder("Your city").fill("Lahore")
        page.get_by_placeholder("Punjab").fill("Punjab")
        page.get_by_placeholder("Optional").fill("54000")
        page.get_by_role("button", name=re.compile(r"Review & place order")).click()
        page.get_by_role("button", name=re.compile(r"Confirm order")).wait_for(state="visible")
        assert delivery_payloads[-1]["lines"] == [{"variantId": BLUE_M, "quantity": 1}]
        page.get_by_role("button", name=re.compile(r"Confirm order")).click()
        page.get_by_text("MOCK-ORDER").wait_for(state="visible")
        assert mocked_orders[-1]["cart_variant_ids"] == [BLUE_M]
        unexpected_external = [item for item in blocked_hosts if item != ("fonts.googleapis.com", "GET")]
        assert not unexpected_external, f"Unexpected external network attempts: {unexpected_external}"
        assert not errors, f"Browser errors: {errors}"

        print(json.dumps({
            "result": "PASS",
            "color_and_size": "Blue / M",
            "variant_id": BLUE_M,
            "cart_persisted_after_reload": True,
            "delivery_payload_variant_id": delivery_payloads[-1]["lines"][0]["variantId"],
            "mock_order_cart_variant_id": mocked_orders[-1]["cart_variant_ids"][0],
            "production_or_other_external_hosts_blocked": True,
            "blocked_external_read_requests": len(blocked_hosts),
            "api_calls": len(request_log),
        }))
        context.close()
        browser.close()


if __name__ == "__main__":
    main()
