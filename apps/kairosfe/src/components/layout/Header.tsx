import React from 'react';

export default function Header() {
  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 lg:px-8 py-3 bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-primary">
          <span className="material-symbols-outlined text-2xl">timelapse</span>
          <h2 className="text-xl font-bold tracking-tight">Kairos</h2>
        </div>
        <nav className="hidden md:flex items-center gap-6 ml-6">
          <a className="text-sm font-medium text-primary" href="/dashboard">Dashboard</a>
          <a className="text-sm font-medium hover:text-primary dark:text-gray-300" href="/team-management">Employees</a>
          <a className="text-sm font-medium hover:text-primary dark:text-gray-300" href="/leave-requests">Reports</a>
          <a className="text-sm font-medium hover:text-primary dark:text-gray-300" href="/settings">Settings</a>
        </nav>
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

        <div
          className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
          style={{backgroundImage: 'url("https://via.placeholder.com/40")'}}
        ></div>

        <button className="md:hidden flex items-center justify-center rounded-full h-10 w-10 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
          <span className="material-symbols-outlined">menu</span>
        </button>
      </div>
    </header>
  );
}
