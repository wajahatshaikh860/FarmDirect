# FarmDirect Phase 2

Phase 2 adds crop listings and public browsing to the frozen Phase 1 application. No ordering functionality is included.

## Phase 1 changes and reasons

| Existing file | Required change |
| --- | --- |
| `lib/constants.js` | Adds central product categories, units, grades, farming types, statuses, sorting and image limits. Existing role and registration constants retain their values. |
| `app/marketplace/page.jsx` | Replaces the coming-soon placeholder with a real MongoDB marketplace. |
| `components/layout/DashboardSidebar.jsx` | Enables Farmer My Products/Add Product and Buyer Marketplace links. An optional active label highlights new product pages; Dashboard stays the default. |
| `.env.example` | Adds blank Cloudinary placeholders only. |

Authentication, credential verification, password hashing, registration, User schema, RBAC helpers, sessions, DNS bootstrap, MongoDB cache, home/auth pages, existing dashboard pages, global CSS and package dependencies are unchanged. A SHA-256 baseline is kept in the ignored `.verification/phase1-baseline.json` for this implementation session.

## Product model

`models/Product.js` stores farmer ObjectId → User, trimmed name, unique generated slug, category, description, up to five image URL/publicId pairs, price, unit, quantity, minimum order, optional harvest date, grade, farming type, location, listing status and timestamps. Price/minimum order must be positive; stock cannot be negative. Minimum order fits positive stock. Zero stock always becomes OUT_OF_STOCK. Positive restocks become ACTIVE unless the listing remains DISABLED. The model uses optimistic concurrency.

## Cloudinary setup

Add these server-only variables to `.env.local`, then restart the server:

