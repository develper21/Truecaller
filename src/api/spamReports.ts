import apiClient from './client';

export interface SpamReport {
  id: number;
  phoneNumberId: number;
  number?: string; // Populated by backend for display
  reporterId: number;
  category: string;
  reason?: string;
  description?: string; // Alias for reason for UI display
  evidence?: any;
  status: 'pending' | 'reviewed' | 'confirmed' | 'rejected';
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSpamReportRequest {
  phoneNumber: string;
  category: 'telemarketing' | 'fraud' | 'harassment' | 'robocall' | 'other';
  reason?: string;
  evidence?: any;
}

export interface SpamStats {
  totalReports: number;
  pendingReports: number;
  confirmedReports: number;
  topCategories: Array<{ category: string; count: number }>;
  reportsTrend: Array<{ date: string; count: number }>;
}

// Create spam report
export const createSpamReport = async (
  data: CreateSpamReportRequest
): Promise<SpamReport> => {
  const response = await apiClient.post('/spam-reports', data);
  return response.data;
};

// Get my spam reports
export const getMySpamReports = async (): Promise<SpamReport[]> => {
  const response = await apiClient.get('/spam-reports/my-reports');
  return response.data;
};

// Get spam statistics
export const getSpamStats = async (): Promise<SpamStats> => {
  const response = await apiClient.get('/spam-reports/stats');
  return response.data;
};

// Get trending spam numbers
export const getSpamTrending = async (limit: number = 10): Promise<any[]> => {
  const response = await apiClient.get('/spam-reports/trending', {
    params: { limit },
  });
  return response.data;
};

// Get top spammers in area
export const getAreaSpammers = async (
  location: string,
  limit: number = 10
): Promise<any[]> => {
  const response = await apiClient.get('/spam-reports/area', {
    params: { location, limit },
  });
  return response.data;
};

// Get spam report by ID
export const getSpamReportById = async (id: number): Promise<SpamReport> => {
  const response = await apiClient.get(`/spam-reports/${id}`);
  return response.data;
};

// Update spam report (for appeals)
export const updateSpamReport = async (
  id: number,
  data: Partial<CreateSpamReportRequest>
): Promise<SpamReport> => {
  const response = await apiClient.patch(`/spam-reports/${id}`, data);
  return response.data;
};

// Delete spam report
export const deleteSpamReport = async (id: number): Promise<void> => {
  await apiClient.delete(`/spam-reports/${id}`);
};

// Check if number is marked as spam by user
export const isNumberReportedByMe = async (phoneNumber: string): Promise<boolean> => {
  try {
    const response = await apiClient.get(`/spam-reports/check/${phoneNumber}`);
    return response.data.reported;
  } catch {
    return false;
  }
};
