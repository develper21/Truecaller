// API Client and utilities
export { default as apiClient, API_BASE_URL, STORAGE_KEYS } from './client';

// Auth API
export * from './auth';

// Call Logs API
export * from './callLogs';

// Contacts API
export * from './contacts';

// Phone Numbers API
export * from './phoneNumbers';

// Messages API
export * from './messages';

// Profile API
export { 
  getProfile, 
  updateProfile, 
  uploadAvatar, 
  getPublicProfile, 
  getProfileViewers, 
  deleteProfile,
  type Profile,
  type UpdateProfileRequest,
  type ProfileViewer 
} from './profile';

// Business API
export * from './business';

// Spam Reports API
export * from './spamReports';

// Notifications API
export * from './notifications';

// WebSocket
export * from './websocket';
