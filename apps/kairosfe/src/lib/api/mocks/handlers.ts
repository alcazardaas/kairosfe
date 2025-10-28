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
  Holiday,
  CalendarData,
  CalendarEvent,
} from '@kairos/shared';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

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

// Mock holidays for 2025
const mockHolidays: Holiday[] = [
  {
    id: 'h1',
    name: "New Year's Day",
    date: '2025-01-01',
    type: 'public',
    isRecurring: true,
  },
  {
    id: 'h2',
    name: 'Independence Day',
    date: '2025-07-04',
    type: 'public',
    isRecurring: true,
  },
  {
    id: 'h3',
    name: 'Thanksgiving',
    date: '2025-11-27',
    type: 'public',
    isRecurring: true,
  },
  {
    id: 'h4',
    name: 'Christmas Day',
    date: '2025-12-25',
    type: 'public',
    isRecurring: true,
  },
  {
    id: 'h5',
    name: 'Company Anniversary',
    date: '2025-06-15',
    type: 'company',
    isRecurring: true,
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

// Mock benefit types
const mockBenefitTypes = [
  {
    id: 'bt1',
    tenant_id: 'tenant-1',
    key: 'vacation',
    name: 'Vacation Leave',
    unit: 'days',
    requires_approval: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'bt2',
    tenant_id: 'tenant-1',
    key: 'sick',
    name: 'Sick Leave',
    unit: 'days',
    requires_approval: false,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'bt3',
    tenant_id: 'tenant-1',
    key: 'personal',
    name: 'Personal Leave',
    unit: 'days',
    requires_approval: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
];

// Mock timesheet policies
const mockTimesheetPolicies = [
  {
    tenantId: 'tenant-1',
    hoursPerWeek: 40,
    weekStartDay: 1,
    requireApproval: true,
    allowEditAfterSubmit: false,
  },
];

// In-memory storage for timesheets and entries
const timesheets: Map<string, Timesheet> = new Map();
const timeEntries: Map<string, TimeEntry> = new Map();

// In-memory storage for leave requests
const leaveRequests: Map<string, LeaveRequest> = new Map();

// In-memory storage for projects
const projects: Map<string, any> = new Map();
mockProjects.forEach((p) => projects.set(p.id, p));

// In-memory storage for tasks
const tasks: Map<string, any> = new Map();
mockTasks.forEach((t) => tasks.set(t.id, t));

// In-memory storage for holidays
const holidays: Map<string, any> = new Map();
mockHolidays.forEach((h) => holidays.set(h.id, h));

// In-memory storage for benefit types
const benefitTypes: Map<string, any> = new Map();
mockBenefitTypes.forEach((bt) => benefitTypes.set(bt.id, bt));

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

// Helper function to check auth
const checkAuth = (request: Request): boolean => {
  const authHeader = request.headers.get('Authorization');
  return authHeader !== null && authHeader.startsWith('Bearer ');
};

// Helper function to get user from token
const getUserFromToken = (request: Request): User => {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return mockUser;
  const token = authHeader.replace('Bearer ', '');
  if (token.includes('-2-')) {
    return mockManagerUser;
  }
  return mockUser;
};

export const handlers = [
  // ========================================
  // AUTHENTICATION ENDPOINTS (4)
  // ========================================

  // 1. Login
  http.post(`${API_BASE_URL}/api/v1/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };

    let user: User = mockUser;

    // Support multiple test users
    if (body.email === 'demo@kairos.com' && body.password === 'demo123') {
      user = mockUser;
    } else if (body.email === 'manager@demo.com' && body.password === 'Password123!') {
      user = mockManagerUser;
    } else if (body.email === 'manager@kairos.com' && body.password === 'manager123') {
      user = mockManagerUser;
    } else {
      return HttpResponse.json({
        error: 'Unauthorized',
        message: 'Invalid credentials',
        statusCode: 401
      }, { status: 401 });
    }

    const response = {
      data: {
        token: `mock-jwt-token-${user.id}-${Date.now()}`,
        refreshToken: `mock-refresh-token-${user.id}-${Date.now()}`,
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        tenant: {
          id: 'tenant-1',
        },
      },
    };

    return HttpResponse.json(response);
  }),

  // 2. Refresh token
  http.post(`${API_BASE_URL}/api/v1/auth/refresh`, async ({ request }) => {
    const body = (await request.json()) as { refreshToken: string };

    if (body.refreshToken && body.refreshToken.startsWith('mock-refresh-token')) {
      const response = {
        data: {
          sessionToken: `mock-jwt-token-refreshed-${Date.now()}`,
          refreshToken: `mock-refresh-token-refreshed-${Date.now()}`,
          userId: '1',
          tenantId: 'tenant-1',
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
        },
      };
      return HttpResponse.json(response);
    }

    return HttpResponse.json({
      error: 'Unauthorized',
      message: 'Invalid refresh token',
      statusCode: 401
    }, { status: 401 });
  }),

  // 3. Logout
  http.post(`${API_BASE_URL}/api/v1/auth/logout`, ({ request }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token',
        statusCode: 401
      }, { status: 401 });
    }
    return new HttpResponse(null, { status: 204 });
  }),

  // 4. Get current user (me)
  http.get(`${API_BASE_URL}/api/v1/auth/me`, ({ request }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token',
        statusCode: 401
      }, { status: 401 });
    }

    const user = getUserFromToken(request);

    const response = {
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          locale: 'en-US',
        },
        tenant: {
          id: 'tenant-1',
        },
        membership: {
          role: user.role,
          status: 'active',
        },
        timesheetPolicy: mockTimesheetPolicies[0],
      },
    };

    return HttpResponse.json(response);
  }),

  // ========================================
  // HEALTH ENDPOINT (1)
  // ========================================

  // 5. Health check
  http.get(`${API_BASE_URL}/api/v1/health`, () => {
    return HttpResponse.json({
      ok: true,
      ts: new Date().toISOString(),
      database: 'connected',
    });
  }),

  // ========================================
  // PROJECTS ENDPOINTS (8)
  // ========================================

  // 6. List all projects
  http.get(`${API_BASE_URL}/api/v1/projects`, ({ request }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token',
        statusCode: 401
      }, { status: 401 });
    }

    const projectsArray = Array.from(projects.values()).map((p) => ({
      id: p.id,
      tenant_id: 'tenant-1',
      name: p.name,
      code: p.code,
      active: p.isActive,
      created_at: '2025-01-15T10:00:00.000Z',
      updated_at: '2025-01-20T15:30:00.000Z',
    }));

    return HttpResponse.json({
      data: projectsArray,
      meta: {
        page: 1,
        limit: 20,
        total: projectsArray.length,
      },
    });
  }),

  // 7. Create project
  http.post(`${API_BASE_URL}/api/v1/projects`, async ({ request }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token',
        statusCode: 401
      }, { status: 401 });
    }

    const body = (await request.json()) as any;
    const id = `proj-${Date.now()}`;
    const now = new Date().toISOString();

    const newProject = {
      id,
      tenant_id: 'tenant-1',
      name: body.name,
      code: body.code || null,
      active: true,
      created_at: now,
      updated_at: now,
    };

    projects.set(id, newProject);

    return HttpResponse.json({ data: newProject }, { status: 201 });
  }),

  // 8. Get single project
  http.get(`${API_BASE_URL}/api/v1/projects/:id`, ({ request, params }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token',
        statusCode: 401
      }, { status: 401 });
    }

    const project = projects.get(params.id as string);
    if (!project) {
      return HttpResponse.json({
        error: 'Not Found',
        message: 'Project not found',
        statusCode: 404
      }, { status: 404 });
    }

    return HttpResponse.json({ data: project });
  }),

  // 9. Update project
  http.patch(`${API_BASE_URL}/api/v1/projects/:id`, async ({ request, params }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token',
        statusCode: 401
      }, { status: 401 });
    }

    const project = projects.get(params.id as string);
    if (!project) {
      return HttpResponse.json({
        error: 'Not Found',
        message: 'Project not found',
        statusCode: 404
      }, { status: 404 });
    }

    const body = (await request.json()) as any;
    const updated = {
      ...project,
      ...body,
      updated_at: new Date().toISOString(),
    };

    projects.set(params.id as string, updated);

    return HttpResponse.json({ data: updated });
  }),

  // 10. Delete project
  http.delete(`${API_BASE_URL}/api/v1/projects/:id`, ({ request, params }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token',
        statusCode: 401
      }, { status: 401 });
    }

    const project = projects.get(params.id as string);
    if (!project) {
      return HttpResponse.json({
        error: 'Not Found',
        message: 'Project not found',
        statusCode: 404
      }, { status: 404 });
    }

    projects.delete(params.id as string);

    return new HttpResponse(null, { status: 204 });
  }),

  // 11. Get project members
  http.get(`${API_BASE_URL}/api/v1/projects/:id/members`, ({ request, params }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token',
        statusCode: 401
      }, { status: 401 });
    }

    const project = projects.get(params.id as string);
    if (!project) {
      return HttpResponse.json({
        error: 'Not Found',
        message: 'Project not found',
        statusCode: 404
      }, { status: 404 });
    }

    // Mock project members
    const members = [
      {
        id: 'pm1',
        tenantId: 'tenant-1',
        projectId: params.id,
        userId: '1',
        role: 'member',
        createdAt: '2025-01-15T10:00:00.000Z',
      },
      {
        id: 'pm2',
        tenantId: 'tenant-1',
        projectId: params.id,
        userId: '2',
        role: 'lead',
        createdAt: '2025-01-15T10:00:00.000Z',
      },
    ];

    return HttpResponse.json({ data: members });
  }),

  // 12. Add member to project
  http.post(`${API_BASE_URL}/api/v1/projects/:id/members`, async ({ request, params }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token',
        statusCode: 401
      }, { status: 401 });
    }

    const project = projects.get(params.id as string);
    if (!project) {
      return HttpResponse.json({
        error: 'Not Found',
        message: 'Project not found',
        statusCode: 404
      }, { status: 404 });
    }

    const body = (await request.json()) as any;
    const newMember = {
      id: `pm-${Date.now()}`,
      tenantId: 'tenant-1',
      projectId: params.id,
      userId: body.userId,
      role: body.role || 'member',
      createdAt: new Date().toISOString(),
    };

    return HttpResponse.json({ data: newMember }, { status: 201 });
  }),

  // 13. Remove member from project
  http.delete(`${API_BASE_URL}/api/v1/projects/:id/members/:userId`, ({ request, params }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token',
        statusCode: 401
      }, { status: 401 });
    }

    const project = projects.get(params.id as string);
    if (!project) {
      return HttpResponse.json({
        error: 'Not Found',
        message: 'Project not found',
        statusCode: 404
      }, { status: 404 });
    }

    return new HttpResponse(null, { status: 204 });
  }),

  // ========================================
  // MY PROJECTS ENDPOINT (1)
  // ========================================

  // 14. Get my projects
  http.get(`${API_BASE_URL}/api/v1/my/projects`, ({ request }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token',
        statusCode: 401
      }, { status: 401 });
    }

    const user = getUserFromToken(request);

    // Mock user projects
    const userProjects = [
      {
        id: 'pm1',
        tenantId: 'tenant-1',
        projectId: '1',
        userId: user.id,
        role: 'member',
        createdAt: '2025-01-15T10:00:00.000Z',
      },
      {
        id: 'pm2',
        tenantId: 'tenant-1',
        projectId: '2',
        userId: user.id,
        role: 'member',
        createdAt: '2025-01-15T10:00:00.000Z',
      },
    ];

    return HttpResponse.json({ data: userProjects });
  }),

  // ========================================
  // TASKS ENDPOINTS (5)
  // ========================================

  // 15. List all tasks
  http.get(`${API_BASE_URL}/api/v1/tasks`, ({ request }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token',
        statusCode: 401
      }, { status: 401 });
    }

    const tasksArray = Array.from(tasks.values()).map((t) => ({
      id: t.id,
      tenant_id: 'tenant-1',
      project_id: t.projectId,
      name: t.name,
      parent_task_id: null,
      created_at: '2025-01-15T10:00:00.000Z',
      updated_at: '2025-01-20T15:30:00.000Z',
    }));

    return HttpResponse.json({
      data: tasksArray,
      meta: {
        page: 1,
        limit: 20,
        total: tasksArray.length,
      },
    });
  }),

  // 16. Create task
  http.post(`${API_BASE_URL}/api/v1/tasks`, async ({ request }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token',
        statusCode: 401
      }, { status: 401 });
    }

    const body = (await request.json()) as any;
    const id = `task-${Date.now()}`;
    const now = new Date().toISOString();

    const newTask = {
      id,
      tenant_id: 'tenant-1',
      project_id: body.projectId,
      name: body.name,
      parent_task_id: body.parentTaskId || null,
      created_at: now,
      updated_at: now,
    };

    tasks.set(id, newTask);

    return HttpResponse.json({ data: newTask }, { status: 201 });
  }),

  // 17. Get single task
  http.get(`${API_BASE_URL}/api/v1/tasks/:id`, ({ request, params }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token',
        statusCode: 401
      }, { status: 401 });
    }

    const task = tasks.get(params.id as string);
    if (!task) {
      return HttpResponse.json({
        error: 'Not Found',
        message: 'Task not found',
        statusCode: 404
      }, { status: 404 });
    }

    return HttpResponse.json({ data: task });
  }),

  // 18. Update task
  http.patch(`${API_BASE_URL}/api/v1/tasks/:id`, async ({ request, params }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token',
        statusCode: 401
      }, { status: 401 });
    }

    const task = tasks.get(params.id as string);
    if (!task) {
      return HttpResponse.json({
        error: 'Not Found',
        message: 'Task not found',
        statusCode: 404
      }, { status: 404 });
    }

    const body = (await request.json()) as any;
    const updated = {
      ...task,
      ...body,
      updated_at: new Date().toISOString(),
    };

    tasks.set(params.id as string, updated);

    return HttpResponse.json({ data: updated });
  }),

  // 19. Delete task
  http.delete(`${API_BASE_URL}/api/v1/tasks/:id`, ({ request, params }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token',
        statusCode: 401
      }, { status: 401 });
    }

    const task = tasks.get(params.id as string);
    if (!task) {
      return HttpResponse.json({
        error: 'Not Found',
        message: 'Task not found',
        statusCode: 404
      }, { status: 404 });
    }

    tasks.delete(params.id as string);

    return new HttpResponse(null, { status: 204 });
  }),

  // ========================================
  // TIME ENTRIES ENDPOINTS (7)
  // ========================================

  // 20. List all time entries
  http.get(`${API_BASE_URL}/api/v1/time-entries`, ({ request }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token',
        statusCode: 401
      }, { status: 401 });
    }

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

    const entriesArray = results.map((e) => ({
      id: e.id,
      tenant_id: 'tenant-1',
      user_id: e.userId,
      project_id: e.projectId,
      task_id: e.taskId || null,
      week_start_date: e.date,
      day_of_week: new Date(e.date).getDay(),
      hours: e.hours,
      note: e.notes || null,
      created_at: e.createdAt,
    }));

    return HttpResponse.json({
      data: entriesArray,
      meta: {
        page: 1,
        limit: 20,
        total: entriesArray.length,
      },
    });
  }),

  // 21. Create time entry
  http.post(`${API_BASE_URL}/api/v1/time-entries`, async ({ request }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token',
        statusCode: 401
      }, { status: 401 });
    }

    const body = (await request.json()) as Partial<TimeEntry>;
    const id = `entry-${Date.now()}`;

    const project = mockProjects.find((p) => p.id === body.projectId);
    const task = mockTasks.find((t) => t.id === body.taskId);

    const newEntry: TimeEntry = {
      id,
      timesheetId: body.timesheetId || '',
      userId: getUserFromToken(request).id,
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

    const responseData = {
      id: newEntry.id,
      tenant_id: 'tenant-1',
      user_id: newEntry.userId,
      project_id: newEntry.projectId,
      task_id: newEntry.taskId || null,
      week_start_date: newEntry.date,
      day_of_week: new Date(newEntry.date).getDay(),
      hours: newEntry.hours,
      note: newEntry.notes || null,
      created_at: newEntry.createdAt,
    };

    return HttpResponse.json({ data: responseData }, { status: 201 });
  }),

  // 22. Get single time entry
  http.get(`${API_BASE_URL}/api/v1/time-entries/:id`, ({ request, params }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token',
        statusCode: 401
      }, { status: 401 });
    }

    const entry = timeEntries.get(params.id as string);
    if (!entry) {
      return HttpResponse.json({
        error: 'Not Found',
        message: 'Time entry not found',
        statusCode: 404
      }, { status: 404 });
    }

    const responseData = {
      id: entry.id,
      tenant_id: 'tenant-1',
      user_id: entry.userId,
      project_id: entry.projectId,
      task_id: entry.taskId || null,
      week_start_date: entry.date,
      day_of_week: new Date(entry.date).getDay(),
      hours: entry.hours,
      note: entry.notes || null,
      created_at: entry.createdAt,
    };

    return HttpResponse.json({ data: responseData });
  }),

  // 23. Update time entry
  http.patch(`${API_BASE_URL}/api/v1/time-entries/:id`, async ({ request, params }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token',
        statusCode: 401
      }, { status: 401 });
    }

    const entry = timeEntries.get(params.id as string);
    if (!entry) {
      return HttpResponse.json({
        error: 'Not Found',
        message: 'Time entry not found',
        statusCode: 404
      }, { status: 404 });
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

    const responseData = {
      id: updated.id,
      tenant_id: 'tenant-1',
      user_id: updated.userId,
      project_id: updated.projectId,
      task_id: updated.taskId || null,
      week_start_date: updated.date,
      day_of_week: new Date(updated.date).getDay(),
      hours: updated.hours,
      note: updated.notes || null,
      created_at: updated.createdAt,
    };

    return HttpResponse.json({ data: responseData });
  }),

  // 24. Delete time entry
  http.delete(`${API_BASE_URL}/api/v1/time-entries/:id`, ({ request, params }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token',
        statusCode: 401
      }, { status: 401 });
    }

    const entry = timeEntries.get(params.id as string);
    if (!entry) {
      return HttpResponse.json({
        error: 'Not Found',
        message: 'Time entry not found',
        statusCode: 404
      }, { status: 404 });
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

    return new HttpResponse(null, { status: 204 });
  }),

  // 25. Get weekly hours for a user
  http.get(`${API_BASE_URL}/api/v1/time-entries/stats/weekly/:userId/:weekStartDate`, ({ request, params }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token',
        statusCode: 401
      }, { status: 401 });
    }

    const { userId, weekStartDate } = params;
    const startDate = new Date(weekStartDate as string);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    const entries = Array.from(timeEntries.values()).filter((entry) => {
      if (entry.userId !== userId) return false;
      const entryDate = new Date(entry.date);
      return entryDate >= startDate && entryDate <= endDate;
    });

    const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);

    return HttpResponse.json({
      userId,
      weekStartDate,
      totalHours,
    });
  }),

  // 26. Get project total hours
  http.get(`${API_BASE_URL}/api/v1/time-entries/stats/project/:projectId`, ({ request, params }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token',
        statusCode: 401
      }, { status: 401 });
    }

    const { projectId } = params;

    const entries = Array.from(timeEntries.values()).filter((entry) => {
      return entry.projectId === projectId;
    });

    const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);

    return HttpResponse.json({
      projectId,
      totalHours,
    });
  }),

  // ========================================
  // TIMESHEETS ENDPOINTS (7)
  // ========================================

  // 27. List timesheets
  http.get(`${API_BASE_URL}/api/v1/timesheets`, ({ request }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token',
        statusCode: 401
      }, { status: 401 });
    }

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

    const timesheetsArray = results.map((ts) => ({
      id: ts.id,
      tenantId: 'tenant-1',
      userId: ts.userId,
      weekStartDate: ts.weekStart,
      status: ts.status,
      submittedAt: ts.submittedAt || null,
      submittedByUserId: ts.userId || null,
      reviewedAt: null,
      reviewedByUserId: null,
      reviewNote: null,
      createdAt: ts.createdAt,
      updatedAt: ts.updatedAt,
      time_entries: [],
    }));

    return HttpResponse.json({
      data: timesheetsArray,
      page: 1,
      page_size: 20,
      total: timesheetsArray.length,
    });
  }),

  // 28. Create timesheet
  http.post(`${API_BASE_URL}/api/v1/timesheets`, async ({ request }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token',
        statusCode: 401
      }, { status: 401 });
    }

    const body = (await request.json()) as { weekStart: string };
    const id = `ts-${Date.now()}`;

    const weekStartDate = new Date(body.weekStart);
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekStartDate.getDate() + 6);

    const newTimesheet: Timesheet = {
      id,
      userId: getUserFromToken(request).id,
      weekStart: body.weekStart,
      weekEnd: weekEndDate.toISOString().split('T')[0],
      status: 'draft',
      totalHours: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    timesheets.set(id, newTimesheet);

    const responseData = {
      id: newTimesheet.id,
      tenantId: 'tenant-1',
      userId: newTimesheet.userId,
      weekStartDate: newTimesheet.weekStart,
      status: newTimesheet.status,
      submittedAt: null,
      submittedByUserId: null,
      reviewedAt: null,
      reviewedByUserId: null,
      reviewNote: null,
      createdAt: newTimesheet.createdAt,
      updatedAt: newTimesheet.updatedAt,
      time_entries: [],
    };

    return HttpResponse.json({ data: responseData }, { status: 201 });
  }),

  // 29. Get single timesheet
  http.get(`${API_BASE_URL}/api/v1/timesheets/:id`, ({ request, params }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token',
        statusCode: 401
      }, { status: 401 });
    }

    const timesheet = timesheets.get(params.id as string);
    if (!timesheet) {
      return HttpResponse.json({
        error: 'Not Found',
        message: 'Timesheet not found',
        statusCode: 404
      }, { status: 404 });
    }

    const responseData = {
      id: timesheet.id,
      tenantId: 'tenant-1',
      userId: timesheet.userId,
      weekStartDate: timesheet.weekStart,
      status: timesheet.status,
      submittedAt: timesheet.submittedAt || null,
      submittedByUserId: timesheet.userId || null,
      reviewedAt: null,
      reviewedByUserId: null,
      reviewNote: null,
      createdAt: timesheet.createdAt,
      updatedAt: timesheet.updatedAt,
      time_entries: [],
    };

    return HttpResponse.json({ data: responseData });
  }),

  // 30. Delete timesheet
  http.delete(`${API_BASE_URL}/api/v1/timesheets/:id`, ({ request, params }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token',
        statusCode: 401
      }, { status: 401 });
    }

    const timesheet = timesheets.get(params.id as string);
    if (!timesheet) {
      return HttpResponse.json({
        error: 'Not Found',
        message: 'Timesheet not found',
        statusCode: 404
      }, { status: 404 });
    }

    if (timesheet.status !== 'draft') {
      return HttpResponse.json({
        error: 'Bad Request',
        message: 'Timesheet cannot be deleted (not in draft status)',
        statusCode: 400
      }, { status: 400 });
    }

    timesheets.delete(params.id as string);

    return new HttpResponse(null, { status: 204 });
  }),

  // 31. Submit timesheet
  http.post(`${API_BASE_URL}/api/v1/timesheets/:id/submit`, ({ request, params }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token',
        statusCode: 401
      }, { status: 401 });
    }

    const timesheet = timesheets.get(params.id as string);
    if (!timesheet) {
      return HttpResponse.json({
        error: 'Not Found',
        message: 'Timesheet not found',
        statusCode: 404
      }, { status: 404 });
    }

    if (timesheet.status !== 'draft') {
      return HttpResponse.json({
        error: 'Bad Request',
        message: 'Timesheet cannot be submitted (invalid status)',
        statusCode: 400
      }, { status: 400 });
    }

    const updated: Timesheet = {
      ...timesheet,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    timesheets.set(params.id as string, updated);

    const responseData = {
      id: updated.id,
      tenantId: 'tenant-1',
      userId: updated.userId,
      weekStartDate: updated.weekStart,
      status: updated.status,
      submittedAt: updated.submittedAt,
      submittedByUserId: updated.userId,
      reviewedAt: null,
      reviewedByUserId: null,
      reviewNote: null,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      time_entries: [],
    };

    return HttpResponse.json({ data: responseData });
  }),

  // 32. Approve timesheet
  http.post(`${API_BASE_URL}/api/v1/timesheets/:id/approve`, ({ request, params }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token',
        statusCode: 401
      }, { status: 401 });
    }

    const timesheet = timesheets.get(params.id as string);
    if (!timesheet) {
      return HttpResponse.json({
        error: 'Not Found',
        message: 'Timesheet not found',
        statusCode: 404
      }, { status: 404 });
    }

    if (timesheet.status !== 'pending') {
      return HttpResponse.json({
        error: 'Bad Request',
        message: 'Timesheet cannot be approved (invalid status)',
        statusCode: 400
      }, { status: 400 });
    }

    const user = getUserFromToken(request);
    const now = new Date().toISOString();

    const updated: Timesheet = {
      ...timesheet,
      status: 'approved',
      updatedAt: now,
    };

    timesheets.set(params.id as string, updated);

    const responseData = {
      id: updated.id,
      tenantId: 'tenant-1',
      userId: updated.userId,
      weekStartDate: updated.weekStart,
      status: updated.status,
      submittedAt: updated.submittedAt,
      submittedByUserId: updated.userId,
      reviewedAt: now,
      reviewedByUserId: user.id,
      reviewNote: 'Approved',
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      time_entries: [],
    };

    return HttpResponse.json({ data: responseData });
  }),

  // 33. Reject timesheet
  http.post(`${API_BASE_URL}/api/v1/timesheets/:id/reject`, async ({ request, params }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token',
        statusCode: 401
      }, { status: 401 });
    }

    const timesheet = timesheets.get(params.id as string);
    if (!timesheet) {
      return HttpResponse.json({
        error: 'Not Found',
        message: 'Timesheet not found',
        statusCode: 404
      }, { status: 404 });
    }

    if (timesheet.status !== 'pending') {
      return HttpResponse.json({
        error: 'Bad Request',
        message: 'Timesheet cannot be rejected (invalid status)',
        statusCode: 400
      }, { status: 400 });
    }

    const body = (await request.json()) as { reviewNote?: string };
    const user = getUserFromToken(request);
    const now = new Date().toISOString();

    const updated: Timesheet = {
      ...timesheet,
      status: 'rejected',
      updatedAt: now,
    };

    timesheets.set(params.id as string, updated);

    const responseData = {
      id: updated.id,
      tenantId: 'tenant-1',
      userId: updated.userId,
      weekStartDate: updated.weekStart,
      status: updated.status,
      submittedAt: updated.submittedAt,
      submittedByUserId: updated.userId,
      reviewedAt: now,
      reviewedByUserId: user.id,
      reviewNote: body.reviewNote || 'Rejected',
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      time_entries: [],
    };

    return HttpResponse.json({ data: responseData });
  }),

  // ========================================
  // SEARCH ENDPOINTS (2)
  // ========================================

  // 34. Search projects
  http.get(`${API_BASE_URL}/api/v1/search/projects`, ({ request }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token',
        statusCode: 401
      }, { status: 401 });
    }

    const url = new URL(request.url);
    const query = url.searchParams.get('q')?.toLowerCase() || '';
    const limit = parseInt(url.searchParams.get('limit') || '10');

    const results = mockProjects
      .filter(
        (p) =>
          p.isActive &&
          (p.name.toLowerCase().includes(query) || p.code.toLowerCase().includes(query))
      )
      .slice(0, limit);

    return HttpResponse.json({
      data: results.map((p) => ({
        id: p.id,
        tenant_id: 'tenant-1',
        name: p.name,
        code: p.code,
        active: p.isActive,
        created_at: '2025-01-15T10:00:00.000Z',
        updated_at: '2025-01-20T15:30:00.000Z',
      })),
      meta: {
        query,
        count: results.length,
      },
    });
  }),

  // 35. Search tasks
  http.get(`${API_BASE_URL}/api/v1/search/tasks`, ({ request }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token',
        statusCode: 401
      }, { status: 401 });
    }

    const url = new URL(request.url);
    const query = url.searchParams.get('q')?.toLowerCase() || '';
    const projectId = url.searchParams.get('project_id');
    const limit = parseInt(url.searchParams.get('limit') || '10');

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

    results = results.slice(0, limit);

    return HttpResponse.json({
      data: results.map((t) => ({
        id: t.id,
        tenant_id: 'tenant-1',
        project_id: t.projectId,
        name: t.name,
        parent_task_id: null,
        created_at: '2025-01-15T10:00:00.000Z',
        updated_at: '2025-01-20T15:30:00.000Z',
      })),
      meta: {
        query,
        count: results.length,
        projectId: projectId || undefined,
      },
    });
  }),

  // ========================================
  // BENEFIT TYPES ENDPOINTS (5)
  // ========================================

  // 36. List all benefit types
  http.get(`${API_BASE_URL}/api/v1/benefit-types`, ({ request }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token',
        statusCode: 401
      }, { status: 401 });
    }

    const benefitTypesArray = Array.from(benefitTypes.values());

    return HttpResponse.json({
      data: benefitTypesArray,
      meta: {
        page: 1,
        limit: 20,
        total: benefitTypesArray.length,
      },
    });
  }),

  // 37. Create benefit type
  http.post(`${API_BASE_URL}/api/v1/benefit-types`, async ({ request }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token',
        statusCode: 401
      }, { status: 401 });
    }

    const body = (await request.json()) as any;
    const id = `bt-${Date.now()}`;
    const now = new Date().toISOString();

    const newBenefitType = {
      id,
      tenant_id: 'tenant-1',
      key: body.key,
      name: body.name,
      unit: body.unit || 'days',
      requires_approval: body.requires_approval !== false,
      created_at: now,
      updated_at: now,
    };

    benefitTypes.set(id, newBenefitType);

    return HttpResponse.json({ data: newBenefitType }, { status: 201 });
  }),

  // 38. Get single benefit type
  http.get(`${API_BASE_URL}/api/v1/benefit-types/:id`, ({ request, params }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token',
        statusCode: 401
      }, { status: 401 });
    }

    const benefitType = benefitTypes.get(params.id as string);
    if (!benefitType) {
      return HttpResponse.json({
        error: 'Not Found',
        message: 'Benefit type not found',
        statusCode: 404
      }, { status: 404 });
    }

    return HttpResponse.json({ data: benefitType });
  }),

  // 39. Update benefit type
  http.patch(`${API_BASE_URL}/api/v1/benefit-types/:id`, async ({ request, params }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token',
        statusCode: 401
      }, { status: 401 });
    }

    const benefitType = benefitTypes.get(params.id as string);
    if (!benefitType) {
      return HttpResponse.json({
        error: 'Not Found',
        message: 'Benefit type not found',
        statusCode: 404
      }, { status: 404 });
    }

    const body = (await request.json()) as any;
    const updated = {
      ...benefitType,
      ...body,
      updated_at: new Date().toISOString(),
    };

    benefitTypes.set(params.id as string, updated);

    return HttpResponse.json({ data: updated });
  }),

  // 40. Delete benefit type
  http.delete(`${API_BASE_URL}/api/v1/benefit-types/:id`, ({ request, params }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token',
        statusCode: 401
      }, { status: 401 });
    }

    const benefitType = benefitTypes.get(params.id as string);
    if (!benefitType) {
      return HttpResponse.json({
        error: 'Not Found',
        message: 'Benefit type not found',
        statusCode: 404
      }, { status: 404 });
    }

    benefitTypes.delete(params.id as string);

    return new HttpResponse(null, { status: 204 });
  }),

  // ========================================
  // HOLIDAYS ENDPOINTS (5)
  // ========================================

  // 41. List all holidays
  http.get(`${API_BASE_URL}/api/v1/holidays`, ({ request }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token',
        statusCode: 401
      }, { status: 401 });
    }

    const url = new URL(request.url);
    const year = url.searchParams.get('year');

    let holidaysArray = Array.from(holidays.values()).map((h) => ({
      id: h.id,
      tenant_id: 'tenant-1',
      name: h.name,
      date: h.date,
      is_recurring: h.isRecurring,
      created_at: '2025-01-01T00:00:00.000Z',
      updated_at: '2025-01-01T00:00:00.000Z',
    }));

    if (year) {
      holidaysArray = holidaysArray.filter((h) => h.date.startsWith(year));
    }

    return HttpResponse.json({
      data: holidaysArray,
      meta: {
        page: 1,
        limit: 20,
        total: holidaysArray.length,
      },
    });
  }),

  // 42. Create holiday
  http.post(`${API_BASE_URL}/api/v1/holidays`, async ({ request }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token',
        statusCode: 401
      }, { status: 401 });
    }

    const body = (await request.json()) as any;
    const id = `h-${Date.now()}`;
    const now = new Date().toISOString();

    const newHoliday = {
      id,
      tenant_id: 'tenant-1',
      name: body.name,
      date: body.date,
      is_recurring: body.is_recurring !== false,
      created_at: now,
      updated_at: now,
    };

    holidays.set(id, newHoliday);

    return HttpResponse.json({ data: newHoliday }, { status: 201 });
  }),

  // 43. Get single holiday
  http.get(`${API_BASE_URL}/api/v1/holidays/:id`, ({ request, params }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token',
        statusCode: 401
      }, { status: 401 });
    }

    const holiday = holidays.get(params.id as string);
    if (!holiday) {
      return HttpResponse.json({
        error: 'Not Found',
        message: 'Holiday not found',
        statusCode: 404
      }, { status: 404 });
    }

    const responseData = {
      id: holiday.id,
      tenant_id: 'tenant-1',
      name: holiday.name,
      date: holiday.date,
      is_recurring: holiday.isRecurring,
      created_at: '2025-01-01T00:00:00.000Z',
      updated_at: '2025-01-01T00:00:00.000Z',
    };

    return HttpResponse.json({ data: responseData });
  }),

  // 44. Update holiday
  http.patch(`${API_BASE_URL}/api/v1/holidays/:id`, async ({ request, params }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token',
        statusCode: 401
      }, { status: 401 });
    }

    const holiday = holidays.get(params.id as string);
    if (!holiday) {
      return HttpResponse.json({
        error: 'Not Found',
        message: 'Holiday not found',
        statusCode: 404
      }, { status: 404 });
    }

    const body = (await request.json()) as any;
    const updated = {
      ...holiday,
      ...body,
      updated_at: new Date().toISOString(),
    };

    holidays.set(params.id as string, updated);

    const responseData = {
      id: updated.id,
      tenant_id: 'tenant-1',
      name: updated.name,
      date: updated.date,
      is_recurring: updated.isRecurring,
      created_at: updated.created_at || '2025-01-01T00:00:00.000Z',
      updated_at: updated.updated_at,
    };

    return HttpResponse.json({ data: responseData });
  }),

  // 45. Delete holiday
  http.delete(`${API_BASE_URL}/api/v1/holidays/:id`, ({ request, params }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token',
        statusCode: 401
      }, { status: 401 });
    }

    const holiday = holidays.get(params.id as string);
    if (!holiday) {
      return HttpResponse.json({
        error: 'Not Found',
        message: 'Holiday not found',
        statusCode: 404
      }, { status: 404 });
    }

    holidays.delete(params.id as string);

    return new HttpResponse(null, { status: 204 });
  }),

  // ========================================
  // TIMESHEET POLICIES ENDPOINTS (5)
  // ========================================

  // 46. List all timesheet policies
  http.get(`${API_BASE_URL}/api/v1/timesheet-policies`, ({ request }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token',
        statusCode: 401
      }, { status: 401 });
    }

    return HttpResponse.json({
      data: mockTimesheetPolicies,
    });
  }),

  // 47. Create timesheet policy
  http.post(`${API_BASE_URL}/api/v1/timesheet-policies`, async ({ request }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token',
        statusCode: 401
      }, { status: 401 });
    }

    const body = (await request.json()) as any;

    const newPolicy = {
      tenantId: body.tenantId || 'tenant-1',
      hoursPerWeek: body.hoursPerWeek || 40,
      weekStartDay: body.weekStartDay || 1,
      requireApproval: body.requireApproval !== false,
      allowEditAfterSubmit: body.allowEditAfterSubmit === true,
    };

    return HttpResponse.json({ data: newPolicy }, { status: 201 });
  }),

  // 48. Get timesheet policy for tenant
  http.get(`${API_BASE_URL}/api/v1/timesheet-policies/:tenantId`, ({ request, params }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token',
        statusCode: 401
      }, { status: 401 });
    }

    const policy = mockTimesheetPolicies.find((p) => p.tenantId === params.tenantId);
    if (!policy) {
      return HttpResponse.json({
        error: 'Not Found',
        message: 'Timesheet policy not found',
        statusCode: 404
      }, { status: 404 });
    }

    return HttpResponse.json({ data: policy });
  }),

  // 49. Update timesheet policy
  http.patch(`${API_BASE_URL}/api/v1/timesheet-policies/:tenantId`, async ({ request, params }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token',
        statusCode: 401
      }, { status: 401 });
    }

    const policy = mockTimesheetPolicies.find((p) => p.tenantId === params.tenantId);
    if (!policy) {
      return HttpResponse.json({
        error: 'Not Found',
        message: 'Timesheet policy not found',
        statusCode: 404
      }, { status: 404 });
    }

    const body = (await request.json()) as any;
    const updated = {
      ...policy,
      ...body,
    };

    return HttpResponse.json({ data: updated });
  }),

  // 50. Delete timesheet policy
  http.delete(`${API_BASE_URL}/api/v1/timesheet-policies/:tenantId`, ({ request, params }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token',
        statusCode: 401
      }, { status: 401 });
    }

    const policy = mockTimesheetPolicies.find((p) => p.tenantId === params.tenantId);
    if (!policy) {
      return HttpResponse.json({
        error: 'Not Found',
        message: 'Timesheet policy not found',
        statusCode: 404
      }, { status: 404 });
    }

    return new HttpResponse(null, { status: 204 });
  }),

  // ========================================
  // LEAVE REQUESTS ENDPOINTS (7)
  // ========================================

  // 51. List leave requests
  http.get(`${API_BASE_URL}/api/v1/leave-requests`, ({ request }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token',
        statusCode: 401
      }, { status: 401 });
    }

    const url = new URL(request.url);
    const mine = url.searchParams.get('mine');
    const userId = url.searchParams.get('user_id');
    const status = url.searchParams.get('status');
    const team = url.searchParams.get('team');

    let results = Array.from(leaveRequests.values());

    if (mine === 'true') {
      results = results.filter((req) => req.userId === getUserFromToken(request).id);
    }
    if (userId) {
      results = results.filter((req) => req.userId === userId);
    }
    if (status) {
      results = results.filter((req) => req.status === status);
    }
    if (team === 'true') {
      // In real app, filter by manager's team
      results = results.filter((req) => req.userId !== getUserFromToken(request).id);
    }

    const leaveRequestsArray = results.map((lr) => ({
      id: lr.id,
      tenantId: 'tenant-1',
      userId: lr.userId,
      benefitTypeId: 'bt1',
      startDate: lr.startDate,
      endDate: lr.endDate,
      amount: 5,
      status: lr.status,
      approverUserId: lr.approvedBy || null,
      approvedAt: lr.approvedAt || null,
      note: lr.reason || null,
      createdAt: lr.createdAt,
    }));

    return HttpResponse.json({
      data: leaveRequestsArray,
      page: 1,
      page_size: 20,
      total: leaveRequestsArray.length,
    });
  }),

  // 52. Create leave request
  http.post(`${API_BASE_URL}/api/v1/leave-requests`, async ({ request }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token',
        statusCode: 401
      }, { status: 401 });
    }

    const body = (await request.json()) as Partial<LeaveRequest>;
    const id = `lr-${Date.now()}`;

    const newRequest: LeaveRequest = {
      id,
      userId: getUserFromToken(request).id,
      userName: getUserFromToken(request).name,
      type: body.type || 'vacation',
      startDate: body.startDate || '',
      endDate: body.endDate || '',
      status: 'pending',
      reason: body.reason,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    leaveRequests.set(id, newRequest);

    const responseData = {
      id: newRequest.id,
      tenantId: 'tenant-1',
      userId: newRequest.userId,
      benefitTypeId: 'bt1',
      startDate: newRequest.startDate,
      endDate: newRequest.endDate,
      amount: 5,
      status: newRequest.status,
      approverUserId: null,
      approvedAt: null,
      note: newRequest.reason || null,
      createdAt: newRequest.createdAt,
    };

    return HttpResponse.json({ data: responseData }, { status: 201 });
  }),

  // 53. Get single leave request
  http.get(`${API_BASE_URL}/api/v1/leave-requests/:id`, ({ request, params }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token',
        statusCode: 401
      }, { status: 401 });
    }

    const leaveRequest = leaveRequests.get(params.id as string);
    if (!leaveRequest) {
      return HttpResponse.json({
        error: 'Not Found',
        message: 'Leave request not found',
        statusCode: 404
      }, { status: 404 });
    }

    const responseData = {
      id: leaveRequest.id,
      tenantId: 'tenant-1',
      userId: leaveRequest.userId,
      benefitTypeId: 'bt1',
      startDate: leaveRequest.startDate,
      endDate: leaveRequest.endDate,
      amount: 5,
      status: leaveRequest.status,
      approverUserId: leaveRequest.approvedBy || null,
      approvedAt: leaveRequest.approvedAt || null,
      note: leaveRequest.reason || null,
      createdAt: leaveRequest.createdAt,
    };

    return HttpResponse.json({ data: responseData });
  }),

  // 54. Cancel leave request
  http.delete(`${API_BASE_URL}/api/v1/leave-requests/:id`, ({ request, params }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token',
        statusCode: 401
      }, { status: 401 });
    }

    const existing = leaveRequests.get(params.id as string);
    if (!existing) {
      return HttpResponse.json({
        error: 'Not Found',
        message: 'Leave request not found',
        statusCode: 404
      }, { status: 404 });
    }

    if (existing.status !== 'pending') {
      return HttpResponse.json({
        error: 'Bad Request',
        message: 'Leave request cannot be cancelled (invalid status or not owned by user)',
        statusCode: 400
      }, { status: 400 });
    }

    const updated: LeaveRequest = {
      ...existing,
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
    };

    leaveRequests.set(params.id as string, updated);

    const responseData = {
      id: updated.id,
      tenantId: 'tenant-1',
      userId: updated.userId,
      benefitTypeId: 'bt1',
      startDate: updated.startDate,
      endDate: updated.endDate,
      amount: 5,
      status: updated.status,
      approverUserId: updated.approvedBy || null,
      approvedAt: updated.approvedAt || null,
      note: updated.reason || null,
      createdAt: updated.createdAt,
    };

    return HttpResponse.json({ data: responseData });
  }),

  // 55. Approve leave request
  http.post(`${API_BASE_URL}/api/v1/leave-requests/:id/approve`, ({ request, params }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token',
        statusCode: 401
      }, { status: 401 });
    }

    const existing = leaveRequests.get(params.id as string);
    if (!existing) {
      return HttpResponse.json({
        error: 'Not Found',
        message: 'Leave request not found',
        statusCode: 404
      }, { status: 404 });
    }

    if (existing.status !== 'pending') {
      return HttpResponse.json({
        error: 'Bad Request',
        message: 'Leave request cannot be approved (invalid status)',
        statusCode: 400
      }, { status: 400 });
    }

    const user = getUserFromToken(request);
    const now = new Date().toISOString();

    const updated: LeaveRequest = {
      ...existing,
      status: 'approved',
      approvedBy: user.id,
      approvedAt: now,
      updatedAt: now,
    };

    leaveRequests.set(params.id as string, updated);

    const responseData = {
      id: updated.id,
      tenantId: 'tenant-1',
      userId: updated.userId,
      benefitTypeId: 'bt1',
      startDate: updated.startDate,
      endDate: updated.endDate,
      amount: 5,
      status: updated.status,
      approverUserId: updated.approvedBy,
      approvedAt: updated.approvedAt,
      note: updated.reason || null,
      createdAt: updated.createdAt,
    };

    return HttpResponse.json({ data: responseData });
  }),

  // 56. Reject leave request
  http.post(`${API_BASE_URL}/api/v1/leave-requests/:id/reject`, async ({ request, params }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token',
        statusCode: 401
      }, { status: 401 });
    }

    const existing = leaveRequests.get(params.id as string);
    if (!existing) {
      return HttpResponse.json({
        error: 'Not Found',
        message: 'Leave request not found',
        statusCode: 404
      }, { status: 404 });
    }

    if (existing.status !== 'pending') {
      return HttpResponse.json({
        error: 'Bad Request',
        message: 'Leave request cannot be rejected (invalid status)',
        statusCode: 400
      }, { status: 400 });
    }

    const body = (await request.json()) as { reason?: string };
    const user = getUserFromToken(request);
    const now = new Date().toISOString();

    const updated: LeaveRequest = {
      ...existing,
      status: 'rejected',
      rejectionReason: body.reason,
      rejectedBy: user.id,
      rejectedAt: now,
      updatedAt: now,
    };

    leaveRequests.set(params.id as string, updated);

    const responseData = {
      id: updated.id,
      tenantId: 'tenant-1',
      userId: updated.userId,
      benefitTypeId: 'bt1',
      startDate: updated.startDate,
      endDate: updated.endDate,
      amount: 5,
      status: updated.status,
      approverUserId: updated.rejectedBy || null,
      approvedAt: null,
      note: updated.rejectionReason || null,
      createdAt: updated.createdAt,
    };

    return HttpResponse.json({ data: responseData });
  }),

  // 57. Get user benefit balances
  http.get(`${API_BASE_URL}/api/v1/leave-requests/users/:userId/benefits`, ({ request, params }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token',
        statusCode: 401
      }, { status: 401 });
    }

    const benefits = mockUserBenefits[params.userId as string];
    if (!benefits) {
      return HttpResponse.json({
        error: 'Not Found',
        message: 'Benefits not found',
        statusCode: 404
      }, { status: 404 });
    }

    const benefitBalances = benefits.benefits.map((b, index) => ({
      id: `benefit-balance-${index + 1}`,
      benefitTypeId: `bt${index + 1}`,
      benefitTypeKey: b.type,
      benefitTypeName: b.name,
      currentBalance: b.remainingDays.toString(),
      totalAmount: b.totalDays.toString(),
      usedAmount: b.usedDays.toString(),
      unit: 'days' as const,
      requiresApproval: true,
    }));

    return HttpResponse.json({
      data: benefitBalances,
      meta: {
        userId: params.userId,
        count: benefitBalances.length,
      },
    });
  }),

  // ========================================
  // USERS/EMPLOYEES ENDPOINT (1)
  // ========================================

  // 58. Get users/employees list
  http.get(`${API_BASE_URL}/api/v1/users`, ({ request }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token',
        statusCode: 401
      }, { status: 401 });
    }

    // Check if user has admin or manager role (permission check)
    const user = getUserFromToken(request);
    if (user.role === 'employee') {
      return HttpResponse.json({
        error: 'Forbidden',
        message: 'Access denied. Required roles: admin, manager',
        statusCode: 403
      }, { status: 403 });
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const q = url.searchParams.get('q')?.toLowerCase();
    const role = url.searchParams.get('role');
    const status = url.searchParams.get('status');
    const managerId = url.searchParams.get('manager_id');
    const sort = url.searchParams.get('sort') || 'name:asc';

    // Mock employees data with new structure
    const mockEmployees = [
      {
        id: '123e4567-e89b-12d3-a456-426614174001',
        email: 'olivia.rhye@kairos.com',
        name: 'Olivia Rhye',
        locale: 'en',
        createdAt: '2025-01-15T10:00:00.000Z',
        lastLoginAt: '2025-10-24T14:30:00.000Z',
        membership: {
          role: 'employee' as const,
          status: 'active' as const,
          createdAt: '2025-01-15T10:00:00.000Z',
        },
        profile: {
          jobTitle: 'Software Engineer',
          startDate: '2025-01-15',
          managerUserId: '123e4567-e89b-12d3-a456-426614174002',
          location: 'New York, NY',
          phone: '+1-555-0123',
        },
      },
      {
        id: '123e4567-e89b-12d3-a456-426614174002',
        email: 'phoenix.baker@kairos.com',
        name: 'Phoenix Baker',
        locale: 'en',
        createdAt: '2025-01-16T11:00:00.000Z',
        lastLoginAt: '2025-10-25T09:15:00.000Z',
        membership: {
          role: 'manager' as const,
          status: 'active' as const,
          createdAt: '2025-01-16T11:00:00.000Z',
        },
        profile: {
          jobTitle: 'Engineering Manager',
          startDate: '2024-06-01',
          managerUserId: null,
          location: 'San Francisco, CA',
          phone: '+1-555-0124',
        },
      },
      {
        id: '123e4567-e89b-12d3-a456-426614174003',
        email: 'lana.steiner@kairos.com',
        name: 'Lana Steiner',
        locale: 'en',
        createdAt: '2025-02-01T09:00:00.000Z',
        lastLoginAt: '2025-09-20T16:45:00.000Z',
        membership: {
          role: 'employee' as const,
          status: 'active' as const,
          createdAt: '2025-02-01T09:00:00.000Z',
        },
        profile: {
          jobTitle: 'UX Designer',
          startDate: '2025-02-01',
          managerUserId: '123e4567-e89b-12d3-a456-426614174002',
          location: 'Remote',
          phone: '+1-555-0125',
        },
      },
      {
        id: '123e4567-e89b-12d3-a456-426614174004',
        email: 'demi.wilkinson@kairos.com',
        name: 'Demi Wilkinson',
        locale: 'en',
        createdAt: '2025-03-10T08:30:00.000Z',
        lastLoginAt: '2025-10-26T11:20:00.000Z',
        membership: {
          role: 'employee' as const,
          status: 'active' as const,
          createdAt: '2025-03-10T08:30:00.000Z',
        },
        profile: {
          jobTitle: 'Frontend Developer',
          startDate: '2025-03-10',
          managerUserId: '123e4567-e89b-12d3-a456-426614174002',
          location: 'Austin, TX',
          phone: '+1-555-0126',
        },
      },
      {
        id: '123e4567-e89b-12d3-a456-426614174005',
        email: 'candice.wu@kairos.com',
        name: 'Candice Wu',
        locale: 'en',
        createdAt: '2024-06-15T10:00:00.000Z',
        lastLoginAt: '2025-04-10T14:00:00.000Z',
        membership: {
          role: 'employee' as const,
          status: 'disabled' as const,
          createdAt: '2024-06-15T10:00:00.000Z',
        },
        profile: {
          jobTitle: 'Backend Developer',
          startDate: '2024-06-15',
          managerUserId: '123e4567-e89b-12d3-a456-426614174002',
          location: 'Seattle, WA',
          phone: '+1-555-0127',
        },
      },
      {
        id: '123e4567-e89b-12d3-a456-426614174006',
        email: 'john.smith@kairos.com',
        name: 'John Smith',
        locale: 'en',
        createdAt: '2025-01-05T12:00:00.000Z',
        lastLoginAt: null,
        membership: {
          role: 'employee' as const,
          status: 'invited' as const,
          createdAt: '2025-01-05T12:00:00.000Z',
        },
        profile: {
          jobTitle: 'DevOps Engineer',
          startDate: '2025-11-01',
          managerUserId: '123e4567-e89b-12d3-a456-426614174002',
          location: 'Boston, MA',
          phone: '+1-555-0128',
        },
      },
      {
        id: '123e4567-e89b-12d3-a456-426614174007',
        email: 'sarah.admin@kairos.com',
        name: 'Sarah Admin',
        locale: 'en',
        createdAt: '2024-01-01T00:00:00.000Z',
        lastLoginAt: '2025-10-26T08:00:00.000Z',
        membership: {
          role: 'admin' as const,
          status: 'active' as const,
          createdAt: '2024-01-01T00:00:00.000Z',
        },
        profile: {
          jobTitle: 'System Administrator',
          startDate: '2024-01-01',
          managerUserId: null,
          location: 'New York, NY',
          phone: '+1-555-0100',
        },
      },
    ];

    // Apply filters
    let results = mockEmployees;

    // Search filter (q parameter)
    if (q) {
      results = results.filter(
        (emp) =>
          emp.name?.toLowerCase().includes(q) ||
          emp.email.toLowerCase().includes(q)
      );
    }

    // Role filter
    if (role) {
      results = results.filter((emp) => emp.membership.role === role);
    }

    // Status filter
    if (status) {
      results = results.filter((emp) => emp.membership.status === status);
    }

    // Manager filter (direct reports)
    if (managerId) {
      results = results.filter((emp) => emp.profile?.managerUserId === managerId);
    }

    // Sorting
    const [sortField, sortDirection] = sort.split(':');
    results.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortField) {
        case 'name':
          aVal = a.name || '';
          bVal = b.name || '';
          break;
        case 'email':
          aVal = a.email;
          bVal = b.email;
          break;
        case 'created_at':
          aVal = a.createdAt;
          bVal = b.createdAt;
          break;
        case 'role':
          aVal = a.membership.role;
          bVal = b.membership.role;
          break;
        case 'status':
          aVal = a.membership.status;
          bVal = b.membership.status;
          break;
        default:
          aVal = a.name || '';
          bVal = b.name || '';
      }

      if (sortDirection === 'desc') {
        return bVal > aVal ? 1 : -1;
      }
      return aVal > bVal ? 1 : -1;
    });

    // Pagination
    const total = results.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedResults = results.slice(start, end);

    return HttpResponse.json({
      data: paginatedResults,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  }),

  // 59. Create user/employee (POST /users)
  http.post(`${API_BASE_URL}/api/v1/users`, async ({ request }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token',
        statusCode: 401
      }, { status: 401 });
    }

    // Check permissions (admin or manager only)
    const user = getUserFromToken(request);
    if (user.role === 'employee') {
      return HttpResponse.json({
        error: 'Forbidden',
        message: 'Forbidden – requires admin or manager role',
        statusCode: 403
      }, { status: 403 });
    }

    const body = await request.json() as any;

    // Validate required fields
    if (!body.email || !body.name || !body.role) {
      return HttpResponse.json({
        error: 'Validation failed',
        message: 'Email, name, and role are required',
        statusCode: 400
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return HttpResponse.json({
        error: 'Invalid email format',
        message: 'Please provide a valid email address',
        statusCode: 400
      }, { status: 400 });
    }

    // Check for duplicate email (simulate checking existing users)
    const existingEmails = [
      'olivia.rhye@kairos.com',
      'phoenix.baker@kairos.com',
      'lana.steiner@kairos.com',
      'demi.wilkinson@kairos.com',
      'candice.wu@kairos.com',
      'john.smith@kairos.com',
      'sarah.admin@kairos.com',
    ];

    if (existingEmails.includes(body.email.toLowerCase())) {
      return HttpResponse.json({
        error: 'Email already exists for this tenant',
        message: `User with email ${body.email} already exists`,
        statusCode: 409
      }, { status: 409 });
    }

    // Generate new user
    const newUserId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const now = new Date().toISOString();

    const newUser = {
      data: {
        user: {
          id: newUserId,
          email: body.email,
          name: body.name,
          locale: body.locale || 'en',
          createdAt: now,
          updatedAt: now,
        },
        membership: {
          tenantId: 'df829f65-c1ac-4a3a-86b7-7cd1ccf26615',
          role: body.role,
          status: 'invited' as const, // New users start as invited
        },
        profile: body.profile || null,
      },
    };

    // Simulate sending invite email if sendInvite is true
    if (body.sendInvite !== false) {
      console.log(`[MSW] Invitation email sent to ${body.email}`);
    }

    return HttpResponse.json(newUser, { status: 201 });
  }),

  // 60. Update user/employee (PATCH /users/:id)
  http.patch(`${API_BASE_URL}/api/v1/users/:id`, async ({ request, params }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token',
        statusCode: 401
      }, { status: 401 });
    }

    // Check permissions
    const currentUser = getUserFromToken(request);
    if (currentUser.role === 'employee') {
      return HttpResponse.json({
        error: 'Forbidden',
        message: 'Forbidden – requires admin or manager role',
        statusCode: 403
      }, { status: 403 });
    }

    const userId = params.id as string;
    const body = await request.json() as any;

    // Check if user is trying to change their own role
    if (currentUser.id === userId && body.role && body.role !== currentUser.role) {
      return HttpResponse.json({
        error: 'You cannot change your own role',
        message: 'Users cannot modify their own role',
        statusCode: 403
      }, { status: 403 });
    }

    // Simulate finding the user (in real app, would check database)
    const mockUserIds = [
      '123e4567-e89b-12d3-a456-426614174001',
      '123e4567-e89b-12d3-a456-426614174002',
      '123e4567-e89b-12d3-a456-426614174003',
      '123e4567-e89b-12d3-a456-426614174004',
      '123e4567-e89b-12d3-a456-426614174005',
      '123e4567-e89b-12d3-a456-426614174006',
      '123e4567-e89b-12d3-a456-426614174007',
    ];

    if (!mockUserIds.includes(userId)) {
      return HttpResponse.json({
        error: 'User not found',
        message: `User with ID ${userId} not found`,
        statusCode: 404
      }, { status: 404 });
    }

    // Validate manager hierarchy (prevent circular references)
    if (body.profile?.managerUserId) {
      if (body.profile.managerUserId === userId) {
        return HttpResponse.json({
          error: 'Invalid manager hierarchy',
          message: 'User cannot be their own manager',
          statusCode: 400
        }, { status: 400 });
      }
    }

    const now = new Date().toISOString();

    // Return updated user (merge with existing data)
    const updatedUser = {
      data: {
        user: {
          id: userId,
          email: 'john.doe@example.com', // Would come from existing user
          name: body.name || 'John Doe',
          locale: 'en',
          createdAt: '2025-01-15T10:00:00.000Z',
          updatedAt: now,
        },
        membership: {
          tenantId: 'df829f65-c1ac-4a3a-86b7-7cd1ccf26615',
          role: body.role || 'employee',
          status: 'active' as const,
        },
        profile: body.profile ? {
          jobTitle: body.profile.jobTitle ?? 'Software Engineer',
          startDate: body.profile.startDate ?? '2025-01-15',
          managerUserId: body.profile.managerUserId ?? null,
          location: body.profile.location ?? 'New York, NY',
          phone: body.profile.phone ?? null,
        } : null,
      },
    };

    return HttpResponse.json(updatedUser, { status: 200 });
  }),

  // 61. Delete/deactivate user (DELETE /users/:id)
  http.delete(`${API_BASE_URL}/api/v1/users/:id`, ({ request, params }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token',
        statusCode: 401
      }, { status: 401 });
    }

    // Check permissions (admin only for delete)
    const currentUser = getUserFromToken(request);
    if (currentUser.role !== 'admin') {
      return HttpResponse.json({
        error: 'Forbidden',
        message: 'Forbidden – requires admin role',
        statusCode: 403
      }, { status: 403 });
    }

    const userId = params.id as string;

    // Simulate finding the user
    const mockUserIds = [
      '123e4567-e89b-12d3-a456-426614174001',
      '123e4567-e89b-12d3-a456-426614174002',
      '123e4567-e89b-12d3-a456-426614174003',
      '123e4567-e89b-12d3-a456-426614174004',
      '123e4567-e89b-12d3-a456-426614174005',
      '123e4567-e89b-12d3-a456-426614174006',
      '123e4567-e89b-12d3-a456-426614174007',
    ];

    if (!mockUserIds.includes(userId)) {
      return HttpResponse.json({
        error: 'User not found',
        message: `User with ID ${userId} not found`,
        statusCode: 404
      }, { status: 404 });
    }

    // Soft delete: In real implementation, would set status to 'disabled'
    console.log(`[MSW] User ${userId} has been deactivated (soft delete)`);

    // Return 204 No Content
    return new HttpResponse(null, { status: 204 });
  }),

  // ========================================
  // CALENDAR ENDPOINT (1)
  // ========================================

  // 62. Get calendar
  http.get(`${API_BASE_URL}/api/v1/calendar`, ({ request }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token',
        statusCode: 401
      }, { status: 401 });
    }

    const url = new URL(request.url);
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const include = url.searchParams.get('include')?.split(',') || ['holidays', 'leave'];
    const userId = url.searchParams.get('user_id') || getUserFromToken(request).id;

    if (!from || !to) {
      return HttpResponse.json({
        error: 'Bad Request',
        message: 'Missing required parameters (from and to dates)',
        statusCode: 400
      }, { status: 400 });
    }

    const events: any[] = [];
    const fromDate = new Date(from);
    const toDate = new Date(to);

    // Add holidays
    if (include.includes('holidays')) {
      mockHolidays.forEach((holiday) => {
        const holidayDate = new Date(holiday.date);
        if (holidayDate >= fromDate && holidayDate <= toDate) {
          events.push({
            type: 'holiday',
            id: holiday.id,
            date: holiday.date,
            title: holiday.name,
            description: `${holiday.type} holiday`,
          });
        }
      });
    }

    // Add approved leaves
    if (include.includes('leave')) {
      Array.from(leaveRequests.values())
        .filter((req) => req.status === 'approved')
        .forEach((leave) => {
          const leaveStart = new Date(leave.startDate);
          const leaveEnd = new Date(leave.endDate);

          // Add events for each day in the leave range that falls within from-to
          let currentDate = new Date(leaveStart);
          while (currentDate <= leaveEnd) {
            if (currentDate >= fromDate && currentDate <= toDate) {
              const dateStr = currentDate.toISOString().split('T')[0];
              events.push({
                type: 'leave',
                id: `${leave.id}-${dateStr}`,
                date: dateStr,
                title: `${leave.userName || leave.userId} - ${leave.type}`,
                userId: leave.userId,
                userName: leave.userName,
              });
            }
            currentDate.setDate(currentDate.getDate() + 1);
          }
        });
    }

    return HttpResponse.json({
      data: events,
      meta: {
        userId,
        from,
        to,
        include,
      },
    });
  }),
];
