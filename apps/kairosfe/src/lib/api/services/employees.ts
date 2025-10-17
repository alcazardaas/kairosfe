import { apiClient } from '../client';

export interface Employee {
  id: string;
  name: string;
  email: string;
  position: string;
  department?: string;
  location?: string;
  status: 'active' | 'inactive' | 'on_leave';
  lastLogin?: string;
  avatar?: string;
}

export interface EmployeesResponse {
  employees: Employee[];
  total: number;
  page: number;
  limit: number;
}

export const employeesService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    department?: string;
    location?: string;
    status?: string;
  }): Promise<EmployeesResponse> {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.department) queryParams.append('department', params.department);
    if (params?.location) queryParams.append('location', params.location);
    if (params?.status) queryParams.append('status', params.status);

    const endpoint = `/api/employees${queryParams.toString() ? `?${queryParams}` : ''}`;
    return apiClient.get<EmployeesResponse>(endpoint);
  },

  async getById(id: string): Promise<Employee> {
    return apiClient.get<Employee>(`/api/employees/${id}`);
  },

  async create(data: Omit<Employee, 'id'>): Promise<Employee> {
    return apiClient.post<Employee>('/api/employees', data);
  },

  async update(id: string, data: Partial<Employee>): Promise<Employee> {
    return apiClient.put<Employee>(`/api/employees/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/api/employees/${id}`);
  },
};
