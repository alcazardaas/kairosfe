import { useEffect, useState } from 'react';
import { employeesService } from '@/lib/api/services/employees';
import { useAuthStore } from '@/lib/store';
import { canAddEmployee, canEditEmployee, canDeactivateEmployee } from '@/lib/utils/permissions';
import type { Employee, EmployeeStatus, UserRole } from '@kairos/shared';
import AddEmployeeModal from '@/components/forms/AddEmployeeModal';
import BulkImportModal from '@/components/forms/BulkImportModal';
import EditEmployeeModal from '@/components/forms/EditEmployeeModal';
import ConfirmDeleteDialog from '@/components/ui/ConfirmDeleteDialog';

export default function TeamManagementContentNew() {
  // Auth state
  const { role } = useAuthStore();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [roleFilter, setRoleFilter] = useState<UserRole | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus | undefined>('active');
  const [sortBy, setSortBy] = useState<string>('name:asc');

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [addMenuOpen, setAddMenuOpen] = useState(false);

  // Permission checks
  const userCanAddEmployee = canAddEmployee(role);
  const userCanEditEmployee = canEditEmployee(role);
  const userCanDeactivate = canDeactivateEmployee(role);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        loadEmployees();
      } else {
        setCurrentPage(1); // Reset to first page on search
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    loadEmployees();
  }, [currentPage, roleFilter, statusFilter, sortBy]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await employeesService.getAll({
        page: currentPage,
        limit: 10,
        search: searchTerm || undefined,
        role: roleFilter,
        status: statusFilter,
        sort: sortBy,
      });
      setEmployees(response.data);
      setTotalEmployees(response.meta.total);
      setTotalPages(response.meta.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load employees');
      // Fallback to mock data if API fails
      setEmployees(getMockEmployees());
      setTotalEmployees(5);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const getMockEmployees = (): Employee[] => [
    {
      id: '1',
      name: 'Olivia Rhye',
      email: 'olivia@kairos.com',
      locale: 'en',
      createdAt: '2025-01-15T10:00:00.000Z',
      lastLoginAt: '2025-10-24T14:30:00.000Z',
      membership: {
        role: 'employee',
        status: 'active',
        createdAt: '2025-01-15T10:00:00.000Z',
      },
      profile: {
        jobTitle: 'Software Engineer',
        startDate: '2025-01-15',
        managerUserId: null,
        location: 'New York, NY',
        phone: null,
      },
    },
    {
      id: '2',
      name: 'Phoenix Baker',
      email: 'phoenix@kairos.com',
      locale: 'en',
      createdAt: '2025-01-16T11:00:00.000Z',
      lastLoginAt: '2025-10-25T09:15:00.000Z',
      membership: {
        role: 'manager',
        status: 'active',
        createdAt: '2025-01-16T11:00:00.000Z',
      },
      profile: {
        jobTitle: 'Engineering Manager',
        startDate: '2024-06-01',
        managerUserId: null,
        location: 'San Francisco, CA',
        phone: null,
      },
    },
    {
      id: '3',
      name: 'Lana Steiner',
      email: 'lana@kairos.com',
      locale: 'en',
      createdAt: '2025-02-01T09:00:00.000Z',
      lastLoginAt: '2025-09-20T16:45:00.000Z',
      membership: {
        role: 'employee',
        status: 'active',
        createdAt: '2025-02-01T09:00:00.000Z',
      },
      profile: {
        jobTitle: 'UX Designer',
        startDate: '2025-02-01',
        managerUserId: null,
        location: 'Remote',
        phone: null,
      },
    },
    {
      id: '4',
      name: 'Demi Wilkinson',
      email: 'demi@kairos.com',
      locale: 'en',
      createdAt: '2025-03-10T08:30:00.000Z',
      lastLoginAt: '2025-10-26T11:20:00.000Z',
      membership: {
        role: 'employee',
        status: 'active',
        createdAt: '2025-03-10T08:30:00.000Z',
      },
      profile: {
        jobTitle: 'Frontend Developer',
        startDate: '2025-03-10',
        managerUserId: null,
        location: 'Austin, TX',
        phone: null,
      },
    },
    {
      id: '5',
      name: 'Candice Wu',
      email: 'candice@kairos.com',
      locale: 'en',
      createdAt: '2024-06-15T10:00:00.000Z',
      lastLoginAt: '2025-04-10T14:00:00.000Z',
      membership: {
        role: 'employee',
        status: 'disabled',
        createdAt: '2024-06-15T10:00:00.000Z',
      },
      profile: {
        jobTitle: 'Backend Developer',
        startDate: '2024-06-15',
        managerUserId: null,
        location: 'Seattle, WA',
        phone: null,
      },
    },
  ];

  const getStatusBadge = (status: EmployeeStatus) => {
    const statusClasses: Record<EmployeeStatus, string> = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      disabled: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      invited: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    };

    const statusLabels: Record<EmployeeStatus, string> = {
      active: 'Active',
      disabled: 'Disabled',
      invited: 'Invited',
    };

    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses[status]}`}>
        {statusLabels[status]}
      </span>
    );
  };

  const getRoleBadge = (role: UserRole) => {
    const roleClasses: Record<UserRole, string> = {
      admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      employee: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    };

    const roleLabels: Record<UserRole, string> = {
      admin: 'Admin',
      manager: 'Manager',
      employee: 'Employee',
    };

    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${roleClasses[role]}`}>
        {roleLabels[role]}
      </span>
    );
  };

  const formatLastLogin = (lastLoginAt: string | null) => {
    if (!lastLoginAt) return 'Never';
    const date = new Date(lastLoginAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 24) {
      if (diffHours < 1) return 'Just now';
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    }
    if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  // Modal handlers
  const handleEmployeeAdded = () => {
    loadEmployees(); // Refresh list and show toast from modal
  };

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowEditModal(true);
    setActionMenuOpen(null);
  };

  const handleEmployeeUpdated = () => {
    loadEmployees(); // Refresh list and show toast from modal
  };

  const handleDelete = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowDeleteDialog(true);
    setActionMenuOpen(null);
  };

  const handleEmployeeDeleted = () => {
    loadEmployees(); // Refresh list and show toast from modal
  };

  const toggleActionMenu = (employeeId: string) => {
    setActionMenuOpen(actionMenuOpen === employeeId ? null : employeeId);
  };

  return (
    <main className="px-4 sm:px-6 lg:px-8 flex flex-1 justify-center py-5 bg-gray-50 dark:bg-gray-900">
      <div className="layout-content-container flex flex-col w-full max-w-6xl flex-1">
        <div className="flex flex-wrap justify-between gap-4 items-center mb-6">
          <div className="flex flex-col gap-1">
            <p className="text-gray-900 dark:text-gray-100 text-3xl font-black leading-tight tracking-tight">Team</p>
            <p className="text-gray-600 dark:text-gray-400 text-base font-normal leading-normal">
              Manage your team members and their roles.
            </p>
          </div>
          {userCanAddEmployee && (
            <div className="hidden sm:block relative">
              <button
                onClick={() => setAddMenuOpen(!addMenuOpen)}
                className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-colors"
              >
                <span className="truncate">Add Employee</span>
                <span className="material-symbols-outlined text-lg">
                  {addMenuOpen ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              {/* Dropdown Menu */}
              {addMenuOpen && (
                <>
                  {/* Backdrop to close menu */}
                  <div className="fixed inset-0 z-10" onClick={() => setAddMenuOpen(false)} />

                  {/* Menu */}
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                    <button
                      onClick={() => {
                        setShowAddModal(true);
                        setAddMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 rounded-t-lg transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">person_add</span>
                      <div>
                        <div className="font-medium">Add Single Employee</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Add one employee at a time
                        </div>
                      </div>
                    </button>
                    <div className="border-t border-gray-200 dark:border-gray-700"></div>
                    <button
                      onClick={() => {
                        setShowBulkImportModal(true);
                        setAddMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 rounded-b-lg transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">upload_file</span>
                      <div>
                        <div className="font-medium">Bulk Import</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Import from CSV or Excel
                        </div>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-grow">
            <label className="flex flex-col min-w-40 h-12 w-full">
              <div className="flex w-full flex-1 items-stretch rounded-lg h-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600">
                <div className="text-gray-500 dark:text-gray-400 flex items-center justify-center pl-4">
                  <span className="material-symbols-outlined text-xl">search</span>
                </div>
                <input
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-r-lg text-gray-900 dark:text-gray-100 focus:outline-0 focus:ring-2 focus:ring-primary h-full placeholder:text-gray-500 dark:placeholder:text-gray-400 px-2 text-base font-normal leading-normal bg-transparent border-none"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </label>
          </div>
          <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2">
            {/* Role Filter */}
            <select
              className="flex h-12 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 pl-4 pr-8 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-900 dark:text-gray-100 text-sm font-medium"
              value={roleFilter || ''}
              onChange={(e) => setRoleFilter(e.target.value as UserRole | undefined || undefined)}
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="employee">Employee</option>
            </select>

            {/* Status Filter */}
            <select
              className="flex h-12 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 pl-4 pr-8 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-900 dark:text-gray-100 text-sm font-medium"
              value={statusFilter || ''}
              onChange={(e) => setStatusFilter(e.target.value as EmployeeStatus | undefined || undefined)}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="invited">Invited</option>
              <option value="disabled">Disabled</option>
            </select>

            {/* Sort Filter */}
            <select
              className="flex h-12 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 pl-4 pr-8 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-900 dark:text-gray-100 text-sm font-medium"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="name:asc">Name (A-Z)</option>
              <option value="name:desc">Name (Z-A)</option>
              <option value="email:asc">Email (A-Z)</option>
              <option value="email:desc">Email (Z-A)</option>
              <option value="role:asc">Role (A-Z)</option>
              <option value="role:desc">Role (Z-A)</option>
              <option value="created_at:asc">Oldest First</option>
              <option value="created_at:desc">Newest First</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500 dark:text-gray-400">Loading employees...</div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
            <p className="text-red-800 dark:text-red-200 text-sm">
              {error}
              <br />
              <span className="text-xs">Showing mock data for demonstration purposes.</span>
            </p>
          </div>
        )}

        {/* Table */}
        {!loading && (
          <>
            <div className="overflow-x-auto">
              <div className="flex overflow-hidden rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-900">
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                        Job Title
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                        Role
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                        Last Login
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-300 dark:divide-gray-600">
                    {employees.map((employee) => (
                      <tr key={employee.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-primary font-semibold text-sm">
                                {employee.name?.charAt(0).toUpperCase() || employee.email.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {employee.name || 'N/A'}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">{employee.email}</div>
                              <div className="text-sm text-gray-600 dark:text-gray-400 md:hidden">
                                {employee.profile?.jobTitle || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {employee.profile?.jobTitle || 'N/A'}
                          </div>
                          {employee.profile?.location && (
                            <div className="text-xs text-gray-500 dark:text-gray-500">{employee.profile.location}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                          {getRoleBadge(employee.membership.role)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(employee.membership.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 hidden lg:table-cell">
                          {formatLastLogin(employee.lastLoginAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                          {(userCanEditEmployee || userCanDeactivate) && (
                            <>
                              <button
                                onClick={() => toggleActionMenu(employee.id)}
                                className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary"
                              >
                                <span className="material-symbols-outlined">more_horiz</span>
                              </button>

                              {/* Actions Dropdown */}
                              {actionMenuOpen === employee.id && (
                                <>
                                  {/* Backdrop to close menu */}
                                  <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setActionMenuOpen(null)}
                                  />

                                  {/* Menu */}
                                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                                    {userCanEditEmployee && (
                                      <button
                                        onClick={() => handleEdit(employee)}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 rounded-t-lg"
                                      >
                                        <span className="material-symbols-outlined text-base">edit</span>
                                        Edit
                                      </button>
                                    )}

                                    {userCanDeactivate && employee.membership.status === 'active' && (
                                      <button
                                        onClick={() => handleDelete(employee)}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 rounded-b-lg"
                                      >
                                        <span className="material-symbols-outlined text-base">block</span>
                                        Deactivate
                                      </button>
                                    )}
                                  </div>
                                </>
                              )}
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing {employees.length > 0 ? (currentPage - 1) * 10 + 1 : 0} to{' '}
                {Math.min(currentPage * 10, totalEmployees)} of {totalEmployees} results
                {totalPages > 0 && ` (Page ${currentPage} of ${totalPages})`}
              </p>
              <div className="flex gap-2">
                <button
                  className="flex items-center justify-center h-9 w-9 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  <span className="material-symbols-outlined text-xl">chevron_left</span>
                </button>
                <button
                  className="flex items-center justify-center h-9 w-9 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  <span className="material-symbols-outlined text-xl">chevron_right</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* Modals */}
        <AddEmployeeModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleEmployeeAdded}
        />

        <BulkImportModal
          isOpen={showBulkImportModal}
          onClose={() => setShowBulkImportModal(false)}
          onSuccess={handleEmployeeAdded}
        />

        <EditEmployeeModal
          isOpen={showEditModal}
          employee={selectedEmployee}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEmployeeUpdated}
        />

        <ConfirmDeleteDialog
          isOpen={showDeleteDialog}
          employee={selectedEmployee}
          onClose={() => setShowDeleteDialog(false)}
          onSuccess={handleEmployeeDeleted}
        />
      </div>
    </main>
  );
}
