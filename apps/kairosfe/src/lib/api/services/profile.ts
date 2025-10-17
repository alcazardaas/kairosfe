import { apiClient } from '../client';

export interface UserProfile {
  id: string;
  fullName: string;
  preferredName?: string;
  pronouns?: string;
  email: string;
  phone?: string;
  address?: string;
  avatar?: string;
  position?: string;
  department?: string;
  startDate?: string;
}

export const profileService = {
  async get(): Promise<UserProfile> {
    return apiClient.get<UserProfile>('/api/profile');
  },

  async update(data: Partial<UserProfile>): Promise<UserProfile> {
    return apiClient.put<UserProfile>('/api/profile', data);
  },

  async uploadAvatar(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/profile/avatar`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload avatar');
    }

    return response.json();
  },
};
