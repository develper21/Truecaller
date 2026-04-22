import apiClient from './client';

export interface BusinessAccount {
  id: number;
  userId: number;
  phoneNumberId?: number;
  companyName: string;
  legalName?: string;
  registrationNumber?: string;
  taxId?: string;
  businessType?: string;
  category: string;
  subCategory?: string;
  description?: string;
  website?: string;
  email?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  workingHours?: {
    monday?: { open: string; close: string; isOpen: boolean };
    tuesday?: { open: string; close: string; isOpen: boolean };
    wednesday?: { open: string; close: string; isOpen: boolean };
    thursday?: { open: string; close: string; isOpen: boolean };
    friday?: { open: string; close: string; isOpen: boolean };
    saturday?: { open: string; close: string; isOpen: boolean };
    sunday?: { open: string; close: string; isOpen: boolean };
  };
  timezone?: string;
  callIntent?: string[];
  isVerified: boolean;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verifiedAt?: string;
  verificationTier?: 'gold' | 'silver' | 'bronze';
  verificationDocuments?: Array<{
    type: string;
    url: string;
    verified: boolean;
  }>;
  totalCalls: number;
  customerRating?: number;
  reviewCount: number;
  status: 'active' | 'suspended' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CreateBusinessRequest {
  companyName: string;
  legalName?: string;
  phoneNumberId?: number;
  category: string;
  subCategory?: string;
  description?: string;
  website?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  workingHours?: BusinessAccount['workingHours'];
  timezone?: string;
  callIntent?: string[];
}

export interface UpdateBusinessRequest {
  companyName?: string;
  description?: string;
  website?: string;
  email?: string;
  workingHours?: BusinessAccount['workingHours'];
  callIntent?: string[];
}

export interface VerificationDocument {
  type: string;
  url: string;
}

export interface VerificationDocumentsRequest {
  documents: VerificationDocument[];
}

// Get my business account
export const getMyBusiness = async (): Promise<BusinessAccount> => {
  const response = await apiClient.get('/business/me');
  return response.data;
};

// Get business by ID
export const getBusinessById = async (id: number): Promise<BusinessAccount> => {
  const response = await apiClient.get(`/business/${id}`);
  return response.data;
};

// Create business account
export const createBusiness = async (data: CreateBusinessRequest): Promise<BusinessAccount> => {
  const response = await apiClient.post('/business', data);
  return response.data;
};

// Update my business account
export const updateMyBusiness = async (data: UpdateBusinessRequest): Promise<BusinessAccount> => {
  const response = await apiClient.put('/business/me', data);
  return response.data;
};

// Get verified businesses
export const getVerifiedBusinesses = async (
  category?: string,
  limit: number = 20
): Promise<BusinessAccount[]> => {
  const response = await apiClient.get('/business', {
    params: { category, limit },
  });
  return response.data;
};

// Get business categories
export const getBusinessCategories = async (): Promise<string[]> => {
  const response = await apiClient.get('/business/categories/all');
  return response.data;
};

// Submit verification documents
export const submitVerificationDocuments = async (
  data: VerificationDocumentsRequest
): Promise<{ message: string }> => {
  const response = await apiClient.post('/business/me/verify', data);
  return response.data;
};
