
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, Message, SignalData } from './types';
import { storage } from './services/storage';
import { getGeminiResponse } from './services/geminiService';
import { AI_BOT, SYSTEM_USER_ID } from './constants';
import { createAudioBlob } from './services/audioUtils';
import Auth from './components/Auth';
import UserItem from './components/UserItem';
import ChatBubble from './components/ChatBubble';
import VideoCallOverlay from './components/VideoCallOverlay';
import EmojiPicker from './components/EmojiPicker';
import { GoogleGenAI, Modality } from '@google/genai';
import { 
  Search, 
  MoreVertical, 
  Paperclip, 
  Smile, 
  Send, 
  LogOut, 
  Sparkles,
  Mic,
  MicOff,
  Video,
  Plus,
  Trash2,
  User as UserIcon,
  X,
  Info,
  Layers,
  SearchCode
} from 'lucide-react';
import { ref, set, onValue, onChildAdded, update } from "firebase/database";
import { db } from "./firebase";

const SIGNAL_KEY = 'aura_chat_signal';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(storage.getSession());
  const [users, setUsers] = useState<User[]>([AI_BOT]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [msgSearchQuery, setMsgSearchQuery] = useState('');
  const [isSearchingMessages, setIsSearchingMessages] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'receiving' | 'connected'>('idle');
  const [callRemoteUser, setCallRemoteUser] = useState<User | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const liveSessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);

  // --- REAL-TIME CLOUD SYNC LOGIC ---
  const refreshData = () => {
    const allUsers = storage.getUsers();
    if (currentUser) {
      const otherUsers = allUsers.filter(u => u.id !== currentUser.id);
      const userList = [AI_BOT, ...otherUsers.filter(u => u.id !== AI_BOT.id)];
      setUsers(userList);
    }
  };
  // This logic updates the status to 'delivered' (Double Tick) when the receiver sees it
