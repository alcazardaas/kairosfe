# Kairos Frontend

Modern HR Management System built with Astro, React, TypeScript, and Tailwind CSS.

## Tech Stack

- **Framework**: Astro 4 (Hybrid SSR + SSG)
- **UI Library**: React 18
- **Styling**: Tailwind CSS 3 + @tailwindcss/forms
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod
- **i18n**: i18next (en, es, pt-PT, de)
- **Testing**: Vitest + Playwright
- **Analytics**: PostHog
- **Error Tracking**: Sentry
- **Deployment**: Vercel
- **Package Manager**: pnpm (workspaces)
- **Fonts**: Manrope + Inter (Google Fonts)
- **Icons**: Material Symbols (Google)

## Project Structure

```
kairosfe/
├── apps/
│   └── kairosfe/               # Main Astro application
│       ├── src/
│       │   ├── pages/          # Astro pages (routing)
│       │   ├── layouts/        # Layout components
│       │   ├── components/     # React components
│       │   │   ├── ui/         # UI components
│       │   │   ├── forms/      # Form components
│       │   │   ├── layout/     # Layout components
│       │   │   ├── data/       # Data-driven components
│       │   │   └── charts/     # Chart components
│       │   ├── lib/
│       │   │   ├── auth/       # Auth utilities
│       │   │   ├── api/        # API client
│       │   │   ├── i18n/       # Internationalization
│       │   │   ├── store/      # Zustand stores
│       │   │   └── test/       # Test utilities
│       │   ├── styles/         # Global styles
│       │   └── middleware.ts   # Astro middleware
│       └── tests/              # E2E tests
├── packages/
│   ├── design-tokens/          # SCSS design tokens
│   ├── ui/                     # Shared UI components
│   └── shared/                 # Shared utilities & types
└── referenceFE/                # Reference materials (ignored by git)

```

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm 9+

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp apps/kairosfe/.env.example apps/kairosfe/.env

# Edit .env and set your API URL (default is http://localhost:3000)
# VITE_API_BASE_URL=http://localhost:3000

# Start development server
pnpm dev
```

The application will be available at [http://localhost:4321](http://localhost:4321)

## Available Scripts

### Root Level

```bash
pnpm dev          # Start dev server
pnpm build        # Build for production
pnpm lint         # Lint all packages
pnpm format       # Format code with Prettier
pnpm test         # Run all tests
pnpm test:e2e     # Run E2E tests
```

### App Level (apps/kairosfe)

```bash
pnpm dev          # Start Astro dev server
pnpm build        # Build Astro app
pnpm preview      # Preview production build
pnpm test         # Run unit tests
pnpm test:ui      # Run tests with UI
pnpm test:e2e     # Run E2E tests
```

## Features

### Authentication
- See middleware.ts and api/client.ts for auth implementation

**⚠️ CRITICAL: Protected Pages Must Disable Prerendering**

ALL protected .astro pages MUST include `export const prerender = false;` in their frontmatter.

Without this, Astro will prerender the page as static HTML at build time, which prevents middleware from accessing cookies and headers. This causes authentication to fail even when the user is properly authenticated.

```astro
---
import AppLayout from '@/layouts/AppLayout.astro';
import AuthGuard from '@/components/auth/AuthGuard';

export const prerender = false;  // ← REQUIRED FOR AUTH TO WORK
---

<AppLayout title="Protected Page">
  <AuthGuard client:load>
    <!-- Page content -->
  </AuthGuard>
