Update my existing e-commerce website UI while keeping the same current design system, colors, typography, spacing, cards, buttons, and overall visual style.

Do not redesign the whole website. Only add and improve the following features.

1. Add Login and Signup Pages

Create two new responsive pages:

Login Page

Include:

Email / phone field
Password field
Show/hide password
Forgot Password link
Login button
Link to Signup page
Signup Page

Include:

Full Name
Email
Phone Number
Password
Confirm Password
Signup button
Link back to Login

Keep both pages clean, modern, responsive, and consistent with the existing website UI.

2. Fix the Right-Side Sidebar

Fix and improve the existing right-side sidebar.

Requirements:

Proper alignment
Correct spacing
No overlapping content
Responsive on desktop, tablet, and mobile
Smooth opening/closing behavior
Keep the sidebar consistent with the existing website design
Do not disturb the main page layout
3. Create an Admin Dashboard / Orders Management Page

Create a new Admin Orders page where the admin can track every customer order.

Each order should show information such as:

Order ID
Customer name
Phone number
Delivery address
Ordered products
Product quantity
Total order amount
Order date
Current order status

The admin must be able to clearly see the order progress.

Every Order Must Have 3 Status Steps
Step 1 — Order Confirmed

Label:

Order Confirmed

This status should be completed automatically when the buyer successfully verifies the order using OTP.

The admin should NOT need to manually confirm this step.

Example:

Buyer verifies OTP
→ Order Confirmed automatically becomes checked.

Step 2 — Shipped

Label:

Shipped

This status is controlled manually by the admin.

When the rider collects the parcel from the seller/store, the admin should click or tick:

Shipped

The UI should clearly show that the order has moved from:

Order Confirmed → Shipped

Step 3 — Order Completed

Label:

Order Completed

This is also controlled manually by the admin.

When the admin receives confirmation that:

Rider delivered the parcel successfully
Customer received the parcel
Payment has been received

the admin should click/tick:

Order Completed

The UI should then clearly show:

Order Confirmed ✓
Shipped ✓
Order Completed ✓

Use a visual stepper, progress tracker, status badges, or another clean professional UI pattern.

4. Admin Wallet

Add an Admin Wallet section to the Admin Dashboard.

When an order becomes:

Order Completed

the final amount of that completed order should automatically be added to the Admin Wallet.

Example:

Order Total = Rs. 5,000

When admin marks:

Order Completed ✓

Admin Wallet:

Rs. 20,000
→ Rs. 25,000

The wallet UI should show:

Current wallet balance
Completed order income
Transaction history
Order ID related to each transaction
Amount received
Date
Transaction status

Do not add the order amount to the Admin Wallet before the order is completed.

5. Cart Amount Calculation

Fix the cart UI and calculation behavior.

Whenever a customer adds an item to the cart:

Product quantity should increase
Item subtotal should update
Cart total amount should increase automatically

Example:

Product price = Rs. 2,000

Quantity 1:
Rs. 2,000

Quantity 2:
Rs. 4,000

Whenever a customer removes an item or decreases quantity:

Product quantity should decrease
Item subtotal should update
Cart total should decrease automatically

The total amount must always match the current products and quantities inside the cart.

Also update:

Subtotal
Delivery charges if applicable
Discount if applicable
Final total
6. Admin Order Status UI

For each order, visually display this flow:

Order Confirmed
↓
Shipped
↓
Order Completed

Rules:

Order Confirmed = Automatic after buyer OTP verification
Shipped = Manually marked by Admin
Order Completed = Manually marked by Admin after payment/delivery confirmation

Do not allow the UI to show an order as completed before the previous required steps are completed.

Use clear colors, icons, check marks, and status badges so the admin can understand the order state immediately.

7. Admin Dashboard Summary

At the top of the admin dashboard, add summary cards for:

Total Orders
Confirmed Orders
Shipped Orders
Completed Orders
Pending Orders
Total Completed Order Revenue
Admin Wallet Balance

Make these cards clean and easy to scan.

Important Design Instructions
Keep the existing e-commerce UI style.
Do not unnecessarily redesign existing pages.
Make all new screens responsive.
Maintain consistent colors, fonts, spacing, border radius, shadows, and button styles.
Use reusable components.
Keep the interface simple and professional.
Make admin actions very clear.
Avoid clutter.
Provide desktop and mobile responsive versions where necessary.

The final design should make the complete order lifecycle visually clear:

Customer places order
→ Buyer verifies OTP
→ Order Confirmed automatically
→ Rider collects parcel
→ Admin marks Shipped
→ Rider delivers parcel and payment is received
→ Admin marks Order Completed
→ Completed order amount is added to Admin Wallet.