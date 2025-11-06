import { apiClient } from '../client';
import type { LeaveRequest, UserBenefits, LeaveType } from '@kairos/shared';

export interface CreateLeaveRequestData {
  benefitTypeId: string;
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface UpdateLeaveRequestData {
  benefitTypeId?: string;
  startDate?: string;
  endDate?: string;
  reason?: string;
}

// Map API LeaveRequestDto to frontend LeaveRequest
interface LeaveRequestDto {
  id: string;
  tenantId: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  benefitTypeId: string;
  startDate: string;
  endDate: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approverUserId: string | null;
  approvedAt: string | null;
  note: string | null;
  createdAt: string;
}

function mapDtoToLeaveRequest(dto: LeaveRequestDto): LeaveRequest {
  return {
    id: dto.id,
    userId: dto.userId,
    userName: dto.userName || undefined,
    userEmail: dto.userEmail || undefined,
    type: 'vacation', // Default - should be mapped from benefitTypeId in real implementation
    startDate: dto.startDate,
    endDate: dto.endDate,
    status: dto.status,
    reason: dto.note || undefined,
    rejectionReason: undefined, // Not provided by API yet
    approvedBy: dto.approverUserId || undefined,
    approvedAt: dto.approvedAt || undefined,
    rejectedBy: undefined, // Not provided by API yet
    rejectedAt: undefined, // Not provided by API yet
    createdAt: dto.createdAt,
    updatedAt: dto.createdAt, // Using createdAt as updatedAt since API doesn't provide it
  };
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
  const response = await apiClient.get<{ data: LeaveRequestDto[]; page: number; page_size: number; total: number }>(`/leave-requests${query ? `?${query}` : ''}`, true);

  // Extract and map data array from paginated response
  return (response.data || []).map(mapDtoToLeaveRequest);
}

// Get single leave request
export async function getLeaveRequest(id: string): Promise<LeaveRequest> {
  const response = await apiClient.get<{ data: LeaveRequestDto }>(`/leave-requests/${id}`, true);
  return mapDtoToLeaveRequest(response.data);
}

// Create new leave request
export async function createLeaveRequest(data: CreateLeaveRequestData): Promise<LeaveRequest> {
  // Calculate number of days (business days)
  const amount = calculateBusinessDays(data.startDate, data.endDate);

  // Transform to backend format (benefitTypeId already provided from form)
  const requestPayload = {
    benefitTypeId: data.benefitTypeId,
    startDate: data.startDate,
    endDate: data.endDate,
    amount: Number(amount),
    note: data.reason || null,
  };

  console.log('[createLeaveRequest] Sending payload:', JSON.stringify(requestPayload, null, 2));

  const response = await apiClient.post<{ data: LeaveRequestDto }>('/leave-requests', requestPayload, true);
  return mapDtoToLeaveRequest(response.data);
}

// Update leave request (only for pending requests)
export async function updateLeaveRequest(
  id: string,
  data: UpdateLeaveRequestData
): Promise<LeaveRequest> {
  const response = await apiClient.patch<{ data: LeaveRequestDto }>(`/leave-requests/${id}`, data, true);
  return mapDtoToLeaveRequest(response.data);
}

// Cancel leave request
export async function cancelLeaveRequest(id: string): Promise<LeaveRequest> {
  const response = await apiClient.delete<{ data: LeaveRequestDto }>(`/leave-requests/${id}`, true);
  return mapDtoToLeaveRequest(response.data);
}

// Approve leave request (manager only)
export async function approveLeaveRequest(id: string): Promise<LeaveRequest> {
  const response = await apiClient.post<{ data: LeaveRequestDto }>(`/leave-requests/${id}/approve`, {}, true);
  return mapDtoToLeaveRequest(response.data);
}

// Reject leave request (manager only)
export async function rejectLeaveRequest(id: string, reason: string): Promise<LeaveRequest> {
  const response = await apiClient.post<{ data: LeaveRequestDto }>(`/leave-requests/${id}/reject`, { reason }, true);
  return mapDtoToLeaveRequest(response.data);
}

// Get user benefits (leave balances)
export async function getUserBenefits(userId: string): Promise<UserBenefits> {
  const response = await apiClient.get<{ data: any[]; meta: any }>(`/leave-requests/users/${userId}/benefits`, true);

  // Transform API response to UserBenefits format
  // Backend returns: { benefitTypeKey, benefitTypeName, totalAmount, usedAmount, currentBalance }
  const transformedBenefits = (response.data || []).map((benefit: any) => ({
    type: benefit.benefitTypeKey as LeaveType, // Use benefitTypeKey for type field
    name: benefit.benefitTypeName || 'Unknown',
    totalDays: parseFloat(benefit.totalAmount || '0'),
    usedDays: parseFloat(benefit.usedAmount || '0'),
    remainingDays: parseFloat(benefit.currentBalance || '0'),
    year: new Date().getFullYear(),
  }));

  return {
    userId,
    year: new Date().getFullYear(),
    benefits: transformedBenefits,
  };
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
