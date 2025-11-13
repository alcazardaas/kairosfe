/**
 * Comprehensive tests for LeaveBalanceDisplay Component
 * Target: 95%+ coverage
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import LeaveBalanceDisplay from './LeaveBalanceDisplay';
import { useAuthStore } from '@/lib/store';
import * as leaveRequestsService from '@/lib/api/services/leave-requests';

// Mock dependencies
vi.mock('@/lib/store');
vi.mock('@/lib/api/services/leave-requests');

// Mock i18next with all required exports
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'leaveRequest.noBenefitsAvailable': 'No benefits available',
        'leaveRequest.leaveBalance': 'Leave Balance',
        'leaveRequest.of': 'of',
        'leaveRequest.days': 'days',
        'leaveRequest.used': 'Used',
        'leaveRequest.remaining': 'remaining',
        'leaveRequest.totalDays': 'Total Days',
        'leaveRequest.usedDays': 'Used Days',
        'leaveRequest.remainingDays': 'Remaining Days',
        'leaveRequest.types.vacation': 'Vacation',
        'leaveRequest.types.sick': 'Sick Leave',
      };
      return translations[key] || key;
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: vi.fn(),
  },
}));

// Mock the i18n module to prevent initialization errors
vi.mock('@/lib/i18n', () => ({
  default: {
    use: vi.fn().mockReturnThis(),
    init: vi.fn(),
  },
}));

describe('LeaveBalanceDisplay', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'employee' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuthStore).mockReturnValue(mockUser as any);
  });

  describe('loading state', () => {
    it('should show loading skeleton while fetching data', () => {
      vi.mocked(leaveRequestsService.getUserBenefits).mockReturnValue(
        new Promise(() => {}) // Never resolves
      );

      render(<LeaveBalanceDisplay />);

      const animatedElements = document.querySelectorAll('.animate-pulse');
      expect(animatedElements.length).toBeGreaterThan(0);
    });

    it('should show loading skeleton with multiple placeholder elements', () => {
      vi.mocked(leaveRequestsService.getUserBenefits).mockReturnValue(
        new Promise(() => {})
      );

      const { container } = render(<LeaveBalanceDisplay />);

      const skeletonElements = container.querySelectorAll('.bg-gray-200');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });
  });

  describe('empty state', () => {
    it('should show message when no benefits available', async () => {
      vi.mocked(leaveRequestsService.getUserBenefits).mockResolvedValue({
        year: 2025,
        benefits: [],
      });

      render(<LeaveBalanceDisplay />);

      await waitFor(() => {
        expect(screen.getByText('No benefits available')).toBeInTheDocument();
      });
    });

    it('should show message when benefits is null', async () => {
      vi.mocked(leaveRequestsService.getUserBenefits).mockResolvedValue(null as any);

      render(<LeaveBalanceDisplay />);

      await waitFor(() => {
        expect(screen.getByText('No benefits available')).toBeInTheDocument();
      });
    });
  });

  describe('successful data display', () => {
    const mockBenefits = {
      year: 2025,
      benefits: [
        {
          type: 'vacation',
          name: 'Annual Vacation',
          totalDays: 20,
          usedDays: 5,
          remainingDays: 15,
        },
        {
          type: 'sick',
          name: 'Sick Leave',
          totalDays: 10,
          usedDays: 2,
          remainingDays: 8,
        },
      ],
    };

    it('should display leave balance title with year', async () => {
      vi.mocked(leaveRequestsService.getUserBenefits).mockResolvedValue(mockBenefits);

      render(<LeaveBalanceDisplay />);

      await waitFor(() => {
        expect(screen.getByText(/Leave Balance - 2025/)).toBeInTheDocument();
      });
    });

    it('should display all benefit types', async () => {
      vi.mocked(leaveRequestsService.getUserBenefits).mockResolvedValue(mockBenefits);

      render(<LeaveBalanceDisplay />);

      await waitFor(() => {
        expect(screen.getByText('Annual Vacation')).toBeInTheDocument();
        // "Sick Leave" appears twice (as name and type), so use getAllByText
        const sickLeaveElements = screen.getAllByText('Sick Leave');
        expect(sickLeaveElements.length).toBeGreaterThan(0);
      });
    });

    it('should display remaining days for each benefit', async () => {
      vi.mocked(leaveRequestsService.getUserBenefits).mockResolvedValue(mockBenefits);

      render(<LeaveBalanceDisplay />);

      await waitFor(() => {
        expect(screen.getByText('15')).toBeInTheDocument();
        expect(screen.getByText('8')).toBeInTheDocument();
      });
    });

    it('should display used days for each benefit', async () => {
      vi.mocked(leaveRequestsService.getUserBenefits).mockResolvedValue(mockBenefits);

      render(<LeaveBalanceDisplay />);

      await waitFor(() => {
        expect(screen.getByText('Used: 5 days')).toBeInTheDocument();
        expect(screen.getByText('Used: 2 days')).toBeInTheDocument();
      });
    });

    it('should display percentage remaining', async () => {
      vi.mocked(leaveRequestsService.getUserBenefits).mockResolvedValue(mockBenefits);

      render(<LeaveBalanceDisplay />);

      await waitFor(() => {
        // 15/20 = 75%
        expect(screen.getByText('75% remaining')).toBeInTheDocument();
        // 8/10 = 80%
        expect(screen.getByText('80% remaining')).toBeInTheDocument();
      });
    });
  });

  describe('summary totals', () => {
    const mockBenefits = {
      year: 2025,
      benefits: [
        {
          type: 'vacation',
          name: 'Annual Vacation',
          totalDays: 20,
          usedDays: 5,
          remainingDays: 15,
        },
        {
          type: 'sick',
          name: 'Sick Leave',
          totalDays: 10,
          usedDays: 2,
          remainingDays: 8,
        },
      ],
    };

    it('should calculate total days across all benefits', async () => {
      vi.mocked(leaveRequestsService.getUserBenefits).mockResolvedValue(mockBenefits);

      render(<LeaveBalanceDisplay />);

      await waitFor(() => {
        // Total: 20 + 10 = 30
        const totalDaysElements = screen.getAllByText('30');
        expect(totalDaysElements.length).toBeGreaterThan(0);
      });
    });

    it('should calculate total used days', async () => {
      vi.mocked(leaveRequestsService.getUserBenefits).mockResolvedValue(mockBenefits);

      render(<LeaveBalanceDisplay />);

      await waitFor(() => {
        // Used: 5 + 2 = 7
        const usedDaysElements = screen.getAllByText('7');
        expect(usedDaysElements.length).toBeGreaterThan(0);
      });
    });

    it('should calculate total remaining days', async () => {
      vi.mocked(leaveRequestsService.getUserBenefits).mockResolvedValue(mockBenefits);

      render(<LeaveBalanceDisplay />);

      await waitFor(() => {
        // Remaining: 15 + 8 = 23
        const remainingDaysElements = screen.getAllByText('23');
        expect(remainingDaysElements.length).toBeGreaterThan(0);
      });
    });

    it('should display summary labels', async () => {
      vi.mocked(leaveRequestsService.getUserBenefits).mockResolvedValue(mockBenefits);

      render(<LeaveBalanceDisplay />);

      await waitFor(() => {
        expect(screen.getByText('Total Days')).toBeInTheDocument();
        expect(screen.getByText('Used Days')).toBeInTheDocument();
        expect(screen.getByText('Remaining Days')).toBeInTheDocument();
      });
    });
  });

  describe('progress bar colors', () => {
    it('should use green color for > 60% remaining', async () => {
      vi.mocked(leaveRequestsService.getUserBenefits).mockResolvedValue({
        year: 2025,
        benefits: [
          {
            type: 'vacation',
            name: 'Vacation',
            totalDays: 20,
            usedDays: 5,
            remainingDays: 15, // 75% remaining
          },
        ],
      });

      const { container } = render(<LeaveBalanceDisplay />);

      await waitFor(() => {
        const progressBar = container.querySelector('.bg-green-500');
        expect(progressBar).toBeInTheDocument();
      });
    });

    it('should use yellow color for 30-60% remaining', async () => {
      vi.mocked(leaveRequestsService.getUserBenefits).mockResolvedValue({
        year: 2025,
        benefits: [
          {
            type: 'vacation',
            name: 'Vacation',
            totalDays: 20,
            usedDays: 11,
            remainingDays: 9, // 45% remaining
          },
        ],
      });

      const { container } = render(<LeaveBalanceDisplay />);

      await waitFor(() => {
        const progressBar = container.querySelector('.bg-yellow-500');
        expect(progressBar).toBeInTheDocument();
      });
    });

    it('should use red color for < 30% remaining', async () => {
      vi.mocked(leaveRequestsService.getUserBenefits).mockResolvedValue({
        year: 2025,
        benefits: [
          {
            type: 'vacation',
            name: 'Vacation',
            totalDays: 20,
            usedDays: 18,
            remainingDays: 2, // 10% remaining
          },
        ],
      });

      const { container } = render(<LeaveBalanceDisplay />);

      await waitFor(() => {
        const progressBar = container.querySelector('.bg-red-500');
        expect(progressBar).toBeInTheDocument();
      });
    });
  });

  describe('error handling', () => {
    it('should handle API error gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(leaveRequestsService.getUserBenefits).mockRejectedValue(
        new Error('API Error')
      );

      render(<LeaveBalanceDisplay />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to load leave benefits:',
          expect.any(Error)
        );
      });

      // Should show empty state after error
      await waitFor(() => {
        expect(screen.getByText('No benefits available')).toBeInTheDocument();
      });
    });

    it('should not call API if user is not logged in', async () => {
      vi.mocked(useAuthStore).mockReturnValue(null as any);

      render(<LeaveBalanceDisplay />);

      await waitFor(() => {
        expect(leaveRequestsService.getUserBenefits).not.toHaveBeenCalled();
      });
    });
  });

  describe('data updates', () => {
    it('should reload benefits when user changes', async () => {
      const { rerender } = render(<LeaveBalanceDisplay />);

      vi.mocked(useAuthStore).mockReturnValue({
        id: 'user-2',
        email: 'other@example.com',
        name: 'Other User',
        role: 'employee',
      } as any);

      rerender(<LeaveBalanceDisplay />);

      await waitFor(() => {
        expect(leaveRequestsService.getUserBenefits).toHaveBeenCalled();
      });
    });
  });

  describe('styling and layout', () => {
    const mockBenefits = {
      year: 2025,
      benefits: [
        {
          type: 'vacation',
          name: 'Vacation',
          totalDays: 20,
          usedDays: 5,
          remainingDays: 15,
        },
      ],
    };

    it('should apply card styling', async () => {
      vi.mocked(leaveRequestsService.getUserBenefits).mockResolvedValue(mockBenefits);

      const { container } = render(<LeaveBalanceDisplay />);

      await waitFor(() => {
        const card = container.querySelector('.rounded-lg.shadow-md');
        expect(card).toBeInTheDocument();
      });
    });

    it('should use grid layout for summary', async () => {
      vi.mocked(leaveRequestsService.getUserBenefits).mockResolvedValue(mockBenefits);

      const { container } = render(<LeaveBalanceDisplay />);

      await waitFor(() => {
        const grid = container.querySelector('.grid.grid-cols-3');
        expect(grid).toBeInTheDocument();
      });
    });
  });
});
