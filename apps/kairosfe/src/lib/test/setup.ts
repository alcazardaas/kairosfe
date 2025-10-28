import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables
vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:3000/api/v1');
vi.stubEnv('VITE_DEFAULT_LOCALE', 'en');
vi.stubEnv('VITE_SUPPORTED_LOCALES', 'en,es,pt-PT,de');
