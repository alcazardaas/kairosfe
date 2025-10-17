import type { MenuItem } from '@kairos/shared';

export const menuItems: MenuItem[] = [
  {
    path: '/dashboard',
    labelKey: 'nav.dashboard',
    icon: 'dashboard',
    roles: ['admin', 'manager', 'employee'],
  },
  {
    path: '/profile',
    labelKey: 'nav.profile',
    icon: 'person',
    roles: ['admin', 'manager', 'employee'],
  },
  {
    path: '/team-management',
    labelKey: 'nav.teamManagement',
    icon: 'group',
    roles: ['admin', 'manager'],
  },
  {
    path: '/leave-requests',
    labelKey: 'nav.leaveRequests',
    icon: 'calendar',
    roles: ['admin', 'manager', 'employee'],
  },
  {
    path: '/settings',
    labelKey: 'nav.settings',
    icon: 'settings',
    roles: ['admin', 'manager', 'employee'],
  },
];
