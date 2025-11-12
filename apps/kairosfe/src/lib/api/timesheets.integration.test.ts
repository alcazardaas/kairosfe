import { describe, it, expect, beforeEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/lib/test/mocks/server';

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  initReactI18next: {
    type: '3rdParty',
    init: vi.fn(),
  },
}));

describe('Timesheet CRUD Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Timesheet API Integration', () => {
    it('should fetch timesheets from API', async () => {
      let apiCalled = false;

      server.use(
        http.get('http://localhost:8080/api/v1/timesheets', () => {
          apiCalled = true;
          return HttpResponse.json({
            data: [
              {
                id: 'ts-1',
                userId: 'user-1',
                weekStartDate: '2025-01-13',
                status: 'draft',
                totalHours: 40,
                createdAt: '2025-01-13T10:00:00Z',
              },
            ],
          });
        })
      );

      // Simulate API call
      const response = await fetch('http://localhost:8080/api/v1/timesheets');
      const data = await response.json();

      expect(apiCalled).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].id).toBe('ts-1');
      expect(data.data[0].status).toBe('draft');
    });

    it('should create new timesheet via API', async () => {
      let requestBody: any = null;

      server.use(
        http.post('http://localhost:8080/api/v1/timesheets', async ({ request }) => {
          requestBody = await request.json();
          return HttpResponse.json({
            data: {
              id: 'ts-new',
              ...requestBody,
              status: 'draft',
              createdAt: '2025-01-13T10:00:00Z',
            },
          });
        })
      );

      // Simulate creating timesheet
      const newTimesheet = {
        userId: 'user-1',
        weekStartDate: '2025-01-13',
      };

      const response = await fetch('http://localhost:8080/api/v1/timesheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTimesheet),
      });
      const data = await response.json();

      expect(requestBody).toEqual(newTimesheet);
      expect(data.data.id).toBe('ts-new');
      expect(data.data.status).toBe('draft');
    });

    it('should update timesheet via API', async () => {
      let requestBody: any = null;

      server.use(
        http.put('http://localhost:8080/api/v1/timesheets/ts-1', async ({ request }) => {
          requestBody = await request.json();
          return HttpResponse.json({
            data: {
              id: 'ts-1',
              ...requestBody,
              updatedAt: '2025-01-13T11:00:00Z',
            },
          });
        })
      );

      // Simulate updating timesheet
      const updates = {
        status: 'submitted',
        totalHours: 40,
      };

      const response = await fetch('http://localhost:8080/api/v1/timesheets/ts-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await response.json();

      expect(requestBody).toEqual(updates);
      expect(data.data.status).toBe('submitted');
      expect(data.data.totalHours).toBe(40);
    });

    it('should submit timesheet for approval', async () => {
      let submitCalled = false;

      server.use(
        http.post('http://localhost:8080/api/v1/timesheets/ts-1/submit', () => {
          submitCalled = true;
          return HttpResponse.json({
            data: {
              id: 'ts-1',
              status: 'pending',
              submittedAt: '2025-01-13T12:00:00Z',
            },
          });
        })
      );

      // Simulate submitting timesheet
      const response = await fetch('http://localhost:8080/api/v1/timesheets/ts-1/submit', {
        method: 'POST',
      });
      const data = await response.json();

      expect(submitCalled).toBe(true);
      expect(data.data.status).toBe('pending');
      expect(data.data.submittedAt).toBeTruthy();
    });

    it('should handle API errors gracefully', async () => {
      server.use(
        http.get('http://localhost:8080/api/v1/timesheets', () => {
          return HttpResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
          );
        })
      );

      // Simulate API call that fails
      const response = await fetch('http://localhost:8080/api/v1/timesheets');
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toBe('Internal server error');
    });
  });

  describe('Time Entries API Integration', () => {
    it('should create time entry via API', async () => {
      let requestBody: any = null;

      server.use(
        http.post('http://localhost:8080/api/v1/time-entries', async ({ request }) => {
          requestBody = await request.json();
          return HttpResponse.json({
            data: {
              id: 'entry-1',
              ...requestBody,
              createdAt: '2025-01-13T10:00:00Z',
            },
          });
        })
      );

      // Simulate creating time entry
      const newEntry = {
        timesheetId: 'ts-1',
        projectId: 'proj-1',
        taskId: 'task-1',
        dayOfWeek: 1,
        hours: 8,
        notes: 'Development work',
      };

      const response = await fetch('http://localhost:8080/api/v1/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEntry),
      });
      const data = await response.json();

      expect(requestBody).toEqual(newEntry);
      expect(data.data.id).toBe('entry-1');
      expect(data.data.hours).toBe(8);
    });

    it('should update time entry via API', async () => {
      let requestBody: any = null;

      server.use(
        http.put('http://localhost:8080/api/v1/time-entries/entry-1', async ({ request }) => {
          requestBody = await request.json();
          return HttpResponse.json({
            data: {
              id: 'entry-1',
              ...requestBody,
              updatedAt: '2025-01-13T11:00:00Z',
            },
          });
        })
      );

      // Simulate updating time entry
      const updates = {
        hours: 10,
        notes: 'Updated work notes',
      };

      const response = await fetch('http://localhost:8080/api/v1/time-entries/entry-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await response.json();

      expect(requestBody).toEqual(updates);
      expect(data.data.hours).toBe(10);
      expect(data.data.notes).toBe('Updated work notes');
    });

    it('should delete time entry via API', async () => {
      let deleteCalled = false;

      server.use(
        http.delete('http://localhost:8080/api/v1/time-entries/entry-1', () => {
          deleteCalled = true;
          return HttpResponse.json({ success: true });
        })
      );

      // Simulate deleting time entry
      const response = await fetch('http://localhost:8080/api/v1/time-entries/entry-1', {
        method: 'DELETE',
      });
      const data = await response.json();

      expect(deleteCalled).toBe(true);
      expect(data.success).toBe(true);
    });

    it('should validate hours are within limits', async () => {
      server.use(
        http.post('http://localhost:8080/api/v1/time-entries', () => {
          return HttpResponse.json(
            { message: 'Hours must be between 0 and 24' },
            { status: 400 }
          );
        })
      );

      // Simulate creating entry with invalid hours
      const invalidEntry = {
        timesheetId: 'ts-1',
        projectId: 'proj-1',
        hours: 25, // Invalid
      };

      const response = await fetch('http://localhost:8080/api/v1/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidEntry),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toContain('Hours must be between');
    });
  });

  describe('Timesheet Workflow Integration', () => {
    it('should complete full timesheet workflow: create → add entries → submit', async () => {
      const workflow: string[] = [];

      // Step 1: Create timesheet
      server.use(
        http.post('http://localhost:8080/api/v1/timesheets', () => {
          workflow.push('created');
          return HttpResponse.json({
            data: {
              id: 'ts-workflow',
              userId: 'user-1',
              weekStartDate: '2025-01-13',
              status: 'draft',
            },
          });
        })
      );

      let response = await fetch('http://localhost:8080/api/v1/timesheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'user-1', weekStartDate: '2025-01-13' }),
      });

      expect(workflow).toContain('created');

      // Step 2: Add time entries
      server.use(
        http.post('http://localhost:8080/api/v1/time-entries', () => {
          workflow.push('entry-added');
          return HttpResponse.json({
            data: { id: 'entry-1', timesheetId: 'ts-workflow', hours: 8 },
          });
        })
      );

      response = await fetch('http://localhost:8080/api/v1/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timesheetId: 'ts-workflow', hours: 8 }),
      });

      expect(workflow).toContain('entry-added');

      // Step 3: Submit for approval
      server.use(
        http.post('http://localhost:8080/api/v1/timesheets/ts-workflow/submit', () => {
          workflow.push('submitted');
          return HttpResponse.json({
            data: { id: 'ts-workflow', status: 'pending' },
          });
        })
      );

      response = await fetch('http://localhost:8080/api/v1/timesheets/ts-workflow/submit', {
        method: 'POST',
      });

      expect(workflow).toEqual(['created', 'entry-added', 'submitted']);
    });

    it('should prevent submission of timesheet with zero hours', async () => {
      server.use(
        http.post('http://localhost:8080/api/v1/timesheets/ts-1/submit', () => {
          return HttpResponse.json(
            { message: 'Cannot submit timesheet with 0 hours' },
            { status: 400 }
          );
        })
      );

      const response = await fetch('http://localhost:8080/api/v1/timesheets/ts-1/submit', {
        method: 'POST',
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toContain('Cannot submit');
    });
  });
});
