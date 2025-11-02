import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore, useUIStore } from '@/lib/store';
import { apiClient } from '@/lib/api/client';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';

export default function Header() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isSidebarOpen, toggleSidebar } = useUIStore();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  const handleLogout = async () => {
    try {
      await apiClient.logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
      // Force logout even if API call fails
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
  };

  const getUserInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 lg:px-8 py-3 bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
      <div className="flex items-center gap-4">
        {/* Mobile menu button - shows on mobile and tablet */}
        <button
          onClick={toggleSidebar}
          className="lg:hidden flex items-center justify-center rounded-full h-10 w-10 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label={isSidebarOpen ? t('common.closeSidebar') : t('common.openSidebar')}
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        {/* Logo */}
        <a href="/dashboard" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
          <span className="material-symbols-outlined text-2xl">timelapse</span>
          <h2 className="text-xl font-bold tracking-tight">Kairos</h2>
        </a>
      </div>

      <div className="flex flex-1 justify-end items-center gap-4">
        <label className="hidden sm:flex flex-col min-w-40 !h-10 max-w-64">
          <div className="flex w-full flex-1 items-stretch rounded-lg h-full">
            <div className="text-gray-500 dark:text-gray-400 flex bg-gray-50 dark:bg-gray-900 items-center justify-center pl-3 rounded-l-lg">
              <span className="material-symbols-outlined">search</span>
            </div>
            <input
              className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-r-lg text-gray-900 dark:text-gray-100 focus:outline-0 focus:ring-2 focus:ring-primary/50 border-none bg-gray-50 dark:bg-gray-900 h-full placeholder:text-gray-500 dark:placeholder:text-gray-400 px-4 text-sm font-normal leading-normal"
              placeholder="Search"
            />
          </div>
        </label>

        <button className="flex items-center justify-center rounded-full h-10 w-10 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
          <span className="material-symbols-outlined">notifications</span>
        </button>

        {/* User Menu Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center justify-center rounded-full h-10 w-10 bg-primary text-white font-medium hover:bg-primary-dark transition-colors"
            aria-label="User menu"
          >
            {getUserInitials(user?.name)}
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
              {user && (
                <>
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">logout</span>
                    {t('auth.logout')}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
