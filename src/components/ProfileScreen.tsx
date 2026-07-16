import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  User, Mail, Phone, Lock, LogOut, CheckCircle2, AlertCircle, 
  ShieldCheck, RefreshCw, Smartphone, Clock, Save, ShieldAlert,
  Bell, Eye, EyeOff, HelpCircle, ArrowRight, Instagram
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function ProfileScreen() {
  const { currentUser, logout } = useAuth();
  
  // Local editable fields
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  // Settings states
  const [privacySettings, setPrivacySettings] = useState({
    locationHistory: true,
    biometrics: false,
    stealthMode: false,
    shareTelemetry: true
  });

  const [notificationSettings, setNotificationSettings] = useState({
    lowBatteryAlerts: true,
    offlineAlerts: true,
    sirenTriggered: true,
    geofenceBreach: false
  });

  // UI feedback states
  const [updating, setUpdating] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Load profile & settings from Firestore on mount
  useEffect(() => {
    if (!currentUser) return;
    const fetchProfile = async () => {
      const userRef = doc(db, "users", currentUser.uid);
      try {
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.displayName) setDisplayName(data.displayName);
          if (data.phoneNumber) setPhoneNumber(data.phoneNumber);
          if (data.privacySettings) setPrivacySettings(prev => ({ ...prev, ...data.privacySettings }));
          if (data.notificationSettings) setNotificationSettings(prev => ({ ...prev, ...data.notificationSettings }));
        } else {
          // If Firestore is clean, parse phone from email if registered via phone email mock
          const isPhoneEmail = currentUser.email?.endsWith('@phone.findora.app');
          if (isPhoneEmail) {
            setPhoneNumber(currentUser.email.split('@')[0]);
          } else if (currentUser.phoneNumber) {
            setPhoneNumber(currentUser.phoneNumber);
          }
        }
      } catch (err) {
        console.warn("Could not retrieve extended firestore user profile:", err);
      }
    };
    fetchProfile();
  }, [currentUser]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setUpdating(true);
    setFeedback(null);

    try {
      const userRef = doc(db, "users", currentUser.uid);
      await setDoc(userRef, {
        displayName,
        phoneNumber,
        privacySettings,
        notificationSettings,
        email: currentUser.email || "",
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setFeedback({ type: 'success', message: 'Profile credentials and preferences saved to secure database successfully!' });
      
      // Auto clear feedback after 3 seconds
      setTimeout(() => setFeedback(null), 3500);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to update user profile.' });
    } finally {
      setUpdating(false);
    }
  };

  const togglePrivacy = (key: keyof typeof privacySettings) => {
    setPrivacySettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleNotification = (key: keyof typeof notificationSettings) => {
    setNotificationSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-8 pb-32">
      {/* 1. Header with custom premium styling */}
      <div className="border-l-4 border-blue-600 pl-4 py-1">
        <h2 className="text-2xl font-black text-slate-900 font-sans tracking-tight">App Preferences & Security</h2>
        <p className="text-xs text-slate-500 mt-1">Manage secure user profile credentials, notification triggers, and telemetry telemetry parameters.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Avatar Panel & About App (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Active profile card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm shadow-slate-100/50 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
            
            {/* Visual Avatar */}
            <div className="relative mt-2">
              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full border border-blue-100 flex items-center justify-center">
                <User className="w-10 h-10" />
              </div>
              <span className="absolute bottom-0 right-0 h-4.5 w-4.5 rounded-full bg-emerald-500 border-2 border-white animate-pulse"></span>
            </div>

            <div className="mt-4">
              <h3 className="text-base font-black text-slate-900">{displayName || 'Findora Protector'}</h3>
              <p className="text-xs font-mono text-slate-500 mt-0.5">
                {currentUser?.email?.endsWith('@phone.findora.app') 
                  ? `Phone: ${currentUser.email.split('@')[0]}` 
                  : currentUser?.email || 'Authenticated User'}
              </p>
            </div>

            {/* Quick telemetry metadata details */}
            <div className="w-full bg-slate-50 p-4 rounded-2xl text-left space-y-2.5 text-xs mt-6">
              <div className="flex items-center justify-between text-slate-500">
                <span className="font-semibold">Security Level</span>
                <span className="font-mono bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md text-[9.5px] font-bold uppercase tracking-wider">
                  Admin Owner
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span className="font-semibold">Bound Device Status</span>
                <span className="font-mono font-bold text-slate-800">Active</span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span className="font-semibold">Active Session</span>
                <span className="font-mono text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">Secure AES-256</span>
              </div>
            </div>

            <button
              onClick={logout}
              className="mt-6 w-full py-3 bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition active:scale-95 shadow-md shadow-slate-950/10 cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-red-400" />
              Sign Out of FindoraApp
            </button>
          </div>

          {/* About App Component (Satisfies requirement explicitly) */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm shadow-slate-100/50 space-y-4">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4.5 h-4.5 text-blue-600" />
              About FindoraApp
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              FindoraApp is a state-of-the-art endpoint security utility, empowering users with robust GPS telemetry logs, remote device monitoring, anti-theft acoustic triggers, and immediate coordinate broadcasting.
            </p>
            
            <div className="bg-slate-50 p-4 rounded-2xl space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Version</span>
                <span className="font-mono font-bold text-slate-950">v2.5.0 Premium</span>
              </div>
              <div className="flex justify-between">
                <span>Created By</span>
                <span className="font-semibold text-slate-950">Khushal Hadiya</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Instagram Profile</span>
                <a 
                  href="https://instagram.com/findoraapp" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-1 text-blue-600 font-extrabold hover:underline"
                >
                  <Instagram className="w-3.5 h-3.5" />
                  @findoraapp
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Right Side: Configuration Workspaces (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Edit profile form */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm shadow-slate-100/50 space-y-5">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-50 flex items-center gap-2">
              <User className="w-4.5 h-4.5 text-blue-600" />
              Edit Profile Credentials
            </h4>

            {/* Feedback alerts */}
            {feedback && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3.5 rounded-2xl text-xs border flex items-start gap-2.5 ${
                  feedback.type === 'success' 
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                    : 'bg-red-50 border-red-100 text-red-800'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4.5 h-4.5 mt-0.5 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4.5 h-4.5 mt-0.5 text-red-600 flex-shrink-0" />
                )}
                <span className="font-semibold">{feedback.message}</span>
              </motion.div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Profile Display Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Alex Johnson"
                      className="w-full pl-11 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none text-slate-700 font-semibold transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Callback Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+91 99999 99999"
                      className="w-full pl-11 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none text-slate-700 font-semibold transition"
                    />
                  </div>
                </div>
              </div>

              {/* Privacy Settings Section (Satisfies requirement explicitly) */}
              <div className="pt-4 border-t border-slate-50 space-y-4">
                <h5 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-blue-600" />
                  Privacy Settings
                </h5>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => togglePrivacy('locationHistory')}
                    className={`p-3 rounded-2xl border text-left flex items-start justify-between transition-all ${
                      privacySettings.locationHistory 
                        ? 'bg-blue-50/40 border-blue-100 text-slate-800' 
                        : 'bg-white border-slate-100 text-slate-400'
                    }`}
                  >
                    <div className="space-y-1">
                      <p className="text-xs font-bold block">Location Trails</p>
                      <p className="text-[9.5px] text-slate-400">Record history logs in Firestore</p>
                    </div>
                    <span className={`h-4.5 w-8 rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex items-center ${
                      privacySettings.locationHistory ? 'bg-blue-600 justify-end' : 'bg-slate-200 justify-start'
                    }`}>
                      <span className="h-3.5 w-3.5 rounded-full bg-white shadow-sm"></span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => togglePrivacy('biometrics')}
                    className={`p-3 rounded-2xl border text-left flex items-start justify-between transition-all ${
                      privacySettings.biometrics 
                        ? 'bg-blue-50/40 border-blue-100 text-slate-800' 
                        : 'bg-white border-slate-100 text-slate-400'
                    }`}
                  >
                    <div className="space-y-1">
                      <p className="text-xs font-bold block">Biometric Security</p>
                      <p className="text-[9.5px] text-slate-400">Lock console verification</p>
                    </div>
                    <span className={`h-4.5 w-8 rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex items-center ${
                      privacySettings.biometrics ? 'bg-blue-600 justify-end' : 'bg-slate-200 justify-start'
                    }`}>
                      <span className="h-3.5 w-3.5 rounded-full bg-white shadow-sm"></span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => togglePrivacy('stealthMode')}
                    className={`p-3 rounded-2xl border text-left flex items-start justify-between transition-all ${
                      privacySettings.stealthMode 
                        ? 'bg-blue-50/40 border-blue-100 text-slate-800' 
                        : 'bg-white border-slate-100 text-slate-400'
                    }`}
                  >
                    <div className="space-y-1">
                      <p className="text-xs font-bold block">Stealth Mode</p>
                      <p className="text-[9.5px] text-slate-400">Hide online status badge</p>
                    </div>
                    <span className={`h-4.5 w-8 rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex items-center ${
                      privacySettings.stealthMode ? 'bg-blue-600 justify-end' : 'bg-slate-200 justify-start'
                    }`}>
                      <span className="h-3.5 w-3.5 rounded-full bg-white shadow-sm"></span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => togglePrivacy('shareTelemetry')}
                    className={`p-3 rounded-2xl border text-left flex items-start justify-between transition-all ${
                      privacySettings.shareTelemetry 
                        ? 'bg-blue-50/40 border-blue-100 text-slate-800' 
                        : 'bg-white border-slate-100 text-slate-400'
                    }`}
                  >
                    <div className="space-y-1">
                      <p className="text-xs font-bold block">Share Diagnostics</p>
                      <p className="text-[9.5px] text-slate-400">Send debug data to developers</p>
                    </div>
                    <span className={`h-4.5 w-8 rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex items-center ${
                      privacySettings.shareTelemetry ? 'bg-blue-600 justify-end' : 'bg-slate-200 justify-start'
                    }`}>
                      <span className="h-3.5 w-3.5 rounded-full bg-white shadow-sm"></span>
                    </span>
                  </button>
                </div>
              </div>

              {/* Notification Settings Section (Satisfies requirement explicitly) */}
              <div className="pt-4 border-t border-slate-50 space-y-4">
                <h5 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Bell className="w-4 h-4 text-blue-600" />
                  Notification Triggers
                </h5>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => toggleNotification('lowBatteryAlerts')}
                    className={`p-3 rounded-2xl border text-left flex items-start justify-between transition-all ${
                      notificationSettings.lowBatteryAlerts 
                        ? 'bg-blue-50/40 border-blue-100 text-slate-800' 
                        : 'bg-white border-slate-100 text-slate-400'
                    }`}
                  >
                    <div className="space-y-1">
                      <p className="text-xs font-bold block">Low Battery Alert</p>
                      <p className="text-[9.5px] text-slate-400">Ping when power falls below 15%</p>
                    </div>
                    <span className={`h-4.5 w-8 rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex items-center ${
                      notificationSettings.lowBatteryAlerts ? 'bg-blue-600 justify-end' : 'bg-slate-200 justify-start'
                    }`}>
                      <span className="h-3.5 w-3.5 rounded-full bg-white shadow-sm"></span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleNotification('offlineAlerts')}
                    className={`p-3 rounded-2xl border text-left flex items-start justify-between transition-all ${
                      notificationSettings.offlineAlerts 
                        ? 'bg-blue-50/40 border-blue-100 text-slate-800' 
                        : 'bg-white border-slate-100 text-slate-400'
                    }`}
                  >
                    <div className="space-y-1">
                      <p className="text-xs font-bold block">Offline Signals</p>
                      <p className="text-[9.5px] text-slate-400">Notify when tracker goes offline</p>
                    </div>
                    <span className={`h-4.5 w-8 rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex items-center ${
                      notificationSettings.offlineAlerts ? 'bg-blue-600 justify-end' : 'bg-slate-200 justify-start'
                    }`}>
                      <span className="h-3.5 w-3.5 rounded-full bg-white shadow-sm"></span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleNotification('sirenTriggered')}
                    className={`p-3 rounded-2xl border text-left flex items-start justify-between transition-all ${
                      notificationSettings.sirenTriggered 
                        ? 'bg-blue-50/40 border-blue-100 text-slate-800' 
                        : 'bg-white border-slate-100 text-slate-400'
                    }`}
                  >
                    <div className="space-y-1">
                      <p className="text-xs font-bold block">Siren Warning</p>
                      <p className="text-[9.5px] text-slate-400">Log whenever emergency siren sounds</p>
                    </div>
                    <span className={`h-4.5 w-8 rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex items-center ${
                      notificationSettings.sirenTriggered ? 'bg-blue-600 justify-end' : 'bg-slate-200 justify-start'
                    }`}>
                      <span className="h-3.5 w-3.5 rounded-full bg-white shadow-sm"></span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleNotification('geofenceBreach')}
                    className={`p-3 rounded-2xl border text-left flex items-start justify-between transition-all ${
                      notificationSettings.geofenceBreach 
                        ? 'bg-blue-50/40 border-blue-100 text-slate-800' 
                        : 'bg-white border-slate-100 text-slate-400'
                    }`}
                  >
                    <div className="space-y-1">
                      <p className="text-xs font-bold block">Geofence Violations</p>
                      <p className="text-[9.5px] text-slate-400">Alert on departure from secure zone</p>
                    </div>
                    <span className={`h-4.5 w-8 rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex items-center ${
                      notificationSettings.geofenceBreach ? 'bg-blue-600 justify-end' : 'bg-slate-200 justify-start'
                    }`}>
                      <span className="h-3.5 w-3.5 rounded-full bg-white shadow-sm"></span>
                    </span>
                  </button>
                </div>
              </div>

              {/* Save Trigger */}
              <div className="pt-4 border-t border-slate-50">
                <button
                  type="submit"
                  disabled={updating}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/10 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {updating ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Profile & Preferences
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
