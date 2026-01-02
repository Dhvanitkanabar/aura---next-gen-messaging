
export interface User {
  id: string;
  username: string;
  avatar: string;
  status: 'online' | 'offline';
  lastSeen?: string;
  email?: string;
  bio?: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'text' | 'image';
  timestamp: number;
  status: 'sent' | 'delivered' | 'read';
  mediaUrl?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export interface SignalData {
  from: string;
  to: string;
  type: 'offer' | 'answer' | 'candidate' | 'hangup';
  payload: any;
  timestamp: number;
}