```dotenv
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

The signed REST integration uses Node's built-in fetch and crypto, so no extra application package is required. See [Cloudinary upload API](https://cloudinary.com/documentation/image_upload_api_reference) and [upload signatures](https://cloudinary.com/documentation/signatures).

Assets use the `farmdirect/products` asset folder and public IDs `farmdirect/products/<farmer-id>/<uuid>`. Only URL/publicId are saved in MongoDB. JPEG, PNG and WebP files are checked for count, MIME type, binary signature and a 5 MB per-file limit. The whole request is bounded to 27 MB. The secret is never sent to client components.

Add/edit submissions upload files on the server after role/ownership validation. Retained image IDs must already belong to that product. Removed images are cleaned after a successful update; failed writes roll back newly uploaded images. Deletion remains successful when remote cleanup partially fails, with a safe warning.

## Routes and security

| Route | Access |
| --- | --- |
| GET `/api/products` | Public, validated search/filter/sort with 24 results per page |
| POST `/api/products` | Authenticated FARMER |
| GET `/api/products/[id]` | Public listed products; hidden products only for owner/ADMIN |
| PATCH/DELETE `/api/products/[id]` | Owning FARMER or ADMIN |
| GET `/api/farmer/products` | Authenticated FARMER; session owner's records only |
| `/farmer/products`, `/farmer/products/new` | Existing requireRole(FARMER) guard |
| `/farmer/products/[id]/edit` | Owner FARMER or ADMIN, checked server-side |
| `/marketplace`, `/products/[id]` | Public browsing |

API session checks share the existing authOptions. API guards return 401/403 rather than page redirects. Services repeat role/ownership checks. No raw request object is passed to MongoDB updates. Client-supplied farmer IDs, images, slugs, timestamps and Mongo operators are rejected. Populate selects only public farmer fields and never passwordHash.

Marketplace defaults to ACTIVE listings. Explicit availability filters can include OUT_OF_STOCK; DISABLED never appears publicly. Search escapes regex metacharacters and targets name, category, district and state. Category, price range, farming type, quality grade, state/district, availability and sort are whitelisted. Query parameters preserve filters/search across sorting and pagination.

## UI

Product cards, image fallback, gallery, one shared add/edit form, previews, native delete confirmation, out-of-stock/restock actions, empty states and route loading/error states use the existing FarmDirect colours and controls. Product-only styles live in `components/product/products.css`; Phase 1 global styling is unchanged. Mobile filters collapse, forms/details stack, and motion respects reduced-motion preferences.

## Verification

Run `npm test`, `npm run lint`, `npm run build`.

`scripts/verifyPhase2.mjs` exercises live registration, credentials, sessions, logout, dashboard/cross-role guards, product CRUD, ownership, search/filter/sort, visibility, stock and 375/768/1440px layouts. It creates UUID-scoped test accounts (including a trusted temporary admin), writes a non-secret fixture manifest, and removes only those accounts/products. Cloudinary checks run only when configured. It needs Chrome and a Playwright verification runtime via `PLAYWRIGHT_MODULE_PATH`, following the existing UI-test convention. Use the existing DNS bootstrap when running the script.

Final results:

- npm test: 39 passed, 0 failed (19 existing Phase 1 tests + 20 Phase 2 tests).
- npm run lint: passed.
- npm run build: passed (Next.js 16.3.5).
- Live Atlas/DNS, Farmer/Buyer registration, duplicate rejection, hashing, wrong/correct credentials, safe Farmer/Buyer/Admin sessions, dashboards, session persistence, cross-role RBAC and logout: passed.
- Live product add/edit forms, owner updates/deletion confirmation, Buyer/guest/other-Farmer denial, admin management, mass-assignment rejection, public details/marketplace, search/filter/sort, hidden visibility, stock and restock: passed.
- 375px, 768px and 1440px layouts: passed without horizontal overflow; no browser React errors. Captures: .verification/phase2/.
- Live Cloudinary upload and cleanup: BLOCKED until the three credentials are configured. Signed uploads, type/size/count checks, rollback and cleanup failure handling pass mocked tests.
- Temporary verification users and products were removed; existing data was left untouched.

Live results: .verification/phase2-live-results.json.

- MongoDB connection and DNS bootstrap
- Farmer/Buyer registration and password hashing
- Duplicate email rejection
- Public ADMIN registration rejection
- Wrong password rejected
- Credentials login and safe sessions for Farmer, Buyer, Admin
- Unauthenticated create 401; Buyer create 403
- Product form creates real MongoDB product and own-product listing
- Farmer B and Buyer cannot update/delete Farmer A product; own listing isolation
- Mass assignment and invalid stock rejected
- Owner update and public product details
- Public marketplace, search, category/location/type/grade/price filters and sorting
- Out-of-stock and restock derived correctly
- Hidden product stays private and partial edits preserve visibility
- Admin product management authorization
- Admin shared edit form returns to public product details
- Phase 1 dashboards, session persistence and cross-role RBAC
- Responsive layouts at 375px
- Responsive layouts at 768px
- Responsive layouts at 1440px
- No browser React errors
- Shared edit form saves changes
- Owner deletion with confirmation
- Phase 1 logout clears session
- BLOCKED live Cloudinary: credentials missing

## Deferred Phase 3 work

Cart, checkout, orders, payments, wishlist, reviews, chat, notifications, maps, AI and market-price insights remain unimplemented.

## New Phase 2 files

- `PHASE2.md`
- `app/api/farmer/products/route.js`
- `app/api/products/[id]/route.js`
- `app/api/products/route.js`
- `app/farmer/products/[id]/edit/page.jsx`
- `app/farmer/products/error.jsx`
- `app/farmer/products/loading.jsx`
- `app/farmer/products/new/page.jsx`
- `app/farmer/products/page.jsx`
- `app/marketplace/error.jsx`
- `app/marketplace/loading.jsx`
- `app/products/[id]/error.jsx`
- `app/products/[id]/loading.jsx`
- `app/products/[id]/page.jsx`
- `components/product/ProductActions.jsx`
- `components/product/ProductCard.jsx`
- `components/product/ProductEmptyState.jsx`
- `components/product/ProductFilterPanel.jsx`
- `components/product/ProductFilters.jsx`
- `components/product/ProductForm.jsx`
- `components/product/ProductGallery.jsx`
- `components/product/ProductImage.jsx`
- `components/product/ProductImageUploader.jsx`
- `components/product/ProductLoading.jsx`
- `components/product/ProductPageShell.jsx`
- `components/product/ProductPagination.jsx`
- `components/product/ProductRouteError.jsx`
- `components/product/ProductSearch.jsx`
- `components/product/ProductSort.jsx`
- `components/product/products.css`
- `components/product/useProductForm.js`
- `lib/cloudinary.js`
- `lib/productErrors.js`
- `lib/productPermissions.js`
- `lib/productRequest.js`
- `lib/productResponses.js`
- `lib/productUtils.js`
- `models/Product.js`
- `next.config.mjs`
- `scripts/verifyPhase2.mjs`
- `services/productService.js`
- `tests/product-images.test.js`
- `tests/product.test.js`
- `validators/productValidator.js`
