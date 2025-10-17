import React, { useEffect, useState } from 'react';
import { leaveRequestsService, type LeaveRequest, type LeaveBalance } from '@/lib/api/services/leave-requests';

export default function LeaveRequestsContentNew() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'my' | 'team'>('my');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [requestsData, balancesData] = await Promise.all([
        leaveRequestsService.getAll({
          status: statusFilter === 'all' ? undefined : statusFilter,
        }),
        leaveRequestsService.getBalances(),
      ]);

      setRequests(requestsData.requests);
      setBalances(balancesData.balances);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      // Fallback to mock data
      setRequests(getMockRequests());
      setBalances(getMockBalances());
    } finally {
      setLoading(false);
    }
  };

  const getMockRequests = (): LeaveRequest[] => [
    {
      id: '1',
      employeeId: '1',
      employeeName: 'Alex Johnson',
      employeeAvatar: 'https://via.placeholder.com/32',
      leaveType: 'vacation',
      startDate: '2023-10-25',
      endDate: '2023-10-28',
      status: 'pending',
      createdAt: '2023-10-15',
    },
    {
      id: '2',
      employeeId: '2',
      employeeName: 'Maria Garcia',
      employeeAvatar: 'https://via.placeholder.com/32',
      leaveType: 'sick',
      startDate: '2023-11-01',
      endDate: '2023-11-01',
      status: 'approved',
      createdAt: '2023-10-20',
    },
    {
      id: '3',
      employeeId: '3',
      employeeName: 'David Chen',
      employeeAvatar: 'https://via.placeholder.com/32',
      leaveType: 'personal',
      startDate: '2023-09-15',
      endDate: '2023-09-15',
      status: 'rejected',
      createdAt: '2023-09-10',
    },
  ];

  const getMockBalances = (): LeaveBalance[] => [
    { leaveType: 'Vacation', used: 15, total: 20 },
    { leaveType: 'Sick Leave', used: 8, total: 10 },
    { leaveType: 'Personal', used: 2, total: 5 },
  ];

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    };

    const statusLabels = {
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses[status as keyof typeof statusClasses]}`}>
        {statusLabels[status as keyof typeof statusLabels]}
      </span>
    );
  };

  return (
    <div className="flex flex-1 min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="flex-1 px-4 md:px-10 lg:px-20 py-8 mx-auto w-full max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="w-full lg:w-2/3 xl:w-3/4">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
              <p className="text-gray-900 dark:text-gray-100 text-4xl font-black leading-tight tracking-tight min-w-72">
                Leave Management
              </p>
              <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] shadow-md hover:opacity-90 transition-opacity">
                <span className="material-symbols-outlined mr-2">add</span>
                <span className="truncate">Request Time Off</span>
              </button>
            </div>

            {/* Tabs */}
            <div className="pb-3">
              <div className="flex border-b border-gray-200 dark:border-gray-700 gap-8">
                <button
                  onClick={() => setActiveTab('my')}
                  className={`flex flex-col items-center justify-center border-b-[3px] pb-[13px] pt-4 ${
                    activeTab === 'my'
                      ? 'border-b-primary text-primary'
                      : 'border-b-transparent text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary'
                  } transition-colors`}
                >
                  <p className="text-sm font-bold leading-normal tracking-[0.015em]">My Requests</p>
                </button>
                <button
                  onClick={() => setActiveTab('team')}
                  className={`flex flex-col items-center justify-center border-b-[3px] pb-[13px] pt-4 ${
                    activeTab === 'team'
                      ? 'border-b-primary text-primary'
                      : 'border-b-transparent text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary'
                  } transition-colors`}
                >
                  <p className="text-sm font-bold leading-normal tracking-[0.015em]">Team Requests</p>
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 p-3 items-center">
              <button
                onClick={() => setStatusFilter('all')}
                className={`flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-lg pl-4 pr-3 ${
                  statusFilter === 'all'
                    ? 'bg-primary/20 dark:bg-primary/30 text-primary'
                    : 'bg-gray-200 dark:bg-gray-700/50 text-gray-800 dark:text-gray-300'
                }`}
              >
                <p className="text-sm font-medium leading-normal">All</p>
                <span className="material-symbols-outlined text-base">expand_more</span>
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-lg pl-4 pr-3 ${
                  statusFilter === 'pending'
                    ? 'bg-primary/20 dark:bg-primary/30 text-primary'
                    : 'bg-gray-200 dark:bg-gray-700/50 text-gray-800 dark:text-gray-300'
                }`}
              >
                <p className="text-sm font-medium leading-normal">Pending</p>
              </button>
              <button
                onClick={() => setStatusFilter('approved')}
                className={`flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-lg pl-4 pr-3 ${
                  statusFilter === 'approved'
                    ? 'bg-primary/20 dark:bg-primary/30 text-primary'
                    : 'bg-gray-200 dark:bg-gray-700/50 text-gray-800 dark:text-gray-300'
                }`}
              >
                <p className="text-sm font-medium leading-normal">Approved</p>
              </button>
              <button
                onClick={() => setStatusFilter('rejected')}
                className={`flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-lg pl-4 pr-3 ${
                  statusFilter === 'rejected'
                    ? 'bg-primary/20 dark:bg-primary/30 text-primary'
                    : 'bg-gray-200 dark:bg-gray-700/50 text-gray-800 dark:text-gray-300'
                }`}
              >
                <p className="text-sm font-medium leading-normal">Rejected</p>
              </button>
              <div className="flex-grow"></div>
              <button className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-lg pl-3 pr-3 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700/50">
                <span className="material-symbols-outlined text-xl">sort</span>
                <p className="text-sm font-medium leading-normal">Sort by Date</p>
              </button>
            </div>

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
            <div className="py-3">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-transparent">
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 w-[25%]">Employee</th>
                      <th className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 w-[20%]">Leave Type</th>
                      <th className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 w-[25%]">Dates</th>
                      <th className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 w-[15%]">Status</th>
                      <th className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 w-[15%] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {requests.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors">
                        <td className="h-[72px] px-4 py-2 text-sm font-normal text-gray-800 dark:text-gray-200">
                          <div className="flex items-center gap-3">
                            <div
                              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-8"
                              style={{ backgroundImage: `url(${request.employeeAvatar || 'https://via.placeholder.com/32'})` }}
                            ></div>
                            <span>{request.employeeName}</span>
                          </div>
                        </td>
                        <td className="h-[72px] px-4 py-2 text-sm capitalize">{request.leaveType}</td>
                        <td className="h-[72px] px-4 py-2 text-sm">
                          {new Date(request.startDate).toLocaleDateString()} -{' '}
                          {new Date(request.endDate).toLocaleDateString()}
                        </td>
                        <td className="h-[72px] px-4 py-2 text-sm">{getStatusBadge(request.status)}</td>
                        <td className="h-[72px] px-4 py-2 text-sm font-medium text-right">
                          <button className="text-primary hover:underline">
                            {request.status === 'pending' ? 'Approve/Reject' : 'View Details'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="w-full lg:w-1/3 xl:w-1/4 space-y-8">
            {/* Leave Balances */}
            <div className="bg-white dark:bg-gray-800/50 p-6 rounded-xl shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Leave Balances</h3>
              <div className="space-y-4">
                {balances.map((balance, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-900 dark:text-gray-100">{balance.leaveType}</span>
                      <span className="text-gray-600 dark:text-gray-300">
                        {balance.used} / {balance.total} Days
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${(balance.used / balance.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* New Request Form */}
            <div className="bg-white dark:bg-gray-800/50 p-6 rounded-xl shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">New Time Off Request</h3>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100" htmlFor="leave-type">
                    Leave Type
                  </label>
                  <select
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:border-primary focus:ring-primary text-gray-900 dark:text-gray-100"
                    id="leave-type"
                  >
                    <option>Vacation</option>
                    <option>Sick Leave</option>
                    <option>Personal</option>
                    <option>Unpaid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100" htmlFor="start-date">
                    Start Date
                  </label>
                  <input
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:border-primary focus:ring-primary text-gray-900 dark:text-gray-100"
                    id="start-date"
                    type="date"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100" htmlFor="end-date">
                    End Date
                  </label>
                  <input
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:border-primary focus:ring-primary text-gray-900 dark:text-gray-100"
                    id="end-date"
                    type="date"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100" htmlFor="reason">
                    Reason (Optional)
                  </label>
                  <textarea
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:border-primary focus:ring-primary text-gray-900 dark:text-gray-100"
                    id="reason"
                    rows={3}
                  ></textarea>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    className="flex-1 text-center rounded-lg h-10 px-4 bg-gray-200 dark:bg-gray-700/50 text-gray-800 dark:text-gray-300 text-sm font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    className="flex-1 text-center rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold hover:opacity-90 transition-opacity"
                    type="submit"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

// Header component placeholder - you can use the existing Header component
function Header() {
  return null; // Will be replaced by the actual Header component in the page
}
