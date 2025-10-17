CLAUDE.md

Project: Kairos FRONTEND
Stack: AstroJS + TypeScript + ReactJS
Runtime: Node 22
Render mode: Hybrid (SSR + SSG)
Deployment: Vercel
Design system: Tailwind CSS 3 using libromarca.json as reference (colors, texts, spacings, components)
Fonts: Manrope + Inter (Google Fonts)
Icons: Material Symbols (Google)
Routing: Astro file-based
State management: Zustand
Forms: React Hook Form
i18n: i18next (en, es, pt-PT, de)
Auth: JWT (placeholder for BTM backend) - CURRENTLY DISABLED
Linting: ESLint + Prettier + Husky + lint-staged
Mocking: MSW
Testing: Vitest + Playwright
Analytics: PostHog (events) + Sentry (errors)
CI: GitHub Actions (draft only)
Reference folder ignored by git: referenceFE/*

------------------------------------------------------------

MONOREPO STRUCTURE

------------------------------------------------------------


Use pnpm workspaces.

repo/
  apps/
    kairosfe/
  packages/
    ui/
    design-tokens/
    shared/
  referenceFE/
    libromarca.json
    login_page.html
    dashboard_page.html
    profile_page.html
    team_management_page.html
    leave_requests_page.html
    settings_page.html
    Kairos_HR_Management_API.postman_collection.json
  .nvmrc (Node 22)
  pnpm-workspace.yaml
  package.json
  tsconfig.base.json
  .gitignore
  CLAUDE.md

.gitignore content:
/referenceFE/

pnpm-workspace.yaml content:
packages:
  - "apps/*"
  - "packages/*"

------------------------------------------------------------

APP STRUCTURE (apps/kairosfe)

------------------------------------------------------------


apps/kairosfe/
  src/
    pages/
      index.astro
      login.astro
      dashboard.astro
      profile.astro
      team-management.astro
      leave-requests.astro
      settings.astro
    layouts/
    components/
      ui/
      forms/
      layout/
      data/
      charts/
    styles/
    lib/
      auth/
      api/
      i18n/
      store/
    middleware.ts
    env.d.ts
    app.config.ts
  public/
  astro.config.mjs
  tsconfig.json
  package.json
  .env.example

Protected routes: all except /login
Unauthorized users redirect to /login
AppShell with navbar, sidebar, footer, dynamic menu per user role

------------------------------------------------------------

DESIGN SYSTEM (TAILWIND CSS)

------------------------------------------------------------


Use Tailwind CSS 3 with custom configuration based on libromarca.json.

Config location: apps/kairosfe/tailwind.config.mjs

Include:
- colors (light and dark) - custom color palette from libromarca.json
- typography (Manrope + Inter fonts, sizes, weights)
- spacing scale (Tailwind default + custom)
- radii, shadows, transitions (custom values)
- @tailwindcss/forms plugin for better form styling

Support both light/dark:
- Class-based dark mode: html.dark
- Toggle via JavaScript/React state
- All components use dark: prefix for dark mode styles

Example token system (simplified):
$colors-light: (
  "bg": #ffffff,
  "fg": #0f172a,
  "primary": #1e3a8a,
  "secondary": #10b981
);
$colors-dark: (
  "bg": #0b1220,
  "fg": #e2e8f0,
  "primary": #93c5fd,
  "secondary": #34d399
);

@mixin theme-color($key) { color: var(--color-#{$key}); }

Define SCSS mixins for typography, spacing, and elevation.

------------------------------------------------------------

I18N CONFIG

------------------------------------------------------------


Library: i18next + react-i18next
Languages: en, es, pt-PT, de
Fallback: en
Detect browser language
Files at src/lib/i18n/locales/{lang}.json
Add LanguageSwitcher component

Env variables:
VITE_DEFAULT_LOCALE=en
VITE_SUPPORTED_LOCALES=en,es,pt-PT,de

------------------------------------------------------------

STATE AND FORMS

------------------------------------------------------------


Global state: Zustand (auth, ui, user, requests)
Forms: React Hook Form with Zod validation
Reusable components: FormText, FormSelect, FormDate

------------------------------------------------------------

API AND MOCKING

------------------------------------------------------------


Base URL from env:
VITE_API_BASE_URL=https://localhost:8080

All requests go through src/lib/api/client.ts
Use MSW for mocking in dev mode
Mock endpoints based on Kairos_HR_Management_API.postman_collection.json from referenceFE

------------------------------------------------------------

AUTHENTICATION

------------------------------------------------------------


Mechanism: JWT (placeholder BTM)
Store token in cookie or localStorage
Astro middleware checks auth
If unauthorized -> redirect to /login
Provide requireAuth() helper for protected pages

------------------------------------------------------------

NAVIGATION

------------------------------------------------------------

Dynamic role-based menu
Roles: admin, manager, employee
Config in app.config.ts
Each menu item: { path, labelKey, icon?, roles: [] }

------------------------------------------------------------

ANALYTICS AND MONITORING

------------------------------------------------------------


PostHog for event tracking
Sentry for error monitoring
Env variables:
VITE_POSTHOG_KEY=
VITE_SENTRY_DSN=

Track page views, logins, and key UI interactions

------------------------------------------------------------

TESTING

------------------------------------------------------------

Unit tests: Vitest + Testing Library
E2E tests: Playwright
Tests required for each page (at least one)

------------------------------------------------------------

DEPLOYMENT

------------------------------------------------------------

Target: Vercel
Use official Astro adapter for Vercel
Ensure serverless compatibility

------------------------------------------------------------

PACKAGE SCRIPTS

------------------------------------------------------------

Root package.json:
{
  "name": "kairos",
  "private": true,
  "scripts": {
    "postinstall": "husky install",
    "build": "pnpm -r --filter ./apps/kairosfe build",
    "dev": "pnpm -w --filter ./apps/kairosfe dev",
    "lint": "pnpm -r run lint",
    "format": "pnpm -r run format",
    "test": "pnpm -r run test",
    "test:e2e": "pnpm -r --filter ./apps/kairosfe run test:e2e"
  },
  "lint-staged": {
    "*.{ts,tsx,astro,js,jsx,css,scss,md,json}": ["prettier --write"],
    "*.{ts,tsx,astro,js,jsx}": ["eslint --fix"]
  }
}

apps/kairosfe/package.json:
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "lint": "eslint .",
    "format": "prettier --write .",
    "test": "vitest run",
    "test:ui": "vitest",
    "test:e2e": "playwright test"
  }
}

.env.example:
VITE_API_BASE_URL=http://localhost:8080
VITE_DEFAULT_LOCALE=en
VITE_SUPPORTED_LOCALES=en,es,pt-PT,de
VITE_POSTHOG_KEY=
VITE_SENTRY_DSN=

------------------------------------------------------------

CODE QUALITY

------------------------------------------------------------

ESLint, Prettier, Husky, lint-staged preconfigured
Husky pre-commit runs lint-staged

------------------------------------------------------------

GITHUB ACTIONS (DRAFT)

------------------------------------------------------------

.github/workflows/ci.yml
Manual trigger only
Steps: Node 22, pnpm install, lint, build, test, e2e

------------------------------------------------------------

PAGE REQUIREMENTS

------------------------------------------------------------


/login:
  - Public
  - Email + password form
  - On success: save token, redirect to /dashboard
  - Track login_success, login_failure with PostHog
  - Send errors to Sentry

/dashboard:
  - Protected
  - Welcome message with user name
  - Quick links and recent activity

/profile:
  - Protected
  - View/edit user info
  - Language switcher

/team-management:
  - Protected
  - List of teammates (mocked)
  - Search and filters

/leave-requests:
  - Protected
  - List + create form (React Hook Form)
  - Status chips

/settings:
  - Protected
  - Theme toggle (auto/manual)
  - Notifications toggle placeholder
  - API base URL readonly
  - Error boundary test for Sentry

------------------------------------------------------------

IMPLEMENTATION RULES

------------------------------------------------------------

Do not import anything from referenceFE.
Generate SCSS tokens from libromarca.json.
Keep components small and typed.
All API calls through one client with auth interceptors.
Middleware enforces route protection.
Use namespaced i18n keys.
Provide loading and empty states.
Track events in PostHog.
Log unexpected errors in Sentry.
Write at least one test per page.

------------------------------------------------------------

NICE TO HAVES

------------------------------------------------------------


Add developer role switch (for testing menus)
Ensure accessibility and keyboard nav
Add aria labels to forms

------------------------------------------------------------

DELIVERABLES CHECKLIST

------------------------------------------------------------

- pnpm monorepo with apps/kairosfe, packages/ui, design-tokens, shared
- Astro app scaffolded with pages and routing
- SCSS tokens and mixins (light/dark)
- Zustand stores and RHF forms
- i18next setup (en/es/pt-PT/de)
- MSW with handlers
- PostHog and Sentry setup
- ESLint + Prettier + Husky + lint-staged
- Vitest and Playwright tests
- Draft GitHub Actions
- Vercel-ready build