import React, { useEffect, useState } from 'react';
import { employeesService, type Employee } from '@/lib/api/services/employees';

export default function TeamManagementContentNew() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalEmployees, setTotalEmployees] = useState(0);

  useEffect(() => {
    loadEmployees();
  }, [currentPage, searchTerm]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await employeesService.getAll({
        page: currentPage,
        limit: 10,
        search: searchTerm || undefined,
      });
      setEmployees(response.employees);
      setTotalEmployees(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load employees');
      // Fallback to mock data if API fails
      setEmployees(getMockEmployees());
      setTotalEmployees(5);
    } finally {
      setLoading(false);
    }
  };

  const getMockEmployees = (): Employee[] => [
    {
      id: '1',
      name: 'Olivia Rhye',
      email: 'olivia@kairos.com',
      position: 'Software Engineer',
      department: 'Engineering',
      status: 'active',
      lastLogin: '2 days ago',
      avatar: 'https://via.placeholder.com/40',
    },
    {
      id: '2',
      name: 'Phoenix Baker',
      email: 'phoenix@kairos.com',
      position: 'Product Manager',
      department: 'Product',
      status: 'active',
      lastLogin: '1 day ago',
      avatar: 'https://via.placeholder.com/40',
    },
    {
      id: '3',
      name: 'Lana Steiner',
      email: 'lana@kairos.com',
      position: 'UX Designer',
      department: 'Design',
      status: 'on_leave',
      lastLogin: '1 month ago',
      avatar: 'https://via.placeholder.com/40',
    },
    {
      id: '4',
      name: 'Demi Wilkinson',
      email: 'demi@kairos.com',
      position: 'Frontend Developer',
      department: 'Engineering',
      status: 'active',
      lastLogin: '3 hours ago',
      avatar: 'https://via.placeholder.com/40',
    },
    {
      id: '5',
      name: 'Candice Wu',
      email: 'candice@kairos.com',
      position: 'Backend Developer',
      department: 'Engineering',
      status: 'inactive',
      lastLogin: '6 months ago',
      avatar: 'https://via.placeholder.com/40',
    },
  ];

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      on_leave: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    };

    const statusLabels = {
      active: 'Active',
      inactive: 'Inactive',
      on_leave: 'On Leave',
    };

    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses[status as keyof typeof statusClasses]}`}>
        {statusLabels[status as keyof typeof statusLabels]}
      </span>
    );
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
          <button className="hidden sm:flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-colors">
            <span className="truncate">Add New Employee</span>
          </button>
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
                  placeholder="Search by name, position..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </label>
          </div>
          <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2">
            <button className="flex h-12 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 pl-4 pr-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <p className="text-gray-900 dark:text-gray-100 text-sm font-medium leading-normal">Department</p>
              <span className="material-symbols-outlined text-gray-600 dark:text-gray-400 text-xl">expand_more</span>
            </button>
            <button className="flex h-12 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 pl-4 pr-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <p className="text-gray-900 dark:text-gray-100 text-sm font-medium leading-normal">Location</p>
              <span className="material-symbols-outlined text-gray-600 dark:text-gray-400 text-xl">expand_more</span>
            </button>
            <button className="flex h-12 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 pl-4 pr-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <p className="text-gray-900 dark:text-gray-100 text-sm font-medium leading-normal">Status</p>
              <span className="material-symbols-outlined text-gray-600 dark:text-gray-400 text-xl">expand_more</span>
            </button>
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
                        Position
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
                            <div className="flex-shrink-0 h-10 w-10">
                              <img
                                className="h-10 w-10 rounded-full"
                                src={employee.avatar || 'https://via.placeholder.com/40'}
                                alt={`${employee.name} profile`}
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{employee.name}</div>
                              <div className="text-sm text-gray-600 dark:text-gray-400 md:hidden">{employee.position}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                          <div className="text-sm text-gray-600 dark:text-gray-400">{employee.position}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(employee.status)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 hidden lg:table-cell">
                          {employee.lastLogin || 'Never'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary">
                            <span className="material-symbols-outlined">more_horiz</span>
                          </button>
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
                Showing {(currentPage - 1) * 10 + 1} to {Math.min(currentPage * 10, totalEmployees)} of{' '}
                {totalEmployees} results
              </p>
              <div className="flex gap-2">
                <button
                  className="flex items-center justify-center h-9 w-9 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  <span className="material-symbols-outlined text-xl">chevron_left</span>
                </button>
                <button
                  className="flex items-center justify-center h-9 w-9 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  disabled={currentPage * 10 >= totalEmployees}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  <span className="material-symbols-outlined text-xl">chevron_right</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
