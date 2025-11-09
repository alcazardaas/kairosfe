/**
 * Reports Service
 * Aggregates data from various endpoints to generate reports
 */

import { timeEntriesService } from './time-entries';
import { timesheetsService } from './timesheets';
import { employeesService } from './employees';
import { projectsService } from './projects';
import { leaveRequestsService } from './leave-requests';
import type { TimeEntryDto, TimesheetDto, Employee, Project } from '@kairos/shared';

export interface TimesheetReportFilters {
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  userIds?: string[];
  projectIds?: string[];
  status?: 'draft' | 'submitted' | 'approved' | 'rejected';
}

export interface LeaveReportFilters {
  from: string;
  to: string;
  userIds?: string[];
  status?: 'pending' | 'approved' | 'rejected';
}

export interface ProjectTimeAllocation {
  projectId: string;
  projectName: string;
  totalHours: number;
  userCount: number;
  avgHoursPerUser: number;
}

export interface UserTimeStats {
  userId: string;
  userName: string;
  totalHours: number;
  weekCount: number;
  avgWeeklyHours: number;
  projectCount: number;
}

export interface TimesheetStatusStats {
  draft: number;
  submitted: number;
  approved: number;
  rejected: number;
  total: number;
}

export interface LeaveStats {
  userId: string;
  userName: string;
  totalDays: number;
  pendingDays: number;
  approvedDays: number;
  rejectedDays: number;
}

export interface TeamUtilization {
  totalEmployees: number;
  activeEmployees: number; // Employees with time entries
  avgHoursPerEmployee: number;
  totalHours: number;
}

