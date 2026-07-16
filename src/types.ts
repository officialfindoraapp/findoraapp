export interface DeviceDetails {
  deviceId: string;
  deviceName: string;
  deviceModel: string;
  androidVersion: string;
  batteryPercentage: number;
  isCharging: boolean;
  isOnline: boolean;
  lastSyncTime: string | any;
  latitude: number;
  longitude: number;
  locationAccuracy: number;
  ownerId?: string;
  phoneNumber?: string;
  isLocked?: boolean;
  lockMessage?: string;
  speed?: number;
  bearing?: number;
}

export interface LocationHistoryItem {
  id: string;
  deviceId?: string;
  latitude: number;
  longitude: number;
  timestamp: string | any;
  batteryLevel: number;
  status: 'Online' | 'Offline';
  addressName: string;
  ownerId?: string;
  speed?: number | null;
  bearing?: number | null;
  accuracy?: number;
}

export interface SecurityLog {
  id: string;
  timestamp: string;
  type: 'auth' | 'location' | 'notification' | 'system' | 'alarm';
  message: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
}
