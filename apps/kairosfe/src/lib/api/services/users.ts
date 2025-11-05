/**
 * Users Service
 * Re-exports employeesService for naming consistency with users schemas and endpoints
 */

import { employeesService } from './employees';

/**
 * usersService provides access to user/employee operations
 * This is a re-export of employeesService to maintain naming consistency
 * across the API layer (users schemas, users endpoints, users service)
 */
export const usersService = employeesService;
