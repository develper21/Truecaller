import apiClient from './client';

export interface PhoneNumberLookupRequest {
  phoneNumber: string;
}

export interface PhoneNumberLookupResponse {
  id: number;
  number: string;
  trustLevel: 'verified' | 'trusted' | 'neutral' | 'risky' | 'spam';
  riskScore: number;
  spamReportCount: number;
  isVerified: boolean;
  isBusiness: boolean;
  location?: string;
  carrier?: string;
  lineType?: 'mobile' | 'landline' | 'voip';
}

export interface PhoneNumberDetails extends PhoneNumberLookupResponse {
  tags: string[];
  profile?: {
    displayName?: string;
    avatarUrl?: string;
    bio?: string;
    location?: string;
  };
  business?: {
    companyName?: string;
    category?: string;
    description?: string;
    website?: string;
    email?: string;
    logoUrl?: string;
    isVerified: boolean;
    verificationTier?: 'gold' | 'silver' | 'bronze';
  };
}

export interface SpamPredictionResponse {
  isSpam: boolean;
  confidence: number;
  riskScore: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
}

// Lookup phone number
export const lookupPhoneNumber = async (
  phoneNumber: string
): Promise<PhoneNumberLookupResponse> => {
  const response = await apiClient.get(`/phone-numbers/lookup/${phoneNumber}`);
  return response.data;
};

// Get phone number details
export const getPhoneNumberDetails = async (
  phoneNumber: string
): Promise<PhoneNumberDetails> => {
  const response = await apiClient.get(`/phone-numbers/details/${phoneNumber}`);
  return response.data;
};

// Get spam prediction for a number
export const getSpamPrediction = async (
  phoneNumber: string
): Promise<SpamPredictionResponse> => {
  const response = await apiClient.get(`/ml/predict/${phoneNumber}`);
  return response.data;
};

// Report a number as spam
export const reportSpamNumber = async (
  phoneNumber: string,
  category: string,
  reason?: string
): Promise<void> => {
  await apiClient.post('/spam-reports', {
    phoneNumber,
    category,
    reason,
  });
};

// Block a phone number
export const blockNumber = async (phoneNumber: string): Promise<void> => {
  await apiClient.post('/blocked-numbers', { phoneNumber });
};

// Unblock a phone number
export const unblockNumber = async (phoneNumber: string): Promise<void> => {
  await apiClient.delete(`/blocked-numbers/${phoneNumber}`);
};

// Get blocked numbers list
export const getBlockedNumbers = async (): Promise<string[]> => {
  const response = await apiClient.get('/blocked-numbers');
  return response.data.map((item: any) => item.phoneNumber);
};

// Check if number is blocked
export const isNumberBlocked = async (phoneNumber: string): Promise<boolean> => {
  try {
    const response = await apiClient.get(`/blocked-numbers/${phoneNumber}`);
    return response.data.isBlocked;
  } catch {
    return false;
  }
};

// Get top spammers
export const getTopSpammers = async (limit: number = 10): Promise<PhoneNumberLookupResponse[]> => {
  const response = await apiClient.get('/phone-numbers/top-spammers', {
    params: { limit },
  });
  return response.data;
};

// Get trending searches
export const getTrendingSearches = async (): Promise<string[]> => {
  const response = await apiClient.get('/phone-numbers/trending');
  return response.data;
};
