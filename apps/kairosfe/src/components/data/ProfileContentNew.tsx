import React, { useEffect, useState } from 'react';
import { profileService, type UserProfile } from '@/lib/api/services/profile';
import { showToast } from '@/lib/utils/toast';
import { useUIStore } from '@/lib/store';

export default function ProfileContentNew() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');

  // Get theme from Zustand store
  const { theme, setTheme } = useUIStore();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await profileService.get();
      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
      // Fallback to mock data
      setProfile(getMockProfile());
    } finally {
      setLoading(false);
    }
  };

  const getMockProfile = (): UserProfile => ({
    id: '1',
    fullName: 'John Doe',
    preferredName: 'Johnny',
    pronouns: 'He/Him',
    email: 'john.doe@kairos.com',
    phone: '+1 (555) 123-4567',
    address: '123 Main St, Anytown, USA 12345',
    avatar: 'https://via.placeholder.com/64',
    position: 'Software Engineer',
    department: 'Engineering',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      setSaving(true);
      setError(null);
      const updated = await profileService.update(profile);
      setProfile(updated);
      setIsDirty(false);
      showToast.success('Profile updated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      showToast.error('Failed to update profile. Using mock data for demonstration.');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof UserProfile, value: string) => {
    if (!profile) return;
    setProfile({ ...profile, [field]: value });
    setIsDirty(true);
  };

  const toggleTheme = () => {
    // Use Zustand store instead of direct DOM manipulation
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-500 dark:text-gray-400">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-red-500">Failed to load profile</div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-gray-50 dark:bg-gray-900">
      <div className="layout-container flex h-full grow">
        {/* Sidebar */}
        <div className="flex-col w-full md:w-1/4 lg:w-1/5 bg-white dark:bg-gray-800 p-4 md:p-6 border-r border-gray-200 dark:border-gray-700 hidden md:flex">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div
                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-16"
                style={{ backgroundImage: `url(${profile.avatar || 'https://via.placeholder.com/64'})` }}
              ></div>
              <div className="flex flex-col">
                <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">{profile.fullName}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">{profile.position}</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setActiveTab('personal')}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                  activeTab === 'personal'
                    ? 'bg-primary/10 dark:bg-primary/20 text-primary'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100'
                }`}
              >
                <span className="material-symbols-outlined">person</span>
                <p className="text-sm font-medium">Personal Info</p>
              </button>
              <button
                onClick={() => setActiveTab('employment')}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                  activeTab === 'employment'
                    ? 'bg-primary/10 dark:bg-primary/20 text-primary'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100'
                }`}
              >
                <span className="material-symbols-outlined">work</span>
                <p className="text-sm font-medium">Employment Details</p>
              </button>
              <button
                onClick={() => setActiveTab('documents')}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                  activeTab === 'documents'
                    ? 'bg-primary/10 dark:bg-primary/20 text-primary'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100'
                }`}
              >
                <span className="material-symbols-outlined">folder</span>
                <p className="text-sm font-medium">Documents</p>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 md:p-8">
          <div className="flex flex-col gap-8">
            <div className="flex justify-between items-center">
              <p className="text-3xl font-black tracking-tight text-gray-900 dark:text-gray-100">Personal Info</p>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-gray-600 dark:text-gray-400">light_mode</span>
                <button
                  onClick={toggleTheme}
                  className="relative inline-flex items-center cursor-pointer"
                  aria-label="Toggle theme"
                >
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                </button>
                <span className="material-symbols-outlined text-gray-600 dark:text-gray-400">dark_mode</span>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-800 dark:text-red-200 text-sm">
                  {error}
                  <br />
                  <span className="text-xs">Showing mock data for demonstration purposes.</span>
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <label className="flex flex-col">
                  <p className="text-base font-medium pb-2 text-gray-900 dark:text-gray-100">Full Name</p>
                  <input
                    className="form-input w-full rounded-lg text-gray-900 dark:text-gray-100 focus:outline-0 focus:ring-2 focus:ring-primary/50 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 h-12 placeholder:text-gray-400 dark:placeholder:text-gray-500 p-3 text-base"
                    value={profile.fullName}
                    onChange={(e) => handleChange('fullName', e.target.value)}
                  />
                </label>

                <label className="flex flex-col">
                  <p className="text-base font-medium pb-2 text-gray-900 dark:text-gray-100">Preferred Name</p>
                  <input
                    className="form-input w-full rounded-lg text-gray-900 dark:text-gray-100 focus:outline-0 focus:ring-2 focus:ring-primary/50 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 h-12 placeholder:text-gray-400 dark:placeholder:text-gray-500 p-3 text-base"
                    value={profile.preferredName || ''}
                    onChange={(e) => handleChange('preferredName', e.target.value)}
                  />
                </label>

                <label className="flex flex-col">
                  <p className="text-base font-medium pb-2 text-gray-900 dark:text-gray-100">Pronouns</p>
                  <select
                    className="form-select w-full rounded-lg text-gray-900 dark:text-gray-100 focus:outline-0 focus:ring-2 focus:ring-primary/50 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 h-12 placeholder:text-gray-400 dark:placeholder:text-gray-500 p-3 text-base"
                    value={profile.pronouns || ''}
                    onChange={(e) => handleChange('pronouns', e.target.value)}
                  >
                    <option>He/Him</option>
                    <option>She/Her</option>
                    <option>They/Them</option>
                    <option>Other</option>
                  </select>
                </label>

                <label className="flex flex-col">
                  <p className="text-base font-medium pb-2 text-gray-900 dark:text-gray-100">Email Address</p>
                  <input
                    className="form-input w-full rounded-lg text-gray-900 dark:text-gray-100 focus:outline-0 focus:ring-2 focus:ring-primary/50 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 h-12 placeholder:text-gray-400 dark:placeholder:text-gray-500 p-3 text-base"
                    type="email"
                    value={profile.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                  />
                </label>

                <label className="flex flex-col">
                  <p className="text-base font-medium pb-2 text-gray-900 dark:text-gray-100">Phone Number</p>
                  <input
                    className="form-input w-full rounded-lg text-gray-900 dark:text-gray-100 focus:outline-0 focus:ring-2 focus:ring-primary/50 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 h-12 placeholder:text-gray-400 dark:placeholder:text-gray-500 p-3 text-base"
                    type="tel"
                    value={profile.phone || ''}
                    onChange={(e) => handleChange('phone', e.target.value)}
                  />
                </label>

                <label className="flex flex-col">
                  <p className="text-base font-medium pb-2 text-gray-900 dark:text-gray-100">Physical Address</p>
                  <input
                    className="form-input w-full rounded-lg text-gray-900 dark:text-gray-100 focus:outline-0 focus:ring-2 focus:ring-primary/50 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 h-12 placeholder:text-gray-400 dark:placeholder:text-gray-500 p-3 text-base"
                    value={profile.address || ''}
                    onChange={(e) => handleChange('address', e.target.value)}
                  />
                </label>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6 flex justify-end gap-4">
                <button
                  type="button"
                  className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm font-bold leading-normal tracking-[0.015em] hover:bg-gray-300 dark:hover:bg-gray-600"
                  onClick={() => {
                    loadProfile();
                    setIsDirty(false);
                  }}
                >
                  <span className="truncate">Cancel</span>
                </button>
                <button
                  type="submit"
                  className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 disabled:bg-primary/50 disabled:cursor-not-allowed"
                  disabled={!isDirty || saving}
                >
                  <span className="truncate">{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
