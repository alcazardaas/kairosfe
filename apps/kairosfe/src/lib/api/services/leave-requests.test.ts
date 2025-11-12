/**
 * Comprehensive tests for Leave Requests Service
 * Target: 95%+ coverage
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getLeaveRequests,
  getLeaveRequest,
  createLeaveRequest,
  updateLeaveRequest,
  cancelLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
  getUserBenefits,
  calculateBusinessDays,
} from './leave-requests';
import { apiClient } from '../client';

// Mock API client
vi.mock('../client');

describe('leave-requests service', () => {
  const mockLeaveRequestDto = {
    id: '1',
    tenantId: 'tenant-1',
    userId: 'user-1',
    userName: 'Test User',
    userEmail: 'test@test.com',
    benefitTypeId: 'vacation',
    startDate: '2025-02-01',
    endDate: '2025-02-05',
    totalDays: 5,
    status: 'pending' as const,
    approvalNote: null,
    createdAt: '2025-01-11T10:00:00.000Z',
    updatedAt: '2025-01-11T10:00:00.000Z',
  };

  const mockLeaveRequest = {
    id: '1',
    tenantId: 'tenant-1',
    userId: 'user-1',
    userName: 'Test User',
    userEmail: 'test@test.com',
    benefitTypeId: 'vacation',
    type: 'vacation' as const,
    startDate: '2025-02-01',
    endDate: '2025-02-05',
    totalDays: 5,
    status: 'pending' as const,
    approvalNote: null,
    createdAt: '2025-01-11T10:00:00.000Z',
    updatedAt: '2025-01-11T10:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getLeaveRequests', () => {
    it('should fetch all leave requests without filters', async () => {
      const mockResponse = {
        data: [mockLeaveRequestDto],
        page: 1,
        page_size: 10,
        total: 1,
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await getLeaveRequests();

      expect(apiClient.get).toHaveBeenCalledWith('/leave-requests', true);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: '1',
        userId: 'user-1',
        benefitTypeId: 'vacation',
      });
    });

    it('should fetch my leave requests', async () => {
      const mockResponse = {
        data: [mockLeaveRequestDto],
        page: 1,
        page_size: 10,
        total: 1,
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      await getLeaveRequests({ mine: true });

      expect(apiClient.get).toHaveBeenCalledWith('/leave-requests?mine=true', true);
    });

    it('should fetch leave requests by userId', async () => {
      const mockResponse = {
        data: [mockLeaveRequestDto],
        page: 1,
        page_size: 10,
        total: 1,
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      await getLeaveRequests({ userId: 'user-1' });

      expect(apiClient.get).toHaveBeenCalledWith('/leave-requests?user_id=user-1', true);
    });

    it('should fetch leave requests by status', async () => {
      const mockResponse = {
        data: [mockLeaveRequestDto],
        page: 1,
        page_size: 10,
        total: 1,
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      await getLeaveRequests({ status: 'pending' });

      expect(apiClient.get).toHaveBeenCalledWith('/leave-requests?status=pending', true);
    });

    it('should fetch team leave requests', async () => {
      const mockResponse = {
        data: [mockLeaveRequestDto],
        page: 1,
        page_size: 10,
        total: 1,
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      await getLeaveRequests({ team: true });

      expect(apiClient.get).toHaveBeenCalledWith('/leave-requests?team=true', true);
    });

    it('should fetch leave requests with combined filters', async () => {
      const mockResponse = {
        data: [mockLeaveRequestDto],
        page: 1,
        page_size: 10,
        total: 1,
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      await getLeaveRequests({ mine: true, status: 'pending' });

      expect(apiClient.get).toHaveBeenCalledWith('/leave-requests?mine=true&status=pending', true);
    });

    it('should handle empty response', async () => {
      const mockResponse = {
        data: [],
        page: 1,
        page_size: 10,
        total: 0,
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await getLeaveRequests();

      expect(result).toEqual([]);
    });

    it('should handle undefined data array', async () => {
      const mockResponse = {
        data: undefined,
        page: 1,
        page_size: 10,
        total: 0,
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await getLeaveRequests();

      expect(result).toEqual([]);
    });
  });

  describe('getLeaveRequest', () => {
    it('should fetch single leave request by ID', async () => {
      const mockResponse = {
        data: mockLeaveRequestDto,
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await getLeaveRequest('1');

      expect(apiClient.get).toHaveBeenCalledWith('/leave-requests/1', true);
      expect(result).toMatchObject({
        id: '1',
        userId: 'user-1',
        benefitTypeId: 'vacation',
      });
    });

    it('should handle not found error', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Leave request not found'));

      await expect(getLeaveRequest('non-existent')).rejects.toThrow('Leave request not found');
    });
  });

  describe('createLeaveRequest', () => {
    it('should create new leave request with reason', async () => {
      const mockResponse = {
        data: mockLeaveRequestDto,
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const createData = {
        benefitTypeId: 'vacation',
        startDate: '2025-02-03', // Monday
        endDate: '2025-02-07', // Friday
        reason: 'Family vacation',
      };

      const result = await createLeaveRequest(createData);

      expect(apiClient.post).toHaveBeenCalledWith(
        '/leave-requests',
        {
          benefitTypeId: 'vacation',
          startDate: '2025-02-03',
          endDate: '2025-02-07',
          amount: 5, // 5 business days
          note: 'Family vacation',
        },
        true
      );
      expect(result).toMatchObject({
        id: '1',
        benefitTypeId: 'vacation',
      });
    });

    it('should create leave request without reason', async () => {
      const mockResponse = {
        data: mockLeaveRequestDto,
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const createData = {
        benefitTypeId: 'vacation',
        startDate: '2025-02-03',
        endDate: '2025-02-07',
      };

      await createLeaveRequest(createData);

      expect(apiClient.post).toHaveBeenCalledWith(
        '/leave-requests',
        expect.objectContaining({
          note: null,
        }),
        true
      );
    });

    it('should calculate business days correctly', async () => {
      const mockResponse = {
        data: mockLeaveRequestDto,
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const createData = {
        benefitTypeId: 'vacation',
        startDate: '2025-02-03', // Monday
        endDate: '2025-02-07', // Friday
      };

      await createLeaveRequest(createData);

      expect(apiClient.post).toHaveBeenCalledWith(
        '/leave-requests',
        expect.objectContaining({
          amount: 5, // Mon-Fri = 5 business days
        }),
        true
      );
    });

    it('should handle creation error', async () => {
      vi.mocked(apiClient.post).mockRejectedValue(
        new Error('Insufficient leave balance')
      );

      const createData = {
        benefitTypeId: 'vacation',
        startDate: '2025-02-03',
        endDate: '2025-02-07',
      };

      await expect(createLeaveRequest(createData)).rejects.toThrow('Insufficient leave balance');
    });
  });

  describe('updateLeaveRequest', () => {
    it('should update leave request', async () => {
      const updatedDto = {
        ...mockLeaveRequestDto,
        reason: 'Updated reason',
      };

      const mockResponse = {
        data: updatedDto,
      };

      vi.mocked(apiClient.patch).mockResolvedValue(mockResponse);

      const updateData = {
        reason: 'Updated reason',
      };

      const result = await updateLeaveRequest('1', updateData);

      expect(apiClient.patch).toHaveBeenCalledWith('/leave-requests/1', updateData, true);
      expect(result).toBeDefined();
    });

    it('should handle update error', async () => {
      vi.mocked(apiClient.patch).mockRejectedValue(
        new Error('Can only update pending requests')
      );

      await expect(updateLeaveRequest('1', { reason: 'test' })).rejects.toThrow(
        'Can only update pending requests'
      );
    });
  });

  describe('cancelLeaveRequest', () => {
    it('should cancel leave request', async () => {
      const cancelledDto = {
        ...mockLeaveRequestDto,
        status: 'cancelled' as const,
      };

      const mockResponse = {
        data: cancelledDto,
      };

      vi.mocked(apiClient.delete).mockResolvedValue(mockResponse);

      const result = await cancelLeaveRequest('1');

      expect(apiClient.delete).toHaveBeenCalledWith('/leave-requests/1', true);
      expect(result).toBeDefined();
    });

    it('should handle cancellation error', async () => {
      vi.mocked(apiClient.delete).mockRejectedValue(
        new Error('Cannot cancel approved request')
      );

      await expect(cancelLeaveRequest('1')).rejects.toThrow('Cannot cancel approved request');
    });
  });

  describe('approveLeaveRequest', () => {
    it('should approve leave request', async () => {
      const approvedDto = {
        ...mockLeaveRequestDto,
        status: 'approved' as const,
        approvalNote: 'Approved',
      };

      const mockResponse = {
        data: approvedDto,
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await approveLeaveRequest('1');

      expect(apiClient.post).toHaveBeenCalledWith('/leave-requests/1/approve', {}, true);
      expect(result).toBeDefined();
    });

    it('should handle approval error', async () => {
      vi.mocked(apiClient.post).mockRejectedValue(
        new Error('Only pending requests can be approved')
      );

      await expect(approveLeaveRequest('1')).rejects.toThrow(
        'Only pending requests can be approved'
      );
    });
  });

  describe('rejectLeaveRequest', () => {
    it('should reject leave request with reason', async () => {
      const rejectedDto = {
        ...mockLeaveRequestDto,
        status: 'rejected' as const,
        approvalNote: 'Insufficient coverage',
      };

      const mockResponse = {
        data: rejectedDto,
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await rejectLeaveRequest('1', 'Insufficient coverage');

      expect(apiClient.post).toHaveBeenCalledWith(
        '/leave-requests/1/reject',
        { reason: 'Insufficient coverage' },
        true
      );
      expect(result).toBeDefined();
    });

    it('should handle rejection error', async () => {
      vi.mocked(apiClient.post).mockRejectedValue(
        new Error('Only pending requests can be rejected')
      );

      await expect(rejectLeaveRequest('1', 'test')).rejects.toThrow(
        'Only pending requests can be rejected'
      );
    });
  });

  describe('getUserBenefits', () => {
    it('should fetch user benefits and transform response', async () => {
      const mockResponse = {
        data: [
          {
            benefitTypeKey: 'vacation',
            benefitTypeName: 'Vacation Leave',
            totalAmount: '20',
            usedAmount: '5',
            currentBalance: '15',
          },
          {
            benefitTypeKey: 'sick',
            benefitTypeName: 'Sick Leave',
            totalAmount: '10',
            usedAmount: '2',
            currentBalance: '8',
          },
        ],
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await getUserBenefits('user-1');

      expect(apiClient.get).toHaveBeenCalledWith('/leave-requests/users/user-1/benefits', true);
      expect(result.userId).toBe('user-1');
      expect(result.benefits).toHaveLength(2);
      expect(result.benefits[0]).toMatchObject({
        type: 'vacation',
        name: 'Vacation Leave',
        totalDays: 20,
        usedDays: 5,
        remainingDays: 15,
      });
      expect(result.benefits[1]).toMatchObject({
        type: 'sick',
        name: 'Sick Leave',
        totalDays: 10,
        usedDays: 2,
        remainingDays: 8,
      });
    });

    it('should handle empty benefits response', async () => {
      const mockResponse = {
        data: [],
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await getUserBenefits('user-1');

      expect(result.benefits).toEqual([]);
    });

    it('should handle undefined data array', async () => {
      const mockResponse = {
        data: undefined,
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await getUserBenefits('user-1');

      expect(result.benefits).toEqual([]);
    });

    it('should handle missing benefit names gracefully', async () => {
      const mockResponse = {
        data: [
          {
            benefitTypeKey: 'vacation',
            benefitTypeName: null,
            totalAmount: '20',
            usedAmount: '5',
            currentBalance: '15',
          },
        ],
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await getUserBenefits('user-1');

      expect(result.benefits[0].name).toBe('Unknown');
    });

    it('should parse string amounts to numbers', async () => {
      const mockResponse = {
        data: [
          {
            benefitTypeKey: 'vacation',
            benefitTypeName: 'Vacation',
            totalAmount: '20.5',
            usedAmount: '5.25',
            currentBalance: '15.25',
          },
        ],
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await getUserBenefits('user-1');

      expect(result.benefits[0].totalDays).toBe(20.5);
      expect(result.benefits[0].usedDays).toBe(5.25);
      expect(result.benefits[0].remainingDays).toBe(15.25);
    });
  });

  describe('calculateBusinessDays', () => {
    it('should calculate business days for a full week (Mon-Fri)', () => {
      const days = calculateBusinessDays('2025-02-03', '2025-02-07');
      expect(days).toBe(5); // Monday to Friday
    });

    it('should exclude weekends', () => {
      const days = calculateBusinessDays('2025-02-01', '2025-02-09');
      expect(days).toBe(5); // Sat-Sun = 5 business days (Mon-Fri)
    });

    it('should handle single day request', () => {
      const days = calculateBusinessDays('2025-02-03', '2025-02-03');
      expect(days).toBe(1); // Single Monday
    });

    it('should handle weekend-only request', () => {
      const days = calculateBusinessDays('2025-02-08', '2025-02-09');
      expect(days).toBe(0); // Saturday to Sunday = 0 business days
    });

    it('should handle request starting on Saturday', () => {
      const days = calculateBusinessDays('2025-02-08', '2025-02-10');
      expect(days).toBe(1); // Sat-Sun-Mon = 1 business day (Monday)
    });

    it('should handle request ending on Sunday', () => {
      const days = calculateBusinessDays('2025-02-07', '2025-02-09');
      expect(days).toBe(1); // Fri-Sat-Sun = 1 business day (Friday)
    });

    it('should calculate multiple weeks correctly', () => {
      const days = calculateBusinessDays('2025-02-03', '2025-02-14');
      expect(days).toBe(10); // 2 full weeks = 10 business days
    });

    it('should handle month boundaries', () => {
      const days = calculateBusinessDays('2025-01-30', '2025-02-03');
      expect(days).toBe(3); // Thu, Fri, Mon = 3 business days
    });

    it('should handle year boundaries', () => {
      const days = calculateBusinessDays('2024-12-30', '2025-01-03');
      expect(days).toBe(5); // Mon-Fri spanning new year
    });
  });
});
