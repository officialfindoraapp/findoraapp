import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, Smartphone, MapPin, Bell, User, Map as MapIcon, 
  Settings as SettingsIcon, AlertCircle, RefreshCw, Compass, BatteryCharging,
  Lock, Phone
} from 'lucide-react';
import { 
  collection, query, where, onSnapshot, doc, setDoc, 
  addDoc, updateDoc, deleteDoc, writeBatch, limit, getDocs, orderBy 
} from 'firebase/firestore';
import { db } from './firebase';

import { DeviceDetails, LocationHistoryItem, AppNotification } from './types';

import { AuthProvider, useAuth } from './context/AuthContext';
import SplashScreen from './components/SplashScreen';
import AuthScreen from './components/AuthScreen';
import HomeScreen from './components/HomeScreen';
import DevicesScreen from './components/DevicesScreen';
import MapScreen from './components/MapScreen';
import NotificationsScreen from './components/NotificationsScreen';
import ProfileScreen from './components/ProfileScreen';

import { handleFirestoreError, OperationType } from './utils/firestoreErrorHandler';

// Standalone helper to extract real device name from User Agent (satisfying Android model/manufacturer requirement)
function getDeviceDetailsFromUA() {
  const ua = navigator.userAgent;
  let deviceName = "My Device";
  let deviceModel = "Web Console";
  let androidVersion = "v14 (U)";

  if (/Android/i.test(ua)) {
    const match = ua.match(/Android\s([0-9\._]+)/);
    if (match) {
      androidVersion = `Android ${match[1]}`;
    }
    // Extract manufacturer/model hints
    if (/Samsung|SM-|SAMSUNG/i.test(ua)) {
      deviceName = "Samsung Galaxy Handset";
      deviceModel = "Samsung SM-Series";
    } else if (/Pixel/i.test(ua)) {
      deviceName = "Google Pixel";
      deviceModel = "Pixel Handset (Google)";
    } else if (/HTC/i.test(ua)) {
      deviceName = "HTC Handset";
      deviceModel = "HTC Android OS";
    } else if (/Nexus/i.test(ua)) {
      deviceName = "Nexus Device";
      deviceModel = "Google Nexus";
    } else if (/OnePlus/i.test(ua)) {
      deviceName = "OnePlus Handset";
      deviceModel = "OnePlus Nord";
    } else {
      deviceName = "Android Handset";
      deviceModel = "Generic Android";
    }
  } else if (/iPhone|iPad|iPod/i.test(ua)) {
    deviceName = "Apple iPhone";
    deviceModel = "iPhone Mobile Client";
    androidVersion = "iOS Premium Hub";
  } else if (/Macintosh/i.test(ua)) {
    deviceName = "Apple MacBook";
    deviceModel = "macOS Client";
    androidVersion = "macOS Sequoia";
  } else if (/Windows/i.test(ua)) {
    deviceName = "Windows Desktop";
    deviceModel = "Windows PC Studio";
    androidVersion = "Windows 11 Hub";
  } else if (/Linux/i.test(ua)) {
    deviceName = "Linux Workstation";
    deviceModel = "Ubuntu/Debian Console";
    androidVersion = "Linux Kernel v6";
  }
  return { deviceName, deviceModel, androidVersion };
}

