# FarmDirect Phase 3

Phase 3 adds persistent Buyer carts, delivery-address checkout, COD and Razorpay **Test Mode**, per-farmer orders, fulfilment history and transactional inventory. Phase 1 and Phase 2 remain the foundation.

## Existing files changed

| Existing file | Why the smallest integration change was necessary |
| --- | --- |
| components/layout/DashboardSidebar.jsx | Adds the Buyer Cart link and enables Buyer My Orders/Farmer Orders. Existing dashboard links, active-label defaults and layouts are retained. Shared Phase 1/2 navigation. |
| app/products/[id]/page.jsx | Inserts the Buyer quantity/Add to Cart component beside the existing product information. Existing details, gallery, permissions and editing link remain intact. Phase 2 integration. |
| package.json | Adds only the official razorpay SDK. Existing dependency ranges and scripts are retained. |
| package-lock.json | Records that SDK and its required dependency tree. |
| .env.example | Appends blank Razorpay Test credential placeholders. Existing settings retain their contents. |

Authentication, registration/login/logout, sessions, RBAC helpers, User/Product models, MongoDB connection, DNS bootstrap, Cloudinary integration, product CRUD, marketplace/search/filter/sort/pagination, dashboard pages and global styles are unchanged. The ignored .verification/phase3-baseline.json captures source hashes before implementation.

## Cart

Cart has one unique buyer index, product/quantity items, timestamps and optimistic concurrency. Every cart API authenticates BUYER; guest returns 401 and Farmer/Admin returns 403. Cart operations resolve the buyer from the server session. Product identity, active status, current stock and MOQ are checked server-side. Requests are strict Zod objects: browser prices, farmer IDs, buyer IDs and arbitrary fields are rejected.

Quantities support three decimal places. Cart totals come from Product records and integer-paise line rounding. A cart contains at most 100 products. Removed/hidden/unavailable products remain removable with a safe error state. Add to Cart sets that product's requested quantity; adding again replaces it rather than silently adding quantities. Guest links to the existing Login page, which retains its dashboard redirect convention.

## Checkout and order snapshots

The server re-reads all products and validates farmer account/role, price, stock, quantity and MOQ. It groups items by farmer, creating one Order per farmer. Orders snapshot product name, image, category, price, unit, quantity and line total, plus shipping address and server totals. Historical display uses snapshots even after product edits or deletion.

CheckoutAttempt stores the server-calculated amount, cart version, immutable item/address snapshot, request ID, gateway IDs and resulting Order IDs. Unique buyer/request ID prevents duplicate COD checkout. Unique gateway order/payment indexes and checkout/farmer order index prevent duplicate payment fulfilment. No signatures or secrets are permanently stored.

MongoDB Atlas transactions commit orders, conditional stock writes and cart cleanup together. Transactions require a replica set; there is no unsafe nontransactional fallback. Conditional stock writes bind the current quantity and Product version, increment __v, and use the frozen productStatus helper. Inventory can leave residual stock below MOQ; the listing retains Phase 2's positive-stock status rule and cannot be purchased below MOQ. Inventory does not change the farmer's MOQ.

A checkout supports a demo total up to INR 1,000,000. Delivery fees/taxes are not introduced in this MVP.

## COD and farmer workflow

COD starts PENDING/PENDING (order/payment). Valid transitions are centralized:

PENDING → CONFIRMED or CANCELLED  
CONFIRMED → PACKED → SHIPPED → DELIVERED

On COD delivery the server records PAID, assuming collection. Buyers cannot change order statuses or payment fields. Farmers can read/manage only their own orders. Admin is not granted Buyer-cart or Farmer-order privileges. Every mutation also verifies same-origin requests, with bounded JSON and explicit allowlists.

Cancellation is allowed only from PENDING. Stock restoration, inventoryRestored, CANCELLED and history append commit in one transaction. Repeating cancellation is rejected without double restoration. Hidden products remain hidden when restored; exhausted products follow the existing restock helper. A product deleted through the unchanged Phase 2 CRUD remains deleted; cancellation does not resurrect it. Historical orders remain readable.

## Razorpay Test setup

Manually add these values to .env.local; this implementation never edits that file:

```dotenv
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```

Use **rzp_test_** keys only, then restart. Live keys are refused. Missing/invalid configuration disables Test Payment while COD and Phase 1/2 continue working. The key secret stays server-only; Checkout receives the public key ID.

The official SDK creates an INR Razorpay Order using the server amount in paise. A Next Script component loads Standard Checkout. Success callbacks go to server verification, not local success logic. HMAC SHA256 uses the **server-stored order ID**, payment ID and secret, with timing-safe comparison. The server also fetches the payment to check order, amount, INR and capture state; authorized payments are captured before internal fulfilment.

Signature failures and failed/closed Checkout do not fulfil FarmDirect orders, reduce inventory or clear cart. Verification re-reads the cart/products; changed prices/units, cart versions or insufficient stock block fulfilment without negative stock. A captured Test payment that cannot be fulfilled needs manual test reconciliation; production refund logic is intentionally excluded. The UI preserves a received payment callback for verification retry during the current page session rather than taking another payment.

Duplicate verified callbacks return the same Order IDs. Concurrent transactions conflict/retry or fail safely rather than committing stock twice. Rejected paid Test orders restore stock once and retain payment audit fields; no real refund/settlement is performed.

