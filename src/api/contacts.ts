import apiClient from './client';

export interface CreateContactRequest {
  name: string;
  phoneNumber: string;
  isFavorite?: boolean;
  isBlocked?: boolean;
  tags?: string[];
}

export interface UpdateContactRequest {
  name?: string;
  isFavorite?: boolean;
  isBlocked?: boolean;
  tags?: string[];
}

export interface ContactResponse {
  id: number;
  userId: number;
  phoneNumberId: number;
  name: string;
  number: string;
  avatar?: string;
  isFavorite?: boolean;
  location?: string;
  tags?: string[];
  isBusiness?: boolean;
  isSpam?: boolean;
  spamReports?: number;
  trustLevel?: 'verified' | 'trusted' | 'neutral' | 'risky' | 'spam';
  riskScore?: 'low' | 'medium' | 'high' | 'critical';
  trustScore?: number;
  isVerified?: boolean;
  verificationTier?: 'gold' | 'silver' | 'bronze';
  createdAt: string;
  updatedAt: string;
}

export interface SyncContactsRequest {
  contacts: Array<{
    name: string;
    phoneNumber: string;
  }>;
}

export interface SyncContactsResponse {
  added: number;
  updated: number;
  failed: number;
  results: ContactResponse[];
}

// Get all contacts for current user
export const getContacts = async (
  isFavorite?: boolean,
  isBlocked?: boolean,
  limit: number = 100,
  offset: number = 0
): Promise<ContactResponse[]> => {
  const params: any = { limit, offset };
  if (isFavorite !== undefined) params.isFavorite = isFavorite;
  if (isBlocked !== undefined) params.isBlocked = isBlocked;

  const response = await apiClient.get('/contacts', { params });
  return response.data;
};

// Get a specific contact
export const getContactById = async (id: number): Promise<ContactResponse> => {
  const response = await apiClient.get(`/contacts/${id}`);
  return response.data;
};

// Create a new contact
export const createContact = async (data: CreateContactRequest): Promise<ContactResponse> => {
  const response = await apiClient.post('/contacts', data);
  return response.data;
};

// Update a contact
export const updateContact = async (id: number, data: UpdateContactRequest): Promise<ContactResponse> => {
  const response = await apiClient.patch(`/contacts/${id}`, data);
  return response.data;
};

// Delete a contact
export const deleteContact = async (id: number): Promise<void> => {
  await apiClient.delete(`/contacts/${id}`);
};

// Sync contacts from phone
export const syncContacts = async (data: SyncContactsRequest): Promise<SyncContactsResponse> {
  const response = await apiClient.post('/contacts/sync', data);
  return response.data;
};

// Toggle favorite status
export const toggleFavorite = async (id: number): Promise<ContactResponse> => {
  const response = await apiClient.post(`/contacts/${id}/favorite`);
  return response.data;
};

// Toggle block status
export const toggleBlock = async (id: number): Promise<ContactResponse> => {
  const response = await apiClient.post(`/contacts/${id}/block`);
  return response.data;
};

// Get favorite contacts
export const getFavoriteContacts = async (): Promise<ContactResponse[]> => {
  const response = await apiClient.get('/contacts', {
    params: { isFavorite: true, limit: 100 },
  });
  return response.data;
};

// Get blocked contacts
export const getBlockedContacts = async (): Promise<ContactResponse[]> => {
  const response = await apiClient.get('/contacts', {
    params: { isBlocked: true, limit: 100 },
  });
  return response.data;
};

// Search contacts
export const searchContacts = async (query: string): Promise<ContactResponse[]> => {
  const response = await apiClient.get('/contacts/search', {
    params: { q: query },
  });
  return response.data;
};