</AppLayout>
```

**Symptoms of missing `prerender = false`:**
- User is authenticated but gets redirected to login when accessing the page
- Terminal shows: `[WARN] Astro.request.headers is unavailable in "static" output mode`
- Middleware logs show: `hasAuthToken: false, referer: null`
- Browser Network tab shows cookie being sent, but server doesn't receive it

**Pages that MUST have `prerender = false`:**
- /dashboard
- /timesheet
- /profile
- /team-management
- /team-timesheets
- /team-calendar
- /team-reports
- /team-member-performance
- /leave-requests
- /team-leave
- /settings

### Pages

1. **Login** (`/login`)
   - Email + password form ready for integration
   - Event tracking (PostHog)

2. **Dashboard** (`/dashboard`)
   - Welcome message with user name
   - Quick actions and recent activity

3. **Profile** (`/profile`)
   - View/edit user information
   - Language switcher

4. **Team Management** (`/team-management`)
   - Public (auth disabled)
   - List of team members
   - Search and filters

5. **Leave Requests** (`/leave-requests`)
   - View existing requests
   - Create new leave requests
   - Status tracking

6. **Settings** (`/settings`)
   - Theme toggle (auto/light/dark)
   - API configuration
   - Error reporting test

### Internationalization

Supported languages:
- English (en)
- Spanish (es)
- Portuguese (pt-PT)
- German (de)

Language can be changed via the language switcher in the navbar.

### Design System

- **Colors**: Custom color palette for light and dark modes
  - Primary: `#1E3A8A` (blue)
  - Accent: `#10B981` (green)
  - Full palette defined in `tailwind.config.mjs`
- **Typography**: Manrope and Inter font families with responsive scales
- **Spacing**: Tailwind's default spacing scale (4px base)
- **Components**: Utility-first approach with custom component classes
- **Dark Mode**: Class-based (`class="dark"`)

Theme can be switched between:
- Light (default)
- Dark (toggle via theme switcher)

### Tailwind Configuration

Custom Tailwind config located at `apps/kairosfe/tailwind.config.mjs`:
- Extended color palette matching libromarca.json
- Custom font families (Manrope, Inter)
- Custom spacing, border radius, and shadows
- Form plugin for better form styling

### API Integration

- **API Base URL**: `http://localhost:3000` (configurable via .env)
- Production-ready API client with authentication
- Supports GET, POST, PUT, PATCH, DELETE methods
- Automatic token refresh on 401 errors
- Error handling with Sentry integration

### Testing

**Unit Tests** (Vitest):
- Store tests
- Component tests
- Utility function tests

**E2E Tests** (Playwright):
- Login flow
- Page navigation
- Form submissions

### Analytics & Monitoring

**PostHog** (Event Tracking):
- Page views
- Login success/failure
- User interactions

**Sentry** (Error Monitoring):
- Automatic error capture
- Manual error testing from settings page

## Implementation Roadmap

This section tracks the implementation status of all features and provides manual testing instructions.

---

### **Story 1: Login & Session Boot** ✅ COMPLETE

**Status**: Fully implemented and tested

**User Story**: As a user, I want to log in and stay authenticated so that I can access protected pages.

**API Endpoints**:
- `POST /auth/login` - Authenticate user
- `POST /auth/refresh` - Refresh expired token
- `GET /me` - Get current user info (role, permissions, policy)

**Implementation Checklist**:
- [x] Create `authStore` (Zustand) with: `{ token, user, role, permissions, policy, hydrate(), logout() }`
- [x] Update API client with `Authorization: Bearer <token>` interceptor
- [x] Implement 401 response → auto-refresh flow
- [x] Build `/login` page with React Hook Form + Zod validation
- [x] On login success: save token → call `hydrate()` → redirect to `/dashboard`
- [x] Update `middleware.ts` to protect routes (redirect to `/login` if no token)
- [x] Implement role-based menu filtering (read from `authStore.role/permissions`)
- [x] Add PostHog events: `login_success`, `login_failure`
- [x] Add Sentry error capture for login/refresh failures
- [x] Write Playwright tests: redirect guards, valid/invalid login

**Manual Testing**:
1. **Login Flow**:
   - Navigate to `/login`
   - Enter valid credentials (email: `demo@kairos.com`, password: `demo123`)
   - Click "Sign In"
   - ✅ Should redirect to `/dashboard`
   - ✅ Dashboard should display user name (Demo User)

2. **Session Persistence**:
   - After logging in, refresh the page
   - ✅ Should remain logged in
   - ✅ Menu items should reflect user role

3. **Invalid Login**:
   - Try logging in with wrong password
   - ✅ Should show error message
   - ✅ PostHog should track `login_failure` event

4. **Route Protection**:
   - Log out (clear token)
   - Try accessing `/dashboard`
   - ✅ Should redirect to `/login`

5. **Token Refresh**:
   - Login and wait for token to expire (or manually expire it)
   - Make an API call
   - ✅ Should auto-refresh token and retry request

