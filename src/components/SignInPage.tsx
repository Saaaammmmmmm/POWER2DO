import React, { useState } from 'react';
import { Mail, Shield, Check, Info, Lock, LogIn } from 'lucide-react';
import { auth, isFirebaseConfigured, localAuth } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

const persistSignedInUser = (email: string) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('power_todo_user', email);
};

interface SignInPageProps {
  onSignIn: (email: string) => void;
  currentUserEmail: string;
}

export default function SignInPage({ onSignIn, currentUserEmail }: SignInPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const targetEmail = email.trim();
    const targetPassword = password.trim();

    if (!targetEmail || !targetPassword) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    try {
      if (isFirebaseConfigured && auth) {
        try {
          await signInWithEmailAndPassword(auth, targetEmail, targetPassword);
          persistSignedInUser(targetEmail);
          onSignIn(targetEmail);
        } catch (fbErr: any) {
          // Self-healing credential provider: If user logs in with the required samdonckels@gmail.com/Doing4ever! account
          // but the Firebase Auth project is empty/has not signed them up, auto-register them seamlessly on-the-fly.
          const isTargetCreds = targetEmail === 'samdonckels@gmail.com' && targetPassword === 'Doing4ever!';
          const isUserNotFound = fbErr.code === 'auth/user-not-found' || fbErr.code === 'auth/invalid-credential' || fbErr.code === 'auth/invalid-login-credentials';
          if (isTargetCreds && isUserNotFound) {
            try {
              await createUserWithEmailAndPassword(auth, targetEmail, targetPassword);
              persistSignedInUser(targetEmail);
              onSignIn(targetEmail);
              return;
            } catch (createErr) {
              console.error('Auto-creation of requested credentials failed:', createErr);
            }
          }
          throw fbErr;
        }
      } else {
        // Fallback local localStorage Auth
        await localAuth.signIn(targetEmail, targetPassword);
        persistSignedInUser(targetEmail);
        onSignIn(targetEmail);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Authentication failed. Please check credentials.');
    }
  };

  const handleQuickSignIn = () => {
    setEmail('samdonckels@gmail.com');
    setPassword('Doing4ever!');
  };

  return (
    <div id="sign-in-screen" className="min-h-screen bg-[#F3F4F6] py-12 px-4 flex flex-col justify-center items-center font-sans immersive-bg">
      
      {/* 3D Speckled Header Title */}
      <div className="text-center mb-8">
        <h1 className="font-comic text-5xl md:text-7xl font-extrabold tracking-widest uppercase select-none flex items-center justify-center gap-2">
          <span className="text-white drop-shadow-[4px_4px_0px_#000000] [letter-spacing:4px]">POWER</span>
          <span className="text-[#FF4B2B] drop-shadow-[4px_4px_0px_#000000] font-black text-6xl md:text-8xl scale-110 rotate-12 inline-block">2</span>
          <span className="text-white drop-shadow-[4px_4px_0px_#000000] [letter-spacing:4px]">DO</span>
        </h1>
        <p className="font-marker text-lg md:text-2xl text-pink-500 mt-2 rotate-[-2deg] tracking-wide">
          POW! BAM! DESTROY PROCRASTINATION!
        </p>
      </div>

      <div className="max-w-md w-full">
        
        {/* Main Auth Panel */}
        <div className="bg-white comic-border comic-shadow rounded-none p-6 md:p-8 relative flex flex-col">
          {/* Halftone dots */}
          <div className="absolute inset-0 comic-halftone opacity-10 pointer-events-none" />
          
          <div className="relative z-10 space-y-6">
            <div className="border-b-4 border-black pb-4 flex justify-between items-center">
              <div>
                <h2 className="font-comic text-3xl uppercase tracking-wider text-black">
                  LOGIN
                </h2>
                <p className="text-xs font-semibold text-gray-500">
                  {isFirebaseConfigured ? 'Firebase secure login active.' : 'Offline password protection active.'}
                </p>
              </div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-100 border border-gray-300 px-2 py-0.5 rounded-sm">
                AUTHORIZATION REQUIRED
              </div>
            </div>

            {errorMsg && (
              <div className="bg-red-100 border-2 border-red-500 text-red-700 p-3 font-semibold text-xs rounded-none">
                💥 {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="bg-emerald-100 border-2 border-emerald-500 text-emerald-700 p-3 font-semibold text-xs rounded-none">
                🎉 {successMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    id="auth-email-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="hero@power2do.com"
                    className="w-full bg-white text-black border-2 border-black p-2.5 pl-10 font-mono text-sm focus:outline-none focus:bg-amber-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    id="auth-password-input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white text-black border-2 border-black p-2.5 pl-10 font-mono text-sm focus:outline-none focus:bg-amber-50"
                  />
                </div>
              </div>

              <button
                id="auth-submit-btn"
                type="submit"
                className="w-full bg-[#FFDE00] text-black font-bold py-3 px-6 comic-border comic-shadow-sm hover:bg-yellow-400 hover:scale-102 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 uppercase font-comic text-lg"
              >
                <LogIn className="w-5 h-5" />
                <span>ENTER BASE</span>
              </button>
            </form>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t-2 border-gray-300"></div>
              <span className="flex-shrink mx-4 text-gray-400 text-xs font-bold uppercase">Or Quick Enter</span>
              <div className="flex-grow border-t-2 border-gray-300"></div>
            </div>

            <button
              id="auth-quick-fill-btn"
              onClick={handleQuickSignIn}
              className="w-full bg-white text-black hover:bg-gray-100 font-semibold py-2 px-4 border-2 border-black text-xs transition-all cursor-pointer"
            >
              ⚡ Fill Credentials (samdonckels@gmail.com)
            </button>
          </div>

          <div className="mt-8 pt-4 border-t border-black/10 flex items-center gap-2 text-xs text-gray-500 font-semibold justify-center">
            <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Secure account storage enabled.</span>
          </div>
        </div>

      </div>
    </div>
  );
}
