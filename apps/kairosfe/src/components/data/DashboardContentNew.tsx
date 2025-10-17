import React from 'react';

export default function DashboardContentNew() {
  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Employees Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md flex flex-col gap-4">
          <p className="text-base font-medium text-gray-900 dark:text-gray-100">Total Employees</p>
          <p className="text-4xl font-bold text-gray-900 dark:text-gray-100">1,234</p>
          <div className="flex items-center text-sm">
            <span className="material-symbols-outlined text-green-500 text-base mr-1">trending_up</span>
            <p className="text-green-500 font-medium">+15% vs last month</p>
          </div>
          <a className="text-primary font-medium text-sm mt-auto" href="/team-management">View All</a>
        </div>

        {/* Pending Leave Requests Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md flex flex-col gap-4">
          <p className="text-base font-medium text-gray-900 dark:text-gray-100">Pending Leave Requests</p>
          <p className="text-4xl font-bold text-gray-900 dark:text-gray-100">12</p>
          <div className="flex flex-col gap-3 mt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
                  style={{backgroundImage: 'url("https://via.placeholder.com/40")'}}
                ></div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">John Doe</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Sick Leave - 2 days</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="p-2 rounded-full hover:bg-green-100 dark:hover:bg-green-900/50">
                  <span className="material-symbols-outlined text-green-500">check</span>
                </button>
                <button className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50">
                  <span className="material-symbols-outlined text-red-500">close</span>
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
                  style={{backgroundImage: 'url("https://via.placeholder.com/40")'}}
                ></div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Jane Smith</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Vacation - 5 days</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="p-2 rounded-full hover:bg-green-100 dark:hover:bg-green-900/50">
                  <span className="material-symbols-outlined text-green-500">check</span>
                </button>
                <button className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50">
                  <span className="material-symbols-outlined text-red-500">close</span>
                </button>
              </div>
            </div>
          </div>
          <a className="text-primary font-medium text-sm mt-auto" href="/leave-requests">View All</a>
        </div>

        {/* Performance Reviews Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md flex flex-col gap-4">
          <p className="text-base font-medium text-gray-900 dark:text-gray-100">Performance Reviews</p>
          <div className="flex justify-center items-center my-4">
            <div className="relative w-36 h-36">
              <svg className="w-full h-full" viewBox="0 0 36 36">
                <path
                  className="stroke-current text-gray-200 dark:text-gray-700"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  strokeWidth="3"
                ></path>
                <path
                  className="stroke-current text-green-500"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  strokeDasharray="60, 100"
                  strokeLinecap="round"
                  strokeWidth="3"
                ></path>
                <path
                  className="stroke-current text-yellow-500"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  strokeDasharray="25, 100"
                  strokeDashoffset="-60"
                  strokeLinecap="round"
                  strokeWidth="3"
                ></path>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">87%</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Completed</p>
              </div>
            </div>
          </div>
          <div className="flex justify-around text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>Completed
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>In Progress
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-200 dark:bg-gray-700"></span>Not Started
            </div>
          </div>
          <a className="text-primary font-medium text-sm mt-auto" href="#">View Details</a>
        </div>

        {/* Upcoming Holidays Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md flex flex-col gap-4">
          <p className="text-base font-medium text-gray-900 dark:text-gray-100">Upcoming Holidays</p>
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
                <p className="text-xs font-bold">JUL</p>
                <p className="text-lg font-bold">04</p>
              </div>
              <div>
                <p className="font-medium text-sm text-gray-900 dark:text-gray-100">Independence Day</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Thursday</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
                <p className="text-xs font-bold">SEP</p>
                <p className="text-lg font-bold">02</p>
              </div>
              <div>
                <p className="font-medium text-sm text-gray-900 dark:text-gray-100">Labor Day</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Monday</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
                <p className="text-xs font-bold">NOV</p>
                <p className="text-lg font-bold">28</p>
              </div>
              <div>
                <p className="font-medium text-sm text-gray-900 dark:text-gray-100">Thanksgiving Day</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Thursday</p>
              </div>
            </div>
          </div>
          <a className="text-primary font-medium text-sm mt-auto" href="#">View Calendar</a>
        </div>
      </div>

      {/* Employee Growth Chart */}
      <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
        <p className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Employee Growth</p>
        <div className="flex flex-col lg:flex-row gap-4 items-start">
          <div className="flex flex-col gap-2">
            <p className="text-4xl font-bold text-gray-900 dark:text-gray-100">1,234</p>
            <div className="flex gap-1">
              <p className="text-gray-500 dark:text-gray-400 text-sm">Last 6 Months</p>
              <p className="text-green-500 text-sm font-medium">+5%</p>
            </div>
          </div>
          <div className="flex-1 flex flex-col gap-4 w-full">
            <div className="w-full h-48">
              <svg fill="none" height="100%" preserveAspectRatio="none" viewBox="-3 0 478 150" width="100%" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25V149H326.769H0V109Z"
                  fill="url(#paint0_linear)"
                ></path>
                <path
                  d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25"
                  stroke="#3B82F6"
                  strokeLinecap="round"
                  strokeWidth="3"
                ></path>
                <defs>
                  <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear" x1="236" x2="236" y1="1" y2="149">
                    <stop stopColor="#3B82F6" stopOpacity="0.2"></stop>
                    <stop offset="1" stopColor="#3B82F6" stopOpacity="0"></stop>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="flex justify-around text-gray-500 dark:text-gray-400 text-xs font-medium">
              <p>Jan</p><p>Feb</p><p>Mar</p><p>Apr</p><p>May</p><p>Jun</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
