import apiClient from './client';

export interface Profile {
  id: number;
  userId: number;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  language: string;
  isPublic: boolean;
  allowSearchByName: boolean;
  allowSearchByNumber: boolean;
  showProfileToContacts: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  displayName?: string;
  bio?: string;
  location?: string;
  language?: string;
  isPublic?: boolean;
  allowSearchByName?: boolean;
  allowSearchByNumber?: boolean;
  showProfileToContacts?: boolean;
}

export interface ProfileViewer {
  id: number;
  viewerId: number;
  viewerName?: string;
  viewerAvatar?: string;
  viewedAt: string;
}

// Get current user profile
export const getProfile = async (): Promise<Profile> => {
  const response = await apiClient.get('/profiles/me');
  return response.data;
};

// Update profile
export const updateProfile = async (data: UpdateProfileRequest): Promise<Profile> => {
  const response = await apiClient.patch('/profiles/me', data);
  return response.data;
};

// Upload avatar
export const uploadAvatar = async (fileUri: string): Promise<{ url: string }> => {
  const formData = new FormData();
  
  // Get file name from URI
  const fileName = fileUri.split('/').pop() || 'avatar.jpg';
  const fileType = fileName.endsWith('.png') ? 'image/png' : 'image/jpeg';
  
  formData.append('file', {
    uri: fileUri,
    name: fileName,
    type: fileType,
  } as any);

  const response = await apiClient.post('/upload/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

// Get profile by phone number (public view)
export const getPublicProfile = async (phoneNumber: string): Promise<Profile> => {
  const response = await apiClient.get(`/profiles/number/${phoneNumber}`);
  return response.data;
};

// Get who viewed my profile
export const getProfileViewers = async (
  limit: number = 20,
  offset: number = 0
): Promise<ProfileViewer[]> => {
  const response = await apiClient.get('/profiles/viewers', {
    params: { limit, offset },
  });
  return response.data;
};

// Delete profile
export const deleteProfile = async (): Promise<void> => {
  await apiClient.delete('/profiles/me');
};
