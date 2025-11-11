# Employee Management Enhancements Tracker

**Started:** 2025-10-27
**Status:** 🔄 In Progress
**Type:** UX Improvements & Optional Enhancements

---

## 📊 Progress Overview

- ✅ **Enhancement 1**: Toast Notifications (COMPLETE)
- ⏳ **Enhancement 2**: Manager Dropdown with AsyncCombobox (IN PROGRESS)
- ❌ **Enhancement 3**: Permission-based UI Visibility (NOT STARTED)
- ❌ **Enhancement 4**: i18n for Other Languages (NOT STARTED)
- ❌ **Enhancement 5**: Resend Invite Action (NOT STARTED)
- ❌ **Enhancement 6**: Employee Details Modal (OPTIONAL - NOT STARTED)
- ❌ **Enhancement 7**: Bulk Operations (OPTIONAL - NOT STARTED)

---

## 🎯 Enhancement Details

### ✅ Enhancement 1: Toast Notifications (Priority: HIGH) - COMPLETE

**Goal:** Replace inline error messages with toast notifications for better UX

**Tasks:**
- [x] Install `react-hot-toast` library
- [x] Create toast utility wrapper at `src/lib/utils/toast.ts`
- [x] Create ToastProvider component
- [x] Add Toaster component to BaseLayout.astro
- [x] Replace TODO comment in `handleEmployeeAdded()` (TeamManagementContentNew.tsx:232)
- [x] Replace TODO comment in `handleEmployeeUpdated()` (TeamManagementContentNew.tsx:243)
- [x] Replace TODO comment in `handleEmployeeDeleted()` (TeamManagementContentNew.tsx:254)
- [x] Add success toasts to AddEmployeeModal
- [x] Add success toasts to EditEmployeeModal
- [x] Add success toasts to ConfirmDeleteDialog
- [x] Keep error messages inline for form validation (better UX)

**Files to modify:**
- `package.json` - Add dependency
- `src/lib/utils/toast.ts` - NEW FILE
- `src/components/data/TeamManagementContentNew.tsx`
- `src/components/forms/AddEmployeeModal.tsx`
- `src/components/forms/EditEmployeeModal.tsx`
- `src/components/ui/ConfirmDeleteDialog.tsx`

---

### Enhancement 2: Manager Dropdown with AsyncCombobox

**Goal:** Replace plain text managerId input with searchable dropdown

**Tasks:**
- [ ] Add manager search method to `employeesService`
- [ ] Replace text input with `<AsyncCombobox>` in AddEmployeeModal
- [ ] Replace text input with `<AsyncCombobox>` in EditEmployeeModal
- [ ] Display manager name instead of UUID in forms
- [ ] Add i18n key for "Manager" field

**Files to modify:**
- `src/lib/api/services/employees.ts`
- `src/components/forms/AddEmployeeModal.tsx`
- `src/components/forms/EditEmployeeModal.tsx`
- `src/lib/i18n/locales/*.json`

---

### Enhancement 3: Permission-based UI Visibility

**Goal:** Show/hide actions based on current user role

**Tasks:**
- [ ] Create permission helper at `src/lib/utils/permissions.ts`
- [ ] Add `useAuthStore` to TeamManagementContentNew
- [ ] Hide "Add Employee" button for employees
- [ ] Hide "Edit" action for employees
- [ ] Hide "Deactivate" action for non-admins
- [ ] Show visual feedback when actions are disabled

**Files to modify:**
- `src/lib/utils/permissions.ts` - NEW FILE
- `src/components/data/TeamManagementContentNew.tsx`

---

### Enhancement 4: i18n for Other Languages

**Goal:** Translate employee CRUD strings to es, pt-PT, de

**Tasks:**
- [ ] Add employee translations to `es.json` (Spanish)
- [ ] Add employee translations to `pt-PT.json` (Portuguese)
- [ ] Add employee translations to `de.json` (German)
- [ ] Test language switching

**Files to modify:**
- `src/lib/i18n/locales/es.json`
- `src/lib/i18n/locales/pt-PT.json`
- `src/lib/i18n/locales/de.json`

**Translation keys to add:**
```
employees.modals.add.*
employees.modals.edit.*
employees.modals.delete.*
employees.fields.*
employees.actions.*
employees.success.*
employees.errors.*
```