**Acceptance Criteria**:
- ✅ Successful login redirects to `/dashboard` and shows user name
- ✅ Page reload persists session and menu
- ✅ Unauthorized route access redirects to `/login`

---

### **Story 2: Timesheet - Employee Weekly Flow** ✅ COMPLETE

**Status**: Fully implemented and tested

**User Story**: As an employee, I want to view/edit my weekly timesheet and submit it so that my time can be approved.

**API Endpoints**:
- `GET /timesheets?user_id=me&week_start=YYYY-MM-DD` - Get timesheet for week
- `POST /timesheets` - Create new timesheet
- `GET /time-entries` - List time entries
- `POST /time-entries` - Create entry
- `PATCH /time-entries/:id` - Update entry
- `DELETE /time-entries/:id` - Delete entry
- `GET /time-entries/stats/weekly?user_id=me` - Weekly stats
- `POST /timesheets/:id/submit` - Submit for approval

**Implementation Checklist**:
- [x] Build timesheet table component (7 day columns: Mon-Sun)
- [x] If no timesheet exists: show "Create timesheet" CTA → `POST /timesheets`
- [x] CRUD operations for time entries (project, task, hours, notes per day)
- [x] Calculate and display weekly total hours (client-side)
- [x] Validate against policy limits from `/me.policy` (e.g., max hours/day)
- [x] "Submit for approval" button → `POST /timesheets/:id/submit`
- [x] Add week picker with navigation (previous/next/this week)
- [x] Add PostHog event tracking: `timesheet_submitted`
- [x] MSW mock handlers for all endpoints
- [x] i18n translations (English)

**Manual Testing**:
1. **Create Timesheet**:
   - Navigate to `/timesheet`
   - If no timesheet: click "Create timesheet"
   - ✅ Empty timesheet grid should appear with 7 columns (Mon-Sun)

2. **Add Time Entry**:
   - Click "Add entry" or click a cell
   - Select project, task, enter hours, add notes
   - ✅ Entry should appear in table
   - ✅ Weekly total should update

3. **Edit/Delete Entry**:
   - Click existing entry → modify hours
   - ✅ Total should recalculate
   - Delete entry → ✅ Should be removed

4. **Policy Validation**:
   - Try entering >24 hours in one day
   - ✅ Should show validation error
   - ✅ Submit button should be disabled

5. **Submit Timesheet**:
   - Fill valid entries
   - Click "Submit for approval"
   - ✅ Success toast should appear
   - ✅ Timesheet status should change to "Pending"

**Acceptance Criteria**:
- ✅ Can create draft, add/edit/remove entries, see totals, and submit
- ✅ Policy limits (e.g., max/day) block submission with clear message

---

### **Story 3: Timesheet - Manager Queue** ✅ COMPLETE

**Status**: Fully implemented and tested

**User Story**: As a manager, I want to see pending team timesheets so that I can approve/reject them.

**API Endpoints**:
- `GET /timesheets?status=pending` - Pending team timesheets
- `GET /timesheets/:id` - Get timesheet details
- `POST /timesheets/:id/approve` - Approve timesheet
- `POST /timesheets/:id/reject` - Reject with note

**Implementation Checklist**:
- [x] Create new page: `/team-timesheets`
- [x] Add permission check (manager only - `approve_timesheets` permission)
- [x] Build pending timesheets table: employee, week, total hours, submitted_at
- [x] Row actions: "View" (modal with details), "Approve", "Reject (with note)"
- [x] Implement optimistic UI updates (revert on error)
- [x] Add PostHog events: `timesheet_approved`, `timesheet_rejected`
- [x] Build TimesheetDetailModal component with full week view
- [x] Add rejection reason modal
- [x] MSW mock handlers (already in Story 2)
- [x] i18n translations

**Manual Testing**:
1. **Access Control**:
   - Login as employee (demo@kairos.com) → ✅ Menu should NOT show "Team Timesheets"
   - Login as manager (manager@kairos.com) → ✅ Menu SHOULD show "Team Timesheets"

2. **View Pending Queue**:
   - Navigate to `/team-timesheets`
   - ✅ Should show list of pending timesheets
   - ✅ Each row shows: employee ID, week dates, total hours, submitted date

3. **View Details**:
   - Click "View" on a timesheet
   - ✅ Modal should open with all time entries