useEffect(() => {
  if (!currentUser || messages.length === 0) return;

  // Filter messages that were sent TO the current user and are currently only 'sent'
  const incomingUnread = messages.filter(
    m => m.receiverId === currentUser.id && m.status === 'sent'
  );

  // Mark them as delivered in the cloud database
  incomingUnread.forEach(msg => {
    update(ref(db, 'global_packets/' + msg.id), { status: 'delivered' });
  });
}, [messages, currentUser]);
  
  useEffect(() => {
  if (!selectedUser || !currentUser) return;

  // When I open a chat, mark all messages from that person as 'read'
  const chatMessagesToMarkRead = messages.filter(
    m => m.senderId === selectedUser.id && m.status === 'delivered'
  );

  chatMessagesToMarkRead.forEach(msg => {
    update(ref(db, 'global_packets/' + msg.id), { status: 'read' });
  });
  }, [selectedUser, messages, currentUser]);
  

  useEffect(() => {
    if (!currentUser) return;

    // 1. Initial Load of Users (Local is fine for this)
    const allUsers = storage.getUsers();
    const otherUsers = allUsers.filter(u => u.id !== currentUser.id);
    setUsers([AI_BOT, ...otherUsers.filter(u => u.id !== AI_BOT.id)]);

    // 2. Start Listening to the Firebase Cloud
    const packetsRef = ref(db, 'global_packets');
    
    const unsubscribe = onValue(packetsRef, (snapshot) => {
      const cloudData = snapshot.val();
      
      if (cloudData) {
        // Firebase gives us an object, so we convert it into an array
        const cloudMessages: Message[] = Object.values(cloudData);
        
        // Sort them so they appear in the right order (oldest to newest)
        const sortedMessages = cloudMessages.sort((a, b) => a.timestamp - b.timestamp);
        
        // Update the screen and the local backup
        setMessages(sortedMessages);
        localStorage.setItem('aura_chat_messages', JSON.stringify(sortedMessages));
      } else {
        // If the cloud is empty, use what we have locally
        setMessages(storage.getMessages());
      }
    });

    // This stops the listener if the user logs out
    return () => unsubscribe();
  }, [currentUser]);

  // Keep this part exactly as it was for your UI menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sendSignal = (to: string, type: SignalData['type'], payload: any) => {
    if (!currentUser) return;
    const signal: SignalData = { from: currentUser.id, to, type, payload, timestamp: Date.now() };
    localStorage.setItem(SIGNAL_KEY, JSON.stringify(signal));
  };

  const startCall = async () => {
    if (!selectedUser || !currentUser) return;
    if (selectedUser.id === SYSTEM_USER_ID) return alert("Aura AI only takes audio input via dictation!");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      setCallRemoteUser(selectedUser);
      setCallStatus('calling');
      const pc = initPeerConnection(selectedUser.id);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendSignal(selectedUser.id, 'offer', offer);
    } catch (err) { alert("Camera access required."); }
  };

  const initPeerConnection = (remoteUserId: string) => {
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    pc.onicecandidate = (event) => { if (event.candidate) sendSignal(remoteUserId, 'candidate', event.candidate); };
    pc.ontrack = (event) => { setRemoteStream(event.streams[0]); setCallStatus('connected'); };
    peerConnection.current = pc;
    return pc;
  };

  const acceptCall = async () => {
    const signal = (window as any)._pendingOffer as SignalData;
    if (!signal || !currentUser) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      setCallStatus('connected');
      const pc = initPeerConnection(signal.from);
      stream.getTracks().forEach(track => track.stop()); // Just an example fix for stream
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      await pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sendSignal(signal.from, 'answer', answer);
    } catch (err) { endCall(); }
  };

  const endCall = (locallyStarted = true) => {
    if (locallyStarted && callRemoteUser) sendSignal(callRemoteUser.id, 'hangup', null);
    if (peerConnection.current) { peerConnection.current.close(); peerConnection.current = null; }
    if (localStream) { localStream.getTracks().forEach(track => track.stop()); setLocalStream(null); }
    setRemoteStream(null); setCallStatus('idle'); setCallRemoteUser(null); setIsCameraOff(false); setIsMuted(false); (window as any)._pendingOffer = null;
  };

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SIGNAL_KEY && e.newValue && currentUser) {
        const signal: SignalData = JSON.parse(e.newValue);
        if (signal.to !== currentUser.id) return;
        if (signal.type === 'offer') {
          const sender = users.find(u => u.id === signal.from);
          if (sender) { setCallRemoteUser(sender); setCallStatus('receiving'); (window as any)._pendingOffer = signal; }
        } else if (signal.type === 'answer') {
          peerConnection.current?.setRemoteDescription(new RTCSessionDescription(signal.payload));
          setCallStatus('connected');
        } else if (signal.type === 'candidate') {
          peerConnection.current?.addIceCandidate(new RTCIceCandidate(signal.payload)).catch(console.error);
        } else if (signal.type === 'hangup') { endCall(false); }
      }
      if (e.key === 'aura_chat_session' && !e.newValue) setCurrentUser(null);
      refreshData();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [currentUser, users, callStatus]);

  const toggleDictation = async () => {
    if (isRecording) { stopRecording(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioContext;
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: { responseModalities: [Modality.AUDIO], inputAudioTranscription: {}, },
        callbacks: {
          onopen: () => {
            setIsRecording(true);
            const source = audioContext.createMediaStreamSource(stream);
            const processor = audioContext.createScriptProcessor(4096, 1, 1);
            processor.onaudioprocess = (e) => {
              const pcmBlob = createAudioBlob(e.inputBuffer.getChannelData(0));
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(processor); processor.connect(audioContext.destination);
            (window as any)._audioProcessor = processor;
          },
          onmessage: (msg) => { if (msg.serverContent?.inputTranscription) setInputText(p => p + (p.endsWith(' ') || p === '' ? '' : ' ') + msg.serverContent!.inputTranscription!.text); },
          onerror: () => stopRecording(), onclose: () => stopRecording(),
        }
      });
      liveSessionRef.current = sessionPromise;
    } catch (err) { alert("Microphone access required."); }
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (audioContextRef.current) { audioContextRef.current.close(); audioContextRef.current = null; }
    if (liveSessionRef.current) { liveSessionRef.current.then((s: any) => s.close()); liveSessionRef.current = null; }
  };

  // Inside sendMessage function in Aura/App.tsx
