import { apiClient } from '../client';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar?: string;
  leaveType: 'vacation' | 'sick' | 'personal' | 'unpaid';
  startDate: string;
  endDate: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface LeaveBalance {
  leaveType: string;
  used: number;
  total: number;
}

export interface LeaveRequestsResponse {
  requests: LeaveRequest[];
  total: number;
  page: number;
  limit: number;
}

export interface LeaveBalancesResponse {
  balances: LeaveBalance[];
}

export const leaveRequestsService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    status?: string;
    employeeId?: string;
  }): Promise<LeaveRequestsResponse> {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.employeeId) queryParams.append('employeeId', params.employeeId);

    const endpoint = `/api/leave-requests${queryParams.toString() ? `?${queryParams}` : ''}`;
    return apiClient.get<LeaveRequestsResponse>(endpoint);
  },

  async getById(id: string): Promise<LeaveRequest> {
    return apiClient.get<LeaveRequest>(`/api/leave-requests/${id}`);
  },

  async create(data: Omit<LeaveRequest, 'id' | 'createdAt' | 'status'>): Promise<LeaveRequest> {
    return apiClient.post<LeaveRequest>('/api/leave-requests', data);
  },

  async approve(id: string): Promise<LeaveRequest> {
    return apiClient.post<LeaveRequest>(`/api/leave-requests/${id}/approve`, {});
  },

  async reject(id: string, reason?: string): Promise<LeaveRequest> {
    return apiClient.post<LeaveRequest>(`/api/leave-requests/${id}/reject`, { reason });
  },

  async getBalances(): Promise<LeaveBalancesResponse> {
    return apiClient.get<LeaveBalancesResponse>('/api/leave-requests/balances');
  },
};
