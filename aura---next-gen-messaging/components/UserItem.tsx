
import React from 'react';
import { User } from '../types';

interface UserItemProps {
  user: User;
  active: boolean;
  lastMessage?: string;
  onClick: () => void;
}

const UserItem: React.FC<UserItemProps> = ({ user, active, lastMessage, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center p-3 cursor-pointer transition-colors hover:bg-slate-50 ${active ? 'bg-slate-100' : ''}`}
    >
      <div className="relative">
        <img 
          src={user.avatar} 
          alt={user.username} 
          className="w-12 h-12 rounded-full object-cover border border-slate-200"
        />
        {user.status === 'online' && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
        )}
      </div>
      <div className="ml-4 flex-1 overflow-hidden">
        <div className="flex justify-between items-baseline">
          <h3 className="font-semibold text-slate-800 truncate">{user.username}</h3>
          <span className="text-xs text-slate-400">12:00</span>
        </div>
        <p className="text-sm text-slate-500 truncate mt-0.5">
          {lastMessage || (user.id === 'gemini-ai-bot' ? 'Ask me anything!' : 'No messages yet')}
        </p>
      </div>
    </div>
  );
};

export default UserItem;
