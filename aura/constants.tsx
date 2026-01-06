
import React from 'react';
import { User } from './types';

export const SYSTEM_USER_ID = 'aura-ai-intelligence';

export const AI_BOT: User = {
  id: SYSTEM_USER_ID,
  username: 'Aura AI',
  avatar: 'https://images.unsplash.com/photo-1675271591211-126ad94e495d?q=80&w=200&h=200&auto=format&fit=crop',
  status: 'online',
  lastSeen: 'Active Intellect'
};

export const COLORS = {
  aura_primary: '#4f46e5',
  aura_secondary: '#7c3aed',
  aura_accent: '#06b6d4',
  bubble_me: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
  bubble_other: '#ffffff'
};
