# FarmDirect — Phase 1

Next.js App Router foundation with JavaScript, Tailwind, MongoDB/Mongoose, NextAuth Credentials, bcryptjs, Zod, Lucide, and Sonner. Scope ends at authentication and base dashboard shells.

## Setup

1. Run `npm install`.
2. Copy `.env.example` to `.env.local`.
3. Set `MONGODB_URI` to your Atlas connection string (a database user with read/write access; allow the deployment IP in Atlas).
4. Set `AUTH_SECRET` to a cryptographically random secret, for example generated with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`.
5. Set `NEXTAUTH_URL` to `http://localhost:3000` locally, or the canonical HTTPS origin in production.
6. Run `npm run dev`.

Do not commit `.env.local`. Production requires HTTPS: NextAuth uses secure, HttpOnly, SameSite=Lax cookies in production. Credentials sessions use NextAuth-managed encrypted JWT cookies, never browser localStorage. Sessions expire after 24 hours. No database connection or secret is required merely to compile the application.

## Admin

Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env.local`, then run `npm run seed:admin`. The script hashes at bcrypt cost 12 and refuses to overwrite or promote any existing account. Remove admin seed variables when finished. Admin is never a public signup option.

## Architecture

`lib/db.js` caches the Mongoose connection and in-flight promise. `models/User.js` defines normalized, unique email, roles, address, farmer profile, verification/account status, and timestamps. `passwordHash` is excluded by default and from JSON.

`app/api/register/route.js` checks origin, validates with `validators/authValidator.js`, calls `services/authService.js`, and returns the same responses. The service performs duplicate checks, password hashing, and persistence; unique-index races still return 409. `lib/auth.js` configures NextAuth and delegates credential verification to the same service. The session callback re-fetches current role and account status on every session read, so suspended/deleted users lose access and role changes apply immediately. `requireAuth()` and `requireRole()` enforce access in server pages; future server operations must call these helpers as well.

Farmer/Buyer dashboards display zero values and future-feature empty states. Admin counts users, farmers, and buyers from MongoDB; product/order counts remain zero. `/profile` is protected and read-only. `/marketplace` is a public coming-soon page.

## Verification

Run `npm test`, `npm run lint`, and `npm run build`. The 16 tests cover signup validation, public admin/injected-field rejection, password hashing/byte limits, model serialization, dashboard mappings, credential acceptance/rejection, suspension, safe session fields, and current-role refresh. Credential/session tests mock the database boundary. Live duplicate registration, credentials sessions, cookies/logout, and cross-role access require a configured MongoDB database and should also be exercised against the running app. Test home, login, registration (including farmer fields), navigation, and dashboards at 375px, tablet, and desktop.

Product CRUD, marketplace backend, cart, orders, uploads, maps, reviews, payments, and wishlist are intentionally deferred.

## Phase 1 verification result

- Dependency installation: 387 packages; npm audit reported zero vulnerabilities.
- `npm test`: 16 passed, zero failed.
- `npm run lint`: passed, zero errors or warnings.
- `npm run build`: passed with Next.js 16.3.5; protected dashboards, profile, registration, and APIs remain server-rendered.
- Production browser verification: home, login, buyer signup, farmer signup, and coming-soon marketplace passed at 375px, 768px, and 1440px without horizontal overflow. Mobile signup navigation passed.
- All three dashboards redirect signed-out visitors to login. Registration API rejects public ADMIN, invalid fields, and cross-origin requests.
- Mobile and desktop home screenshots were visually inspected. Captures and browser results are in the ignored `.verification/` directory.
- No Atlas URI or permanent session secret was provided. Live account creation, duplicate-email persistence, signed-in role access, authenticated dashboard layouts, session persistence, and logout were not tested end to end. Configure `.env.local` and exercise those flows before deployment. No production credentials or plaintext passwords were created.

The browser script is `scripts/verifyUI.cjs`; it accepts `PLAYWRIGHT_MODULE_PATH`, `TEST_BASE_URL`, and optional `BROWSER_CHANNEL`, and uses installed Chrome by default. Playwright is a verification runtime, not an application dependency.

## Editing the refactored UI

- Homepage headline and action labels: `data/siteContent.js`. Navbar public links also live here.
- Homepage sections: `components/home/Hero.jsx`, `TrustSection.jsx`, and `CTASection.jsx`. The current design has no category or how-it-works section.
- Navigation and footer copy: `components/layout/Navbar.jsx` and `Footer.jsx`. Mobile toggle: `MobileMenu.jsx`. Navbar/footer render once in `app/layout.jsx`.
- Login/signup: `components/auth/LoginForm.jsx` and `RegisterForm.jsx` share `AuthForm.jsx`; edit fields there, farm fields in `FarmFields.jsx`, and surrounding headings in `AuthPage.jsx`. Browser submission, loading, errors, toast, and redirects are in `useAuthForm.js`.
- Password visibility and account role buttons: `PasswordInput.jsx` and `RoleSelector.jsx`.
- Dashboard UI: `components/dashboard/WelcomeSection.jsx`, `DashboardStats.jsx`, `StatCard.jsx`, `DashboardEmptyState.jsx`, and `ProfileTip.jsx`. Shared role menus: `components/layout/DashboardSidebar.jsx`.
- Shared styled actions and fields: `components/ui/Button.jsx` and `Input.jsx`. Button supports primary, secondary, outline, danger, and link actions via href.
- Artwork is drawn with CSS and Lucide icons, rather than remote images. Edit `Hero.jsx`, `AuthPage.jsx`, and `app/globals.css`. No image files or product categories were invented for this refactor.
- Shared roles/farming types: `lib/constants.js`. Validation: `validators/authValidator.js` (`lib/validators.js` preserves existing imports). Auth config/session refresh: `lib/auth.js`. Server access guards: `lib/permissions.js`. User counts: `services/userService.js`. MongoDB connection and User schema retain their existing behavior.

All React UI files use .jsx; hooks, services, validators, model, API routes, and utilities use .js. Future category shortcuts, recommendations, and orders remain outside this structural refactor.

## UI files renamed (.js → .jsx)

All imports continue to resolve without explicit UI extensions. Backend routes and logic retain .js.

- App: `app/page`, `app/layout`, `app/loading`, `app/error`, `app/not-found`, `app/login/page`, `app/register/page`, `app/marketplace/page`, `app/profile/page`, `app/farmer/dashboard/page`, `app/buyer/dashboard/page`, `app/admin/dashboard/page`.
- Existing components: `components/ui/Logo`, `components/layout/Navbar`, `components/layout/Footer`, `components/layout/Providers`, `components/auth/AuthPage`, `components/auth/AuthForm`, `components/auth/Logout`, `components/dashboard/Dashboard`, `components/dashboard/Notice`.

## Structural refactor verification

- `npm test`: 19 passed, zero failures. Existing credential, suspension, JWT/session, model, validation, and role-mapping tests pass. Three added registration-service tests mock database operations and cover buyer persistence, farmer mappings, cost-12 hashing, duplicate emails, and unique-index races.
- `npm run lint`: passed.
- `npm run build`: passed with Next.js 16.3.5. Protected pages and APIs remain dynamic/server-rendered.
- Live account persistence, signed-in cross-role access, authenticated dashboard responsiveness, session cookies/persistence, and logout require a configured MongoDB connection and were not tested end to end.
- Production browser verification on port 3100 with a temporary process-only AUTH_SECRET: home, login, buyer/farmer signup, and marketplace passed at 375px, 768px, and 1440px without horizontal overflow. Mobile navigation passed. Farmer, Buyer, and Admin dashboards redirected signed-out users to login. Public ADMIN signup, invalid fields, and foreign origins were rejected. Results and screenshots: .verification/. Screenshot visual inspection was unavailable because the image reader timed out.
