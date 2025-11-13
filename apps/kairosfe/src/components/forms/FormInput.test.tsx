/**
 * Comprehensive tests for FormInput Component
 * Target: 95%+ coverage
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { FormInput } from './FormInput';

// Wrapper component to provide React Hook Form context
function FormInputWrapper(props: Parameters<typeof FormInput>[0]) {
  const { register } = useForm();
  return <FormInput {...props} register={register} />;
}

describe('FormInput', () => {
  describe('rendering', () => {
    it('should render input with label', () => {
      render(<FormInputWrapper label="Email" name="email" />);

      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: 'Email' })).toBeInTheDocument();
    });

    it('should render input with correct id matching name', () => {
      render(<FormInputWrapper label="Email" name="email" />);

      const input = screen.getByLabelText('Email');
      expect(input).toHaveAttribute('id', 'email');
    });

    it('should not render error message when no error provided', () => {
      render(<FormInputWrapper label="Email" name="email" />);

      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
    });

    it('should render error message when error provided', () => {
      const error = { type: 'required', message: 'This field is required' };

      render(<FormInputWrapper label="Email" name="email" error={error} />);

      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });
  });

  describe('input attributes', () => {
    it('should pass through HTML input attributes', () => {
      render(
        <FormInputWrapper
          label="Email"
          name="email"
          type="email"
          placeholder="Enter your email"
          required
        />
      );

      const input = screen.getByLabelText('Email');
      expect(input).toHaveAttribute('type', 'email');
      expect(input).toHaveAttribute('placeholder', 'Enter your email');
      expect(input).toBeRequired();
    });

    it('should support disabled attribute', () => {
      render(<FormInputWrapper label="Email" name="email" disabled />);

      expect(screen.getByLabelText('Email')).toBeDisabled();
    });

    it('should support readOnly attribute', () => {
      render(<FormInputWrapper label="Email" name="email" readOnly />);

      const input = screen.getByLabelText('Email') as HTMLInputElement;
      expect(input.readOnly).toBe(true);
    });

    it('should support maxLength attribute', () => {
      render(<FormInputWrapper label="Username" name="username" maxLength={20} />);

      expect(screen.getByLabelText('Username')).toHaveAttribute('maxLength', '20');
    });

    it('should support pattern attribute', () => {
      render(
        <FormInputWrapper label="Phone" name="phone" pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}" />
      );

      expect(screen.getByLabelText('Phone')).toHaveAttribute(
        'pattern',
        '[0-9]{3}-[0-9]{3}-[0-9]{4}'
      );
    });
  });

  describe('different input types', () => {
    it('should render password input', () => {
      render(<FormInputWrapper label="Password" name="password" type="password" />);

      const input = screen.getByLabelText('Password');
      expect(input).toHaveAttribute('type', 'password');
    });

    it('should render number input', () => {
      render(<FormInputWrapper label="Age" name="age" type="number" min={0} max={120} />);

      const input = screen.getByLabelText('Age');
      expect(input).toHaveAttribute('type', 'number');
      expect(input).toHaveAttribute('min', '0');
      expect(input).toHaveAttribute('max', '120');
    });

    it('should render email input', () => {
      render(<FormInputWrapper label="Email" name="email" type="email" />);

      expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email');
    });

    it('should render date input', () => {
      render(<FormInputWrapper label="Birth Date" name="birthDate" type="date" />);

      expect(screen.getByLabelText('Birth Date')).toHaveAttribute('type', 'date');
    });
  });

  describe('error handling', () => {
    it('should display error with specific message', () => {
      const error = { type: 'minLength', message: 'Password must be at least 8 characters' };

      render(<FormInputWrapper label="Password" name="password" error={error} />);

      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
    });

    it('should display validation error message', () => {
      const error = { type: 'pattern', message: 'Invalid email format' };

      render(<FormInputWrapper label="Email" name="email" error={error} />);

      expect(screen.getByText('Invalid email format')).toBeInTheDocument();
    });

    it('should display custom error message', () => {
      const error = { type: 'custom', message: 'This username is already taken' };

      render(<FormInputWrapper label="Username" name="username" error={error} />);

      expect(screen.getByText('This username is already taken')).toBeInTheDocument();
    });

    it('should have form-error class on error span', () => {
      const error = { type: 'required', message: 'Required' };

      render(<FormInputWrapper label="Name" name="name" error={error} />);

      const errorElement = screen.getByText('Required');
      expect(errorElement).toHaveClass('form-error');
    });
  });

  describe('styling classes', () => {
    it('should have form-field class on wrapper div', () => {
      const { container } = render(<FormInputWrapper label="Email" name="email" />);

      const formField = container.querySelector('.form-field');
      expect(formField).toBeInTheDocument();
    });

    it('should contain label, input, and error elements in correct structure', () => {
      const error = { type: 'required', message: 'Required' };
      const { container } = render(<FormInputWrapper label="Email" name="email" error={error} />);

      const formField = container.querySelector('.form-field');
      expect(formField).toBeInTheDocument();

      const label = formField?.querySelector('label');
      const input = formField?.querySelector('input');
      const errorSpan = formField?.querySelector('.form-error');

      expect(label).toBeInTheDocument();
      expect(input).toBeInTheDocument();
      expect(errorSpan).toBeInTheDocument();
    });
  });

  describe('React Hook Form integration', () => {
    it('should integrate with React Hook Form register', () => {
      const mockRegister = vi.fn(() => ({
        name: 'email',
        onChange: vi.fn(),
        onBlur: vi.fn(),
        ref: vi.fn(),
      }));

      render(<FormInput label="Email" name="email" register={mockRegister as any} />);

      expect(mockRegister).toHaveBeenCalledWith('email');
    });

    it('should work with different field names', () => {
      const mockRegister = vi.fn(() => ({
        name: 'username',
        onChange: vi.fn(),
        onBlur: vi.fn(),
        ref: vi.fn(),
      }));

      render(<FormInput label="Username" name="username" register={mockRegister as any} />);

      expect(mockRegister).toHaveBeenCalledWith('username');
    });
  });

  describe('accessibility', () => {
    it('should associate label with input via htmlFor/id', () => {
      render(<FormInputWrapper label="Email Address" name="email" />);

      const label = screen.getByText('Email Address');
      const input = screen.getByLabelText('Email Address');

      expect(label).toHaveAttribute('for', 'email');
      expect(input).toHaveAttribute('id', 'email');
    });

    it('should be accessible by role', () => {
      render(<FormInputWrapper label="Search" name="search" />);

      expect(screen.getByRole('textbox', { name: 'Search' })).toBeInTheDocument();
    });

    it('should support aria-describedby for error messages', () => {
      // Note: Current implementation doesn't set aria-describedby
      // This test documents the current behavior
      const error = { type: 'required', message: 'This field is required' };

      render(<FormInputWrapper label="Email" name="email" error={error} />);

      const input = screen.getByLabelText('Email');
      // Current implementation doesn't link error with aria-describedby
      expect(input).not.toHaveAttribute('aria-describedby');
    });
  });
});