4. **Approve Timesheet**:
   - Click "Approve"
   - ✅ Timesheet should disappear from queue (optimistic update)
   - ✅ Success toast should appear

5. **Reject Timesheet**:
   - Click "Reject" → enter reason
   - ✅ Timesheet should disappear
   - ✅ Employee should see rejection note

**Acceptance Criteria**:
- ✅ Only manager roles see the page
- ✅ Approve/reject updates list without reload

---

### **Story 4: Leave - Employee Requests** ✅ COMPLETE

**Status**: Fully implemented and tested

**User Story**: As an employee, I want to request leave and track statuses so that I can plan time off.

**API Endpoints**:
- `GET /leave-requests?mine=true` - My leave requests
- `POST /leave-requests` - Create request
- `PATCH /leave-requests/:id` - Update request (pending only)
- `POST /leave-requests/:id/cancel` - Cancel request
- `GET /users/:id/benefits` - Get leave balances

**Implementation Checklist**:
- [x] Build `/leave-requests` page with comprehensive layout
- [x] Create LeaveRequestForm component with React Hook Form + Zod validation
- [x] Create LeaveRequestsTable component with employee and manager modes
- [x] Create LeaveBalanceDisplay component with visual progress bars
- [x] Fetch and display leave balances from `/users/:id/benefits`
- [x] Implement business days calculation for leave requests
- [x] Zod validation: validate date ranges (end >= start)
- [x] View mode toggle for managers (My Requests / Team Requests)
- [x] Add PostHog events: `leave_requested`, `leave_cancelled`
- [x] Add MSW mock handlers for all leave endpoints
- [x] Add i18n translations for all leave-related strings
- [x] Implement optimistic UI updates for cancel/approve/reject actions

**Manual Testing**:
1. **View Requests**:
   - Navigate to `/leave-requests`
   - ✅ Should show table of all my requests (pending, approved, rejected, cancelled)
   - ✅ Should see leave balance display on the left side

2. **Check Balances**:
   - ✅ Page displays leave balances per type (Vacation, Sick, Personal, Parental)
   - ✅ Shows total, used, and remaining days with progress bars
   - ✅ Color-coded progress bars (green > 60%, yellow > 30%, red < 30%)

3. **Create Request**:
   - Click "New Leave Request"
   - Select type (e.g., Vacation)
   - Choose start/end dates
   - Enter reason (optional)
   - ✅ Should show business days count
   - Click "Submit Request"
   - ✅ Request should appear in table with "Pending" status

4. **Validation**:
   - Try end date before start date
   - ✅ Should show error: "End date must be after or equal to start date"
   - Leave required fields empty
   - ✅ Should show validation errors

5. **Cancel Request**:
   - Click "Cancel" on pending request
   - ✅ Confirmation dialog appears
   - ✅ Request status changes to "Cancelled"
   - ✅ Optimistic UI update (instant feedback)

6. **Manager View**:
   - Login as manager
   - ✅ Should see view mode toggle buttons
   - Click "Team Requests"
   - ✅ Should show pending team requests
   - ✅ Approve/Reject buttons available

**Acceptance Criteria**:
- ✅ Create/cancel works; balances render correctly with visual indicators
- ✅ Validation prevents invalid date ranges
- ✅ Manager can switch between personal and team views
- ✅ Business days calculation works correctly

---

### **Story 5: Leave - Manager Queue** ✅ COMPLETE

**Status**: Fully implemented and tested

**User Story**: As a manager, I want a list of pending team leave requests so that I can approve/reject quickly.

**API Endpoints**:
- `GET /leave-requests?team=true&status=pending` - Pending team requests
- `POST /leave-requests/:id/approve` - Approve request
- `POST /leave-requests/:id/reject` - Reject with note

**Implementation Checklist**:
- [x] Create dedicated page: `/team-leave`
- [x] Create TeamLeaveQueueContent component
- [x] Pending requests table: employee, type, dates, duration, reason, requested_at
- [x] Row actions: "Approve", "Reject (with reason modal)"
- [x] Add stats card showing pending count
- [x] Add PostHog events: `leave_approved`, `leave_rejected`
- [x] Add permission check (approve_leave_requests)
- [x] Add to navigation menu (manager-only)
- [x] Update middleware to protect route
- [x] Add i18n translations

