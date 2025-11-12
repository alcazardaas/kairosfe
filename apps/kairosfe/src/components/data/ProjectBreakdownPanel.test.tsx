/**
 * Comprehensive tests for ProjectBreakdownPanel Component
 * Target: 95%+ coverage
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProjectBreakdownPanel from './ProjectBreakdownPanel';
import type { ProjectBreakdownDto } from '../../lib/api/schemas';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      const translations: Record<string, string> = {
        'timesheet.breakdown.title': 'Project Breakdown',
        'timesheet.breakdown.subtitle': 'Hours logged per project this week',
        'timesheet.breakdown.empty': 'No projects logged this week',
        'timesheet.breakdown.total': 'Total',
        'timesheet.breakdown.projectCount': `${options?.count || 0} project(s)`,
      };
      return translations[key] || key;
    },
  }),
}));

describe('ProjectBreakdownPanel', () => {
  const mockBreakdown: ProjectBreakdownDto[] = [
    {
      projectId: '123e4567-e89b-12d3-a456-426614174000',
      projectName: 'Project Alpha',
      projectCode: 'ALPHA',
      totalHours: 20,
    },
    {
      projectId: '123e4567-e89b-12d3-a456-426614174001',
      projectName: 'Project Beta',
      projectCode: 'BETA',
      totalHours: 15,
    },
    {
      projectId: '123e4567-e89b-12d3-a456-426614174002',
      projectName: 'Project Gamma',
      projectCode: 'GAMMA',
      totalHours: 5,
    },
  ];

  describe('rendering and layout', () => {
    it('should render title and subtitle', () => {
      render(<ProjectBreakdownPanel breakdown={mockBreakdown} totalHours={40} />);

      expect(screen.getByText('Project Breakdown')).toBeInTheDocument();
      expect(screen.getByText('Hours logged per project this week')).toBeInTheDocument();
    });

    it('should apply custom className when provided', () => {
      const { container } = render(
        <ProjectBreakdownPanel
          breakdown={mockBreakdown}
          totalHours={40}
          className="custom-class"
        />
      );

      const panel = container.querySelector('.custom-class');
      expect(panel).toBeInTheDocument();
    });

    it('should work without custom className', () => {
      const { container } = render(
        <ProjectBreakdownPanel breakdown={mockBreakdown} totalHours={40} />
      );

      const panel = container.querySelector('.bg-white.dark\\:bg-gray-800');
      expect(panel).toBeInTheDocument();
    });

    it('should use rounded-lg border styling', () => {
      const { container } = render(
        <ProjectBreakdownPanel breakdown={mockBreakdown} totalHours={40} />
      );

      const panel = container.querySelector('.rounded-lg.border');
      expect(panel).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('should show empty message when breakdown is empty array', () => {
      render(<ProjectBreakdownPanel breakdown={[]} totalHours={0} />);

      expect(screen.getByText('No projects logged this week')).toBeInTheDocument();
    });

    it('should not show total summary when empty', () => {
      render(<ProjectBreakdownPanel breakdown={[]} totalHours={0} />);

      expect(screen.queryByText('Total')).not.toBeInTheDocument();
    });

    it('should handle null breakdown gracefully', () => {
      render(<ProjectBreakdownPanel breakdown={null as any} totalHours={0} />);

      expect(screen.getByText('No projects logged this week')).toBeInTheDocument();
    });

    it('should handle undefined breakdown gracefully', () => {
      render(<ProjectBreakdownPanel breakdown={undefined as any} totalHours={0} />);

      expect(screen.getByText('No projects logged this week')).toBeInTheDocument();
    });
  });

  describe('project list rendering', () => {
    it('should render all projects', () => {
      render(<ProjectBreakdownPanel breakdown={mockBreakdown} totalHours={40} />);

      expect(screen.getByText('Project Alpha')).toBeInTheDocument();
      expect(screen.getByText('Project Beta')).toBeInTheDocument();
      expect(screen.getByText('Project Gamma')).toBeInTheDocument();
    });

    it('should display hours with one decimal place', () => {
      render(<ProjectBreakdownPanel breakdown={mockBreakdown} totalHours={40} />);

      expect(screen.getByText('20.0h')).toBeInTheDocument();
      expect(screen.getByText('15.0h')).toBeInTheDocument();
      expect(screen.getByText('5.0h')).toBeInTheDocument();
    });

    it('should sort projects by hours descending', () => {
      const unsortedBreakdown: ProjectBreakdownDto[] = [
        {
          projectId: '123e4567-e89b-12d3-a456-426614174001',
          projectName: 'Project Beta',
          projectCode: 'BETA',
          totalHours: 15,
        },
        {
          projectId: '123e4567-e89b-12d3-a456-426614174000',
          projectName: 'Project Alpha',
          projectCode: 'ALPHA',
          totalHours: 20,
        },
        {
          projectId: '123e4567-e89b-12d3-a456-426614174002',
          projectName: 'Project Gamma',
          projectCode: 'GAMMA',
          totalHours: 5,
        },
      ];

      const { container } = render(
        <ProjectBreakdownPanel breakdown={unsortedBreakdown} totalHours={40} />
      );

      const projectNames = Array.from(
        container.querySelectorAll('.text-sm.font-medium')
      ).map((el) => el.textContent);

      expect(projectNames[0]).toBe('Project Alpha'); // 20h
      expect(projectNames[1]).toBe('Project Beta');  // 15h
      expect(projectNames[2]).toBe('Project Gamma'); // 5h
    });

    it('should truncate long project names', () => {
      const longNameBreakdown: ProjectBreakdownDto[] = [
        {
          projectId: '123e4567-e89b-12d3-a456-426614174000',
          projectName: 'Very Long Project Name That Should Be Truncated Because It Exceeds Maximum Width',
          projectCode: 'LONG',
          totalHours: 10,
        },
      ];

      const { container } = render(
        <ProjectBreakdownPanel breakdown={longNameBreakdown} totalHours={10} />
      );

      const projectName = container.querySelector('.truncate.max-w-\\[200px\\]');
      expect(projectName).toBeInTheDocument();
    });
  });

  describe('percentage calculation', () => {
    it('should calculate correct percentages', () => {
      render(<ProjectBreakdownPanel breakdown={mockBreakdown} totalHours={40} />);

      // 20/40 = 50%
      expect(screen.getByText('50%')).toBeInTheDocument();
      // 15/40 = 37.5% -> 38%
      expect(screen.getByText('38%')).toBeInTheDocument();
      // 5/40 = 12.5% -> 13%
      expect(screen.getByText('13%')).toBeInTheDocument();
    });

    it('should handle zero total hours gracefully', () => {
      render(<ProjectBreakdownPanel breakdown={mockBreakdown} totalHours={0} />);

      // All percentages should be 0
      const percentages = screen.getAllByText('0%');
      expect(percentages.length).toBe(mockBreakdown.length);
    });

    it('should display percentage with no decimal places', () => {
      const breakdown: ProjectBreakdownDto[] = [
        {
          projectId: '123e4567-e89b-12d3-a456-426614174000',
          projectName: 'Project Test',
          projectCode: 'TEST',
          totalHours: 33.33,
        },
      ];

      render(<ProjectBreakdownPanel breakdown={breakdown} totalHours={100} />);

      // 33.33/100 = 33.33% -> should be rounded to 33%
      expect(screen.getByText('33%')).toBeInTheDocument();
    });

    it('should handle 100% correctly', () => {
      const breakdown: ProjectBreakdownDto[] = [
        {
          projectId: '123e4567-e89b-12d3-a456-426614174000',
          projectName: 'Only Project',
          projectCode: 'ONLY',
          totalHours: 40,
        },
      ];

      render(<ProjectBreakdownPanel breakdown={breakdown} totalHours={40} />);

      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  describe('progress bars', () => {
    it('should render progress bar for each project', () => {
      const { container } = render(
        <ProjectBreakdownPanel breakdown={mockBreakdown} totalHours={40} />
      );

      const progressBars = container.querySelectorAll('.bg-blue-500.dark\\:bg-blue-400');
      expect(progressBars.length).toBe(mockBreakdown.length);
    });

    it('should set correct width for progress bars', () => {
      const { container } = render(
        <ProjectBreakdownPanel breakdown={mockBreakdown} totalHours={40} />
      );

      const progressBars = container.querySelectorAll('.bg-blue-500.dark\\:bg-blue-400');

      // First project: 20/40 = 50%
      expect(progressBars[0]).toHaveStyle({ width: '50%' });
      // Second project: 15/40 = 37.5%
      expect(progressBars[1]).toHaveStyle({ width: '37.5%' });
      // Third project: 5/40 = 12.5%
      expect(progressBars[2]).toHaveStyle({ width: '12.5%' });
    });

    it('should use transition animation for progress bars', () => {
      const { container } = render(
        <ProjectBreakdownPanel breakdown={mockBreakdown} totalHours={40} />
      );

      const progressBars = container.querySelectorAll('.transition-all.duration-300');
      expect(progressBars.length).toBe(mockBreakdown.length);
    });

    it('should use correct background for progress bar container', () => {
      const { container } = render(
        <ProjectBreakdownPanel breakdown={mockBreakdown} totalHours={40} />
      );

      const progressContainers = container.querySelectorAll('.bg-gray-200.dark\\:bg-gray-700.rounded-full');
      expect(progressContainers.length).toBe(mockBreakdown.length);
    });
  });

  describe('total summary', () => {
    it('should display total hours with one decimal place', () => {
      render(<ProjectBreakdownPanel breakdown={mockBreakdown} totalHours={40} />);

      expect(screen.getByText('40.0h')).toBeInTheDocument();
    });

    it('should display total label', () => {
      render(<ProjectBreakdownPanel breakdown={mockBreakdown} totalHours={40} />);

      expect(screen.getByText('Total')).toBeInTheDocument();
    });

    it('should display correct project count', () => {
      render(<ProjectBreakdownPanel breakdown={mockBreakdown} totalHours={40} />);

      expect(screen.getByText('3 project(s)')).toBeInTheDocument();
    });

    it('should display project count for single project', () => {
      const singleProject: ProjectBreakdownDto[] = [
        {
          projectId: '123e4567-e89b-12d3-a456-426614174000',
          projectName: 'Only Project',
          projectCode: 'ONLY',
          totalHours: 10,
        },
      ];

      render(<ProjectBreakdownPanel breakdown={singleProject} totalHours={10} />);

      expect(screen.getByText('1 project(s)')).toBeInTheDocument();
    });

    it('should handle fractional total hours', () => {
      render(<ProjectBreakdownPanel breakdown={mockBreakdown} totalHours={37.5} />);

      expect(screen.getByText('37.5h')).toBeInTheDocument();
    });

    it('should show summary section with border-top', () => {
      const { container } = render(
        <ProjectBreakdownPanel breakdown={mockBreakdown} totalHours={40} />
      );

      const summary = container.querySelector('.border-t.border-gray-200.dark\\:border-gray-700');
      expect(summary).toBeInTheDocument();
    });
  });

  describe('dark mode support', () => {
    it('should include dark mode classes for main container', () => {
      const { container } = render(
        <ProjectBreakdownPanel breakdown={mockBreakdown} totalHours={40} />
      );

      const panel = container.querySelector('.dark\\:bg-gray-800');
      expect(panel).toBeInTheDocument();
    });

    it('should include dark mode classes for text', () => {
      const { container } = render(
        <ProjectBreakdownPanel breakdown={mockBreakdown} totalHours={40} />
      );

      const darkText = container.querySelector('.dark\\:text-gray-100');
      expect(darkText).toBeInTheDocument();
    });

    it('should include dark mode classes for progress bars', () => {
      const { container } = render(
        <ProjectBreakdownPanel breakdown={mockBreakdown} totalHours={40} />
      );

      const progressBar = container.querySelector('.dark\\:bg-blue-400');
      expect(progressBar).toBeInTheDocument();
    });

    it('should include dark mode classes for borders', () => {
      const { container } = render(
        <ProjectBreakdownPanel breakdown={mockBreakdown} totalHours={40} />
      );

      const border = container.querySelector('.dark\\:border-gray-700');
      expect(border).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle projects with zero hours', () => {
      const zeroHoursBreakdown: ProjectBreakdownDto[] = [
        {
          projectId: '123e4567-e89b-12d3-a456-426614174000',
          projectName: 'Zero Hours Project',
          projectCode: 'ZERO',
          totalHours: 0,
        },
      ];

      render(<ProjectBreakdownPanel breakdown={zeroHoursBreakdown} totalHours={0} />);

      // "0.0h" appears twice (project row + total summary)
      const zeroHours = screen.getAllByText('0.0h');
      expect(zeroHours.length).toBe(2);
    });

    it('should handle very large hours', () => {
      const largeHoursBreakdown: ProjectBreakdownDto[] = [
        {
          projectId: '123e4567-e89b-12d3-a456-426614174000',
          projectName: 'Big Project',
          projectCode: 'BIG',
          totalHours: 999.9,
        },
      ];

      render(<ProjectBreakdownPanel breakdown={largeHoursBreakdown} totalHours={999.9} />);

      // "999.9h" appears twice (project row + total summary)
      const largeHours = screen.getAllByText('999.9h');
      expect(largeHours.length).toBe(2);
    });

    it('should handle fractional hours correctly', () => {
      const fractionalBreakdown: ProjectBreakdownDto[] = [
        {
          projectId: '123e4567-e89b-12d3-a456-426614174000',
          projectName: 'Fractional Project',
          projectCode: 'FRAC',
          totalHours: 12.75,
        },
      ];

      render(<ProjectBreakdownPanel breakdown={fractionalBreakdown} totalHours={50} />);

      expect(screen.getByText('12.8h')).toBeInTheDocument(); // 12.75 rounded to 1 decimal
      expect(screen.getByText('26%')).toBeInTheDocument(); // 12.75/50 = 25.5% -> 26%
    });

    it('should handle multiple projects with same hours', () => {
      const sameHoursBreakdown: ProjectBreakdownDto[] = [
        {
          projectId: '123e4567-e89b-12d3-a456-426614174000',
          projectName: 'Project A',
          projectCode: 'A',
          totalHours: 10,
        },
        {
          projectId: '123e4567-e89b-12d3-a456-426614174001',
          projectName: 'Project B',
          projectCode: 'B',
          totalHours: 10,
        },
      ];

      render(<ProjectBreakdownPanel breakdown={sameHoursBreakdown} totalHours={20} />);

      const fiftyPercent = screen.getAllByText('50%');
      expect(fiftyPercent.length).toBe(2);
    });
  });

  describe('i18n integration', () => {
    it('should translate title', () => {
      render(<ProjectBreakdownPanel breakdown={mockBreakdown} totalHours={40} />);

      expect(screen.getByText('Project Breakdown')).toBeInTheDocument();
    });

    it('should translate subtitle', () => {
      render(<ProjectBreakdownPanel breakdown={mockBreakdown} totalHours={40} />);

      expect(screen.getByText('Hours logged per project this week')).toBeInTheDocument();
    });

    it('should translate empty state message', () => {
      render(<ProjectBreakdownPanel breakdown={[]} totalHours={0} />);

      expect(screen.getByText('No projects logged this week')).toBeInTheDocument();
    });

    it('should translate total label', () => {
      render(<ProjectBreakdownPanel breakdown={mockBreakdown} totalHours={40} />);

      expect(screen.getByText('Total')).toBeInTheDocument();
    });

    it('should translate project count with parameter', () => {
      render(<ProjectBreakdownPanel breakdown={mockBreakdown} totalHours={40} />);

      expect(screen.getByText('3 project(s)')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should render semantic HTML structure', () => {
      const { container } = render(
        <ProjectBreakdownPanel breakdown={mockBreakdown} totalHours={40} />
      );

      const heading = container.querySelector('h3');
      expect(heading).toBeInTheDocument();
      expect(heading?.textContent).toBe('Project Breakdown');
    });

    it('should have readable text content', () => {
      render(<ProjectBreakdownPanel breakdown={mockBreakdown} totalHours={40} />);

      expect(screen.getByText('Project Alpha')).toBeInTheDocument();
      expect(screen.getByText('20.0h')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
    });
  });
});
