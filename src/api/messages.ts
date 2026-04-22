import apiClient from './client';

export interface Thread {
  id: number;
  participantId: number;
  participantName: string;
  participantNumber: string;
  participantAvatar?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  isBlocked: boolean;
}

export interface Message {
  id: number;
  threadId: number;
  senderId: number;
  content: string;
  mediaUrl?: string;
  mediaType?: string;
  isRead: boolean;
  readAt?: string;
  reactions: MessageReaction[];
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MessageReaction {
  userId: number;
  emoji: string;
  createdAt: string;
}

export interface CreateThreadRequest {
  phoneNumber: string;
  initialMessage?: string;
}

export interface SendMessageRequest {
  content: string;
  mediaUrl?: string;
  mediaType?: string;
}

export interface ThreadResponse {
  id: number;
  userId: number;
  participantId: number;
  createdAt: string;
  updatedAt: string;
}

// Get all threads for current user
export const getThreads = async (): Promise<Thread[]> => {
  const response = await apiClient.get('/messages/threads');
  return response.data;
};

// Create a new thread
export const createThread = async (data: CreateThreadRequest): Promise<ThreadResponse> => {
  const response = await apiClient.post('/messages/threads', data);
  return response.data;
};

// Get or create thread with a phone number
export const getOrCreateThread = async (phoneNumber: string): Promise<Thread> => {
  const response = await apiClient.post('/messages/threads/find-or-create', { phoneNumber });
  return response.data;
};

// Get messages in a thread
export const getMessages = async (
  threadId: number,
  limit: number = 50,
  offset: number = 0
): Promise<Message[]> => {
  const response = await apiClient.get(`/messages/threads/${threadId}/messages`, {
    params: { limit, offset },
  });
  return response.data;
};

// Send a message
export const sendMessage = async (
  threadId: number,
  data: SendMessageRequest
): Promise<Message> => {
  const response = await apiClient.post(`/messages/threads/${threadId}/messages`, data);
  return response.data;
};

// Mark messages as read
export const markThreadAsRead = async (threadId: number): Promise<void> => {
  await apiClient.post(`/messages/threads/${threadId}/read`);
};

// Add reaction to message
export const addReaction = async (
  threadId: number,
  messageId: number,
  emoji: string
): Promise<Message> => {
  const response = await apiClient.post(
    `/messages/threads/${threadId}/messages/${messageId}/reaction`,
    { emoji }
  );
  return response.data;
};

// Edit message
export const editMessage = async (
  threadId: number,
  messageId: number,
  content: string
): Promise<Message> => {
  const response = await apiClient.patch(
    `/messages/threads/${threadId}/messages/${messageId}`,
    { content }
  );
  return response.data;
};

// Delete message
export const deleteMessage = async (threadId: number, messageId: number): Promise<void> => {
  await apiClient.delete(`/messages/threads/${threadId}/messages/${messageId}`);
};

// Archive thread
export const archiveThread = async (threadId: number): Promise<void> => {
  await apiClient.post(`/messages/threads/${threadId}/archive`);
};

// Unarchive thread
export const unarchiveThread = async (threadId: number): Promise<void> => {
  await apiClient.post(`/messages/threads/${threadId}/unarchive`);
};

// Block thread
export const blockThread = async (threadId: number): Promise<void> => {
  await apiClient.post(`/messages/threads/${threadId}/block`);
};

// Get unread message count
export const getUnreadCount = async (): Promise<number> => {
  const response = await apiClient.get('/messages/unread-count');
  return response.data.count;
};