**Manual Testing**:
1. **Access Control**:
   - Login as employee → ✅ Menu should NOT show "Team Leave"
   - Login as manager → ✅ Menu SHOULD show "Team Leave"
   - Navigate to `/team-leave` as employee → ✅ Shows permission error

2. **View Queue**:
   - Navigate to `/team-leave` as manager
   - ✅ Should show pending requests only
   - ✅ Stats card shows pending count
   - ✅ Table displays: employee, type, dates, duration, reason, requested date

3. **Approve**:
   - Click "Approve"
   - ✅ Confirmation dialog appears
   - ✅ Request disappears from queue
   - ✅ Optimistic UI update (instant feedback)
   - ✅ PostHog tracks `leave_approved` event

4. **Reject**:
   - Click "Reject" → modal appears
   - Enter rejection reason
   - ✅ Request disappears from queue
   - ✅ PostHog tracks `leave_rejected` event
   - ✅ Employee can see rejection reason in their requests

5. **Empty State**:
   - When all requests are processed
   - ✅ Shows "No Pending Requests" with checkmark icon

**Acceptance Criteria**:
- ✅ Manager-only access with proper permission checks
- ✅ Actions update list immediately with optimistic updates
- ✅ Business days calculation shown for each request
- ✅ Rejection reason required and captured

---

### **Story 6: Unified Calendar & PTO Conflict Hint** ✅ COMPLETE

**Status**: Fully implemented and tested

**User Story**: As a user, I want a calendar view merging holidays and approved leaves so that I can plan better and avoid conflicts.

**API Endpoints**:
- `GET /calendar?user_id=me&from=YYYY-MM-DD&to=YYYY-MM-DD&include=holidays,leave` - Calendar data
- `GET /holidays?year=YYYY` - Get holidays for a specific year
- `GET /calendar/check-overlap?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD` - Check for conflicts

**Implementation Checklist**:
- [x] Add calendar types to shared types (Holiday, CalendarEvent, CalendarData)
- [x] Create calendar API service with getCalendarData, getHolidays, checkDateOverlap
- [x] Create Calendar component (month view) with navigation
- [x] Add to `/leave-requests` page sidebar
- [x] Fetch holidays + approved leaves for visible month
- [x] Render distinct badges for holidays (red) vs. leaves (green)
- [x] In PTO form: on date change, check for overlaps automatically
- [x] Show warning with holiday names and team members out
- [x] Overlap warnings are non-blocking (can still submit)
- [x] Add PostHog event: `pto_overlap_warned`
- [x] Add MSW mock handlers for all calendar endpoints
- [x] Add i18n translations for calendar

**Manual Testing**:
1. **View Calendar**:
   - Navigate to `/leave-requests`
   - ✅ Sidebar shows current month calendar below leave balance
   - ✅ Holidays marked with red dots
   - ✅ Approved leaves marked with green dots
   - ✅ Current day highlighted in blue
   - ✅ Legend shows what each color means

2. **Navigate Months**:
   - Click "Today" button → ✅ Returns to current month
   - Click previous/next arrows → ✅ Calendar updates
   - ✅ New data fetched for each month
   - ✅ Events update based on visible month

3. **Overlap Warning - Holidays**:
   - Click "New request"
   - Select dates that include a holiday (e.g., July 4th)
   - ✅ Warning appears: "Scheduling Conflict Detected"
   - ✅ Lists holiday names with dates
   - ✅ Shows "This is just a warning. You can still submit your request."
   - ✅ Submit button remains enabled

4. **Overlap Warning - Team Members**:
   - Create approved leave for team member
   - Select overlapping dates in new request
   - ✅ Shows "X team member(s) will be out"
   - ✅ Lists team member names and their leave dates
   - ✅ Shows up to 3 team members, then "and X more..."

5. **PostHog Tracking**:
   - When overlap detected → ✅ `pto_overlap_warned` event tracked
   - Includes holidaysCount and leavesCount in event data

**Acceptance Criteria**:
- ✅ Calendar updates per month; holidays and leaves show distinct badges
- ✅ Overlap warnings are shown but non-blocking
- ✅ Both holiday and team leave overlaps detected
- ✅ Calendar integrated into leave requests page

---

### **Story 7: Projects & Tasks Pickers** ✅ COMPLETE