---

### Enhancement 5: Resend Invite Action

**Goal:** Allow admins to resend invitation emails

**Tasks:**
- [ ] Add "Resend Invite" to action menu dropdown
- [ ] Show only for users with status='invited'
- [ ] Call `employeesService.invite()` on click
- [ ] Show toast confirmation
- [ ] Add i18n key for "Resend Invite"
- [ ] Handle error cases (403, 404)

**Files to modify:**
- `src/components/data/TeamManagementContentNew.tsx`
- `src/lib/i18n/locales/*.json`

---

### Enhancement 6: Employee Details Modal (OPTIONAL)

**Goal:** Click row to view full employee profile

**Tasks:**
- [ ] Create `src/components/ui/EmployeeDetailsModal.tsx`
- [ ] Add click handler to table rows
- [ ] Display all employee fields in read-only view
- [ ] Show manager name (fetch if needed)
- [ ] Add "Edit" and "Close" buttons
- [ ] Dark mode support

**Files to create:**
- `src/components/ui/EmployeeDetailsModal.tsx`

**Files to modify:**
- `src/components/data/TeamManagementContentNew.tsx`

---

### Enhancement 7: Bulk Operations (OPTIONAL)

**Goal:** Select multiple employees for batch operations

**Tasks:**
- [ ] Add checkbox column to table
- [ ] Track selected employee IDs in state
- [ ] Add "Select All" checkbox in header
- [ ] Add "Bulk Deactivate" button (only for admins)
- [ ] Show selected count (e.g., "3 selected")
- [ ] Confirmation dialog for bulk action
- [ ] Call deactivate for each selected user
- [ ] Show progress toast
- [ ] Handle partial failures

**Files to modify:**
- `src/components/data/TeamManagementContentNew.tsx`
- `src/lib/i18n/locales/*.json`

---

## 📂 Files Summary

### New Files (3):
- [ ] `apps/kairosfe/EMPLOYEE_ENHANCEMENTS.md` - This tracking document
- [ ] `src/lib/utils/toast.ts` - Toast notification utility
- [ ] `src/lib/utils/permissions.ts` - Permission helper functions
- [ ] `src/components/ui/EmployeeDetailsModal.tsx` - Employee details (optional)

### Modified Files (~10):
- [ ] `package.json` - Add react-hot-toast
- [ ] `src/components/data/TeamManagementContentNew.tsx` - Multiple enhancements
- [ ] `src/components/forms/AddEmployeeModal.tsx` - Toast + AsyncCombobox
- [ ] `src/components/forms/EditEmployeeModal.tsx` - Toast + AsyncCombobox
- [ ] `src/components/ui/ConfirmDeleteDialog.tsx` - Toast notifications
- [ ] `src/lib/api/services/employees.ts` - Manager search method
- [ ] `src/lib/i18n/locales/en.json` - New keys
- [ ] `src/lib/i18n/locales/es.json` - Full translation
- [ ] `src/lib/i18n/locales/pt-PT.json` - Full translation
- [ ] `src/lib/i18n/locales/de.json` - Full translation

---

## ⏱️ Time Tracking

| Enhancement | Estimated | Actual | Status |
|-------------|-----------|--------|--------|
| Setup | 5 min | - | ⏳ In Progress |
| Toast Notifications | 45 min | - | ❌ Pending |
| Manager Dropdown | 30 min | - | ❌ Pending |
| Permissions UI | 30 min | - | ❌ Pending |
| i18n Translations | 45 min | - | ❌ Pending |
| Resend Invite | 20 min | - | ❌ Pending |
| Employee Details | 60 min | - | ❌ Optional |
| Bulk Operations | 90 min | - | ❌ Optional |
| **TOTAL (Core)** | **~3 hours** | **-** | **-** |
| **TOTAL (All)** | **~5.5 hours** | **-** | **-** |

---

## 🐛 Issues & Blockers

*(None yet)*

---

## 📝 Notes

- Toast library: `react-hot-toast` (lightweight, 3.7KB gzipped)
- AsyncCombobox component already exists and is working
- Auth store (useAuthStore) already has user, role, permissions
- i18n files exist but need employee translations added
- Manager search will filter GET /users?role=manager,admin

---

Last Updated: 2025-10-27
