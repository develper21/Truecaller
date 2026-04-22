import apiClient from './client';

export interface CreateCallLogRequest {
  callerNumber: string;
  receiverNumber?: string;
  direction: 'incoming' | 'outgoing';
  status: 'started' | 'accepted' | 'rejected' | 'ended';
  duration?: number;
  isSpam?: boolean;
  notes?: string;
}

export interface CallLogResponse {
  id: number;
  userId: number;
  callerNumberId: number;
  receiverNumberId?: number;
  name: string;
  number: string;
  type: 'incoming' | 'outgoing' | 'missed' | 'spam';
  time: string;
  duration?: string;
  location?: string;
  isSpam?: boolean;
  spamReports?: number;
  avatar?: string;
  isBlocked?: boolean;
  isBusiness?: boolean;
  tags?: string[];
  trustLevel?: 'verified' | 'trusted' | 'neutral' | 'risky' | 'spam';
  riskScore?: 'low' | 'medium' | 'high' | 'critical';
  trustScore?: number;
  isVerified?: boolean;
  verificationTier?: 'gold' | 'silver' | 'bronze';
  createdAt: string;
  endedAt?: string;
  updatedAt: string;
}

export interface CallStats {
  totalCalls: number;
  incomingCalls: number;
  outgoingCalls: number;
  missedCalls: number;
  spamCalls: number;
  blockedCalls: number;
  averageDuration: number;
}

// Get all call logs for current user
export const getCallLogs = async (
  direction?: 'incoming' | 'outgoing',
  status?: string,
  isSpam?: boolean,
  limit: number = 50,
  offset: number = 0
): Promise<CallLogResponse[]> => {
  const params: any = { limit, offset };
  if (direction) params.direction = direction;
  if (status) params.status = status;
  if (isSpam !== undefined) params.isSpam = isSpam;

  const response = await apiClient.get('/call-logs', { params });
  return response.data;
};

// Get a specific call log
export const getCallLogById = async (id: number): Promise<CallLogResponse> => {
  const response = await apiClient.get(`/call-logs/${id}`);
  return response.data;
};

// Create a new call log
export const createCallLog = async (data: CreateCallLogRequest): Promise<CallLogResponse> => {
  const response = await apiClient.post('/call-logs', data);
  return response.data;
};

// Update call log (mark as ended, etc)
export const updateCallLog = async (
  id: number,
  data: Partial<CreateCallLogRequest>
): Promise<CallLogResponse> => {
  const response = await apiClient.patch(`/call-logs/${id}`, data);
  return response.data;
};

// Delete a call log
export const deleteCallLog = async (id: number): Promise<void> => {
  await apiClient.delete(`/call-logs/${id}`);
};

// Get call statistics
export const getCallStats = async (): Promise<CallStats> => {
  const response = await apiClient.get('/call-logs/stats');
  return response.data;
};

// Get recent calls for home screen
export const getRecentCalls = async (limit: number = 20): Promise<CallLogResponse[]> => {
  const response = await apiClient.get('/call-logs', {
    params: { limit, offset: 0 },
  });
  return response.data;
};

// Mark call as spam
export const markCallAsSpam = async (id: number): Promise<CallLogResponse> => {
  const response = await apiClient.patch(`/call-logs/${id}`, { isSpam: true });
  return response.data;
};

// Get call history for a specific phone number
export const getCallHistory = async (
  phoneNumber: string,
  limit: number = 10,
  offset: number = 0
): Promise<CallLogResponse[]> => {
  const response = await apiClient.get('/call-logs', {
    params: { phoneNumber, limit, offset },
  });
  return response.data;
};