**Status**: Fully implemented and tested

**User Story**: As an employee, I want fast project/task selection so that logging time is quick.

**API Endpoints**:
- `GET /search/projects?q=query` - Search projects
- `GET /search/tasks?q=query&project_id=id` - Search tasks (scoped by project)

**Implementation Checklist**:
- [x] Create reusable AsyncCombobox component
- [x] Implement debounced search (300ms default, configurable)
- [x] Cache last 10 search results in component state (Map)
- [x] Replace `<select>` dropdowns in TimeEntryForm with AsyncCombobox
- [x] Task picker automatically scoped by selected project
- [x] Task field disabled until project is selected
- [x] Task resets when project changes
- [x] Add PostHog events: `project_search`, `task_search`
- [x] MSW handlers already implemented for search endpoints
- [x] Add i18n translations

**Manual Testing**:
1. **Project Search**:
   - In timesheet form, click project field
   - ✅ Dropdown opens with all projects
   - Type "kairos" → ✅ Results filter instantly
   - ✅ Shows project name and code
   - ✅ Debounced search (300ms)
   - ✅ Clear button appears when selected

2. **Task Search**:
   - Without selecting project → ✅ Task field is disabled
   - Select a project → ✅ Task field becomes enabled
   - Click task field → ✅ Shows only tasks for selected project
   - Type to filter → ✅ Results narrow
   - ✅ Shows task name and code

3. **Cache Behavior**:
   - Search "kairos" → results appear
   - Select a project, then clear it
   - Search "kairos" again → ✅ Instant results (from cache)
   - Cache stores last 10 searches

4. **Project Change Handling**:
   - Select project → select task
   - Change to different project
   - ✅ Task field automatically resets

5. **PostHog Tracking**:
   - Search for project → ✅ `project_search` event tracked
   - Search for task → ✅ `task_search` event tracked
   - Events include: query, resultsCount, userId, projectId (for tasks)

**Acceptance Criteria**:
- ✅ Typeahead returns results <300ms (debounced)
- ✅ Task list scoped by selected project
- ✅ Search results cached for performance
- ✅ Reusable component for future use

---

### **Story 8: Dashboard Data & Widgets** ✅ COMPLETE

**Status**: Fully implemented and tested

**User Story**: As a user, I want a dashboard with my key info so that I see what needs attention.

**API Endpoints**:
- `GET /time-entries/stats/weekly?user_id=me` - Weekly hours
- `GET /time-entries/stats/project?user_id=me` - Hours by project
- `GET /timesheets?team=true&status=pending` - Pending timesheets (manager)
- `GET /leave-requests?team=true&status=pending` - Pending leave (manager)
- `GET /holidays?year=YYYY` - Holidays

**Implementation Checklist**:
- [x] Build dashboard widgets (cards):
  - "This week hours" (bar chart showing daily hours)
  - "By project" (horizontal bar chart with percentages)
  - "Upcoming holidays" (list with dates)
- [x] Manager-only widgets:
  - "Pending timesheets (N)" (count + link)
  - "Pending leave (M)" (count + link)
- [x] Empty states for zero data with icons and messages
- [x] Add PostHog event: `dashboard_viewed`
- [x] Add MSW handler for `/time-entries/stats/project`
- [x] Add i18n translations for dashboard widgets
- [x] Create DashboardContent2 component with all widgets
- [x] Update dashboard.astro to use new component

**Manual Testing**:
1. **Employee Dashboard**:
   - Login as employee
   - Navigate to `/dashboard`
   - ✅ Should see: "This week hours", "By project", "Upcoming holidays"
   - ✅ Should NOT see manager widgets

2. **Manager Dashboard**:
   - Login as manager
   - ✅ Should see all employee widgets PLUS:
     - "Pending timesheets (N)"
     - "Pending leave (M)"

3. **Empty States**:
   - New user with no data
   - ✅ Each widget shows empty state message

4. **Data Updates**:
   - Log some hours
   - Return to dashboard
   - ✅ "This week hours" updates

**Acceptance Criteria**:
- ✅ Cards reflect API data
- ✅ Empty states shown when no data

---

### **Story 9: Error, Empty, Loading States + i18n** ✅ COMPLETE

**Status**: Fully implemented and tested

