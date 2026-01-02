
import React from 'react';
import { Message } from '../types';
import { format } from 'date-fns';
import { Check, CheckCheck } from 'lucide-react';

interface ChatBubbleProps {
  message: Message;
  isMe: boolean;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, isMe }) => {
  return (
    <div className={`flex w-full mb-4 ${isMe ? 'justify-end' : 'justify-start'}`}>
      <div 
        className={`max-w-[80%] px-4 py-3 shadow-md relative group animate-in slide-in-from-bottom-2 duration-300 ${
          isMe 
          ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-2xl rounded-tr-none' 
          : 'bg-white/80 backdrop-blur-sm text-slate-800 rounded-2xl rounded-tl-none border border-white/40'
        }`}
      >
        {message.type === 'image' && message.mediaUrl && (
          <div className="mb-2 overflow-hidden rounded-xl border border-white/20">
            <img 
              src={message.mediaUrl} 
              alt="Media content" 
              className="max-h-72 w-full object-cover cursor-pointer hover:scale-105 transition-transform duration-500"
              onClick={() => window.open(message.mediaUrl, '_blank')}
            />
          </div>
        )}
        
        <p className="text-[14px] font-medium leading-relaxed break-words whitespace-pre-wrap">
          {message.content}
        </p>
        
        <div className="flex items-center justify-end space-x-1.5 mt-2 opacity-70">
          <span className={`text-[9px] uppercase font-bold tracking-tighter ${isMe ? 'text-indigo-100' : 'text-slate-400'}`}>
            {format(message.timestamp, 'p')}
          </span>
          {isMe && (
            <span className="text-white">
              {message.status === 'sent' ? <Check size={10} /> : <CheckCheck size={10} />}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
