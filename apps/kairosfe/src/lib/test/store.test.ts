import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore, useUIStore } from '../store';

describe('Auth Store', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, token: null, isAuthenticated: false });
  });

  it('should initialize with null user and token', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('should login user', () => {
    const mockUser = { id: '1', email: 'test@test.com', name: 'Test', role: 'employee' as const };
    const mockToken = 'test-token';

    useAuthStore.getState().login(mockUser, mockToken);

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.token).toBe(mockToken);
    expect(state.isAuthenticated).toBe(true);
  });

  it('should logout user', () => {
    const mockUser = { id: '1', email: 'test@test.com', name: 'Test', role: 'employee' as const };
    useAuthStore.getState().login(mockUser, 'token');
    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});

describe('UI Store', () => {
  it('should change theme', () => {
    useUIStore.getState().setTheme('dark');
    expect(useUIStore.getState().theme).toBe('dark');

    useUIStore.getState().setTheme('light');
    expect(useUIStore.getState().theme).toBe('light');
  });

  it('should change locale', () => {
    useUIStore.getState().setLocale('es');
    expect(useUIStore.getState().locale).toBe('es');
  });
});