export const reportsService = {
  /**
   * Get timesheet report data
   */
  async getTimesheetReport(filters: TimesheetReportFilters) {
    // Load all relevant timesheets
    const timesheetsResponse = await timesheetsService.getAll({
      from: filters.from,
      to: filters.to,
      status: filters.status,
      pageSize: 1000,
    });

    // Load all time entries for the period
    const entriesResponse = await timeEntriesService.getAll({
      weekStartDate: filters.from,
      weekEndDate: filters.to,
    });

    const timesheets = timesheetsResponse.data || [];
    const entries = entriesResponse.data || [];

    // Filter by users if specified
    let filteredEntries = entries;
    if (filters.userIds && filters.userIds.length > 0) {
      filteredEntries = entries.filter((e) => filters.userIds!.includes(e.userId));
    }

    // Filter by projects if specified
    if (filters.projectIds && filters.projectIds.length > 0) {
      filteredEntries = filteredEntries.filter((e) => filters.projectIds!.includes(e.projectId));
    }

    // Calculate total hours
    const totalHours = filteredEntries.reduce((sum, entry) => sum + (entry.hours || 0), 0);

    // Calculate timesheet status stats
    const statusStats: TimesheetStatusStats = {
      draft: timesheets.filter((t) => t.status === 'draft').length,
      submitted: timesheets.filter((t) => t.status === 'submitted').length,
      approved: timesheets.filter((t) => t.status === 'approved').length,
      rejected: timesheets.filter((t) => t.status === 'rejected').length,
      total: timesheets.length,
    };

    // Calculate project allocations
    const projectMap = new Map<string, { hours: number; users: Set<string> }>();
    filteredEntries.forEach((entry) => {
      if (!entry.projectId || !entry.hours) return;

      if (!projectMap.has(entry.projectId)) {
        projectMap.set(entry.projectId, { hours: 0, users: new Set() });
      }

      const proj = projectMap.get(entry.projectId)!;
      proj.hours += entry.hours;
      proj.users.add(entry.userId);
    });

    // Load project names
    const projectsResponse = await projectsService.getAll();
    const projects = projectsResponse.data || [];

    const projectAllocations: ProjectTimeAllocation[] = Array.from(projectMap.entries()).map(
      ([projectId, data]) => {
        const project = projects.find((p) => p.id === projectId);
        return {
          projectId,
          projectName: project?.name || 'Unknown Project',
          totalHours: data.hours,
          userCount: data.users.size,
          avgHoursPerUser: data.users.size > 0 ? data.hours / data.users.size : 0,
        };
      }
    );

    // Calculate user stats
    const userMap = new Map<string, { hours: number; weeks: Set<string>; projects: Set<string> }>();
    filteredEntries.forEach((entry) => {
      if (!entry.userId || !entry.hours) return;

      if (!userMap.has(entry.userId)) {
        userMap.set(entry.userId, { hours: 0, weeks: new Set(), projects: new Set() });
      }

      const user = userMap.get(entry.userId)!;
      user.hours += entry.hours;
      user.weeks.add(entry.weekStartDate);
      user.projects.add(entry.projectId);
    });

    // Load user names
    const employeesResponse = await employeesService.getAll();
    const employees = employeesResponse.data || [];

    const userStats: UserTimeStats[] = Array.from(userMap.entries()).map(([userId, data]) => {
      const employee = employees.find((e) => e.id === userId);
      const weekCount = data.weeks.size;
      return {
        userId,
        userName: employee?.name || employee?.email || 'Unknown User',
        totalHours: data.hours,
        weekCount,
        avgWeeklyHours: weekCount > 0 ? data.hours / weekCount : 0,
        projectCount: data.projects.size,
      };
    });

    // Calculate team utilization
    const activeEmployees = userMap.size;
    const teamUtilization: TeamUtilization = {
      totalEmployees: employees.length,
      activeEmployees,
      avgHoursPerEmployee: activeEmployees > 0 ? totalHours / activeEmployees : 0,
      totalHours,
    };

    return {
      totalHours,
      statusStats,
      projectAllocations: projectAllocations.sort((a, b) => b.totalHours - a.totalHours),
      userStats: userStats.sort((a, b) => b.totalHours - a.totalHours),
      teamUtilization,
      timesheetCount: timesheets.length,
      entryCount: filteredEntries.length,
    };
  },

  /**
   * Get leave report data
   */
  async getLeaveReport(filters: LeaveReportFilters) {
    // Load all leave requests for the period
    const leaveResponse = await leaveRequestsService.getAll({
      startDate: filters.from,
      endDate: filters.to,
      status: filters.status,
      pageSize: 1000,
    });

    const leaves = leaveResponse.data || [];

    // Filter by users if specified
    let filteredLeaves = leaves;
    if (filters.userIds && filters.userIds.length > 0) {
      filteredLeaves = leaves.filter((l) => filters.userIds!.includes(l.userId));
    }

    // Calculate user leave stats
    const userMap = new Map<
      string,
      { pending: number; approved: number; rejected: number; total: number }
    >();

    filteredLeaves.forEach((leave) => {
      if (!leave.userId) return;

      if (!userMap.has(leave.userId)) {
        userMap.set(leave.userId, { pending: 0, approved: 0, rejected: 0, total: 0 });
      }

      const user = userMap.get(leave.userId)!;
      const days = leave.amount || 0;

      user.total += days;
      if (leave.status === 'pending') user.pending += days;
      else if (leave.status === 'approved') user.approved += days;
      else if (leave.status === 'rejected') user.rejected += days;
    });

    // Load user names
    const employeesResponse = await employeesService.getAll();
    const employees = employeesResponse.data || [];

    const leaveStats: LeaveStats[] = Array.from(userMap.entries()).map(([userId, data]) => {
      const employee = employees.find((e) => e.id === userId);
      return {
        userId,
        userName: employee?.name || employee?.email || 'Unknown User',
        totalDays: data.total,
        pendingDays: data.pending,
        approvedDays: data.approved,
        rejectedDays: data.rejected,
      };
    });

    // Calculate totals
    const totalPending = filteredLeaves
      .filter((l) => l.status === 'pending')
      .reduce((sum, l) => sum + (l.amount || 0), 0);
    const totalApproved = filteredLeaves
      .filter((l) => l.status === 'approved')
      .reduce((sum, l) => sum + (l.amount || 0), 0);
    const totalRejected = filteredLeaves
      .filter((l) => l.status === 'rejected')
      .reduce((sum, l) => sum + (l.amount || 0), 0);

    return {
      leaveStats: leaveStats.sort((a, b) => b.totalDays - a.totalDays),
      summary: {
        totalRequests: filteredLeaves.length,
        pendingRequests: filteredLeaves.filter((l) => l.status === 'pending').length,
        approvedRequests: filteredLeaves.filter((l) => l.status === 'approved').length,
        rejectedRequests: filteredLeaves.filter((l) => l.status === 'rejected').length,
        totalDays: totalPending + totalApproved + totalRejected,
        pendingDays: totalPending,
        approvedDays: totalApproved,
        rejectedDays: totalRejected,
      },
    };
  },

  /**
   * Export report data to CSV
   */
  exportToCSV(data: any[], filename: string) {
    if (!data || data.length === 0) {
      return;
    }

    // Get headers from first object
    const headers = Object.keys(data[0]);

    // Convert to CSV
    const rows = [headers.join(',')];
    data.forEach((item) => {
      const values = headers.map((header) => {
        const value = item[header];
        // Escape quotes and wrap in quotes if contains comma
        const stringValue = String(value ?? '');
        return stringValue.includes(',') || stringValue.includes('"')
          ? `"${stringValue.replace(/"/g, '""')}"`
          : stringValue;
      });
      rows.push(values.join(','));
    });

    const csv = rows.join('\n');

    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};
