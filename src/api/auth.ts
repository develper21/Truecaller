import apiClient, { setAuthToken, setRefreshToken, setUserData, clearAuthData } from './client';

export interface SendOtpRequest {
  phoneNumber: string;
}

export interface VerifyOtpRequest {
  phoneNumber: string;
  otp: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  refreshToken: string;
  user: {
    id: number;
    phoneNumber: string;
    isVerified: boolean;
    trustLevel: string;
    createdAt: string;
  };
}

export interface UserProfile {
  id: number;
  phoneNumber: string;
  displayName?: string;
  avatarUrl?: string;
  isVerified: boolean;
  trustLevel: string;
  riskScore: string;
  createdAt: string;
  updatedAt: string;
}

// Send OTP to phone number
export const sendOtp = async (phoneNumber: string): Promise<{ message: string }> => {
  const response = await apiClient.post('/auth/otp/send', { phoneNumber });
  return response.data;
};

// Verify OTP and login
export const verifyOtp = async (phoneNumber: string, otp: string): Promise<LoginResponse> => {
  const response = await apiClient.post('/auth/otp/verify', { phoneNumber, otp });
  
  // Store tokens
  if (response.data.token) {
    await setAuthToken(response.data.token);
  }
  if (response.data.refreshToken) {
    await setRefreshToken(response.data.refreshToken);
  }
  if (response.data.user) {
    await setUserData(response.data.user);
  }
  
  return response.data;
};

// Get current user profile
export const getCurrentUser = async (): Promise<UserProfile> => {
  const response = await apiClient.get('/auth/me');
  return response.data;
};

// Get profile (alias for getCurrentUser for compatibility)
export const getProfile = async (): Promise<UserProfile> => {
  return getCurrentUser();
};

// Re-export Profile type
export type { UserProfile as Profile };

// Logout
export const logout = async (): Promise<void> => {
  try {
    await apiClient.post('/auth/logout');
  } catch (error) {
    console.error('Logout API error:', error);
  } finally {
    await clearAuthData();
  }
};

// Check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  const token = await apiClient.get('/auth/refresh');
  return !!token;
};
