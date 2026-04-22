import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Base URL - Change this to your backend URL
// For development with Expo on device: use your computer's IP
// Example: 'http://192.168.1.100:3000' or 'https://your-api.com'
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

// Storage keys
export const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user_data',
} as const;

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error reading token:', error);
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        
        if (refreshToken) {
          // Call refresh token endpoint
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { token } = response.data;
          await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);

          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        await clearAuthData();
        return Promise.reject(refreshError);
      }
    }

    // Handle network errors
    if (!error.response) {
      console.error('Network Error - Check your connection and API URL:', API_BASE_URL);
    }

    return Promise.reject(error);
  }
);

// Helper functions for auth
export const setAuthToken = async (token: string): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
};

export const setRefreshToken = async (token: string): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
};

export const getAuthToken = async (): Promise<string | null> => {
  return await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
};

export const clearAuthData = async (): Promise<void> => {
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.TOKEN,
    STORAGE_KEYS.REFRESH_TOKEN,
    STORAGE_KEYS.USER,
  ]);
};

export const setUserData = async (user: any): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
};

export const getUserData = async (): Promise<any | null> => {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.USER);
  return data ? JSON.parse(data) : null;
};

// Health check
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    await axios.get(`${API_BASE_URL}/health`, { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
};

export { API_BASE_URL };
export default apiClient;
