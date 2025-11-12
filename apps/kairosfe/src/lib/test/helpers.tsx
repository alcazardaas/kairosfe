/**
 * Test helper utilities for component testing
 */

import { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * All providers wrapper for testing
 * Add any global providers here (i18n, theme, etc.)
 */
interface AllTheProvidersProps {
  children: ReactNode;
}

function AllTheProviders({ children }: AllTheProvidersProps) {
  // TODO: Add i18n provider when needed
  // TODO: Add theme provider when needed
  return <>{children}</>;
}

/**
 * Custom render function that includes all providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

/**
 * Setup userEvent with default options
 */
export function setupUser() {
  return userEvent.setup();
}

/**
 * Wait for a condition to be true
 * Usage: await waitForCondition(() => someCondition === true)
 */
export async function waitForCondition(
  condition: () => boolean,
  timeout = 3000
): Promise<void> {
  const startTime = Date.now();

  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

/**
 * Mock localStorage for tests
 */
export function mockLocalStorage() {
  const storage: Record<string, string> = {};

  return {
    getItem: (key: string) => storage[key] || null,
    setItem: (key: string, value: string) => {
      storage[key] = value;
    },
    removeItem: (key: string) => {
      delete storage[key];
    },
    clear: () => {
      Object.keys(storage).forEach((key) => delete storage[key]);
    },
  };
}

/**
 * Mock sessionStorage for tests
 */
export function mockSessionStorage() {
  return mockLocalStorage();
}

// Re-export everything from @testing-library/react
export * from '@testing-library/react';
export { userEvent };
