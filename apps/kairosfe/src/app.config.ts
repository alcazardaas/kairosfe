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
    path: '/team-calendar',
    labelKey: 'nav.teamCalendar',
    icon: 'calendar_view_month',
    roles: ['admin', 'manager'],
  },
  {
    path: '/team-reports',
    labelKey: 'nav.teamReports',
    icon: 'assessment',
    roles: ['admin', 'manager'],
  },
  {
    path: '/team-member-performance',
    labelKey: 'nav.teamMemberPerformance',
    icon: 'person_search',
    roles: ['admin', 'manager'],
  },
  {
    path: '/admin/users',
    labelKey: 'nav.users',
    icon: 'group',
    roles: ['admin'],
  },
  {
    path: '/admin/organization',
    labelKey: 'nav.organization',
    icon: 'business',
    roles: ['admin'],
  },
  {
    path: '/admin/timesheet-policy',
    labelKey: 'nav.timesheetPolicy',
    icon: 'policy',
    roles: ['admin'],
  },
  {
    path: '/admin/projects',
    labelKey: 'nav.projects',
    icon: 'folder',
    roles: ['admin'],
  },
  {
    path: '/admin/tasks',
    labelKey: 'nav.tasks',
    icon: 'task_alt',
    roles: ['admin'],
  },
  {
    path: '/admin/holidays',
    labelKey: 'nav.holidays',
    icon: 'event',
    roles: ['admin'],
  },
  {
    path: '/admin/benefit-types',
    labelKey: 'nav.benefitTypes',
    icon: 'card_travel',
    roles: ['admin'],
  },
  {
    path: '/settings',
    labelKey: 'nav.settings',
    icon: 'settings',
    roles: ['admin', 'manager', 'employee'],
  },
];
