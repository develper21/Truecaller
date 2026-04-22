import { io, Socket } from 'socket.io-client';
import { API_BASE_URL, getAuthToken } from './client';

export interface CallStartData {
  callerNumber: string;
  calleeNumber: string;
  callId?: string;
}

export interface CallerInfoResponse {
  callId: string;
  callerNumber: string;
  name?: string;
  businessName?: string;
  trustLevel: 'verified' | 'trusted' | 'neutral' | 'risky' | 'spam';
  riskScore: number;
  isSpam: boolean;
  spamReasons?: string[];
  location?: string;
  avatar?: string;
  category?: string;
}

export interface CallEndData {
  callId: string;
  duration: number;
  isSpam?: boolean;
}

export type CallStatus = 'started' | 'accepted' | 'rejected' | 'ended';

// Socket instance
let socket: Socket | null = null;

// Event handlers storage
const eventHandlers: Map<string, Set<Function>> = new Map();

// Initialize WebSocket connection
export const initializeSocket = async (): Promise<Socket> => {
  if (socket?.connected) {
    return socket;
  }

  const token = await getAuthToken();
  
  socket = io(`${API_BASE_URL}/calls`, {
    auth: {
      token: token ? `Bearer ${token}` : undefined,
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  // Set up default event listeners
  socket.on('connect', () => {
    console.log('WebSocket connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('WebSocket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('WebSocket connection error:', error.message);
  });

  // Handle incoming call overlay
  socket.on('call:overlay', (data: CallerInfoResponse) => {
    console.log('Incoming call:', data);
    triggerEventHandlers('call:overlay', data);
  });

  // Handle call status updates
  socket.on('call:status', (data: { callId: string; status: CallStatus }) => {
    console.log('Call status:', data);
    triggerEventHandlers('call:status', data);
  });

  // Handle call completion
  socket.on('call:completed', (data: { callId: string }) => {
    console.log('Call completed:', data);
    triggerEventHandlers('call:completed', data);
  });

  // Handle errors
  socket.on('call:error', (error: { message: string }) => {
    console.error('Call error:', error);
    triggerEventHandlers('call:error', error);
  });

  return socket;
};

// Disconnect WebSocket
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
    eventHandlers.clear();
  }
};

// Check if socket is connected
export const isSocketConnected = (): boolean => {
  return socket?.connected || false;
};

// Send incoming call notification to server
export const notifyIncomingCall = (data: CallStartData): void => {
  if (!socket?.connected) {
    console.warn('Socket not connected, cannot notify incoming call');
    return;
  }
  socket.emit('call:incoming', data);
};

// Accept call
export const acceptCall = (callId: string): void => {
  if (!socket?.connected) return;
  socket.emit('call:accepted', { callId });
};

// Reject call
export const rejectCall = (callId: string, reason?: string): void => {
  if (!socket?.connected) return;
  socket.emit('call:rejected', { callId, reason });
};

// End call
export const endCall = (data: CallEndData): void => {
  if (!socket?.connected) return;
  socket.emit('call:ended', data);
};

// Report spam during call
export const reportSpamFromCall = (
  callId: string,
  category: string,
  reason: string
): void => {
  if (!socket?.connected) return;
  socket.emit('call:report_spam', { callId, category, reason });
};

// Update user status
export const updateUserStatus = (status: 'available' | 'busy' | 'dnd'): void => {
  if (!socket?.connected) return;
  socket.emit('user:status', { status });
};

// Event subscription helpers
export const onIncomingCall = (handler: (data: CallerInfoResponse) => void): (() => void) => {
  return subscribeToEvent('call:overlay', handler);
};

export const onCallStatusChange = (
  handler: (data: { callId: string; status: CallStatus }) => void
): (() => void) => {
  return subscribeToEvent('call:status', handler);
};

export const onCallCompleted = (handler: (data: { callId: string }) => void): (() => void) => {
  return subscribeToEvent('call:completed', handler);
};

export const onCallError = (handler: (error: { message: string }) => void): (() => void) => {
  return subscribeToEvent('call:error', handler);
};

// Subscribe to an event
function subscribeToEvent(event: string, handler: Function): () => void {
  if (!eventHandlers.has(event)) {
    eventHandlers.set(event, new Set());
  }
  eventHandlers.get(event)!.add(handler);

  // Return unsubscribe function
  return () => {
    eventHandlers.get(event)?.delete(handler);
  };
}

// Trigger all handlers for an event
function triggerEventHandlers(event: string, data: any): void {
  const handlers = eventHandlers.get(event);
  if (handlers) {
    handlers.forEach((handler) => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in ${event} handler:`, error);
      }
    });
  }
}

// Get socket instance (for advanced use)
export const getSocket = (): Socket | null => socket;
