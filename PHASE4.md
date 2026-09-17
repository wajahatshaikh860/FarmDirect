# FarmDirect Phase 4

## Scope completed

Phase 4 adds the following additive features while preserving the existing authentication, database connection, cart, checkout, inventory, Cloudinary, and payment architecture.

- Responsive dashboard workspace layout: a 250px desktop sidebar with a flexible main area; a keyboard-accessible mobile drawer below 1000px.
- Farm location fields on the product form: full address, village/city, district, state, pincode, optional latitude, and optional longitude.
- Automatic MapTiler forward geocoding restricted to India, with a 500ms debounce, suggestions, and a **Find Location** fallback. Coordinates are optional, so map/geocoding failures never prevent saving textual location.
- MapLibre read-only location preview and public product-details map. The public response removes the full address and pincode and rounds coordinates to two decimal places before rendering an approximate marker.
- An ADMIN-only farmer-verification page at `/admin/farmers`. It reuses `User.verificationStatus`, permits only PENDING → VERIFIED/REJECTED, and shows a trust badge only for VERIFIED farmers.
- Persistent reviews, one per buyer/order/product. Creation requires the buyer’s delivered order to contain the product. Editing and deletion require the same buyer at the service layer.
- Product and farmer ratings calculated with MongoDB aggregation, never cached into product or user records.
- Persistent user-owned notifications, a navbar bell, a recent dropdown, mark-one/mark-all-read actions, and `/notifications`. Notification writes are best effort after the authoritative order/verification write and use event keys to avoid duplicate events.
- Server-side dashboard analytics for each role using `countDocuments` and aggregation.
- Razorpay remains visible but disabled in the checkout UI. COD is the only active checkout method.

## Map configuration

Add this manually to the local deployment environment; it is intentionally not added to `.env.local`:

```
NEXT_PUBLIC_MAPTILER_API_KEY=
```

The only added dependency is `maplibre-gl`. MapTiler’s geocoding endpoint is called from the browser with the public key, country restriction `in`, bounded result count, and debouncing.

When no key exists, a key is invalid, a request fails, coordinates are absent/invalid, the map style fails, or WebGL is unavailable, the UI renders a clean Farm Location fallback. Product creation, editing, marketplace browsing, and product details continue to work.

## Protected data and authorization

- Public product serialization hides `location.addressLine` and `location.postalCode`.
- All new mutation routes authenticate, validate JSON and origin, return JSON errors, and use allowlisted schemas.
- Review updates only accept `rating` and `comment`.
- Notification reads/updates are bound to the current user.
- Farmer verification is ADMIN-only and cannot self-verify.
- Existing unverified farmers retain product CRUD access.

## Existing files changed and rationale

### Phase 1

- `components/layout/Navbar.jsx`: renders the authenticated notification bell.
- `components/layout/DashboardSidebar.jsx`: adds the responsive workspace layout and ADMIN farmer-verification navigation.
- `components/dashboard/Dashboard.jsx`: supplies role-scoped analytics data to dashboard presentation.
- `.env.example`: adds an empty MapTiler key placeholder.

No auth, sessions, registration, RBAC primitives, database connection, or DNS bootstrap files were changed.

### Phase 2

- `models/Product.js`, `validators/productValidator.js`, `services/productService.js`: add optional location fields and public privacy sanitization while retaining existing village/district/state, CRUD validation, ownership, stock, and image behavior.
- `components/product/ProductForm.jsx`, `components/product/useProductForm.js`, `components/product/ProductCard.jsx`, and `app/products/[id]/page.jsx`: render location, verification, ratings, and map UI.
- `package.json` and lockfile: add MapLibre only.

### Phase 3

- `services/orderService.js` and `services/paymentService.js`: invoke best-effort notifications after successful completion/status changes. The existing transactions, inventory calculations, and idempotency rules remain unchanged.
- `app/checkout/page.jsx` and `components/checkout/CheckoutForm.jsx`: force Razorpay visible-but-disabled while preserving its implementation code.
- `app/buyer/orders/[id]/page.jsx`: displays review controls for delivered buyer orders.
- `tests/commerce-flow.test.js`: supplies harmless notification mocks to preserve isolated existing order tests.

## Verification

- Unit coverage includes Phase 4 review eligibility/ownership/validation, notification ownership and failure containment, geocoding validation/failure paths, public-location privacy, and defensive JSON parsing.
- Existing test suites continue to cover Phase 1 auth/RBAC/registration, Phase 2 product/stock/ownership/upload behavior, and Phase 3 cart/COD/payment/order fulfillment behavior.
- Run `npm test`, `npm run lint`, and `npm run build` before release. The final task report records the actual outcomes.

## Deferred by request

Live Razorpay, chat, wishlist, AI features, SMS/WhatsApp automation, refunds, and unrelated features remain out of scope.
