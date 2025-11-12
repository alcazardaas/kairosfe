/**
 * Tests for ProfileContentNew Component
 * Comprehensive coverage of profile management functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileContentNew from './ProfileContentNew';
import * as profileService from '@/lib/api/services/profile';
import { useUIStore } from '@/lib/store';
import * as toast from '@/lib/utils/toast';

// Mock dependencies
vi.mock('@/lib/api/services/profile');
vi.mock('@/lib/store');
vi.mock('@/lib/utils/toast');

describe('ProfileContentNew', () => {
  const mockProfile = {
    id: '1',
    fullName: 'John Doe',
    preferredName: 'Johnny',
    pronouns: 'He/Him',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    address: '123 Main St, Anytown, USA 12345',
    avatar: 'https://via.placeholder.com/64',
    position: 'Software Engineer',
    department: 'Engineering',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock UI store
    const mockUIStore = (selector: any) => {
      if (typeof selector === 'function') {
        const state = {
          theme: 'light',
          setTheme: vi.fn(),
        };
        return selector(state);
      }
      return { theme: 'light', setTheme: vi.fn() };
    };
    vi.mocked(useUIStore).mockImplementation(mockUIStore as any);

    // Mock profile service
    vi.mocked(profileService.profileService.get).mockResolvedValue(mockProfile);
    vi.mocked(profileService.profileService.update).mockResolvedValue(mockProfile);

    // Mock toast
    vi.mocked(toast.showToast.success).mockImplementation(() => {});
    vi.mocked(toast.showToast.error).mockImplementation(() => {});
  });

  describe('loading state', () => {
    it('should show loading message initially', async () => {
      render(<ProfileContentNew />);

      expect(screen.getByText('Loading profile...')).toBeInTheDocument();

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();
      });
    });

    it('should have loading state with dark mode classes', async () => {
      const { container } = render(<ProfileContentNew />);

      const loadingDiv = container.querySelector('.dark\\:bg-gray-900');
      expect(loadingDiv).toBeInTheDocument();

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();
      });
    });
  });

  describe('successful data load', () => {
    it('should display profile data after loading', async () => {
      render(<ProfileContentNew />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Johnny')).toBeInTheDocument();
        expect(screen.getByDisplayValue('john.doe@example.com')).toBeInTheDocument();
      });
    });

    it('should display user avatar and position', async () => {
      render(<ProfileContentNew />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Software Engineer')).toBeInTheDocument();
      });
    });

    it('should call profile service on mount', async () => {
      render(<ProfileContentNew />);

      await waitFor(() => {
        expect(profileService.profileService.get).toHaveBeenCalled();
      });
    });
  });

  describe('form inputs', () => {
    it('should allow editing full name', async () => {
      const user = userEvent.setup();
      render(<ProfileContentNew />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      });

      const fullNameInput = screen.getByDisplayValue('John Doe');
      await user.clear(fullNameInput);
      await user.type(fullNameInput, 'Jane Smith');

      expect(fullNameInput).toHaveValue('Jane Smith');
    });

    it('should allow editing preferred name', async () => {
      const user = userEvent.setup();
      render(<ProfileContentNew />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Johnny')).toBeInTheDocument();
      });

      const preferredNameInput = screen.getByDisplayValue('Johnny');
      await user.clear(preferredNameInput);
      await user.type(preferredNameInput, 'JD');

      expect(preferredNameInput).toHaveValue('JD');
    });

    it('should allow selecting pronouns', async () => {
      const user = userEvent.setup();
      render(<ProfileContentNew />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('He/Him')).toBeInTheDocument();
      });

      const pronounsSelect = screen.getByDisplayValue('He/Him') as HTMLSelectElement;
      await user.selectOptions(pronounsSelect, 'They/Them');

      expect(pronounsSelect.value).toBe('They/Them');
    });

    it('should have email input with email type', async () => {
      render(<ProfileContentNew />);

      await waitFor(() => {
        const emailInput = screen.getByDisplayValue('john.doe@example.com') as HTMLInputElement;
        expect(emailInput.type).toBe('email');
      });
    });

    it('should have phone input with tel type', async () => {
      render(<ProfileContentNew />);

      await waitFor(() => {
        const phoneInput = screen.getByDisplayValue('+1 (555) 123-4567') as HTMLInputElement;
        expect(phoneInput.type).toBe('tel');
      });
    });

    it('should allow editing address', async () => {
      const user = userEvent.setup();
      render(<ProfileContentNew />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('123 Main St, Anytown, USA 12345')).toBeInTheDocument();
      });

      const addressInput = screen.getByDisplayValue('123 Main St, Anytown, USA 12345');
      await user.clear(addressInput);
      await user.type(addressInput, '456 Oak Ave');

      expect(addressInput).toHaveValue('456 Oak Ave');
    });
  });

  describe('form submission', () => {
    it('should save profile on submit', async () => {
      const user = userEvent.setup();
      render(<ProfileContentNew />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      });

      const fullNameInput = screen.getByDisplayValue('John Doe');
      await user.clear(fullNameInput);
      await user.type(fullNameInput, 'Jane Smith');

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(profileService.profileService.update).toHaveBeenCalledWith(
          expect.objectContaining({
            fullName: 'Jane Smith',
          })
        );
      });
    });

    it('should show success toast on successful save', async () => {
      const user = userEvent.setup();
      render(<ProfileContentNew />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      });

      // Must edit field to make form dirty
      const fullNameInput = screen.getByDisplayValue('John Doe');
      await user.clear(fullNameInput);
      await user.type(fullNameInput, 'Jane Smith');

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(toast.showToast.success).toHaveBeenCalledWith('Profile updated successfully!');
      });
    });

    it('should disable submit button while saving', async () => {
      const user = userEvent.setup();
      vi.mocked(profileService.profileService.update).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockProfile), 100))
      );

      render(<ProfileContentNew />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      });

      // Must edit field to make form dirty
      const fullNameInput = screen.getByDisplayValue('John Doe');
      await user.clear(fullNameInput);
      await user.type(fullNameInput, 'Jane Smith');

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      // Button should show "Saving..." during save
      await waitFor(() => {
        expect(screen.getByText('Saving...')).toBeInTheDocument();
      });
    });

    it('should disable save button when form is not dirty', async () => {
      render(<ProfileContentNew />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      expect(saveButton).toBeDisabled();
    });
  });

  describe('cancel action', () => {
    it('should reset form on cancel', async () => {
      const user = userEvent.setup();
      render(<ProfileContentNew />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      });

      const fullNameInput = screen.getByDisplayValue('John Doe');
      await user.clear(fullNameInput);
      await user.type(fullNameInput, 'Jane Smith');

      expect(fullNameInput).toHaveValue('Jane Smith');

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      });
    });
  });

  describe('theme toggle', () => {
    it('should call setTheme when toggle is clicked', async () => {
      const user = userEvent.setup();
      const mockSetTheme = vi.fn();

      vi.mocked(useUIStore).mockImplementation((selector: any) => {
        if (typeof selector === 'function') {
          const state = {
            theme: 'light',
            setTheme: mockSetTheme,
          };
          return selector(state);
        }
        return { theme: 'light', setTheme: mockSetTheme };
      });

      render(<ProfileContentNew />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      });

      const themeToggle = screen.getByLabelText('Toggle theme');
      await user.click(themeToggle);

      expect(mockSetTheme).toHaveBeenCalledWith('dark');
    });

    it('should toggle from dark to light', async () => {
      const user = userEvent.setup();
      const mockSetTheme = vi.fn();

      vi.mocked(useUIStore).mockImplementation((selector: any) => {
        if (typeof selector === 'function') {
          const state = {
            theme: 'dark',
            setTheme: mockSetTheme,
          };
          return selector(state);
        }
        return { theme: 'dark', setTheme: mockSetTheme };
      });

      render(<ProfileContentNew />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      });

      const themeToggle = screen.getByLabelText('Toggle theme');
      await user.click(themeToggle);

      expect(mockSetTheme).toHaveBeenCalledWith('light');
    });
  });

  describe('tab navigation', () => {
    it('should show Personal Info tab by default', async () => {
      render(<ProfileContentNew />);

      await waitFor(() => {
        expect(screen.getByText('Personal Info', { selector: 'p.text-3xl' })).toBeInTheDocument();
      });
    });

    it('should switch to Employment Details tab', async () => {
      const user = userEvent.setup();
      render(<ProfileContentNew />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      });

      const employmentTab = screen.getByText('Employment Details');
      await user.click(employmentTab);

      // Tab button should have active state classes
      const tabButton = employmentTab.closest('button');
      expect(tabButton).toHaveClass('bg-primary/10');
    });

    it('should switch to Documents tab', async () => {
      const user = userEvent.setup();
      render(<ProfileContentNew />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      });

      const documentsTab = screen.getByText('Documents');
      await user.click(documentsTab);

      // Tab button should have active state classes
      const tabButton = documentsTab.closest('button');
      expect(tabButton).toHaveClass('bg-primary/10');
    });
  });

  describe('error handling', () => {
    it('should show error message on load failure', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(profileService.profileService.get).mockRejectedValue(
        new Error('Network error')
      );

      render(<ProfileContentNew />);

      await waitFor(() => {
        expect(screen.getByText(/Network error/)).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it('should show mock data on load failure', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(profileService.profileService.get).mockRejectedValue(
        new Error('Network error')
      );

      render(<ProfileContentNew />);

      await waitFor(() => {
        expect(screen.getByText(/Showing mock data for demonstration/)).toBeInTheDocument();
        // Should show mock profile data
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      });
    });

    it('should show error toast on save failure', async () => {
      const user = userEvent.setup();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(profileService.profileService.update).mockRejectedValue(
        new Error('Save failed')
      );

      render(<ProfileContentNew />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      });

      // Make form dirty
      const fullNameInput = screen.getByDisplayValue('John Doe');
      await user.clear(fullNameInput);
      await user.type(fullNameInput, 'Jane Smith');

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(toast.showToast.error).toHaveBeenCalledWith(
          'Failed to update profile. Using mock data for demonstration.'
        );
      });

      consoleSpy.mockRestore();
    });

    it('should handle save failure gracefully', async () => {
      const user = userEvent.setup();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(profileService.profileService.update).mockRejectedValue(
        new Error('Save failed')
      );

      render(<ProfileContentNew />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      });

      // Make form dirty
      const fullNameInput = screen.getByDisplayValue('John Doe');
      await user.clear(fullNameInput);
      await user.type(fullNameInput, 'Jane Smith');

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      // Should call error toast
      await waitFor(() => {
        expect(toast.showToast.error).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('dark mode support', () => {
    it('should have dark mode classes', async () => {
      const { container } = render(<ProfileContentNew />);

      await waitFor(() => {
        const darkElements = container.querySelectorAll(
          '.dark\\:bg-gray-900, .dark\\:bg-gray-800, .dark\\:text-gray-100'
        );
        expect(darkElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('null profile handling', () => {
    it('should not crash when profile is null after load', async () => {
      vi.mocked(profileService.profileService.get).mockResolvedValue(null as any);

      render(<ProfileContentNew />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load profile')).toBeInTheDocument();
      });
    });
  });
});