**User Story**: As a user, I want clear states in every view so that I understand what's happening.

**Implementation Checklist**:
- [x] Create `<DataState>` component with modes:
  - Loading (skeleton loader with animation)
  - Empty (message + optional icon + optional CTA button)
  - Error (error icon + message + retry button)
  - Success (renders children)
- [x] Component created at [src/components/ui/DataState.tsx](apps/kairosfe/src/components/ui/DataState.tsx)
- [x] Add i18n keys for all states (en, es, pt-PT, de):
  - `dataState.noData` - Empty state message
  - `dataState.errorTitle` - Error heading
  - `dataState.errorGeneric` - Default error message
  - `dataState.retry` - Retry button text
  - `dataState.loadingData` - Loading message
- [x] All translations added to en.json, es.json, pt-PT.json, de.json
- [x] Sentry already configured in application (existing setup)

**Manual Testing**:
1. **Loading State**:
   - Navigate to `/dashboard`
   - Slow down network (DevTools → throttle)
   - ✅ Should show skeleton loaders

2. **Empty State**:
   - New user with no timesheets
   - Navigate to timesheet page
   - ✅ Should show: "No timesheets yet. Create your first one!"

3. **Error State**:
   - Stop backend API
   - Navigate to any page
   - ✅ Should show error message + "Retry" button
   - Click retry → ✅ Should refetch

4. **i18n**:
   - Switch language to Spanish
   - Trigger error state
   - ✅ Error message should be in Spanish

5. **Sentry**:
   - Trigger an error
   - Check Sentry dashboard
   - ✅ Should see error with user context

**Acceptance Criteria**:
- ✅ Every list/form shows proper loading/error/empty messages (translated)

---

### **Story 10: Real API Integration** ✅ COMPLETE

**Status**: Application uses real backend API only

**User Story**: As a developer, I want to use the real backend API for all requests.

**Implementation Checklist**:
- [x] API client infrastructure ready at [src/lib/api/client.ts](apps/kairosfe/src/lib/api/client.ts)
- [x] API base URL configurable via `VITE_API_BASE_URL` environment variable
- [x] All service functions in [src/lib/api/services/](apps/kairosfe/src/lib/api/services/) use the API client
- [x] Authentication with JWT tokens and automatic refresh
- [x] API errors automatically reported to Sentry
- [x] Removed MSW (Mock Service Worker) infrastructure

**Manual Testing**:
1. **Real API**:
   - Set `VITE_API_BASE_URL=http://localhost:3000`
   - Start backend
   - ✅ All requests hit real API

2. **Error Handling**:
   - Stop backend
   - Refresh app
   - ✅ Should show appropriate error messages
   - Start backend
   - ✅ Application recovers gracefully

**Acceptance Criteria**:
- ✅ All endpoints use real backend API
- ✅ No mocking infrastructure in production build

---

## Definition of Done (All Stories)

Each story is considered complete when:
- ✅ UI matches all states (loading/empty/error/success)
- ✅ i18n keys added for all new strings (en, es, pt-PT, de)
- ✅ Telemetry events added (PostHog + Sentry)
- ✅ Tests pass (Vitest + Playwright)
- ✅ No console errors
- ✅ ESLint/Prettier clean
- ✅ Manual testing checklist completed
- ✅ PR reviewed and merged

---

## Legend

- ✅ **COMPLETE** - Fully implemented and tested
- 🚧 **IN PROGRESS** - Currently being worked on
- ⏸️ **NOT STARTED** - Queued for future implementation
- ⚠️ **BLOCKED** - Waiting on dependencies

---

## Development Guidelines

### Code Style

- Use TypeScript for all new files
- Follow the Airbnb style guide
- Use functional components with hooks
- Keep components small and focused
- Write tests for new features

### Component Structure

```tsx
// 1. Imports
import React from 'react';
import { useTranslation } from 'react-i18next';

// 2. Types
interface Props {
  // ...
}

// 3. Component
export default function Component({ prop }: Props) {
  // 4. Hooks
  const { t } = useTranslation();

  // 5. State & effects

  // 6. Handlers

  // 7. Render
  return <div>...</div>;
}
```

### Commit Messages

Follow conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting
- `refactor:` Code restructuring
- `test:` Tests
- `chore:` Maintenance

## Deployment

