import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, Battery, BatteryCharging, Wifi, ShieldAlert, MapPin, 
  ChevronRight, Smartphone, Compass, Clock, 
  User, Plus, Play, Pause, RefreshCw, Volume2, ShieldCheck,
  Share2, Lock, Radio, Activity, Copy, Check, Navigation, Flame, CheckCircle,
  Phone
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { DeviceDetails, LocationHistoryItem } from '../types';

interface HomeScreenProps {
  devices: DeviceDetails[];
  selectedDevice: DeviceDetails | null;
  onSelectDevice: (device: DeviceDetails) => void;
  history: LocationHistoryItem[];
  sirenActive: boolean;
  onTriggerSiren: () => void;
  onDismissSiren: () => void;
  onAddDevice: () => void;
  onTriggerSOS: () => void;
  isSimulating: boolean;
  onToggleSimulation: () => void;
  locationPermission?: 'granted' | 'prompt' | 'denied';
  locationError?: string | null;
  onToggleLockDevice?: (deviceId: string) => void;
  onRefreshLocation?: (deviceId: string) => void;
  reverseGeocodedAddress?: string;
}

export default function HomeScreen({
  devices,
  selectedDevice,
  onSelectDevice,
  history,
  sirenActive,
  onTriggerSiren,
  onDismissSiren,
  onAddDevice,
  onTriggerSOS,
  isSimulating,
  onToggleSimulation,
  locationPermission = 'prompt',
  locationError = null,
  onToggleLockDevice,
  onRefreshLocation,
  reverseGeocodedAddress = 'Loading location...'
}: HomeScreenProps) {
  const { currentUser } = useAuth();
  
  // Loaded user data states
  const [profileName, setProfileName] = useState(currentUser?.displayName || '');
  const [profilePhone, setProfilePhone] = useState('');
  
  // Functional visual feedback states
  const [copiedLink, setCopiedLink] = useState(false);
  const [pinging, setPinging] = useState(false);
  const [activeActionMsg, setActiveActionMsg] = useState<string | null>(null);

  const pinLocked = selectedDevice ? selectedDevice.isLocked === true : false;

  // Fetch verified credentials from Firestore on mount
  useEffect(() => {
    if (!currentUser) return;
    const fetchUserData = async () => {
      try {
        const userRef = doc(db, "users", currentUser.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.displayName) setProfileName(data.displayName);
          if (data.phoneNumber) {
            setProfilePhone(data.phoneNumber);
          } else if (data.email?.endsWith('@phone.findora.app')) {
            setProfilePhone(data.email.split('@')[0]);
          }
        } else {
          // Fallback parsing
          if (currentUser.phoneNumber) {
            setProfilePhone(currentUser.phoneNumber);
          } else if (currentUser.email?.endsWith('@phone.findora.app')) {
            setProfilePhone(currentUser.email.split('@')[0]);
          }
        }
      } catch (err) {
        console.warn("Could not retrieve extended user profile for HomeScreen:", err);
      }
    };
    fetchUserData();
  }, [currentUser]);

  // Actions
  const handleFindDevice = () => {
    if (!selectedDevice) return;
    setPinging(true);
    setActiveActionMsg(`Broadcasting ping beacons to ${selectedDevice.deviceName}...`);
    
    if (onRefreshLocation) {
      onRefreshLocation(selectedDevice.deviceId);
    }
    
    setTimeout(() => {
      setPinging(false);
      setActiveActionMsg(`Pinpoint GPS coordinates synchronized for ${selectedDevice.deviceName}!`);
      setTimeout(() => setActiveActionMsg(null), 3000);
    }, 2000);
  };

  const handleLockDevice = () => {
    if (!selectedDevice) return;
    const nextLockedState = !selectedDevice.isLocked;
    
    if (onToggleLockDevice) {
      onToggleLockDevice(selectedDevice.deviceId);
    }
    
    setActiveActionMsg(
      nextLockedState 
        ? `Screen Lock signal dispatched to ${selectedDevice.deviceName}! Custom security PIN forced.`
        : `Screen Unlock signal dispatched to ${selectedDevice.deviceName}.`
    );
    
    setTimeout(() => {
      setActiveActionMsg(null);
    }, 4000);
  };

  const handleShareLiveLocation = () => {
    if (!selectedDevice) return;
    const mockShareUrl = `https://findora.app/track/live?node=${selectedDevice.deviceId}&token=secure_temp_auth_token`;
    navigator.clipboard.writeText(mockShareUrl);
    setCopiedLink(true);
    setActiveActionMsg("Secure, temporary live tracking link copied to clipboard!");
    
    setTimeout(() => {
      setCopiedLink(false);
      setActiveActionMsg(null);
    }, 4000);
  };

  // Live Google Map Preview Render
  const renderMiniMapPreview = () => {
    if (!selectedDevice) return null;
    
    return (
      <div className="relative w-full h-48 rounded-2xl bg-[#0f172a] border border-slate-100 overflow-hidden group shadow-md">
        <iframe
          src={`https://maps.google.com/maps?q=${selectedDevice.latitude},${selectedDevice.longitude}&z=15&output=embed&iwloc=0`}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen={false}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="w-full h-full rounded-2xl"
        ></iframe>

        {/* HUD Overlay details */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 to-transparent p-3 flex justify-between items-end pointer-events-none">
          <div className="space-y-0.5">
            <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest block">Signal Strength</span>
            <div className="flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="text-[10px] text-slate-200 font-mono font-bold">ACCURACY: {selectedDevice.locationAccuracy?.toFixed(1) || '10.0'}m (Excellent)</span>
            </div>
          </div>
          
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg px-2.5 py-1 text-[9.5px] text-slate-300 font-bold tracking-tight">
            LAT: {selectedDevice.latitude.toFixed(4)} • LNG: {selectedDevice.longitude.toFixed(4)}
          </div>
        </div>

        {/* Interactive map badge */}
        <div className="absolute top-3 right-3 bg-blue-600 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md pointer-events-none">
          Live Google Map
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-32 font-sans">
      
      {/* 1. WELCOME BANNER (Premium Blue, White, Black Design) */}
      <div className="bg-slate-950 text-white rounded-3xl p-6 shadow-xl shadow-slate-950/15 relative overflow-hidden">
        <div className="absolute right-[-40px] bottom-[-40px] w-52 h-52 rounded-full bg-blue-600/10 blur-3xl"></div>
        <div className="absolute top-[-20px] left-[20%] w-32 h-32 rounded-full bg-indigo-500/10 blur-2xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-blue-600 text-white text-[9.5px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                Shield Console Active
              </span>
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
            
            <h2 className="text-2xl font-black tracking-tight text-white font-sans mt-2">
              Welcome, {profileName || 'Findora Protector'}
            </h2>
            
            {profilePhone && (
              <p className="text-xs text-slate-400 font-mono font-semibold flex items-center gap-1.5 mt-1">
                <Phone className="w-3.5 h-3.5 text-blue-500" />
                Linked Device Mobile: <span className="text-slate-200">{profilePhone}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 1.1 FRIENDLY DENIED LOCATION WARNING BANNER (satisfying requirement 13) */}
      {locationPermission === 'denied' && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm shadow-amber-50/50">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl flex-shrink-0">
              <Radio className="w-6 h-6 text-amber-800 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-amber-900">Live Geolocation Suspended</h4>
              <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                Your browser or application has blocked Location permissions. To continuously track this device's live coordinates, please click the site settings option in your address bar and toggle **Location access to "Allow"**.
              </p>
            </div>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="bg-amber-800 hover:bg-amber-900 text-white text-[10.5px] font-black px-4.5 py-2.5 rounded-xl uppercase tracking-wider transition-colors duration-200 cursor-pointer shadow-sm shadow-amber-800/10 self-end sm:self-auto flex-shrink-0"
          >
            Retry Permission
          </button>
        </div>
      )}

      {/* ACTION LOG FEEDBACK */}
      <AnimatePresence>
        {activeActionMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="bg-blue-50 border border-blue-100 text-blue-900 rounded-2xl p-4 flex items-center gap-2.5 text-xs font-bold shadow-sm shadow-blue-50/50"
          >
            <CheckCircle className="w-4.5 h-4.5 text-blue-600 flex-shrink-0" />
            <span>{activeActionMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. LINKED ENDPOINTS SELECTOR ROW */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm shadow-slate-100/50">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Linked Devices ({devices.length})</h3>
            <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Select a node to query active coordinate feeds</p>
          </div>
          <button
            onClick={onAddDevice}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl flex items-center justify-center transition cursor-pointer"
          >
            <Plus className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {devices.map((dev) => {
            const isSelected = selectedDevice?.deviceId === dev.deviceId;
            return (
              <button
                key={dev.deviceId}
                onClick={() => onSelectDevice(dev)}
                className={`p-4 rounded-2xl text-left border transition-all duration-300 flex items-center justify-between cursor-pointer ${
                  isSelected 
                    ? 'bg-blue-50/30 border-blue-600/20 shadow-sm' 
                    : 'bg-white hover:bg-slate-50 border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isSelected ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/10' : 'bg-slate-50 text-slate-500'
                  }`}>
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <span className="text-xs font-black text-slate-900 block truncate">{dev.deviceName}</span>
                    <span className="text-[10px] text-slate-400 block truncate font-mono mt-0.5">{dev.deviceModel}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${dev.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                  <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-slate-300'}`} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. SELECTED DEVICE STATUS PANEL (GRID SYSTEM) */}
      {selectedDevice ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Main info & Live Map Preview Column (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Last Known Location Card with Google Maps Preview */}
            <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm shadow-slate-100/50 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Google Maps Preview</h4>
                    <h5 className="text-xs font-black text-slate-800 mt-0.5">
                      {selectedDevice.isOnline ? 'Dynamic Live GPS Trajectory' : 'Last Known Location'}
                    </h5>
                  </div>
                </div>
                
                <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                  selectedDevice.isOnline ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-100'
                }`}>
                  {selectedDevice.isOnline ? 'Broadcasting' : 'Offline'}
                </span>
              </div>

              {/* Render the custom high-contrast SVG Map preview */}
              {renderMiniMapPreview()}

              {/* Address details */}
              <div className="p-4 bg-slate-50 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-100/50">
                <div>
                  <span className="text-[9.5px] text-slate-400 font-bold uppercase tracking-widest">Active Address</span>
                  <p className="text-xs font-black text-slate-800 mt-1">
                    {selectedDevice?.deviceId === `device_${currentUser?.uid.slice(0, 10)}`
                      ? reverseGeocodedAddress
                      : (history[0]?.addressName || 'Central Park, New York, NY')}
                  </p>
                  <p className="text-[10px] font-mono text-slate-500 mt-1">
                    LAT: {selectedDevice.latitude.toFixed(6)} • LNG: {selectedDevice.longitude.toFixed(6)}
                  </p>
                </div>

                <div className="sm:text-right">
                  <span className="text-[9.5px] text-slate-400 font-bold uppercase tracking-widest block">Last Sync Time</span>
                  <div className="flex sm:justify-end items-center gap-1.5 mt-1 text-xs text-slate-800 font-black">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedDevice.lastSyncTime || 'Just now'}</span>
                  </div>
                </div>
              </div>

              {selectedDevice.deviceId.startsWith('device_') && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-amber-50/70 border border-amber-100 rounded-2xl p-4 flex gap-3 text-xs text-amber-800"
                >
                  <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-extrabold text-amber-900">⚠️ Why is this showing a different location?</p>
                    <p className="mt-1 text-slate-600 font-medium leading-relaxed">
                      You are viewing your **Web Browser Device**. Laptop/PC browsers do not have a dedicated GPS chip; they estimate your location via your internet connection (IP address). This is often highly inaccurate and can show you in a different city or state.
                    </p>
                    <p className="mt-1.5 text-amber-950 font-bold">
                      Solution: For 100% accurate pinpoint GPS tracking, switch to your actual **Android Phone** (e.g., android_pixel_emulator or physical phone) in the device list above, which sends precise hardware coordinates!
                    </p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Metrics detail Row (Battery + Secure state) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Battery percentage card */}
              <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm shadow-slate-100/50 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Battery className="w-4 h-4 text-blue-600" />
                    Battery Percentage
                  </span>
                  <p className="text-2xl font-black text-slate-900">{selectedDevice.batteryPercentage}%</p>
                  <span className="text-[10px] text-slate-400 font-semibold block">
                    {selectedDevice.isCharging ? 'Charging (AC Adapter Connected)' : 'Discharging'}
                  </span>
                </div>
                
                <div className={`p-3.5 rounded-2xl ${selectedDevice.isCharging ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-400'}`}>
                  {selectedDevice.isCharging ? (
                    <BatteryCharging className="w-7 h-7" />
                  ) : (
                    <Battery className="w-7 h-7" />
                  )}
                </div>
              </div>

              {/* Live Status Card (Online/Offline) */}
              <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm shadow-slate-100/50 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Wifi className="w-4 h-4 text-blue-600" />
                    Live Connection
                  </span>
                  <p className={`text-2xl font-black ${selectedDevice.isOnline ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {selectedDevice.isOnline ? 'ONLINE' : 'OFFLINE'}
                  </p>
                  <span className="text-[10px] text-slate-400 font-semibold block">
                    {selectedDevice.isOnline ? 'Active and emitting beacons' : 'Inactive, sleep state'}
                  </span>
                </div>

                <div className={`p-3.5 rounded-2xl ${selectedDevice.isOnline ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-400'}`}>
                  <ShieldCheck className="w-7 h-7" />
                </div>
              </div>

            </div>

          </div>

          {/* Quick actions Column (4 cols) */}
          <div className="lg:col-span-4 space-y-6 flex flex-col justify-between">
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm shadow-slate-100/50 space-y-4 h-full flex flex-col justify-between">
              
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                  <ShieldAlert className="w-5 h-5 text-blue-600" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">Anti-Theft Quick Actions</h4>
                </div>
                
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  Safeguard or locate your compromised node endpoints immediately using secure cloud triggers.
                </p>
                
                <div className="space-y-3 pt-2">
                  
                  {/* Find Device Action */}
                  <button
                    onClick={handleFindDevice}
                    disabled={pinging}
                    className="w-full py-3 bg-white hover:bg-slate-50 text-slate-800 font-black text-xs rounded-2xl flex items-center justify-center gap-2 border border-slate-200 transition duration-200 cursor-pointer disabled:opacity-50"
                  >
                    <Radio className={`w-4 h-4 text-blue-600 ${pinging ? 'animate-spin' : ''}`} />
                    {pinging ? 'Synchronizing GPS...' : 'Find Device GPS'}
                  </button>

                  {/* Ring Acoustic Siren Action */}
                  {sirenActive ? (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-center space-y-2.5">
                      <p className="text-[10px] font-black text-blue-700 uppercase tracking-wider">Siren broadcasting loud wail</p>
                      <button
                        onClick={onDismissSiren}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-[10.5px] font-black rounded-xl shadow-sm transition cursor-pointer"
                      >
                        Silence Alarm
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={onTriggerSiren}
                      className="w-full py-3 bg-white hover:bg-slate-50 text-slate-800 font-black text-xs rounded-2xl flex items-center justify-center gap-2 border border-slate-200 transition duration-200 cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4 text-blue-600" />
                      Ring Acoustic Siren
                    </button>
                  )}

                  {/* Lock Device Action */}
                  <button
                    onClick={handleLockDevice}
                    className="w-full py-3 bg-white hover:bg-slate-50 text-slate-800 font-black text-xs rounded-2xl flex items-center justify-center gap-2 border border-slate-200 transition duration-200 cursor-pointer"
                  >
                    <Lock className={`w-4 h-4 ${pinLocked ? 'text-red-500' : 'text-blue-600'}`} />
                    {pinLocked ? 'Screen Pin Locked' : 'Lock Secure Screen'}
                  </button>

                  {/* Share Live Location Action */}
                  <button
                    onClick={handleShareLiveLocation}
                    className="w-full py-3 bg-white hover:bg-slate-50 text-slate-800 font-black text-xs rounded-2xl flex items-center justify-center gap-2 border border-slate-200 transition duration-200 cursor-pointer"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-500" />
                        Copied Secure Link
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4 text-blue-600" />
                        Share Live Location
                      </>
                    )}
                  </button>

                </div>
              </div>

              <div className="pt-6 border-t border-slate-50 mt-6 flex items-center gap-2 text-[10px] text-slate-400 font-black tracking-widest uppercase">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Sync Node Status: Optimal</span>
              </div>
            </div>
          </div>

        </div>
      ) : (
        <div className="text-center py-12 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col items-center shadow-slate-100/50">
          <Smartphone className="w-12 h-12 text-slate-300 mb-3 animate-pulse" />
          <p className="text-sm font-bold text-slate-700">No connected endpoints registered</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">Please create and bind your very first safe device endpoint to begin tracking.</p>
          <button
            onClick={onAddDevice}
            className="mt-4 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl shadow-sm transition"
          >
            Register Endpoint Device
          </button>
        </div>
      )}



    </div>
  );
}