// Inside aura---next-gen-messaging/App.tsx
const sendMessage = async (type: 'text' | 'image' = 'text', mediaUrl?: string) => {
  if (!inputText.trim() && !mediaUrl) return;
  if (!currentUser || !selectedUser) return;

  const newMessage: any = { 
    id: 'PKT-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    senderId: currentUser.id, 
    receiverId: selectedUser.id, 
    content: inputText, 
    type, 
    timestamp: Date.now(), 
    status: 'sent' // Represents the single grey tick (successfully in cloud)
  };

  if (mediaUrl) newMessage.mediaUrl = mediaUrl;

  try {
    await set(ref(db, 'global_packets/' + newMessage.id), newMessage);
    setInputText('');
  } catch (error) {
    console.error("Firebase Sync Error:", error);
  }
};

  const clearCurrentChat = () => {
    if (currentUser && selectedUser) {
      if (confirm(`Clear all neural logs for ${selectedUser.username}? This action is irreversible.`)) {
        storage.clearChat(currentUser.id, selectedUser.id);
        setShowMoreMenu(false);
        refreshData();
      }
    }
  };

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping, selectedUser]);
  const filteredUsers = useMemo(() => users.filter(u => u.username.toLowerCase().includes(searchTerm.toLowerCase())), [users, searchTerm]);
  
  const currentChatMessages = useMemo(() => {
    if (!selectedUser || !currentUser) return [];
    let msgs = messages.filter(m => (m.senderId === currentUser.id && m.receiverId === selectedUser.id) || (m.senderId === selectedUser.id && m.receiverId === currentUser.id));
    if (isSearchingMessages && msgSearchQuery) {
      msgs = msgs.filter(m => m.content.toLowerCase().includes(msgSearchQuery.toLowerCase()));
    }
    return msgs;
  }, [messages, selectedUser, currentUser, isSearchingMessages, msgSearchQuery]);

  const unreadCounts = useMemo(() => {
  const counts: Record<string, number> = {};
  if (!currentUser) return counts;

  messages.forEach(m => {
    // Only count messages sent TO me that are NOT 'read' yet
    if (m.receiverId === currentUser.id && m.status !== 'read') {
      counts[m.senderId] = (counts[m.senderId] || 0) + 1;
    }
  });
  return counts;
}, [messages, currentUser]);

  if (!currentUser) return <Auth onLogin={(user) => { setCurrentUser(user); storage.setSession(user); refreshData(); }} />;

  return (
    <div className="flex h-screen bg-[#020617] overflow-hidden p-3 md:p-4 gap-4">
      {callStatus !== 'idle' && callRemoteUser && (
        <VideoCallOverlay
          remoteUser={callRemoteUser}
          localStream={localStream}
          remoteStream={remoteStream}
          isCameraOff={isCameraOff}
          isMuted={isMuted}
          onHangup={() => endCall(true)}
          onToggleCamera={() => { if (localStream) { const v = localStream.getVideoTracks()[0]; v.enabled = !v.enabled; setIsCameraOff(!v.enabled); } }}
          onToggleMute={() => { if (localStream) { const a = localStream.getAudioTracks()[0]; a.enabled = !a.enabled; setIsMuted(!a.enabled); } }}
          callStatus={callStatus}
          onAccept={acceptCall}
        />
      )}

      {/* Aura Sidebar */}
      <div className="w-80 flex-shrink-0 flex flex-col bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden">
        <header className="p-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative group cursor-pointer">
              <div className="absolute inset-0 bg-indigo-500 rounded-2xl blur-md opacity-0 group-hover:opacity-20 transition-opacity"></div>
              <img src={currentUser.avatar} alt="Profile" className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-500/20 shadow-xl group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-[#020617] rounded-full"></div>
            </div>
            <div>
              <h2 className="font-display font-bold text-white leading-none text-lg tracking-tight">{currentUser.username}</h2>
              <span className="text-[9px] uppercase font-black text-indigo-400 tracking-[0.3em] mt-1.5 inline-block opacity-80">Online Node</span>
            </div>
          </div>
          <button onClick={() => { storage.setSession(null); setCurrentUser(null); setSelectedUser(null); }} className="p-3 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-2xl transition-all">
            <LogOut size={18} />
          </button>
        </header>

        <div className="px-6 mb-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Search Identity" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full bg-white/[0.03] border border-white/5 py-3.5 pl-11 pr-4 rounded-2xl focus:outline-none focus:bg-white/[0.07] focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-medium text-white placeholder-slate-600" 
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 space-y-1.5 pb-4">
  <div className="px-5 py-2 mb-2 text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] opacity-60">Synchronized Links</div>
  {filteredUsers.length > 0 ? filteredUsers.map(user => (
    <div key={user.id} onClick={() => setSelectedUser(user)} className={`group relative px-5 py-4 cursor-pointer rounded-[1.5rem] transition-all duration-300 ${selectedUser?.id === user.id ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-600/30 -translate-y-0.5 scale-[1.02]' : 'hover:bg-white/[0.03]'}`}>
      <div className="flex items-center gap-4">
        <img src={user.avatar} className="w-12 h-12 rounded-2xl object-cover shadow-lg" alt="" />
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-baseline">
            <span className={`font-bold text-sm truncate tracking-tight ${selectedUser?.id === user.id ? 'text-white' : 'text-slate-200'}`}>{user.username}</span>
            {/* ADDED: Unread Badge Logic */}
            {unreadCounts[user.id] > 0 && selectedUser?.id !== user.id ? (
              <span className="bg-green-500 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 animate-in zoom-in">
                {unreadCounts[user.id]}
              </span>
            ) : (
              <span className={`text-[9px] font-bold ${selectedUser?.id === user.id ? 'text-indigo-100' : 'text-slate-500'}`}>NODE</span>
            )}
          </div>
          <p className={`text-xs truncate font-medium mt-0.5 ${selectedUser?.id === user.id ? 'text-indigo-100/80' : 'text-slate-500'}`}>
            {user.id === SYSTEM_USER_ID ? "AI Module Active" : "Link Established"}
          </p>
        </div>
      </div>
    </div>
  )) : (
    <div className="p-12 text-center">
      <div className="inline-flex p-4 rounded-3xl bg-white/[0.02] text-slate-600 mb-4"><Search size={24} /></div>
      <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">No nodes found</p>
    </div>
  )}
</div>
      </div>

      {/* Main Experience Area */}
      <div className="flex-1 flex flex-col bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden relative">
        {selectedUser ? (
          <>
            <header className="h-24 flex items-center justify-between px-10 border-b border-white/[0.05] z-10 bg-white/[0.01]">
              <div className="flex items-center gap-5">
                <div className="relative">
                  <img src={selectedUser.avatar} className="w-14 h-14 rounded-2xl shadow-2xl border border-white/10" alt="" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-[#020617] rounded-full"></div>
                </div>
                <div>
                  <h3 className="font-display font-bold text-white tracking-tight text-xl">{selectedUser.username}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{isTyping ? 'Synthesizing...' : 'Link Synchronized'}</span>
                  </div>
                </div>
              </div>

              {isSearchingMessages ? (
                <div className="flex-1 max-w-md mx-8 animate-in slide-in-from-top-4 duration-500">
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500"><SearchCode size={18} /></div>
                    <input 
                      autoFocus
                      type="text" 
                      placeholder="Scanning neural logs..." 
                      className="w-full bg-white/[0.05] border border-indigo-500/30 px-12 py-3 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none text-white font-medium transition-all"
                      value={msgSearchQuery}
                      onChange={(e) => setMsgSearchQuery(e.target.value)}
                    />
                    <button 
                      onClick={() => { setIsSearchingMessages(false); setMsgSearchQuery(''); }} 
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-xl text-slate-400 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="flex items-center gap-4 relative">
                <button onClick={startCall} className="p-3.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-2xl transition-all" title="Initialize Call">
                  <Video size={22} />
                </button>
                <button 
                  onClick={() => setIsSearchingMessages(!isSearchingMessages)} 
                  className={`p-3.5 rounded-2xl transition-all ${isSearchingMessages ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10'}`} 
                  title="Scan Logs"
                >
                  <Search size={22} />
                </button>
                <div ref={moreMenuRef} className="relative">
                  <button 
                    onClick={() => setShowMoreMenu(!showMoreMenu)} 
                    className={`p-3.5 rounded-2xl transition-all ${showMoreMenu ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/[0.05]'}`}
                  >
                    <MoreVertical size={22} />
                  </button>
                  
                  {showMoreMenu && (
                    <div className="absolute top-16 right-0 w-64 bg-[#0f172a] rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 py-3 z-50 animate-in fade-in zoom-in-95 duration-300">
                      <div className="px-5 py-3 border-b border-white/5 mb-2">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Node Operations</p>
                      </div>
                      <button className="w-full px-5 py-3.5 flex items-center gap-4 hover:bg-white/[0.03] text-slate-300 text-sm font-bold transition-colors">
                        <UserIcon size={18} className="text-indigo-500" />
                        Aura Identity Profile
                      </button>
                      <button className="w-full px-5 py-3.5 flex items-center gap-4 hover:bg-white/[0.03] text-slate-300 text-sm font-bold transition-colors">
                        <Layers size={18} className="text-indigo-500" />
                        Neural History
                      </button>
                      <button className="w-full px-5 py-3.5 flex items-center gap-4 hover:bg-white/[0.03] text-slate-300 text-sm font-bold transition-colors">
                        <Info size={18} className="text-indigo-500" />
                        Protocol Info
                      </button>
                      <div className="h-px bg-white/5 my-2 mx-3"></div>
                      <button 
                        onClick={clearCurrentChat}
                        className="w-full px-5 py-4 flex items-center gap-4 hover:bg-red-500/10 text-red-400 text-sm font-black transition-colors uppercase tracking-widest"
                      >
                        <Trash2 size={18} />
                        Purge Aura Logs
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto px-10 py-8 space-y-3 bg-gradient-to-b from-transparent to-[#020617]/40">
              {isSearchingMessages && currentChatMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 opacity-40">
                  <SearchCode size={48} className="text-indigo-500 mb-4" />
                  <p className="text-white text-xs font-black uppercase tracking-[0.3em]">No matching neural patterns</p>
                </div>
              )}
              {currentChatMessages.map(msg => <ChatBubble key={msg.id} message={msg} isMe={msg.senderId === currentUser.id} />)}
              {isTyping && (
                <div className="flex justify-start animate-in fade-in duration-500">
                  <div className="bg-white/5 backdrop-blur-md px-6 py-4 rounded-3xl rounded-tl-none shadow-xl flex items-center gap-2.5 border border-white/5">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <footer className="p-8 bg-white/[0.01] flex items-center gap-5 border-t border-white/[0.05] backdrop-blur-lg">
              <div className="flex items-center gap-1.5" ref={emojiPickerRef}>
                <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`p-3.5 rounded-2xl transition-all ${showEmojiPicker ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
                  <Smile size={24} />
                </button>
                {showEmojiPicker && <EmojiPicker onSelect={(e) => setInputText(p => p + e)} onClose={() => setShowEmojiPicker(false)} />}
                <label className="p-3.5 text-slate-500 hover:text-white hover:bg-white/5 rounded-2xl cursor-pointer transition-all">
                  <Paperclip size={24} />
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onloadend = () => sendMessage('image', r.result as string); r.readAsDataURL(f); } }} />
                </label>
                <button onClick={toggleDictation} className={`p-3.5 rounded-2xl transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse shadow-2xl shadow-red-500/30' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
                  {isRecording ? <MicOff size={24} /> : <Mic size={24} />}
                </button>
              </div>
              <div className="flex-1 relative">
                <input 
                  type="text" 
                  placeholder={isRecording ? "Transcribing neural input..." : "Transmit your intent..."} 
                  className="w-full bg-white/[0.03] border border-white/10 px-8 py-5 rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white/[0.06] focus:border-indigo-500 transition-all font-medium text-white placeholder-slate-600 shadow-inner" 
                  value={inputText} 
                  onChange={(e) => setInputText(e.target.value)} 
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()} 
                />
              </div>
              <button 
                onClick={() => sendMessage()} 
                disabled={!inputText.trim()} 
                className={`p-5 rounded-[1.8rem] shadow-2xl transition-all transform active:scale-95 ${inputText.trim() ? 'aura-gradient text-white shadow-indigo-500/40 hover:scale-105 hover:brightness-110' : 'bg-white/5 text-slate-700 cursor-not-allowed'}`}
              >
                <Send size={24} />
              </button>
            </footer>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-[#020617]/20">
            <div className="relative mb-16">
              <div className="w-64 h-64 aura-gradient rounded-full opacity-10 blur-[100px] absolute animate-pulse"></div>
              <div className="w-48 h-48 bg-white/[0.03] shadow-[0_0_80px_rgba(0,0,0,0.4)] rounded-[3rem] flex items-center justify-center relative border border-white/10 animate-float">
                <Sparkles size={100} className="aura-text-gradient opacity-80" />
              </div>
            </div>
            <h1 className="text-6xl font-display font-bold text-white tracking-tighter mb-6 bg-gradient-to-r from-white via-indigo-200 to-white bg-clip-text text-transparent">Welcome to the Aura</h1>
            <p className="text-slate-500 max-w-md leading-relaxed font-medium text-lg">Synchronize your consciousness with other identities or interact with the core AI intelligence.</p>
            <button 
              onClick={() => {}} 
              className="mt-12 px-10 py-5 aura-gradient text-white rounded-[1.8rem] font-bold shadow-2xl shadow-indigo-500/30 flex items-center gap-4 hover:scale-105 transition-all duration-300 uppercase tracking-[0.2em] text-xs"
            >
              <Plus size={20} className="text-white" />
              <span>Initiate Sync</span>
            </button>
            <div className="mt-20 flex items-center gap-4 opacity-30 grayscale hover:grayscale-0 transition-all cursor-default">
              <div className="h-px w-12 bg-indigo-500"></div>
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.5em]">System Protocols v3.0</span>
              <div className="h-px w-12 bg-indigo-500"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
