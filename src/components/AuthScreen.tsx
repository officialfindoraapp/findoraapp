import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, AlertCircle, RefreshCw, Phone, Lock, LogIn, UserPlus, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthScreen() {
  const { 
    signInWithGoogle, 
    signInWithPhonePassword, 
    signUpWithPhonePassword, 
    error: authError, 
    setError: setAuthError 
  } = useAuth();

  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleGoogleAuth = async () => {
    if (setAuthError) setAuthError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Google single sign-on failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (setAuthError) setAuthError(null);
    
    if (!phone.trim() || !password.trim()) {
      if (setAuthError) setAuthError('Please fill in all required fields.');
      return;
    }

    if (isSignUp && !name.trim()) {
      if (setAuthError) setAuthError('Please enter your full name.');
      return;
    }

    // Basic sanity check for phone numbers
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    if (cleanPhone.length < 7) {
      if (setAuthError) setAuthError('Please enter a valid phone number (at least 7 digits).');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await signUpWithPhonePassword(phone.trim(), password, name.trim());
      } else {
        await signInWithPhonePassword(phone.trim(), password);
      }
    } catch (err: any) {
      console.error('Phone authentication failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const GoogleIcon = () => (
    <svg className="w-5 h-5 mr-3 flex-shrink-0" viewBox="0 0 24 24" fill="none">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden select-none">
      {/* Background soft ambient accents */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-blue-100/30 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-blue-50/40 blur-3xl"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex flex-col items-center justify-center">
          <div className="h-14 w-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4 border border-blue-400/20">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 font-sans tracking-tight text-center">
            FindoraApp
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 text-center font-bold tracking-wide uppercase">
            Safe Track & Secure Antitheft Portal
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-6 sm:px-10 border border-slate-100 rounded-3xl shadow-xl shadow-slate-200/40">
          
          {/* Error Feed Banner */}
          {authError && (
            <div className="mb-5 p-4 rounded-2xl border border-red-100 bg-red-50 text-xs text-red-800 flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 animate-pulse" />
                <div className="space-y-0.5">
                  <p className="font-extrabold text-red-900">Authentication Error</p>
                  <p className="font-medium text-slate-700 leading-relaxed">{authError}</p>
                </div>
              </div>

              {(authError.includes('disabled') || authError.includes('operation-not-allowed') || authError.includes('provider')) && (
                <div className="mt-1 pt-3 border-t border-red-200/40 space-y-2 text-slate-700">
                  <p className="font-bold text-red-900 uppercase tracking-wide text-[9px] flex items-center gap-1">
                    <span>🛠️</span> How to enable Email/Password Sign-In:
                  </p>
                  <ol className="list-decimal list-inside space-y-1.5 text-[11px] font-medium leading-relaxed pl-1 text-slate-600">
                    <li>Go to the <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-semibold hover:text-blue-800">Firebase Console</a></li>
                    <li>Select your project <strong>ai-studio-findoraapp-...</strong></li>
                    <li>Click on <strong>Authentication</strong> in the left sidebar</li>
                    <li>Navigate to the <strong>Sign-in method</strong> tab</li>
                    <li>Click <strong>Add new provider</strong> and choose <strong>Email/Password</strong></li>
                    <li>Toggle <strong>Enable</strong> and click <strong>Save</strong></li>
                  </ol>
                  <div className="bg-blue-50/50 p-2.5 rounded-xl border border-blue-100 text-[10px] text-blue-800 font-medium leading-relaxed mt-2">
                    💡 <strong>Quick Access:</strong> You can click the <strong>"Continue with Google Account"</strong> button below to authenticate immediately without any project setup!
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mb-6 text-center">
            <h3 className="text-lg font-black text-slate-800 font-sans tracking-tight">
              Secure Unified Portal
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Sign in with your phone number or register a new terminal account.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                if (setAuthError) setAuthError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${
                !isSignUp 
                  ? 'bg-white text-slate-950 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(true);
                if (setAuthError) setAuthError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${
                isSignUp 
                  ? 'bg-white text-slate-950 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Phone / Password Form */}
          <form onSubmit={handlePhoneAuth} className="space-y-4">
            {isSignUp && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400" />
                  <input
                    type="text"
                    required={isSignUp}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Johnson"
                    className="w-full pl-11 pr-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none text-slate-800 font-medium transition"
                  />
                </div>
              </motion.div>
            )}

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Mobile Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 99999 99999"
                  className="w-full pl-11 pr-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none text-slate-800 font-medium transition"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Security Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none text-slate-800 font-medium transition"
                />
              </div>
            </div>

            {/* Continue Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-blue-500/10 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {isSignUp ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                  Continue
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex py-5 items-center">
            <div className="flex-grow border-t border-slate-100"></div>
            <span className="flex-shrink mx-3 text-[9px] text-slate-400 font-extrabold uppercase tracking-widest font-mono">
              Alternate Sign In
            </span>
            <div className="flex-grow border-t border-slate-100"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full py-3.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 flex items-center justify-center shadow-sm transition active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            <GoogleIcon />
            Continue with Google Account
          </button>

          <p className="text-[10px] text-slate-400 text-center mt-6 font-medium leading-relaxed px-4 flex flex-col items-center gap-1.5">
            <span className="text-[11.5px] text-slate-500 font-semibold tracking-wide block">
              Built by <span className="text-slate-800 font-extrabold">Khushal Hadiya</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono block">
              Instagram ID: <a href="https://instagram.com/findoraapp" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-extrabold hover:underline">findoraapp</a>
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