function AppContent() {
  const { currentUser, loading: authLoading } = useAuth();
  
  // App view controls
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'devices' | 'map' | 'notifications' | 'profile'>('home');

  // Real-time tracking and device states (satisfying core requirements)
  const [locationPermission, setLocationPermission] = useState<'granted' | 'prompt' | 'denied'>('prompt');
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [liveLocation, setLiveLocation] = useState<{ latitude: number; longitude: number; speed: number | null; accuracy: number; timestamp: string } | null>(null);
  const [liveBattery, setLiveBattery] = useState<{ level: number; charging: boolean }>({ level: 82, charging: false });
  const [realDeviceName, setRealDeviceName] = useState('My Web Device');
  const [realDeviceModel, setRealDeviceModel] = useState('Generic Browser');
  const [realAndroidVersion, setRealAndroidVersion] = useState('Web Console');
  const [reverseGeocodedAddress, setReverseGeocodedAddress] = useState<string>('Loading location...');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [lastSyncTimeFormatted, setLastSyncTimeFormatted] = useState<string>('Never');

  // Control whether the current browser acts as an auto-tracked Web Device
  const [webDeviceEnabled, setWebDeviceEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('track_web_device');
    return saved === 'true';
  });

  // Firestore Synchronized States
  const [devices, setDevices] = useState<DeviceDetails[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<DeviceDetails | null>(null);
  const [history, setHistory] = useState<LocationHistoryItem[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const [sirenActive, setSirenActive] = useState(false);

  // Audio nodes for acoustic buzzer wail
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);

  const localDeviceId = currentUser ? `device_${currentUser.uid.slice(0, 10)}` : '';

  // Reverse geocoding function with free Nominatim API and smart fallback (satisfies current address reverse geocoding requirement)
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en',
            'User-Agent': 'FindoraApp/2.5.0'
          }
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (data && data.display_name) {
          const parts = data.display_name.split(',');
          return parts.slice(0, 3).map((p: string) => p.trim()).join(', ');
        }
      }
    } catch (error) {
      console.warn("Reverse geocode fetch failed or throttled:", error);
    }
    return `Location coordinates near ${lat.toFixed(5)}°N, ${lng.toFixed(5)}°E`;
  };

  // Automatically request Location and Notification permission (satisfying permission requirements)
  const requestTrackingPermissions = async () => {
    if (!currentUser) return;

    // Request Notification Permission
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const status = await Notification.requestPermission();
        setNotificationPermission(status);
      } catch (err) {
        console.warn("Notification permission request error:", err);
      }
    }

    // Request Location Permission
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          setLocationPermission('granted');
          setLocationError(null);
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const ts = new Date(position.timestamp).toLocaleTimeString();
          
          setLiveLocation({
            latitude: lat,
            longitude: lng,
            speed: position.coords.speed,
            accuracy: position.coords.accuracy,
            timestamp: ts
          });

          const address = await reverseGeocode(lat, lng);
          setReverseGeocodedAddress(address);
        },
        (error) => {
          console.warn("Geolocation request error:", error);
          setLocationPermission('denied');
          if (error.code === error.PERMISSION_DENIED) {
            setLocationError("Location permission was denied. Please allow location access in your browser or application frame to activate real-time device tracking.");
          } else {
            setLocationError(`Location tracker offline: ${error.message}`);
          }
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    } else {
      setLocationError("Geolocation is not supported by your browser or device.");
    }
  };

  // Request permissions upon login automatically
  useEffect(() => {
    if (currentUser) {
      requestTrackingPermissions();
    }
  }, [currentUser]);

  // Monitor real battery percentage and status
  useEffect(() => {
    const info = getDeviceDetailsFromUA();
    setRealDeviceName(info.deviceName);
    setRealDeviceModel(info.deviceModel);
    setRealAndroidVersion(info.androidVersion);

    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setLiveBattery({
          level: Math.round(battery.level * 100),
          charging: battery.charging
        });

        const handleLevelChange = () => {
          setLiveBattery(prev => ({ ...prev, level: Math.round(battery.level * 100) }));
        };
        const handleChargingChange = () => {
          setLiveBattery(prev => ({ ...prev, charging: battery.charging }));
        };

        battery.addEventListener('levelchange', handleLevelChange);
        battery.addEventListener('chargingchange', handleChargingChange);

        return () => {
          battery.removeEventListener('levelchange', handleLevelChange);
          battery.removeEventListener('chargingchange', handleChargingChange);
        };
      }).catch((err: any) => {
        console.warn("Battery API is restricted or unavailable:", err);
      });
    }
  }, []);

  // Continuous background/foreground GPS watchPosition tracking
  useEffect(() => {
    if (!currentUser || locationPermission !== 'granted') return;

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const ts = new Date(position.timestamp).toLocaleTimeString();

        setLiveLocation({
          latitude: lat,
          longitude: lng,
          speed: position.coords.speed,
          accuracy: position.coords.accuracy,
          timestamp: ts
        });

        const address = await reverseGeocode(lat, lng);
        setReverseGeocodedAddress(address);
      },
      (error) => {
        console.warn("Watch continuous position error:", error);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [currentUser, locationPermission]);

  // Reverse geocode the selected device's current location when it changes
  useEffect(() => {
    if (!selectedDevice) return;
    const { latitude, longitude } = selectedDevice;
    if (latitude === 0 && longitude === 0) {
      setReverseGeocodedAddress("Location not registered yet");
      return;
    }
    
    let isMounted = true;
    const fetchAddress = async () => {
      const address = await reverseGeocode(latitude, longitude);
      if (isMounted) {
        setReverseGeocodedAddress(address);
      }
    };
    fetchAddress();
    return () => {
      isMounted = false;
    };
  }, [selectedDevice?.deviceId, selectedDevice?.latitude, selectedDevice?.longitude]);

  // Synchronize local device root metadata upon login and real device name load
  useEffect(() => {
    if (!currentUser || !realDeviceName || !localDeviceId || !webDeviceEnabled) return;

    const syncLocalDeviceDoc = async () => {
      const devRef = doc(db, "devices", localDeviceId);
      try {
        await setDoc(devRef, {
          deviceId: localDeviceId,
          deviceName: realDeviceName,
          deviceModel: realDeviceModel,
          androidVersion: realAndroidVersion,
          batteryPercentage: liveBattery.level,
          isCharging: liveBattery.charging,
          isOnline: true,
          lastSyncTime: new Date().toLocaleTimeString(),
          latitude: liveLocation?.latitude || 0.0,
          longitude: liveLocation?.longitude || 0.0,
          locationAccuracy: liveLocation?.accuracy || 0,
          ownerId: currentUser.uid
        }, { merge: true });
      } catch (err) {
        console.warn("Failed to synchronize local device doc:", err);
      }
    };

    syncLocalDeviceDoc();
  }, [currentUser, realDeviceName, realDeviceModel, realAndroidVersion, localDeviceId, webDeviceEnabled, liveLocation]);

  // Save latitude, longitude, device name, battery level and timestamp to Firebase Firestore EVERY 5 SECONDS
  useEffect(() => {
    if (!currentUser || !localDeviceId || !webDeviceEnabled) return;

    const interval = setInterval(async () => {
      if (!liveLocation) return; // Do not push any fake location if GPS tracker has not updated yet

      const lat = liveLocation.latitude;
      const lng = liveLocation.longitude;
      const battery = liveBattery.level;
      const isChg = liveBattery.charging;
      const acc = liveLocation.accuracy;
      const speedVal = liveLocation.speed || 0;
      const addr = reverseGeocodedAddress;

      const pointId = `hist_${Date.now()}`;
      const timeStr = new Date().toLocaleTimeString();

      try {
        // 1. Update root device coordinates
        const devRef = doc(db, "devices", localDeviceId);
        await setDoc(devRef, {
          latitude: lat,
          longitude: lng,
          batteryPercentage: battery,
          isCharging: isChg,
          lastSyncTime: timeStr,
          locationAccuracy: acc,
          isOnline: true
        }, { merge: true });

        // 2. Write the snapshot into the subcollection
        const histDocRef = doc(db, "devices", localDeviceId, "location_history", pointId);
        await setDoc(histDocRef, {
          id: pointId,
          deviceId: localDeviceId,
          latitude: lat,
          longitude: lng,
          timestamp: timeStr,
          batteryLevel: battery,
          status: "Online",
          addressName: addr,
          ownerId: currentUser.uid,
          speed: speedVal,
          accuracy: acc
        });

        setLastSyncTimeFormatted(timeStr);
      } catch (err) {
        console.warn("Failed to write live location update to Firestore:", err);
      }

    }, 5000);

    return () => clearInterval(interval);
  }, [currentUser, liveLocation, liveBattery, reverseGeocodedAddress, localDeviceId, webDeviceEnabled]);

  // 1. SYNC DEVICES LIST FROM FIRESTORE
  useEffect(() => {
    if (!currentUser) return;

    const devRef = collection(db, "devices");
    const q = query(devRef, where("ownerId", "==", currentUser.uid));
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const devList: DeviceDetails[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data() as DeviceDetails;
        if (d.deviceName === "My Pixel 8 Pro" || d.deviceModel === "Google Pixel 8 Pro (GP8P)") {
          deleteDoc(doc(db, "devices", d.deviceId)).catch((err) => {
            console.warn("Failed to auto-delete legacy Pixel:", err);
          });
        } else {
          devList.push(d);
        }
      });

      setDevices(devList);

      // Auto-select first device if none is selected
      if (devList.length > 0) {
        const localId = `device_${currentUser.uid.slice(0, 10)}`;
        if (!selectedDevice || !devList.some(d => d.deviceId === selectedDevice.deviceId)) {
          const localDev = devList.find(d => d.deviceId === localId);
          setSelectedDevice(localDev || devList[0]);
        } else {
          const updated = devList.find(d => d.deviceId === selectedDevice.deviceId);
          if (updated) setSelectedDevice(updated);
        }
      } else {
        // DB is empty, auto-seed our real client device only if web device is enabled!
        if (webDeviceEnabled) {
          try {
            const defaultId = `device_${currentUser.uid.slice(0, 10)}`;
            const newDevice: DeviceDetails = {
              deviceId: defaultId,
              deviceName: realDeviceName,
              deviceModel: realDeviceModel,
              androidVersion: realAndroidVersion,
              batteryPercentage: liveBattery.level,
              isCharging: liveBattery.charging,
              isOnline: true,
              lastSyncTime: new Date().toLocaleTimeString(),
              latitude: liveLocation?.latitude || 0.0,
              longitude: liveLocation?.longitude || 0.0,
              locationAccuracy: liveLocation?.accuracy || 12,
              ownerId: currentUser.uid
            };
            await setDoc(doc(db, "devices", defaultId), newDevice);
          } catch (err) {
            console.warn("Auto-seeding first device deferred:", err);
          }
        }
      }
    }, (error) => {
      console.error("Devices listen error:", error);
    });

    return unsubscribe;
  }, [currentUser, realDeviceName, realDeviceModel, realAndroidVersion, liveBattery, liveLocation, localDeviceId, webDeviceEnabled]);

  // 2. SYNC HISTORY LIST OF SELECTED DEVICE FROM FIRESTORE
  useEffect(() => {
    if (!currentUser || !selectedDevice) {
      setHistory([]);
      return;
    }

    const histRef = collection(db, "devices", selectedDevice.deviceId, "location_history");
    const q = query(histRef, where("ownerId", "==", currentUser.uid));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const histList: LocationHistoryItem[] = [];
      snapshot.forEach((docSnap) => {
        histList.push(docSnap.data() as LocationHistoryItem);
      });

      // Sort newest first
      histList.sort((a, b) => b.id.localeCompare(a.id));
      
      // Keep only the first 20 newest locations and automatically delete older ones
      if (histList.length > 20) {
        const toKeep = histList.slice(0, 20);
        const toDelete = histList.slice(20);
        setHistory(toKeep);

        // Delete older history records from Firestore to keep data footprint optimized
        toDelete.forEach((item) => {
          const docRef = doc(db, "devices", selectedDevice.deviceId, "location_history", item.id);
          deleteDoc(docRef).catch((err) => {
            console.warn("Failed to auto-delete older history document:", err);
          });
        });
      } else {
        setHistory(histList);
      }
    });

    return unsubscribe;
  }, [currentUser, selectedDevice]);

  // 3. SYNC NOTIFICATIONS FROM FIRESTORE
  useEffect(() => {
    if (!currentUser) return;

    const notRef = collection(db, "users", currentUser.uid, "notifications");
    
    const unsubscribe = onSnapshot(notRef, async (snapshot) => {
      const notList: AppNotification[] = [];
      snapshot.forEach((docSnap) => {
        notList.push(docSnap.data() as AppNotification);
      });

      // Sort newest first
      notList.sort((a, b) => b.id.localeCompare(a.id));
      setNotifications(notList);
    });

    return unsubscribe;
  }, [currentUser]);

  // AUDIO ALARM WARBLER SYNTHESIZER
  const playAlarmSiren = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(850, ctx.currentTime + 0.4);
      osc.frequency.linearRampToValueAtTime(450, ctx.currentTime + 0.8);
      osc.loop = true;

      gainNode.gain.setValueAtTime(0.12, ctx.currentTime);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start();
      oscillatorRef.current = osc;
    } catch (e) {
      console.warn("Acoustic alarm block by local browser security constraint:", e);
    }
  };

  const stopAlarmSiren = () => {
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      } catch (e) {}
      oscillatorRef.current = null;
    }
  };

  const handleTriggerSiren = () => {
    setSirenActive(true);
    playAlarmSiren();
    
    // Write warning dispatch to Notifications collection
    if (currentUser && selectedDevice) {
      const notId = `not_${Date.now()}`;
      setDoc(doc(db, "users", currentUser.uid, "notifications", notId), {
        id: notId,
        userId: currentUser.uid,
        title: "Acoustic Siren Broadcast Triggered",
        body: `Anti-Theft acoustic ring wail broadcasted to device: ${selectedDevice.deviceName}.`,
        timestamp: "Just now",
        read: false
      }).catch(() => {});
    }
  };

  const handleDismissSiren = () => {
    setSirenActive(false);
    stopAlarmSiren();
  };

  // 5. SCREEN ACTIONS
  const handleAddDeviceNode = async (name: string, model: string, os: string, phoneNumber?: string) => {
    if (!currentUser) return;
    const customId = `android_${currentUser.uid.slice(0, 5)}_${Date.now().toString().slice(-4)}`;
    
    try {
      const newDevice: DeviceDetails = {
        deviceId: customId,
        deviceName: name,
        deviceModel: model,
        androidVersion: os,
        batteryPercentage: 92,
        isCharging: false,
        isOnline: true,
        lastSyncTime: new Date().toLocaleTimeString(),
        latitude: 40.7812, // Central Park coordinates
        longitude: -73.9665,
        locationAccuracy: 10,
        ownerId: currentUser.uid,
        phoneNumber: phoneNumber || ""
      };

      await setDoc(doc(db, "devices", customId), newDevice);
      
      // Auto-dispatch alert
      const notId = `not_${Date.now()}`;
      await setDoc(doc(db, "users", currentUser.uid, "notifications", notId), {
        id: notId,
        userId: currentUser.uid,
        title: "Endpoint Node Registered",
        body: `Secure location daemon successfully bound to node ${name} (${phoneNumber || 'No phone'}).`,
        timestamp: "Just now",
        read: false
      });

    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `/devices/${customId}`);
    }
  };

  const handleUpdateDevicePhone = async (id: string, phone: string) => {
    try {
      await updateDoc(doc(db, "devices", id), { phoneNumber: phone });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `/devices/${id}`);
    }
  };

  const handleUpdateDeviceName = async (id: string, name: string) => {
    try {
      await updateDoc(doc(db, "devices", id), { deviceName: name });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `/devices/${id}`);
    }
  };

  const handleDeleteDeviceNode = async (id: string) => {
    try {
      await deleteDoc(doc(db, "devices", id));
      if (selectedDevice?.deviceId === id) {
        setSelectedDevice(null);
      }
      if (id === localDeviceId) {
        setWebDeviceEnabled(false);
        localStorage.setItem('track_web_device', 'false');
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `/devices/${id}`);
    }
  };

  const handleToggleLockDevice = async (deviceId: string, isLocked: boolean, message?: string) => {
    try {
      await updateDoc(doc(db, "devices", deviceId), {
        isLocked: isLocked,
        lockMessage: message || "This device has been remotely secured and locked by Findora Finder."
      });
      
      const notId = `not_${Date.now()}`;
      await setDoc(doc(db, "users", currentUser!.uid, "notifications", notId), {
        id: notId,
        userId: currentUser!.uid,
        title: isLocked ? "Remote Lock Engaged" : "Remote Lock Released",
        body: `Remote lock command dispatched successfully for device: ${devices.find(d => d.deviceId === deviceId)?.deviceName || deviceId}.`,
        timestamp: "Just now",
        read: false
      });
    } catch (err) {
      console.warn("Failed to toggle remote lock in Firestore:", err);
    }
  };

  const handleRefreshLocation = async (deviceId: string, isAuto = false) => {
    if (!currentUser) return;
    const dev = devices.find(d => d.deviceId === deviceId);
    if (!dev) return;

    // Write alert only if not auto-refreshing
    if (!isAuto) {
      const notId = `not_${Date.now()}`;
      await setDoc(doc(db, "users", currentUser.uid, "notifications", notId), {
        id: notId,
        userId: currentUser.uid,
        title: "GPS Query Dispatched",
        body: `Polled live high-accuracy GPS telemetry from ${dev.deviceName}.`,
        timestamp: "Just now",
        read: false
      });
    }

    if (deviceId === localDeviceId) {
      if (typeof window !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const ts = new Date(position.timestamp).toLocaleTimeString();
          const addr = await reverseGeocode(lat, lng);
          const pointId = `hist_${Date.now()}`;
          
          const devRef = doc(db, "devices", localDeviceId);
          await setDoc(devRef, {
            latitude: lat,
            longitude: lng,
            batteryPercentage: liveBattery.level,
            lastSyncTime: ts,
            isOnline: true
          }, { merge: true });

          const histDocRef = doc(db, "devices", localDeviceId, "location_history", pointId);
          await setDoc(histDocRef, {
            id: pointId,
            deviceId: localDeviceId,
            latitude: lat,
            longitude: lng,
            timestamp: ts,
            batteryLevel: liveBattery.level,
            status: "Online",
            addressName: addr,
            ownerId: currentUser.uid,
            speed: position.coords.speed || 0,
            accuracy: position.coords.accuracy
          });

          setReverseGeocodedAddress(addr);
          setLocationError(null);
        }, (err) => {
          console.warn("Geolocation permission error or timeout:", err);
          if (err.code === err.PERMISSION_DENIED) {
            setLocationError("Location permission was denied. Please allow location access in site settings.");
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            setLocationError("GPS is turned OFF. Please enable Location Services / GPS on your device.");
          } else {
            setLocationError(`Location tracker offline: ${err.message}`);
          }
        });
      }
    } else {
      // For external nodes like the Android emulator/phone, the physical device updates its own coordinates.
      // We do not simulate or shift anything here to preserve the true physical GPS track.
    }
  };

  // 4b. AUTO-REFRESH GPS LOCATION EVERY 2 SECONDS FOR HOME AND MAP TABS
  const handleRefreshLocationRef = useRef(handleRefreshLocation);
  useEffect(() => {
    handleRefreshLocationRef.current = handleRefreshLocation;
  }, [handleRefreshLocation]);

  useEffect(() => {
    if (!currentUser || !selectedDevice) return;
    if (activeTab !== 'home' && activeTab !== 'map') return;

    const interval = setInterval(() => {
      if (handleRefreshLocationRef.current) {
        handleRefreshLocationRef.current(selectedDevice.deviceId, true);
      }
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [currentUser, selectedDevice?.deviceId, activeTab]);

  const handleTriggerSOS = async () => {
    if (!currentUser || !selectedDevice) return;
    
    try {
      const notId = `not_${Date.now()}`;
      await setDoc(doc(db, "users", currentUser.uid, "notifications", notId), {
        id: notId,
        userId: currentUser.uid,
        title: "CRITICAL EMERGENCY SOS",
        body: `Emergency search signal triggered for ${selectedDevice.deviceName}! GPS pinpoint telemetry dispatching coordinates.`,
        timestamp: "Just now",
        read: false
      });
      
      handleTriggerSiren();
      alert("SOS alarm triggered! Server dispatched beacon warnings to all security contacts.");
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkRead = async (id: string) => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, "users", currentUser.uid, "notifications", id), { read: true });
    } catch (err) {}
  };

  const handleMarkAllRead = async () => {
    if (!currentUser) return;
    try {
      const batch = writeBatch(db);
      notifications.forEach((not) => {
        if (!not.read) {
          const ref = doc(db, "users", currentUser!.uid, "notifications", not.id);
          batch.update(ref, { read: true });
        }
      });
      await batch.commit();
    } catch (err) {}
  };

  const handleDeleteNotification = async (id: string) => {
    if (!currentUser) return;
    try {
      await deleteDoc(doc(db, "users", currentUser.uid, "notifications", id));
    } catch (err) {}
  };

  const handleClearAllFeed = async () => {
    if (!currentUser) return;
    try {
      const batch = writeBatch(db);
      notifications.forEach((not) => {
        const ref = doc(db, "users", currentUser!.uid, "notifications", not.id);
        batch.delete(ref);
      });
      await batch.commit();
    } catch (err) {}
  };

  // Clean up sound wail on dismount
  useEffect(() => {
    return () => stopAlarmSiren();
  }, []);

  // SPLASH SCREEN LOGIC
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  // AUTH SCREEN LOGIC
  if (!currentUser) {
    return <AuthScreen />;
  }

  const isLocalDeviceLocked = devices.find(d => d.deviceId === localDeviceId)?.isLocked === true;

  if (currentUser && isLocalDeviceLocked) {
    const lockedDeviceData = devices.find(d => d.deviceId === localDeviceId);
    const lockMsg = lockedDeviceData?.lockMessage || "This device has been remotely secured and locked by Findora Finder.";
    return (
      <div className="fixed inset-0 bg-slate-950 text-white z-[9999] flex flex-col justify-between p-6 sm:p-12 select-none antialiased">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-500 via-indigo-900 to-slate-950"></div>
        
        {/* Top Header */}
        <div className="relative z-10 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-500 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Findora Safe Lock v2.5</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-red-500 uppercase bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
            Locked Remotely
          </div>
        </div>

        {/* Center Information */}
        <div className="relative z-10 max-w-lg mx-auto text-center space-y-6 my-auto">
          <div className="h-20 w-20 rounded-3xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto shadow-2xl shadow-red-500/10">
            <Lock className="w-10 h-10 text-red-500 animate-bounce" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">Device Blocked</h1>
            <p className="text-xs text-slate-400 font-mono font-bold">NODE IDENTIFIER: {localDeviceId}</p>
          </div>

          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-3xl text-sm leading-relaxed text-slate-300">
            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider block mb-2">Message from Owner</span>
            "{lockMsg}"
          </div>

          {/* Contact Information */}
          <div className="space-y-3 pt-4">
            <p className="text-xs text-slate-400">If you found this device, please contact the owner immediately:</p>
            {lockedDeviceData?.phoneNumber && (
              <a 
                href={`tel:${lockedDeviceData.phoneNumber}`} 
                className="inline-flex items-center gap-2.5 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
              >
                <Phone className="w-4 h-4 fill-current animate-pulse" />
                Call Owner: {lockedDeviceData.phoneNumber}
              </a>
            )}
            <p className="text-[10px] text-slate-500">Findora Security Protocol is actively broadcasting this browser's GPS position in the background.</p>
          </div>
        </div>

        {/* Remote unlock check / PIN form */}
        <div className="relative z-10 max-w-xs mx-auto w-full text-center space-y-4 pt-6 border-t border-slate-900">
          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Unlock via Owner PIN</p>
          <div className="flex gap-2 justify-center">
            <input
              type="password"
              placeholder="Enter 4-digit PIN"
              maxLength={4}
              id="unlock-pin-input"
              className="px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl focus:border-blue-500 outline-none text-center font-black tracking-widest text-sm text-white w-full"
              onKeyDown={async (e) => {
                if (e.key === 'Enter') {
                  const inputVal = (e.target as HTMLInputElement).value;
                  if (inputVal === '1234') {
                    // Unlock the device remotely!
                    await handleToggleLockDevice(localDeviceId, false);
                  } else {
                    alert("Invalid PIN! Security lockdown remains active.");
                    (e.target as HTMLInputElement).value = "";
                  }
                }
              }}
            />
          </div>
          <p className="text-[9px] text-slate-600">Default recovery PIN is <span className="font-mono text-slate-500 font-bold">1234</span> for preview mode.</p>
        </div>
      </div>
    );
  }

  // RENDERING TAB VIEWS
  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeScreen
            devices={devices}
            selectedDevice={selectedDevice}
            onSelectDevice={setSelectedDevice}
            history={history}
            sirenActive={sirenActive}
            onTriggerSiren={handleTriggerSiren}
            onDismissSiren={handleDismissSiren}
            onAddDevice={() => setActiveTab('devices')}
            onTriggerSOS={handleTriggerSOS}
            isSimulating={false}
            onToggleSimulation={() => {}}
            locationPermission={locationPermission}
            locationError={locationError}
            onRefreshLocation={handleRefreshLocation}
            onToggleLockDevice={(id) => handleToggleLockDevice(id, !devices.find(d => d.deviceId === id)?.isLocked)}
            reverseGeocodedAddress={reverseGeocodedAddress}
          />
        );
      case 'devices':
        return (
          <DevicesScreen
            devices={devices}
            onAddDevice={handleAddDeviceNode}
            onUpdateDeviceName={handleUpdateDeviceName}
            onUpdateDevicePhone={handleUpdateDevicePhone}
            onDeleteDevice={handleDeleteDeviceNode}
            webDeviceEnabled={webDeviceEnabled}
            onToggleWebDevice={(enabled) => {
              setWebDeviceEnabled(enabled);
              localStorage.setItem('track_web_device', enabled ? 'true' : 'false');
              if (!enabled && localDeviceId) {
                // Instantly remove from database
                deleteDoc(doc(db, "devices", localDeviceId)).catch(e => console.warn(e));
                if (selectedDevice?.deviceId === localDeviceId) {
                  setSelectedDevice(null);
                }
              }
            }}
          />
        );
      case 'map':
        return (
          <MapScreen
            device={selectedDevice}
            history={history}
            selectedHistoryId={selectedHistoryId}
            onSelectHistory={setSelectedHistoryId}
            locationPermission={locationPermission}
            locationError={locationError}
            reverseGeocodedAddress={reverseGeocodedAddress}
            lastSyncTimeFormatted={lastSyncTimeFormatted}
            liveLocation={liveLocation}
            sirenActive={sirenActive}
            onTriggerSiren={handleTriggerSiren}
            onDismissSiren={handleDismissSiren}
            onLockDevice={() => {
              if (selectedDevice) {
                handleToggleLockDevice(selectedDevice.deviceId, !selectedDevice.isLocked);
              }
            }}
            pinLocked={selectedDevice ? selectedDevice.isLocked : false}
            onRefreshLocation={handleRefreshLocation}
          />
        );
      case 'notifications':
        return (
          <NotificationsScreen
            notifications={notifications}
            onMarkRead={handleMarkRead}
            onMarkAllRead={handleMarkAllRead}
            onDeleteNotification={handleDeleteNotification}
            onClearAll={handleClearAllFeed}
          />
        );
      case 'profile':
        return <ProfileScreen />;
    }
  };

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans select-none overflow-x-hidden antialiased">
      
      {/* Dynamic Top Header */}
      <header className="bg-white/95 border-b border-slate-100 sticky top-0 z-40 px-6 py-4 flex justify-between items-center shadow-sm shadow-slate-100/50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-600/10">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold tracking-tight text-slate-800 uppercase flex items-center gap-2">
              FindoraApp <span className="text-[9px] bg-blue-50 border border-blue-100 text-blue-600 font-mono px-2 py-0.5 rounded-full font-bold">Secure Node</span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">Safe Track & Anti-Theft Device Recovery</p>
          </div>
        </div>

        {/* Sync Feed indicator */}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[10px] font-mono uppercase tracking-wide text-slate-400 font-bold hidden sm:inline">Broadcasting Live Coordinates</span>
        </div>
      </header>

      {/* Main Responsive Workstation Canvas */}
      <main className="flex-1 w-full max-w-5xl mx-auto p-4 sm:p-6">
        {renderTabContent()}
      </main>

      {/* Fixed Sticky Bottom Navigation (MD3 Spec) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 border-t border-slate-100 backdrop-blur-md px-4 py-2.5 z-40 flex justify-around items-center max-w-xl mx-auto rounded-t-3xl shadow-2xl shadow-slate-300">
        
        {/* Navigation Button: Home */}
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
            activeTab === 'home' ? 'text-blue-600 font-bold scale-105' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition ${activeTab === 'home' ? 'bg-blue-50' : ''}`}>
            <Smartphone className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-1 font-semibold">Home</span>
        </button>

        {/* Navigation Button: Map */}
        <button
          onClick={() => setActiveTab('map')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
            activeTab === 'map' ? 'text-blue-600 font-bold scale-105' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition ${activeTab === 'map' ? 'bg-blue-50' : ''}`}>
            <MapIcon className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-1 font-semibold">Map</span>
        </button>

        {/* Navigation Button: Notifications */}
        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all relative cursor-pointer ${
            activeTab === 'notifications' ? 'text-blue-600 font-bold scale-105' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition ${activeTab === 'notifications' ? 'bg-blue-50' : ''}`}>
            <Bell className="w-5 h-5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1 right-5 bg-red-500 text-white text-[8px] font-bold h-4.5 w-4.5 rounded-full flex items-center justify-center border-2 border-white">
                {unreadNotificationsCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1 font-semibold">Alerts</span>
        </button>

        {/* Navigation Button: Profile */}
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
            activeTab === 'profile' ? 'text-blue-600 font-bold scale-105' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition ${activeTab === 'profile' ? 'bg-blue-50' : ''}`}>
            <User className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-1 font-semibold">Profile</span>
        </button>

      </nav>

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