References: [Standard Checkout](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/), [official Node signature verification](https://github.com/razorpay/razorpay-node/blob/master/documents/paymentVerfication.md).

## UI and routes

New screens: /cart, /checkout, /buyer/orders, /buyer/orders/[id], /farmer/orders, /farmer/orders/[id]. They reuse Button, Input, ProductImage, sidebar patterns and the existing green palette. New CSS is scoped to commerce classes. Forms/actions have busy guards, safe Sonner messages, loading/error boundaries, empty states and mobile stacking. Order history displays recorded status events only.

API routes: /api/cart, /api/cart/items, /api/cart/items/[productId], /api/orders, /api/orders/[id], /api/farmer/orders, /api/farmer/orders/[id]/status, /api/payments/razorpay/create-order and /api/payments/razorpay/verify. Public user population selects necessary names/role/account status, never password hashes.

## Verification

Automated tests mock Razorpay and transaction storage; real credentials are not required. They exercise validation, DB prices, grouping, ownership, transition rules, conditional inventory, rollback, cancellation, signatures, gateway failure and replay protection.

scripts/verifyPhase3.mjs exercises real MongoDB/Chrome flows, multi-farmer COD, forms, ownership, fulfilment, historical snapshots, request replay and competing buyers for the same stock. It creates UUID-scoped fixtures and cleans only those records. Use the existing DNS bootstrap, a running app and PLAYWRIGHT_MODULE_PATH as with the Phase 2 verification script.

Live results:

- Phase 1 registration/login/logout, sessions, all role dashboards, RBAC and MongoDB/DNS: passed.
- Phase 2 Add/Edit/Delete, ownership, marketplace/search/filter/sort/pagination, product details, stock and live Cloudinary upload/cleanup: passed.
- Cart/checkout/order layouts at 375, 768 and 1440px: passed without horizontal overflow; no React page errors. Mobile checkout was also visually inspected.
- Test users, carts, products, orders and payment attempts were removed; the temporary verification server was stopped.

Phase 3 browser/Atlas checks:

- Atlas/DNS connection
- Registration, login and safe role sessions
- Cart guest/role authorization, MOQ, stock and mass assignment
- Actual Add to Cart UI, persistence, manual quantity updates, DB prices and buyer isolation
- Actual checkout form, multi-farmer COD, atomic inventory/cart cleanup and order ownership
- Actual farmer fulfilment UI/timeline, COD collection, cancellation and single restoration
- Historical order snapshots survive product edits
- COD request idempotency against real Atlas
- Concurrent buyers cannot oversell; zero stock and rejection restock follow Phase 2 rules
- 375/768/1440px cart/checkout/order layouts and no React errors
- BLOCKED real Razorpay Test success/failure: Test credentials missing; mocked payment flows pass

Atlas checks with a mocked gateway (not real Razorpay sandbox):

- Real Atlas payment preparation persists outside its completed session; no inventory consumed
- Invalid payment signature leaves real cart and inventory unchanged
- Concurrent valid mocked gateway callbacks commit one real order and decrement stock once
- Paid test cancellation restores real inventory once and retains gateway audit

Quality:

- npm test: 68 passed, 0 failed (39 existing + 29 Phase 3).
- npm run lint: passed; final checkout-copy file lint also passed.
- npm run build: passed with all new dynamic routes.
- Live marketplace pagination: 24 + 1 isolated records, two pages, no duplicates and preserved search; passed.
- Final browser bundles contain no RAZORPAY_KEY_SECRET references.

Verification artifacts: .verification/phase3-live-results.json, .verification/phase3-mocked-payment-results.json and .verification/phase3/.

## Deferred work

Live payments, production settlement/refunds, webhook/reconciliation infrastructure, reviews, wishlist, chat, notifications, maps, AI and recommendation features remain outside Phase 3.

## Files created (48)

- PHASE3.md
- app/api/cart/items/[productId]/route.js
- app/api/cart/items/route.js
- app/api/cart/route.js
- app/api/farmer/orders/[id]/status/route.js
- app/api/farmer/orders/route.js
- app/api/orders/[id]/route.js
- app/api/orders/route.js
- app/api/payments/razorpay/create-order/route.js
- app/api/payments/razorpay/verify/route.js
- app/buyer/orders/[id]/page.jsx
- app/buyer/orders/error.jsx
- app/buyer/orders/loading.jsx
- app/buyer/orders/page.jsx
- app/cart/error.jsx
- app/cart/loading.jsx
- app/cart/page.jsx
- app/checkout/error.jsx
- app/checkout/loading.jsx
- app/checkout/page.jsx
- app/farmer/orders/[id]/page.jsx
- app/farmer/orders/error.jsx
- app/farmer/orders/loading.jsx
- app/farmer/orders/page.jsx
- components/cart/AddToCart.jsx
- components/cart/CartView.jsx
- components/checkout/CheckoutForm.jsx
- components/checkout/RazorpayCheckout.jsx
- components/commerce/CommerceShell.jsx
- components/commerce/commerce.css
- components/order/FarmerOrderActions.jsx
- components/order/OrderTimeline.jsx
- components/order/OrderViews.jsx
- lib/commerce.js
- lib/commerceRequest.js
- lib/commerceTransaction.js
- lib/razorpay.js
- models/Cart.js
- models/CheckoutAttempt.js
- models/Order.js
- scripts/verifyPhase3.mjs
- services/cartService.js
- services/orderService.js
- services/paymentService.js
- tests/commerce-flow.test.js
- tests/commerce.test.js
- validators/cartValidator.js
- validators/orderValidator.js
