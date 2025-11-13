/**
 * Comprehensive tests for TimesheetStatusBadge Component
 * Target: 95%+ coverage
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import TimesheetStatusBadge from './TimesheetStatusBadge';
import type { TimesheetStatus } from '../../lib/api/schemas';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'timesheet.status.draft': 'Draft',
        'timesheet.status.pending': 'Pending',
        'timesheet.status.approved': 'Approved',
        'timesheet.status.rejected': 'Rejected',
      };
      return translations[key] || key;
    },
  }),
}));

describe('TimesheetStatusBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear console.error spy
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('status rendering', () => {
    it('should render draft status with correct label', () => {
      render(<TimesheetStatusBadge status="draft" />);

      expect(screen.getByText('Draft')).toBeInTheDocument();
    });

    it('should render pending status with correct label', () => {
      render(<TimesheetStatusBadge status="pending" />);

      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('should render approved status with correct label', () => {
      render(<TimesheetStatusBadge status="approved" />);

      expect(screen.getByText('Approved')).toBeInTheDocument();
    });

    it('should render rejected status with correct label', () => {
      render(<TimesheetStatusBadge status="rejected" />);

      expect(screen.getByText('Rejected')).toBeInTheDocument();
    });
  });

  describe('styling classes', () => {
    it('should apply draft styling classes', () => {
      const { container } = render(<TimesheetStatusBadge status="draft" />);
      const badge = container.querySelector('span');

      expect(badge).toHaveClass('bg-gray-100', 'dark:bg-gray-800');
      expect(badge).toHaveClass('text-gray-700', 'dark:text-gray-300');
      expect(badge).toHaveClass('border-gray-300', 'dark:border-gray-600');
    });

    it('should apply pending styling classes', () => {
      const { container } = render(<TimesheetStatusBadge status="pending" />);
      const badge = container.querySelector('span');

      expect(badge).toHaveClass('bg-yellow-100', 'dark:bg-yellow-900/30');
      expect(badge).toHaveClass('text-yellow-700', 'dark:text-yellow-300');
      expect(badge).toHaveClass('border-yellow-300', 'dark:border-yellow-600');
    });

    it('should apply approved styling classes', () => {
      const { container } = render(<TimesheetStatusBadge status="approved" />);
      const badge = container.querySelector('span');

      expect(badge).toHaveClass('bg-green-100', 'dark:bg-green-900/30');
      expect(badge).toHaveClass('text-green-700', 'dark:text-green-300');
      expect(badge).toHaveClass('border-green-300', 'dark:border-green-600');
    });

    it('should apply rejected styling classes', () => {
      const { container } = render(<TimesheetStatusBadge status="rejected" />);
      const badge = container.querySelector('span');

      expect(badge).toHaveClass('bg-red-100', 'dark:bg-red-900/30');
      expect(badge).toHaveClass('text-red-700', 'dark:text-red-300');
      expect(badge).toHaveClass('border-red-300', 'dark:border-red-600');
    });

    it('should apply common badge styling to all statuses', () => {
      const { container } = render(<TimesheetStatusBadge status="draft" />);
      const badge = container.querySelector('span');

      expect(badge).toHaveClass('inline-flex');
      expect(badge).toHaveClass('items-center');
      expect(badge).toHaveClass('px-3');
      expect(badge).toHaveClass('py-1');
      expect(badge).toHaveClass('rounded-full');
      expect(badge).toHaveClass('text-sm');
      expect(badge).toHaveClass('font-medium');
      expect(badge).toHaveClass('border');
    });
  });

  describe('custom className prop', () => {
    it('should apply custom className when provided', () => {
      const { container } = render(
        <TimesheetStatusBadge status="draft" className="custom-class" />
      );
      const badge = container.querySelector('span');

      expect(badge).toHaveClass('custom-class');
    });

    it('should work without custom className', () => {
      const { container } = render(<TimesheetStatusBadge status="draft" />);
      const badge = container.querySelector('span');

      expect(badge).toBeInTheDocument();
    });

    it('should combine custom className with default classes', () => {
      const { container } = render(
        <TimesheetStatusBadge status="approved" className="ml-2" />
      );
      const badge = container.querySelector('span');

      expect(badge).toHaveClass('ml-2');
      expect(badge).toHaveClass('inline-flex');
      expect(badge).toHaveClass('bg-green-100');
    });
  });

  describe('error handling', () => {
    it('should render "Unknown" for invalid status', () => {
      render(<TimesheetStatusBadge status={'invalid' as TimesheetStatus} />);

      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });

    it('should log error for invalid status', () => {
      const consoleSpy = vi.spyOn(console, 'error');

      render(<TimesheetStatusBadge status={'invalid' as TimesheetStatus} />);

      expect(consoleSpy).toHaveBeenCalledWith(
        'TimesheetStatusBadge: Invalid or undefined status:',
        'invalid'
      );
    });

    it('should apply gray styling for unknown status', () => {
      const { container } = render(<TimesheetStatusBadge status={'unknown' as TimesheetStatus} />);
      const badge = container.querySelector('span');

      expect(badge).toHaveClass('bg-gray-100', 'dark:bg-gray-800');
      expect(badge).toHaveClass('text-gray-700', 'dark:text-gray-300');
      expect(badge).toHaveClass('border-gray-300', 'dark:border-gray-600');
    });

    it('should handle undefined status gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error');

      render(<TimesheetStatusBadge status={undefined as any} />);

      expect(screen.getByText('Unknown')).toBeInTheDocument();
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('should render as a span element', () => {
      const { container } = render(<TimesheetStatusBadge status="draft" />);
      const badge = container.querySelector('span');

      expect(badge?.tagName).toBe('SPAN');
    });

    it('should contain text content for screen readers', () => {
      render(<TimesheetStatusBadge status="approved" />);

      const badge = screen.getByText('Approved');
      expect(badge.textContent).toBe('Approved');
    });
  });

  describe('visual consistency', () => {
    it('should use consistent badge size across all statuses', () => {
      const statuses: TimesheetStatus[] = ['draft', 'pending', 'approved', 'rejected'];

      statuses.forEach((status) => {
        const { container } = render(<TimesheetStatusBadge status={status} />);
        const badge = container.querySelector('span');

        expect(badge).toHaveClass('px-3', 'py-1', 'text-sm');
      });
    });

    it('should use rounded-full shape for all statuses', () => {
      const statuses: TimesheetStatus[] = ['draft', 'pending', 'approved', 'rejected'];

      statuses.forEach((status) => {
        const { container } = render(<TimesheetStatusBadge status={status} />);
        const badge = container.querySelector('span');

        expect(badge).toHaveClass('rounded-full');
      });
    });

    it('should have border for all statuses', () => {
      const statuses: TimesheetStatus[] = ['draft', 'pending', 'approved', 'rejected'];

      statuses.forEach((status) => {
        const { container } = render(<TimesheetStatusBadge status={status} />);
        const badge = container.querySelector('span');

        expect(badge).toHaveClass('border');
      });
    });
  });

  describe('i18n integration', () => {
    it('should translate draft status label', () => {
      render(<TimesheetStatusBadge status="draft" />);

      // Translation returns 'Draft' from our mock
      expect(screen.getByText('Draft')).toBeInTheDocument();
    });

    it('should translate all status labels correctly', () => {
      const statusLabels: Record<TimesheetStatus, string> = {
        draft: 'Draft',
        pending: 'Pending',
        approved: 'Approved',
        rejected: 'Rejected',
      };

      Object.entries(statusLabels).forEach(([status, label]) => {
        const { unmount } = render(<TimesheetStatusBadge status={status as TimesheetStatus} />);
        expect(screen.getByText(label)).toBeInTheDocument();
        unmount();
      });
    });
  });
});
