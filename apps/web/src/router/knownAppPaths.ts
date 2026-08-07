// Single source of truth for "does the app have a route for this path",
// shared by AppNavigation and NotificationsCenter so neither renders its
// authenticated-only chrome (sidebar, notification bell) on a path that
// falls through to the catch-all 404 route.
//
// Keep this in sync with the <Route path="..."> list in router/index.tsx —
// it's a plain Set (not derived from the router) because none of this app's
// routes use dynamic segments, so a static list is exact and cheap to check.

/** Paths where the sidebar/notification chrome stays hidden even when logged in. */
export const PUBLIC_PATHS = new Set([
  "/",
  "/landing",
  "/login",
  "/first-access",
  "/plans",
  "/register/company",
  "/register/individual"
]);

/** Every path the router actually has a route for — anything else is the 404 page. */
export const KNOWN_APP_PATHS = new Set([
  ...PUBLIC_PATHS,
  "/termos",
  "/dashboard",
  "/onboarding",
  "/profile",
  "/fuels",
  "/maintenance",
  "/reports",
  "/vehicles",
  "/drivers",
  "/admin/report",
  "/team",
  "/super-admin"
]);
