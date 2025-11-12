/**
 * MSW (Mock Service Worker) request handlers for testing
 */

import { http, HttpResponse } from 'msw';
import {
  mockUser,
  mockManager,
  mockAuthResponse,
  mockTimesheets,
  mockTimesheet,
  mockTimeEntries,
  mockTimeEntry,
  mockLeaveRequests,
  mockLeaveRequest,
  mockProjects,
  mockProject,
  mockTasks,
  mockTask,
  mockBenefitTypes,
  mockUserBenefits,
  mockHolidays,
  mockWeeklyStats,
  mockProjectStats,
} from './data';

const baseURL = 'http://localhost:3000/api/v1';

export const handlers = [
  // ============================================================================
  // AUTH ENDPOINTS
  // ============================================================================

  // POST /auth/login
  http.post(`${baseURL}/auth/login`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string };
    const { email, password } = body;

    if (email === 'test@test.com' && password === 'password123') {
      return HttpResponse.json(mockAuthResponse);
    }

    if (email === 'manager@test.com' && password === 'password123') {
      return HttpResponse.json({
        ...mockAuthResponse,
        user: mockManager,
      });
    }

    return HttpResponse.json(
      { message: 'Invalid credentials' },
      { status: 401 }
    );
  }),

  // POST /auth/refresh
  http.post(`${baseURL}/auth/refresh`, async ({ request }) => {
    const body = await request.json() as { refreshToken: string };
    const { refreshToken } = body;

    if (refreshToken === 'mock-refresh-token') {
      return HttpResponse.json({
        token: 'new-mock-access-token',
        refreshToken: 'new-mock-refresh-token',
        expiresIn: 3600,
      });
    }

    return HttpResponse.json(
      { message: 'Invalid refresh token' },
      { status: 401 }
    );
  }),

  // POST /auth/logout
  http.post(`${baseURL}/auth/logout`, () => {
    return HttpResponse.json({ message: 'Logged out successfully' });
  }),

  // GET /me
  http.get(`${baseURL}/me`, () => {
    return HttpResponse.json(mockUser);
  }),

  // ============================================================================
  // TIMESHEET ENDPOINTS
  // ============================================================================

  // GET /timesheets
  http.get(`${baseURL}/timesheets`, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const userId = url.searchParams.get('userId');

    let filtered = [...mockTimesheets];

    if (status) {
      filtered = filtered.filter((ts) => ts.status === status);
    }

    if (userId) {
      filtered = filtered.filter((ts) => ts.userId === userId);
    }

    return HttpResponse.json(filtered);
  }),

  // GET /timesheets/:id
  http.get(`${baseURL}/timesheets/:id`, ({ params }) => {
    const { id } = params;
    const timesheet = mockTimesheets.find((ts) => ts.id === id);

    if (!timesheet) {
      return HttpResponse.json(
        { message: 'Timesheet not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json(timesheet);
  }),

  // POST /timesheets
  http.post(`${baseURL}/timesheets`, async ({ request }) => {
    const body = await request.json() as Partial<typeof mockTimesheet>;

    const newTimesheet = {
      ...mockTimesheet,
      ...body,
      id: 'new-timesheet-id',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return HttpResponse.json(newTimesheet, { status: 201 });
  }),

  // PATCH /timesheets/:id
  http.patch(`${baseURL}/timesheets/:id`, async ({ params, request }) => {
    const { id } = params;
    const body = await request.json() as Partial<typeof mockTimesheet>;

    const timesheet = mockTimesheets.find((ts) => ts.id === id);

    if (!timesheet) {
      return HttpResponse.json(
        { message: 'Timesheet not found' },
        { status: 404 }
      );
    }

    const updated = {
      ...timesheet,
      ...body,
      updatedAt: new Date().toISOString(),
    };

    return HttpResponse.json(updated);
  }),

  // POST /timesheets/:id/submit
  http.post(`${baseURL}/timesheets/:id/submit`, ({ params }) => {
    const { id } = params;
    const timesheet = mockTimesheets.find((ts) => ts.id === id);

    if (!timesheet) {
      return HttpResponse.json(
        { message: 'Timesheet not found' },
        { status: 404 }
      );
    }

    const updated = {
      ...timesheet,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return HttpResponse.json(updated);
  }),

  // POST /timesheets/:id/approve
  http.post(`${baseURL}/timesheets/:id/approve`, ({ params }) => {
    const { id } = params;

    const updated = {
      ...mockTimesheet,
      id: id as string,
      status: 'approved',
      reviewedAt: new Date().toISOString(),
      reviewedByUserId: '2',
      updatedAt: new Date().toISOString(),
    };

    return HttpResponse.json(updated);
  }),

  // POST /timesheets/:id/reject
  http.post(`${baseURL}/timesheets/:id/reject`, async ({ params, request }) => {
    const { id } = params;
    const body = await request.json() as { reviewNote: string };

    const updated = {
      ...mockTimesheet,
      id: id as string,
      status: 'rejected',
      reviewedAt: new Date().toISOString(),
      reviewedByUserId: '2',
      reviewNote: body.reviewNote,
      updatedAt: new Date().toISOString(),
    };

    return HttpResponse.json(updated);
  }),

  // ============================================================================
  // TIME ENTRY ENDPOINTS
  // ============================================================================

  // GET /time-entries
  http.get(`${baseURL}/time-entries`, ({ request }) => {
    const url = new URL(request.url);
    const timesheetId = url.searchParams.get('timesheetId');

    if (timesheetId) {
      const filtered = mockTimeEntries.filter((te) => te.timesheetId === timesheetId);
      return HttpResponse.json(filtered);
    }

    return HttpResponse.json(mockTimeEntries);
  }),

  // POST /time-entries
  http.post(`${baseURL}/time-entries`, async ({ request }) => {
    const body = await request.json() as Partial<typeof mockTimeEntry>;

    const newEntry = {
      ...mockTimeEntry,
      ...body,
      id: 'new-entry-id',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return HttpResponse.json(newEntry, { status: 201 });
  }),

  // PATCH /time-entries/:id
  http.patch(`${baseURL}/time-entries/:id`, async ({ params, request }) => {
    const { id } = params;
    const body = await request.json() as Partial<typeof mockTimeEntry>;

    const entry = mockTimeEntries.find((te) => te.id === id);

    if (!entry) {
      return HttpResponse.json(
        { message: 'Time entry not found' },
        { status: 404 }
      );
    }

    const updated = {
      ...entry,
      ...body,
      updatedAt: new Date().toISOString(),
    };

    return HttpResponse.json(updated);
  }),

  // DELETE /time-entries/:id
  http.delete(`${baseURL}/time-entries/:id`, ({ params }) => {
    const { id } = params;
    const entry = mockTimeEntries.find((te) => te.id === id);

    if (!entry) {
      return HttpResponse.json(
        { message: 'Time entry not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json({ message: 'Time entry deleted' });
  }),

  // GET /time-entries/stats/weekly
  http.get(`${baseURL}/time-entries/stats/weekly`, () => {
    return HttpResponse.json(mockWeeklyStats);
  }),

  // GET /time-entries/stats/project
  http.get(`${baseURL}/time-entries/stats/project`, () => {
    return HttpResponse.json(mockProjectStats);
  }),

  // ============================================================================
  // LEAVE REQUEST ENDPOINTS
  // ============================================================================

  // GET /leave-requests
  http.get(`${baseURL}/leave-requests`, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const mine = url.searchParams.get('mine');

    let filtered = [...mockLeaveRequests];

    if (status) {
      filtered = filtered.filter((lr) => lr.status === status);
    }

    if (mine === 'true') {
      filtered = filtered.filter((lr) => lr.userId === '1');
    }

    return HttpResponse.json(filtered);
  }),

  // GET /leave-requests/:id
  http.get(`${baseURL}/leave-requests/:id`, ({ params }) => {
    const { id } = params;
    const request = mockLeaveRequests.find((lr) => lr.id === id);

    if (!request) {
      return HttpResponse.json(
        { message: 'Leave request not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json(request);
  }),

  // POST /leave-requests
  http.post(`${baseURL}/leave-requests`, async ({ request }) => {
    const body = await request.json() as Partial<typeof mockLeaveRequest>;

    const newRequest = {
      ...mockLeaveRequest,
      ...body,
      id: 'new-leave-request-id',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return HttpResponse.json(newRequest, { status: 201 });
  }),

  // PATCH /leave-requests/:id
  http.patch(`${baseURL}/leave-requests/:id`, async ({ params, request }) => {
    const { id } = params;
    const body = await request.json() as Partial<typeof mockLeaveRequest>;

    const leaveRequest = mockLeaveRequests.find((lr) => lr.id === id);

    if (!leaveRequest) {
      return HttpResponse.json(
        { message: 'Leave request not found' },
        { status: 404 }
      );
    }

    const updated = {
      ...leaveRequest,
      ...body,
      updatedAt: new Date().toISOString(),
    };

    return HttpResponse.json(updated);
  }),

  // POST /leave-requests/:id/cancel
  http.post(`${baseURL}/leave-requests/:id/cancel`, ({ params }) => {
    const { id } = params;

    const updated = {
      ...mockLeaveRequest,
      id: id as string,
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
    };

    return HttpResponse.json(updated);
  }),

  // POST /leave-requests/:id/approve
  http.post(`${baseURL}/leave-requests/:id/approve`, ({ params }) => {
    const { id } = params;

    const updated = {
      ...mockLeaveRequest,
      id: id as string,
      status: 'approved',
      reviewedAt: new Date().toISOString(),
      reviewedByUserId: '2',
      updatedAt: new Date().toISOString(),
    };

    return HttpResponse.json(updated);
  }),

  // POST /leave-requests/:id/reject
  http.post(`${baseURL}/leave-requests/:id/reject`, async ({ params, request }) => {
    const { id } = params;
    const body = await request.json() as { reviewNote: string };

    const updated = {
      ...mockLeaveRequest,
      id: id as string,
      status: 'rejected',
      reviewedAt: new Date().toISOString(),
      reviewedByUserId: '2',
      reviewNote: body.reviewNote,
      updatedAt: new Date().toISOString(),
    };

    return HttpResponse.json(updated);
  }),

  // ============================================================================
  // PROJECT ENDPOINTS
  // ============================================================================

  // GET /projects
  http.get(`${baseURL}/projects`, () => {
    return HttpResponse.json(mockProjects);
  }),

  // GET /projects/:id
  http.get(`${baseURL}/projects/:id`, ({ params }) => {
    const { id } = params;
    const project = mockProjects.find((p) => p.id === id);

    if (!project) {
      return HttpResponse.json(
        { message: 'Project not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json(project);
  }),

  // GET /search/projects
  http.get(`${baseURL}/search/projects`, ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';

    const filtered = mockProjects.filter((p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.code.toLowerCase().includes(query.toLowerCase())
    );

    return HttpResponse.json(filtered);
  }),

  // ============================================================================
  // TASK ENDPOINTS
  // ============================================================================

  // GET /tasks
  http.get(`${baseURL}/tasks`, ({ request }) => {
    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');

    if (projectId) {
      const filtered = mockTasks.filter((t) => t.projectId === projectId);
      return HttpResponse.json(filtered);
    }

    return HttpResponse.json(mockTasks);
  }),

  // GET /search/tasks
  http.get(`${baseURL}/search/tasks`, ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';
    const projectId = url.searchParams.get('projectId');

    let filtered = [...mockTasks];

    if (projectId) {
      filtered = filtered.filter((t) => t.projectId === projectId);
    }

    filtered = filtered.filter((t) =>
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      t.code.toLowerCase().includes(query.toLowerCase())
    );

    return HttpResponse.json(filtered);
  }),

  // ============================================================================
  // USER & BENEFIT ENDPOINTS
  // ============================================================================

  // GET /users/:id/benefits
  http.get(`${baseURL}/users/:id/benefits`, () => {
    return HttpResponse.json(mockUserBenefits);
  }),

  // GET /benefit-types
  http.get(`${baseURL}/benefit-types`, () => {
    return HttpResponse.json(mockBenefitTypes);
  }),

  // ============================================================================
  // HOLIDAY ENDPOINTS
  // ============================================================================

  // GET /holidays
  http.get(`${baseURL}/holidays`, ({ request }) => {
    const url = new URL(request.url);
    const year = url.searchParams.get('year');

    if (year) {
      const filtered = mockHolidays.filter((h) => h.date.startsWith(year));
      return HttpResponse.json(filtered);
    }

    return HttpResponse.json(mockHolidays);
  }),

  // ============================================================================
  // CALENDAR ENDPOINTS
  // ============================================================================

  // GET /calendar
  http.get(`${baseURL}/calendar`, () => {
    return HttpResponse.json({
      holidays: mockHolidays,
      leaveRequests: mockLeaveRequests.filter((lr) => lr.status === 'approved'),
    });
  }),

  // GET /calendar/check-overlap
  http.get(`${baseURL}/calendar/check-overlap`, () => {
    return HttpResponse.json({
      hasOverlap: false,
      holidays: [],
      teamLeaves: [],
    });
  }),
];
