
import React, { useEffect, useRef } from 'react';
import { Camera, CameraOff, Mic, MicOff, PhoneOff, Phone, User as UserIcon } from 'lucide-react';
import { User } from '../types';

interface VideoCallOverlayProps {
  remoteUser: User;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isCameraOff: boolean;
  isMuted: boolean;
  onHangup: () => void;
  onToggleCamera: () => void;
  onToggleMute: () => void;
  callStatus: 'calling' | 'receiving' | 'connected';
  onAccept?: () => void;
}

const VideoCallOverlay: React.FC<VideoCallOverlayProps> = ({
  remoteUser,
  localStream,
  remoteStream,
  isCameraOff,
  isMuted,
  onHangup,
  onToggleCamera,
  onToggleMute,
  callStatus,
  onAccept
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center text-white select-none">
      {/* Remote Video (Full Screen) */}
      <div className="absolute inset-0 overflow-hidden flex items-center justify-center bg-slate-900">
        {remoteStream && callStatus === 'connected' ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
            <div className="relative">
              <img 
                src={remoteUser.avatar} 
                className="w-32 h-32 md:w-48 md:h-48 rounded-full border-4 border-slate-700 shadow-2xl mb-6 object-cover" 
                alt={remoteUser.username} 
              />
              {callStatus === 'receiving' && (
                <div className="absolute inset-0 rounded-full border-4 border-green-500 animate-ping opacity-40"></div>
              )}
            </div>
            <h2 className="text-3xl font-bold tracking-tight">{remoteUser.username}</h2>
            <p className="text-slate-400 mt-3 text-lg font-medium">
              {callStatus === 'calling' ? 'Calling...' : 
               callStatus === 'receiving' ? 'Incoming Video Call' : 
               'Connecting...'}
            </p>
          </div>
        )}
      </div>

      {/* Local Video (Floating) */}
      <div className="absolute top-8 right-8 w-36 h-52 md:w-56 md:h-80 bg-slate-800 rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-700/50 z-10 transition-all duration-300 ring-4 ring-black/20">
        {localStream && !isCameraOff ? (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800">
            <div className="p-4 bg-slate-700 rounded-full mb-2">
              <UserIcon size={32} className="text-slate-400" />
            </div>
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Video Off</span>
          </div>
        )}
      </div>

      {/* Call Controls Container */}
      <div className="absolute bottom-16 left-0 right-0 flex justify-center z-20 px-4">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-4 md:p-6 rounded-[2.5rem] shadow-2xl flex items-center space-x-4 md:space-x-10 px-8 md:px-12">
          
          {callStatus === 'receiving' ? (
            <div className="flex items-center space-x-12">
              <div className="flex flex-col items-center space-y-2">
                <button
                  onClick={onAccept}
                  aria-label="Accept call"
                  className="p-6 bg-green-500 hover:bg-green-600 rounded-full transition-all shadow-lg hover:scale-110 active:scale-95 group animate-bounce"
                >
                  <Phone size={32} fill="currentColor" />
                </button>
                <span className="text-xs font-semibold text-green-400 uppercase tracking-wider">Accept</span>
              </div>
              
              <div className="flex flex-col items-center space-y-2">
                <button
                  onClick={onHangup}
                  aria-label="Decline call"
                  className="p-6 bg-red-500 hover:bg-red-600 rounded-full transition-all shadow-lg hover:scale-110 active:scale-95 group"
                >
                  <PhoneOff size={32} />
                </button>
                <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Decline</span>
              </div>
            </div>
          ) : (
            <>
              {/* Mute Button */}
              <div className="flex flex-col items-center space-y-2">
                <button
                  onClick={onToggleMute}
                  aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
                  className={`p-4 md:p-5 rounded-full transition-all shadow-lg flex items-center justify-center ${
                    isMuted 
                    ? 'bg-red-500 text-white hover:bg-red-600' 
                    : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                </button>
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{isMuted ? 'Unmute' : 'Mute'}</span>
              </div>

              {/* Hangup Button */}
              <div className="flex flex-col items-center space-y-2">
                <button
                  onClick={onHangup}
                  aria-label="End call"
                  className="p-6 md:p-7 bg-red-600 hover:bg-red-700 rounded-full transition-all shadow-xl transform hover:scale-110 active:scale-90 flex items-center justify-center"
                >
                  <PhoneOff size={32} />
                </button>
                <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">End</span>
              </div>

              {/* Camera Button */}
              <div className="flex flex-col items-center space-y-2">
                <button
                  onClick={onToggleCamera}
                  aria-label={isCameraOff ? "Turn camera on" : "Turn camera off"}
                  className={`p-4 md:p-5 rounded-full transition-all shadow-lg flex items-center justify-center ${
                    isCameraOff 
                    ? 'bg-red-500 text-white hover:bg-red-600' 
                    : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  {isCameraOff ? <CameraOff size={24} /> : <Camera size={24} />}
                </button>
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{isCameraOff ? 'Camera On' : 'Camera Off'}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Connection Info (Optional Header) */}
      <div className="absolute top-0 left-0 right-0 p-8 flex justify-center pointer-events-none">
        <div className="bg-black/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/5 flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-medium text-slate-200 tracking-wide">End-to-End Encrypted</span>
        </div>
      </div>
    </div>
  );
};

export default VideoCallOverlay;
