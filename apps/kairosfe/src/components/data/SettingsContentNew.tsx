import React, { useState } from 'react';

export default function SettingsContentNew() {
  const [activeTab, setActiveTab] = useState('organization');
  const [orgName, setOrgName] = useState('Kairos Inc.');
  const [orgPhone, setOrgPhone] = useState('+1 (555) 123-4567');
  const [orgAddress, setOrgAddress] = useState('123 Innovation Drive, Tech City, 94105');
  const [language, setLanguage] = useState('en');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const handleSave = () => {
    alert('Settings saved successfully!');
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-grow">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <div className="flex h-full min-h-[700px] flex-col justify-between p-4">
            <div className="flex flex-col gap-4">
              <div className="flex gap-3 items-center px-3 py-2">
                <div
                  className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
                  style={{ backgroundImage: 'url("https://via.placeholder.com/40")' }}
                ></div>
                <div className="flex flex-col">
                  <h1 className="text-gray-900 dark:text-white text-base font-medium leading-normal">Admin</h1>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-normal leading-normal">admin@kairos.com</p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <a
                  href="/dashboard"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <span className="material-symbols-outlined">dashboard</span>
                  <p className="text-sm font-medium leading-normal">Dashboard</p>
                </a>
                <a
                  href="/team-management"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <span className="material-symbols-outlined">group</span>
                  <p className="text-sm font-medium leading-normal">Teams</p>
                </a>
                <a
                  href="/leave-requests"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <span className="material-symbols-outlined">calendar_today</span>
                  <p className="text-sm font-medium leading-normal">Time Off</p>
                </a>
                <a
                  href="/settings"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/20 dark:bg-primary/30 text-primary"
                >
                  <span className="material-symbols-outlined">settings</span>
                  <p className="text-sm font-bold leading-normal">Settings</p>
                </a>
              </div>
            </div>

            <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em]">
              <span className="truncate">New Hire</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-wrap justify-between gap-3 p-4">
              <div className="flex min-w-72 flex-col gap-3">
                <p className="text-gray-900 dark:text-white text-4xl font-black leading-tight tracking-tight">Settings</p>
                <p className="text-gray-600 dark:text-gray-400 text-base font-normal leading-normal">
                  Manage your organization's settings and preferences.
                </p>
              </div>
            </div>

            {/* Tabs */}
            <div className="pb-3">
              <div className="flex border-b border-gray-200 dark:border-gray-700 px-4 gap-8">
                <button
                  onClick={() => setActiveTab('organization')}
                  className={`flex flex-col items-center justify-center border-b-[3px] pb-[13px] pt-4 ${
                    activeTab === 'organization'
                      ? 'border-b-primary text-primary'
                      : 'border-b-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <p className="text-sm font-bold leading-normal tracking-[0.015em]">Organization</p>
                </button>
                <button
                  onClick={() => setActiveTab('working-hours')}
                  className={`flex flex-col items-center justify-center border-b-[3px] pb-[13px] pt-4 ${
                    activeTab === 'working-hours'
                      ? 'border-b-primary text-primary'
                      : 'border-b-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <p className="text-sm font-bold leading-normal tracking-[0.015em]">Working Hours</p>
                </button>
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`flex flex-col items-center justify-center border-b-[3px] pb-[13px] pt-4 ${
                    activeTab === 'notifications'
                      ? 'border-b-primary text-primary'
                      : 'border-b-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <p className="text-sm font-bold leading-normal tracking-[0.015em]">Notifications</p>
                </button>
                <button
                  onClick={() => setActiveTab('display')}
                  className={`flex flex-col items-center justify-center border-b-[3px] pb-[13px] pt-4 ${
                    activeTab === 'display'
                      ? 'border-b-primary text-primary'
                      : 'border-b-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <p className="text-sm font-bold leading-normal tracking-[0.015em]">Display</p>
                </button>
              </div>
            </div>

            <div className="space-y-8">
              {/* Organization Details */}
              {activeTab === 'organization' && (
                <section>
                  <h2 className="text-gray-900 dark:text-white text-[22px] font-bold leading-tight tracking-tight px-4 pb-3 pt-5">
                    Organization Details
                  </h2>
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <label className="flex flex-col">
                        <p className="text-gray-900 dark:text-white text-base font-medium leading-normal pb-2">
                          Organization Name
                        </p>
                        <input
                          className="form-input w-full rounded-lg text-gray-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 h-14 placeholder:text-gray-600 p-[15px] text-base font-normal leading-normal"
                          value={orgName}
                          onChange={(e) => setOrgName(e.target.value)}
                        />
                      </label>

                      <label className="flex flex-col">
                        <p className="text-gray-900 dark:text-white text-base font-medium leading-normal pb-2">
                          Contact Phone
                        </p>
                        <input
                          className="form-input w-full rounded-lg text-gray-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 h-14 placeholder:text-gray-600 p-[15px] text-base font-normal leading-normal"
                          value={orgPhone}
                          onChange={(e) => setOrgPhone(e.target.value)}
                        />
                      </label>

                      <label className="flex flex-col md:col-span-2">
                        <p className="text-gray-900 dark:text-white text-base font-medium leading-normal pb-2">Address</p>
                        <input
                          className="form-input w-full rounded-lg text-gray-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 h-14 placeholder:text-gray-600 p-[15px] text-base font-normal leading-normal"
                          value={orgAddress}
                          onChange={(e) => setOrgAddress(e.target.value)}
                        />
                      </label>
                    </div>

                    <div className="mt-6">
                      <p className="text-gray-900 dark:text-white text-base font-medium leading-normal pb-2">Company Logo</p>
                      <div className="flex items-center gap-6">
                        <div
                          className="bg-center bg-no-repeat aspect-square bg-cover rounded-lg size-20"
                          style={{ backgroundImage: 'url("https://via.placeholder.com/80")' }}
                        ></div>
                        <div className="flex-1 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                          <span className="material-symbols-outlined text-4xl text-gray-600 dark:text-gray-400">upload_file</span>
                          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            Drag & drop a file here or <span className="font-bold text-primary cursor-pointer">choose file</span>
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">PNG, JPG, SVG up to 2MB</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Display Settings */}
              {activeTab === 'display' && (
                <section>
                  <h2 className="text-gray-900 dark:text-white text-[22px] font-bold leading-tight tracking-tight px-4 pb-3 pt-5">
                    Display
                  </h2>
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                      <label className="flex flex-col">
                        <p className="text-gray-900 dark:text-white text-base font-medium leading-normal pb-2">Language</p>
                        <select
                          className="form-select w-full rounded-lg text-gray-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 h-14 p-[15px] text-base font-normal leading-normal"
                          value={language}
                          onChange={(e) => setLanguage(e.target.value)}
                        >
                          <option value="en">English (United States)</option>
                          <option value="es">Español (España)</option>
                          <option value="pt-PT">Português (Portugal)</option>
                          <option value="de">Deutsch (Deutschland)</option>
                        </select>
                      </label>

                      <div>
                        <p className="text-gray-900 dark:text-white text-base font-medium leading-normal pb-2">Theme</p>
                        <div className="flex items-center gap-4 rounded-lg border border-gray-200 dark:border-gray-700 p-2">
                          <button
                            onClick={() => {
                              setTheme('light');
                              document.documentElement.classList.remove('dark');
                            }}
                            className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-md ${
                              theme === 'light'
                                ? 'bg-primary text-white'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                          >
                            <span className="material-symbols-outlined">light_mode</span>
                            <span>Light</span>
                          </button>
                          <button
                            onClick={() => {
                              setTheme('dark');
                              document.documentElement.classList.add('dark');
                            }}
                            className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-md ${
                              theme === 'dark'
                                ? 'bg-primary text-white'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                          >
                            <span className="material-symbols-outlined">dark_mode</span>
                            <span>Dark</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 mt-8 px-4">
              <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-transparent text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 text-sm font-bold leading-normal tracking-[0.015em] hover:bg-gray-50 dark:hover:bg-gray-700">
                <span className="truncate">Cancel</span>
              </button>
              <button
                onClick={handleSave}
                className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:opacity-90"
              >
                <span className="truncate">Save Changes</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
