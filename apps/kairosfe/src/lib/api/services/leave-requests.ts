import { apiClient } from '../client';
import type { LeaveRequest, UserBenefits, LeaveType } from '@kairos/shared';

export interface CreateLeaveRequestData {
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface UpdateLeaveRequestData {
  type?: LeaveType;
  startDate?: string;
  endDate?: string;
  reason?: string;
}

// Get all leave requests (with optional filters)
export async function getLeaveRequests(params?: {
  mine?: boolean;
  userId?: string;
  status?: string;
  team?: boolean;
}): Promise<LeaveRequest[]> {
  const queryParams = new URLSearchParams();
  if (params?.mine) queryParams.append('mine', 'true');
  if (params?.userId) queryParams.append('user_id', params.userId);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.team) queryParams.append('team', 'true');

  const query = queryParams.toString();
  return apiClient.get<LeaveRequest[]>(`/leave-requests${query ? `?${query}` : ''}`, true);
}

// Get single leave request
export async function getLeaveRequest(id: string): Promise<LeaveRequest> {
  return apiClient.get<LeaveRequest>(`/leave-requests/${id}`, true);
}

// Create new leave request
export async function createLeaveRequest(data: CreateLeaveRequestData): Promise<LeaveRequest> {
  return apiClient.post<LeaveRequest>('/leave-requests', data, true);
}

// Update leave request (only for pending requests)
export async function updateLeaveRequest(
  id: string,
  data: UpdateLeaveRequestData
): Promise<LeaveRequest> {
  return apiClient.patch<LeaveRequest>(`/leave-requests/${id}`, data, true);
}

// Cancel leave request
export async function cancelLeaveRequest(id: string): Promise<LeaveRequest> {
  return apiClient.post<LeaveRequest>(`/leave-requests/${id}/cancel`, {}, true);
}

// Approve leave request (manager only)
export async function approveLeaveRequest(id: string): Promise<LeaveRequest> {
  return apiClient.post<LeaveRequest>(`/leave-requests/${id}/approve`, {}, true);
}

// Reject leave request (manager only)
export async function rejectLeaveRequest(id: string, reason: string): Promise<LeaveRequest> {
  return apiClient.post<LeaveRequest>(`/leave-requests/${id}/reject`, { reason }, true);
}

// Get user benefits (leave balances)
export async function getUserBenefits(userId: string): Promise<UserBenefits> {
  return apiClient.get<UserBenefits>(`/users/${userId}/benefits`, true);
}

// Calculate business days between two dates
export function calculateBusinessDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);

  let count = 0;
  const current = new Date(start);

  while (current <= end) {
    const dayOfWeek = current.getDay();
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}
