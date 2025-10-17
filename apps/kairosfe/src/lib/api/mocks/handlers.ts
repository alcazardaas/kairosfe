import { http, HttpResponse } from 'msw';
import type { User, LeaveRequest, TeamMember, AuthResponse, RefreshTokenResponse } from '@kairos/shared';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Mock data
const mockUser: User = {
  id: '1',
  email: 'demo@kairos.com',
  name: 'Demo User',
  role: 'employee',
  avatar: 'https://i.pravatar.cc/150?img=1',
  permissions: [
    'view_dashboard',
    'view_profile',
    'edit_profile',
    'view_leave_requests',
    'create_leave_request',
    'view_timesheets',
    'create_timesheet',
  ],
  policy: {
    maxHoursPerDay: 24,
    maxHoursPerWeek: 40,
    canApproveTimesheets: false,
    canApproveLeaveRequests: false,
  },
};

const mockManagerUser: User = {
  id: '2',
  email: 'manager@kairos.com',
  name: 'Manager User',
  role: 'manager',
  avatar: 'https://i.pravatar.cc/150?img=2',
  permissions: [
    'view_dashboard',
    'view_profile',
    'edit_profile',
    'view_team',
    'manage_team',
    'view_leave_requests',
    'create_leave_request',
    'approve_leave_requests',
    'view_timesheets',
    'create_timesheet',
    'approve_timesheets',
  ],
  policy: {
    maxHoursPerDay: 24,
    maxHoursPerWeek: 40,
    canApproveTimesheets: true,
    canApproveLeaveRequests: true,
  },
};

const mockLeaveRequests: LeaveRequest[] = [
  {
    id: '1',
    userId: '1',
    type: 'vacation',
    startDate: '2025-10-15',
    endDate: '2025-10-20',
    status: 'approved',
    reason: 'Family vacation',
    createdAt: '2025-10-01T10:00:00Z',
    updatedAt: '2025-10-02T14:30:00Z',
  },
  {
    id: '2',
    userId: '1',
    type: 'sick',
    startDate: '2025-09-05',
    endDate: '2025-09-06',
    status: 'approved',
    reason: 'Medical appointment',
    createdAt: '2025-09-03T09:00:00Z',
    updatedAt: '2025-09-04T11:00:00Z',
  },
];

const mockTeamMembers: TeamMember[] = [
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@kairos.com',
    role: 'manager',
    department: 'Engineering',
    avatar: 'https://i.pravatar.cc/150?img=2',
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob@kairos.com',
    role: 'employee',
    department: 'Engineering',
    avatar: 'https://i.pravatar.cc/150?img=3',
  },
  {
    id: '4',
    name: 'Alice Williams',
    email: 'alice@kairos.com',
    role: 'admin',
    department: 'HR',
    avatar: 'https://i.pravatar.cc/150?img=4',
  },
];

export const handlers = [
  // Auth endpoints
  http.post(`${API_BASE_URL}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };

    let user: User = mockUser;

    // Support multiple test users
    if (body.email === 'demo@kairos.com' && body.password === 'demo123') {
      user = mockUser;
    } else if (body.email === 'manager@kairos.com' && body.password === 'manager123') {
      user = mockManagerUser;
    } else {
      return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const response: AuthResponse = {
      token: `mock-jwt-token-${user.id}-${Date.now()}`,
      refreshToken: `mock-refresh-token-${user.id}-${Date.now()}`,
      expiresIn: 3600, // 1 hour
      user,
    };

    return HttpResponse.json(response);
  }),

  http.post(`${API_BASE_URL}/auth/refresh`, async ({ request }) => {
    const body = (await request.json()) as { refreshToken: string };

    if (body.refreshToken && body.refreshToken.startsWith('mock-refresh-token')) {
      const response: RefreshTokenResponse = {
        token: `mock-jwt-token-refreshed-${Date.now()}`,
        expiresIn: 3600,
      };
      return HttpResponse.json(response);
    }

    return HttpResponse.json({ message: 'Invalid refresh token' }, { status: 401 });
  }),

  http.post(`${API_BASE_URL}/auth/logout`, () => {
    return HttpResponse.json({ message: 'Logged out successfully' });
  }),

  http.get(`${API_BASE_URL}/me`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Determine which user based on token
    const token = authHeader.replace('Bearer ', '');
    if (token.includes('-2-')) {
      return HttpResponse.json(mockManagerUser);
    }

    return HttpResponse.json(mockUser);
  }),

  // Leave requests
  http.get(`${API_BASE_URL}/leave-requests`, () => {
    return HttpResponse.json(mockLeaveRequests);
  }),

  http.post(`${API_BASE_URL}/leave-requests`, async ({ request }) => {
    const body = (await request.json()) as Partial<LeaveRequest>;
    const newRequest: LeaveRequest = {
      id: String(Math.random()),
      userId: '1',
      type: body.type || 'vacation',
      startDate: body.startDate || '',
      endDate: body.endDate || '',
      status: 'pending',
      reason: body.reason,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json(newRequest, { status: 201 });
  }),

  // Team members
  http.get(`${API_BASE_URL}/team`, () => {
    return HttpResponse.json(mockTeamMembers);
  }),
];
