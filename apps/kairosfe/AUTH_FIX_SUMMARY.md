# Authentication Fix Summary

## Issues Fixed

### 1. **Login Response Structure Mismatch**
**Problem:** The API returns `{ data: { token, refreshToken, user, tenant } }` but the frontend was trying to access properties directly on the response.

**Solution:** Updated `LoginFormNew.tsx` to properly destructure the response:
```typescript
const { data } = response;
// Now access: data.token, data.refreshToken, data.user
```

### 2. **Missing User Role and Permissions**
**Problem:** The login response doesn't include full user details (role, permissions, policy). This caused the error: `Cannot read properties of undefined (reading 'role')`.

**Solution:** Changed login flow to:
1. Save tokens to store with `setTokens()`
2. Call `hydrate()` to fetch full user data from `/auth/me`
3. The `/auth/me` endpoint returns role, permissions, and policy

### 3. **MSW Login Handler Updates**
**Problem:** Mock handler wasn't returning the correct response structure.

**Solution:** Updated handler to:
- Return `{ data: { token, refreshToken, user: { id, email, name }, tenant: { id } } }`
- Added support for `manager@demo.com` / `Password123!` credentials
- Matches the OpenAPI spec exactly

### 4. **Hydrate Function Enhancement**
**Problem:** The `hydrate()` function was calling `/me` instead of `/auth/me` and not handling the response structure.

**Solution:** Updated `hydrate()` to:
- Call `/auth/me` endpoint
- Extract user data from `response.data`
- Map membership role to user.role
- Assign permissions based on role (admin, manager, employee)
- Build policy from timesheet policy data

## Test Credentials

### Manager Account (Full Access)
- **Email:** `manager@demo.com`
- **Password:** `Password123!`
- **Role:** `manager`
- **Permissions:** Can approve timesheets and leave requests

### Employee Account
- **Email:** `demo@kairos.com`
- **Password:** `demo123`
- **Role:** `employee`
- **Permissions:** Basic employee access

## Login Flow

```
1. User submits login form
   ↓
2. POST /auth/login with email/password
   ↓
3. Response: { data: { token, refreshToken, user, tenant } }
   ↓
4. setTokens(token, refreshToken)
   ↓
5. hydrate() - GET /auth/me
   ↓
6. Response: { data: { user, tenant, membership, timesheetPolicy } }
   ↓
7. Build full user object with role and permissions
   ↓
8. Update store with complete user data
   ↓
9. Redirect to /dashboard
```

## API Endpoints Used

### POST /auth/login
**Request:**
```json
{
  "email": "manager@demo.com",
  "password": "Password123!"
}
```

**Response:**
```json
{
  "data": {
    "token": "mock-jwt-token-...",
    "refreshToken": "mock-refresh-token-...",
    "expiresAt": "2025-11-20T23:02:36.336Z",
    "user": {
      "id": "...",
      "email": "manager@demo.com",
      "name": "Alice Manager"
    },
    "tenant": {
      "id": "tenant-1"
    }
  }
}
```

### GET /auth/me
**Response:**
```json
{
  "data": {
    "user": {
      "id": "...",
      "email": "manager@demo.com",
      "name": "Alice Manager",
      "locale": "en-US"
    },
    "tenant": {
      "id": "tenant-1"
    },
    "membership": {
      "role": "manager",
      "status": "active"
    },
    "timesheetPolicy": {
      "tenantId": "tenant-1",
      "hoursPerWeek": 40,
      "weekStartDay": 1,
      "requireApproval": true,
      "allowEditAfterSubmit": false
    }
  }
}
```

## Permission Mapping

### Admin
- All permissions
- Can manage users and settings

### Manager
- View and manage team
- Approve timesheets and leave requests
- All employee permissions

### Employee
- View dashboard
- Manage own profile
- Submit timesheets and leave requests

## Files Modified

1. `/apps/kairosfe/src/components/forms/LoginFormNew.tsx` - Fixed login flow
2. `/apps/kairosfe/src/lib/store/index.ts` - Enhanced hydrate() function
3. `/apps/kairosfe/src/lib/api/mocks/handlers.ts` - Fixed login response structure

## Testing

1. Start dev server: `pnpm dev`
2. Navigate to `/login`
3. Enter credentials:
   - `manager@demo.com` / `Password123!`
4. Click "Sign In"
5. Should successfully redirect to `/dashboard` with full user context

## Troubleshooting

### "Cannot read properties of undefined (reading 'role')"
- **Cause:** Old login flow tried to access user.role before hydrate completed
- **Fixed:** Now using setTokens() + hydrate() pattern

### "Invalid credentials"
- **Cause:** Wrong email/password
- **Solution:** Use the test credentials above

### "Session expired"
- **Cause:** Token expired or invalid
- **Solution:** Clear localStorage and login again

## Next Steps

- ✅ Authentication working
- ✅ Role-based permissions working
- ✅ MSW handlers aligned with OpenAPI spec
- 🔲 Add loading state during hydrate
- 🔲 Add better error messages
- 🔲 Implement remember me functionality
