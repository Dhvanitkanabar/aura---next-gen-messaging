
import React, { useState } from 'react';
import { storage } from '../services/storage';
import { User } from '../types';
import { Sparkles, ArrowRight, ShieldCheck, Cpu } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password || (!isLogin && !email)) {
      setError('System requires all core parameters');
      return;
    }

    const users = storage.getUsers();
    
    if (isLogin) {
      const existingUser = users.find(u => u.username.toLowerCase() === username.toLowerCase());
      if (existingUser) {
        onLogin(existingUser);
      } else {
        setError('Frequency mismatch: Identity not found');
      }
    } else {
      const existingUser = users.find(u => u.username.toLowerCase() === username.toLowerCase());
      if (existingUser) {
        setError('Alias already claimed in this node');
      } else {
        const newUser: User = {
          id: Math.random().toString(36).substr(2, 9),
          username,
          email,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
          status: 'online',
          lastSeen: new Date().toISOString(),
          bio: 'Aura synchronized entity.'
        };
        storage.saveUser(newUser);
        onLogin(newUser);
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-[#020617] relative overflow-x-hidden">
      {/* Dynamic Background Elements */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-violet-600/10 rounded-full blur-[120px] animate-pulse delay-1000 pointer-events-none"></div>

      <div className="w-full max-w-lg z-10 scale-in-center px-6 py-12 md:py-24 my-auto">
        <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-8 md:p-12 rounded-[3rem] shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col items-center mb-10">
            <div className="relative group">
              <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-indigo-500 via-violet-600 to-fuchsia-600 rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl rotate-6 transform group-hover:rotate-0 transition-all duration-500 ease-out">
                <Sparkles className="text-white w-10 h-10 md:w-12 md:h-12" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tighter">Aura</h1>
            <div className="flex items-center gap-2 mt-3 text-indigo-400">
              <Cpu size={14} className="animate-spin" style={{ animationDuration: '3s' }} />
              <p className="text-[10px] uppercase font-bold tracking-[0.3em]">Neural Interface v3.0</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] px-1 flex items-center justify-between">
                  <span>Chosen Alias</span>
                  <span className="text-indigo-500/50">Required</span>
                </label>
                <input 
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/10 px-6 py-4 rounded-2xl text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-medium"
                  placeholder="e.g. CyberNexus"
                />
              </div>

              {!isLogin && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] px-1 flex items-center justify-between">
                    <span>Neural Link (Email)</span>
                    <span className="text-indigo-500/50">Sync Point</span>
                  </label>
                  <input 
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/[0.05] border border-white/10 px-6 py-4 rounded-2xl text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-medium"
                    placeholder="entity@network.aura"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] px-1 flex items-center justify-between">
                  <span>Access Cipher</span>
                  <ShieldCheck size={12} className="text-indigo-500/50" />
                </label>
                <input 
                  type="password"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/10 px-6 py-4 rounded-2xl text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-medium"
                  placeholder="••••••••••••"
                />
              </div>
            </div>
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 py-3 rounded-xl">
                <p className="text-red-400 text-[10px] font-bold text-center uppercase tracking-wider">{error}</p>
              </div>
            )}

            <button 
              type="submit"
              className="w-full aura-gradient text-white font-display font-bold py-5 rounded-[1.5rem] transition-all hover:scale-[1.01] hover:shadow-[0_0_30px_rgba(79,70,229,0.4)] active:scale-[0.98] shadow-2xl flex items-center justify-center group uppercase tracking-[0.25em] text-[10px]"
            >
              <span>{isLogin ? 'Establish Link' : 'Generate Identity'}</span>
              <ArrowRight className="ml-3 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-8 text-center border-t border-white/5 pt-8">
            <button 
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-slate-400 text-[9px] font-bold uppercase tracking-[0.3em] hover:text-indigo-400 transition-colors"
            >
              {isLogin ? "Need a neural core? Create Identity" : "Already exist? Synchronize Now"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
