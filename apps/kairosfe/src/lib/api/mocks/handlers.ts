import { http, HttpResponse } from 'msw';
import type {
  User,
  LeaveRequest,
  TeamMember,
  AuthResponse,
  RefreshTokenResponse,
  Timesheet,
  TimeEntry,
  Project,
  Task,
  UserBenefits,
  LeaveBenefit,
} from '@kairos/shared';

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

const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Kairos HR Platform',
    code: 'KAI-HR',
    description: 'Main HR management platform',
    isActive: true,
  },
  {
    id: '2',
    name: 'Mobile App Development',
    code: 'KAI-MOB',
    description: 'Mobile application for employees',
    isActive: true,
  },
  {
    id: '3',
    name: 'Analytics Dashboard',
    code: 'KAI-ANA',
    description: 'Data analytics and reporting',
    isActive: true,
  },
];

const mockTasks: Task[] = [
  { id: '1', projectId: '1', name: 'Frontend Development', code: 'FE', isActive: true },
  { id: '2', projectId: '1', name: 'Backend Development', code: 'BE', isActive: true },
  { id: '3', projectId: '1', name: 'Code Review', code: 'REV', isActive: true },
  { id: '4', projectId: '2', name: 'UI Design', code: 'DES', isActive: true },
  { id: '5', projectId: '2', name: 'Testing', code: 'TST', isActive: true },
  { id: '6', projectId: '3', name: 'Data Analysis', code: 'ANA', isActive: true },
];

// In-memory storage for timesheets and entries
const timesheets: Map<string, Timesheet> = new Map();
const timeEntries: Map<string, TimeEntry> = new Map();

// In-memory storage for leave requests
const leaveRequests: Map<string, LeaveRequest> = new Map();

// Initialize with mock data
mockLeaveRequests.forEach((req) => leaveRequests.set(req.id, req));

