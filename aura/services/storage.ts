
import { User, Message } from '../types';

const USERS_KEY = 'aura_chat_users';
const MESSAGES_KEY = 'aura_chat_messages';
const SESSION_KEY = 'aura_chat_session';

export const storage = {
  getUsers: (): User[] => {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveUser: (user: User) => {
    const users = storage.getUsers();
    if (!users.find(u => u.id === user.id)) {
      users.push(user);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
  },

  getMessages: (): Message[] => {
    const data = localStorage.getItem(MESSAGES_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveMessage: (message: Message) => {
    const messages = storage.getMessages();
    messages.push(message);
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
  },

  clearChat: (userId1: string, userId2: string) => {
    const messages = storage.getMessages();
    const remainingMessages = messages.filter(m => 
      !((m.senderId === userId1 && m.receiverId === userId2) || 
        (m.senderId === userId2 && m.receiverId === userId1))
    );
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(remainingMessages));
    window.dispatchEvent(new Event('storage')); // Trigger update across tabs
  },

  getSession: (): User | null => {
    const data = localStorage.getItem(SESSION_KEY);
    return data ? JSON.parse(data) : null;
  },

  setSession: (user: User | null) => {
    if (user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }
};
