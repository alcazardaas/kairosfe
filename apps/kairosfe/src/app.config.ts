import type { MenuItem } from '@kairos/shared';

export const menuItems: MenuItem[] = [
  {
    path: '/dashboard',
    labelKey: 'nav.dashboard',
    icon: 'dashboard',
    roles: ['admin', 'manager', 'employee'],
  },
  {
    path: '/timesheet',
    labelKey: 'nav.timesheet',
    icon: 'schedule',
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
    path: '/team-timesheets',
    labelKey: 'nav.teamTimesheets',
    icon: 'fact_check',
    roles: ['admin', 'manager'],
  },
  {
    path: '/leave-requests',
    labelKey: 'nav.leaveRequests',
    icon: 'calendar_month',
    roles: ['admin', 'manager', 'employee'],
  },
  {
    path: '/team-leave',
    labelKey: 'nav.teamLeave',
    icon: 'approval',
    roles: ['admin', 'manager'],
  },
  {
    path: '/settings',
    labelKey: 'nav.settings',
    icon: 'settings',
    roles: ['admin', 'manager', 'employee'],
  },
];