// Mock benefits data
const mockUserBenefits: Record<string, UserBenefits> = {
  '1': {
    userId: '1',
    year: 2025,
    benefits: [
      {
        type: 'vacation',
        name: 'Annual Leave',
        totalDays: 20,
        usedDays: 5,
        remainingDays: 15,
        year: 2025,
      },
      {
        type: 'sick',
        name: 'Sick Leave',
        totalDays: 10,
        usedDays: 2,
        remainingDays: 8,
        year: 2025,
      },
      {
        type: 'personal',
        name: 'Personal Leave',
        totalDays: 5,
        usedDays: 0,
        remainingDays: 5,
        year: 2025,
      },
      {
        type: 'parental',
        name: 'Parental Leave',
        totalDays: 12,
        usedDays: 0,
        remainingDays: 12,
        year: 2025,
      },
    ],
  },
  '2': {
    userId: '2',
    year: 2025,
    benefits: [
      {
        type: 'vacation',
        name: 'Annual Leave',
        totalDays: 25,
        usedDays: 8,
        remainingDays: 17,
        year: 2025,
      },
      {
        type: 'sick',
        name: 'Sick Leave',
        totalDays: 15,
        usedDays: 3,
        remainingDays: 12,
        year: 2025,
      },
      {
        type: 'personal',
        name: 'Personal Leave',
        totalDays: 7,
        usedDays: 1,
        remainingDays: 6,
        year: 2025,
      },
    ],
  },
};

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
  http.get(`${API_BASE_URL}/leave-requests`, ({ request }) => {
    const url = new URL(request.url);
    const mine = url.searchParams.get('mine');
    const userId = url.searchParams.get('user_id');
    const status = url.searchParams.get('status');
    const team = url.searchParams.get('team');

    let results = Array.from(leaveRequests.values());

    if (mine === 'true') {
      results = results.filter((req) => req.userId === '1');
    }
    if (userId) {
      results = results.filter((req) => req.userId === userId);
    }
    if (status) {
      results = results.filter((req) => req.status === status);
    }
    if (team === 'true') {
      // In real app, filter by manager's team
      results = results.filter((req) => req.userId !== '1');
    }

    return HttpResponse.json(results);
  }),

  http.get(`${API_BASE_URL}/leave-requests/:id`, ({ params }) => {
    const request = leaveRequests.get(params.id as string);
    if (!request) {
      return HttpResponse.json({ message: 'Leave request not found' }, { status: 404 });
    }
    return HttpResponse.json(request);
  }),

  http.post(`${API_BASE_URL}/leave-requests`, async ({ request }) => {
    const body = (await request.json()) as Partial<LeaveRequest>;
    const id = `lr-${Date.now()}`;

    const newRequest: LeaveRequest = {
      id,
      userId: '1',
      userName: 'Demo User',
      type: body.type || 'vacation',
      startDate: body.startDate || '',
      endDate: body.endDate || '',
      status: 'pending',
      reason: body.reason,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    leaveRequests.set(id, newRequest);
    return HttpResponse.json(newRequest, { status: 201 });
  }),

  http.patch(`${API_BASE_URL}/leave-requests/:id`, async ({ params, request }) => {
    const existing = leaveRequests.get(params.id as string);
    if (!existing) {
      return HttpResponse.json({ message: 'Leave request not found' }, { status: 404 });
    }

    if (existing.status !== 'pending') {
      return HttpResponse.json({ message: 'Cannot update non-pending request' }, { status: 400 });
    }

    const body = (await request.json()) as Partial<LeaveRequest>;
    const updated: LeaveRequest = {
      ...existing,
      ...body,
      updatedAt: new Date().toISOString(),
    };

    leaveRequests.set(params.id as string, updated);
    return HttpResponse.json(updated);
  }),

  http.post(`${API_BASE_URL}/leave-requests/:id/cancel`, ({ params }) => {
    const existing = leaveRequests.get(params.id as string);
    if (!existing) {
      return HttpResponse.json({ message: 'Leave request not found' }, { status: 404 });
    }

    const updated: LeaveRequest = {
      ...existing,
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
    };

    leaveRequests.set(params.id as string, updated);
    return HttpResponse.json(updated);
  }),

  http.post(`${API_BASE_URL}/leave-requests/:id/approve`, ({ params }) => {
    const existing = leaveRequests.get(params.id as string);
    if (!existing) {
      return HttpResponse.json({ message: 'Leave request not found' }, { status: 404 });
    }

    const updated: LeaveRequest = {
      ...existing,
      status: 'approved',
      approvedBy: '2',
      approvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    leaveRequests.set(params.id as string, updated);
    return HttpResponse.json(updated);
  }),

  http.post(`${API_BASE_URL}/leave-requests/:id/reject`, async ({ params, request }) => {
    const existing = leaveRequests.get(params.id as string);
    if (!existing) {
      return HttpResponse.json({ message: 'Leave request not found' }, { status: 404 });
    }

    const body = (await request.json()) as { reason: string };
    const updated: LeaveRequest = {
      ...existing,
      status: 'rejected',
      rejectionReason: body.reason,
      rejectedBy: '2',
      rejectedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    leaveRequests.set(params.id as string, updated);
    return HttpResponse.json(updated);
  }),

  // User benefits
  http.get(`${API_BASE_URL}/users/:userId/benefits`, ({ params }) => {
    const benefits = mockUserBenefits[params.userId as string];
    if (!benefits) {
      return HttpResponse.json({ message: 'Benefits not found' }, { status: 404 });
    }
    return HttpResponse.json(benefits);
  }),

  // Team members
  http.get(`${API_BASE_URL}/team`, () => {
    return HttpResponse.json(mockTeamMembers);
  }),

  // Timesheets
  http.get(`${API_BASE_URL}/timesheets`, ({ request }) => {
    const url = new URL(request.url);
    const weekStart = url.searchParams.get('week_start');
    const userId = url.searchParams.get('user_id');
    const status = url.searchParams.get('status');

    let results = Array.from(timesheets.values());

    if (weekStart) {
      results = results.filter((ts) => ts.weekStart === weekStart);
    }
    if (userId) {
      results = results.filter((ts) => ts.userId === userId);
    }
    if (status) {
      results = results.filter((ts) => ts.status === status);
    }

    return HttpResponse.json(results);
  }),

  http.get(`${API_BASE_URL}/timesheets/:id`, ({ params }) => {
    const timesheet = timesheets.get(params.id as string);
    if (!timesheet) {
      return HttpResponse.json({ message: 'Timesheet not found' }, { status: 404 });
    }
    return HttpResponse.json(timesheet);
  }),

  http.post(`${API_BASE_URL}/timesheets`, async ({ request }) => {
    const body = (await request.json()) as { weekStart: string };
    const id = `ts-${Date.now()}`;

    const weekStartDate = new Date(body.weekStart);
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekStartDate.getDate() + 6);

    const newTimesheet: Timesheet = {
      id,
      userId: '1',
      weekStart: body.weekStart,
      weekEnd: weekEndDate.toISOString().split('T')[0],
      status: 'draft',
      totalHours: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    timesheets.set(id, newTimesheet);
    return HttpResponse.json(newTimesheet, { status: 201 });
  }),

  http.post(`${API_BASE_URL}/timesheets/:id/submit`, ({ params }) => {
    const timesheet = timesheets.get(params.id as string);
    if (!timesheet) {
      return HttpResponse.json({ message: 'Timesheet not found' }, { status: 404 });
    }

    const updated: Timesheet = {
      ...timesheet,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    timesheets.set(params.id as string, updated);
    return HttpResponse.json(updated);
  }),

  // Time Entries
  http.get(`${API_BASE_URL}/time-entries`, ({ request }) => {
    const url = new URL(request.url);
    const timesheetId = url.searchParams.get('timesheet_id');
    const userId = url.searchParams.get('user_id');

    let results = Array.from(timeEntries.values());

    if (timesheetId) {
      results = results.filter((entry) => entry.timesheetId === timesheetId);
    }
    if (userId) {
      results = results.filter((entry) => entry.userId === userId);
    }

    return HttpResponse.json(results);
  }),

  http.post(`${API_BASE_URL}/time-entries`, async ({ request }) => {
    const body = (await request.json()) as Partial<TimeEntry>;
    const id = `entry-${Date.now()}`;

    const project = mockProjects.find((p) => p.id === body.projectId);
    const task = mockTasks.find((t) => t.id === body.taskId);

    const newEntry: TimeEntry = {
      id,
      timesheetId: body.timesheetId || '',
      userId: '1',
      projectId: body.projectId || '',
      projectName: project?.name,
      taskId: body.taskId || '',
      taskName: task?.name,
      date: body.date || '',
      hours: body.hours || 0,
      notes: body.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    timeEntries.set(id, newEntry);

    // Update timesheet total
    if (body.timesheetId) {
      const timesheet = timesheets.get(body.timesheetId);
      if (timesheet) {
        const entries = Array.from(timeEntries.values()).filter(
          (e) => e.timesheetId === body.timesheetId
        );
        const total = entries.reduce((sum, e) => sum + e.hours, 0);
        timesheets.set(body.timesheetId, {
          ...timesheet,
          totalHours: total,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    return HttpResponse.json(newEntry, { status: 201 });
  }),

  http.patch(`${API_BASE_URL}/time-entries/:id`, async ({ params, request }) => {
    const entry = timeEntries.get(params.id as string);
    if (!entry) {
      return HttpResponse.json({ message: 'Time entry not found' }, { status: 404 });
    }

    const body = (await request.json()) as Partial<TimeEntry>;
    const project = body.projectId ? mockProjects.find((p) => p.id === body.projectId) : undefined;
    const task = body.taskId ? mockTasks.find((t) => t.id === body.taskId) : undefined;

    const updated: TimeEntry = {
      ...entry,
      ...body,
      projectName: project?.name || entry.projectName,
      taskName: task?.name || entry.taskName,
      updatedAt: new Date().toISOString(),
    };

    timeEntries.set(params.id as string, updated);

    // Update timesheet total
    const timesheet = timesheets.get(entry.timesheetId);
    if (timesheet) {
      const entries = Array.from(timeEntries.values()).filter(
        (e) => e.timesheetId === entry.timesheetId
      );
      const total = entries.reduce((sum, e) => sum + e.hours, 0);
      timesheets.set(entry.timesheetId, {
        ...timesheet,
        totalHours: total,
        updatedAt: new Date().toISOString(),
      });
    }

    return HttpResponse.json(updated);
  }),

  http.delete(`${API_BASE_URL}/time-entries/:id`, ({ params }) => {
    const entry = timeEntries.get(params.id as string);
    if (!entry) {
      return HttpResponse.json({ message: 'Time entry not found' }, { status: 404 });
    }

    const timesheetId = entry.timesheetId;
    timeEntries.delete(params.id as string);

    // Update timesheet total
    const timesheet = timesheets.get(timesheetId);
    if (timesheet) {
      const entries = Array.from(timeEntries.values()).filter(
        (e) => e.timesheetId === timesheetId
      );
      const total = entries.reduce((sum, e) => sum + e.hours, 0);
      timesheets.set(timesheetId, {
        ...timesheet,
        totalHours: total,
        updatedAt: new Date().toISOString(),
      });
    }

    return HttpResponse.json({ message: 'Deleted successfully' });
  }),

  // Weekly stats
  http.get(`${API_BASE_URL}/time-entries/stats/weekly`, ({ request }) => {
    const url = new URL(request.url);
    const userId = url.searchParams.get('user_id');
    const weekStart = url.searchParams.get('week_start');

    const entries = Array.from(timeEntries.values()).filter((entry) => {
      if (userId && entry.userId !== userId) return false;
      if (weekStart) {
        const entryDate = new Date(entry.date);
        const startDate = new Date(weekStart);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        return entryDate >= startDate && entryDate <= endDate;
      }
      return true;
    });

    const hoursPerDay: Record<string, number> = {};
    let totalHours = 0;

    entries.forEach((entry) => {
      hoursPerDay[entry.date] = (hoursPerDay[entry.date] || 0) + entry.hours;
      totalHours += entry.hours;
    });

    return HttpResponse.json({
      weekStart: weekStart || new Date().toISOString().split('T')[0],
      weekEnd: weekStart
        ? new Date(new Date(weekStart).getTime() + 6 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0]
        : new Date().toISOString().split('T')[0],
      totalHours,
      hoursPerDay,
      entriesCount: entries.length,
    });
  }),

  // Projects and tasks search
  http.get(`${API_BASE_URL}/search/projects`, ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('q')?.toLowerCase() || '';

    const results = mockProjects.filter(
      (p) =>
        p.isActive &&
        (p.name.toLowerCase().includes(query) || p.code.toLowerCase().includes(query))
    );

    return HttpResponse.json(results);
  }),

  http.get(`${API_BASE_URL}/search/tasks`, ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('q')?.toLowerCase() || '';
    const projectId = url.searchParams.get('project_id');

    let results = mockTasks.filter((t) => t.isActive);

    if (projectId) {
      results = results.filter((t) => t.projectId === projectId);
    }

    if (query) {
      results = results.filter(
        (t) =>
          t.name.toLowerCase().includes(query) || t.code.toLowerCase().includes(query)
      );
    }

    return HttpResponse.json(results);
  }),
];