The application is configured for deployment on Vercel:

```bash
# Build for production
pnpm build

# Preview production build locally
pnpm preview
```

Vercel will automatically build and deploy when pushing to the main branch.

## Environment Variables

Required environment variables:

```env
# API Configuration (REQUIRED)
VITE_API_BASE_URL=http://localhost:3000

# i18n (REQUIRED)
VITE_DEFAULT_LOCALE=en
VITE_SUPPORTED_LOCALES=en,es,pt-PT,de

# Analytics (OPTIONAL - can be left empty)
VITE_POSTHOG_KEY=
VITE_SENTRY_DSN=
```

**Important**: Make sure your backend API is running on the configured port (default: 3000)

## Troubleshooting

### Build Errors

If you encounter build errors:

```bash
# Clear cache and rebuild
rm -rf node_modules .astro dist
pnpm install
pnpm build
```

### Type Errors

```bash
# Run type check
pnpm exec astro check
```

### Test Failures

```bash
# Run tests in watch mode
pnpm test:ui

# Run E2E tests in debug mode
pnpm exec playwright test --debug
```

## Implementation Status

For detailed implementation status, recent updates, and next steps, see:
- [IMPLEMENTATION_STATUS_UPDATE.md](IMPLEMENTATION_STATUS_UPDATE.md) - Latest progress and roadmap
- [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) - Detailed feature tracker

### Quick Status Summary

**Overall Progress**: ~98% complete (47/49 user stories) 🎉

**Recently Completed** (This Session - ~62 hours):
1. ✅ Session Refresh Mechanism (auto-refresh tokens before expiry)
2. ✅ Organization Settings Page (admin)
3. ✅ Timesheet Policy Management (admin)
4. ✅ Projects Administration (full CRUD + member management)
5. ✅ Tasks Administration (hierarchical task organization)
6. ✅ Holidays Management (recurring and one-time holidays)
7. ✅ Benefit Types Configuration (leave types with units and approval)
8. ✅ Team Calendar View (week/month views with team filtering) 📅
9. ✅ Team Reports & Analytics (timesheet/leave reports with CSV export) 📊
10. ✅ Users Management (full user CRUD, roles, permissions) 👥
11. ✅ **Team Member Performance (individual analytics & comparisons)** 📈
12. ✅ **User Reactivation (admin/manager can reactivate disabled users)** 🔄
13. ✅ **Leave Overlap Detection (warns about scheduling conflicts)** ⚠️
14. ✅ Bug Fixes (Reports tab crash)
15. ✅ Enhanced Services (Projects, Tasks, Holidays, Benefit Types, Calendar, Reports, Users)

**Major Milestones**:
- 🏆 **Admin Tools at 100%!** ALL ADMIN FEATURES COMPLETE! 🎊
- 🎊 **Manager Views at 100%!** ALL MANAGER FEATURES COMPLETE! 📊📈
- 🚀 **Core Features at 98%!** Only 2 LOW-priority polish items remaining!

**Remaining (LOW Priority - Nice-to-Have)**:
- ⏸️ Enhanced Task Search with hierarchy display (2-3 hours)
- ⏸️ Timesheet Status History Timeline visualization (3-4 hours)

### Key Features Status
- ✅ Authentication & Session Management (100%)
- ✅ Weekly Timesheet Management (100%)
- ✅ Leave Request Workflows (100%)
- ✅ Dashboard with Analytics (100%)
- ✅ Manager Approval Queues (100%)
- ✅ Calendar with Overlap Detection (100%)
- ✅ **Admin Tools (100% - ALL COMPLETE!)** 🎊
  - ✅ Users Management (full CRUD, roles, permissions, reactivation)
  - ✅ Organization Settings
  - ✅ Timesheet Policy
  - ✅ Projects Administration
  - ✅ Tasks Administration
  - ✅ Holidays Management
  - ✅ Benefit Types Configuration
- ✅ **Manager Views (100% - ALL COMPLETE!)** 🎊
  - ✅ Team Calendar (week/month views, filtering, CSV export)
  - ✅ Team Reports & Analytics (timesheet/leave reports with data visualization)
  - ✅ Team Member Performance (individual analytics, comparisons, utilization)

## License

Internal use only.

## Support

For questions or issues, please contact the development team.
