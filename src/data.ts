import { DeviceDetails, LocationHistoryItem } from './types';

export const INITIAL_DEVICE: DeviceDetails = {
  deviceId: "android_pixel_emulator",
  deviceName: "My Pixel 8 Pro",
  deviceModel: "Google Pixel 8 Pro (GP8P)",
  androidVersion: "Android 14 (U)",
  batteryPercentage: 82,
  isCharging: false,
  isOnline: true,
  lastSyncTime: "Just now",
  latitude: 40.7829, // Central Park, NY
  longitude: -73.9654,
  locationAccuracy: 12, // meters
};

export const MOCK_TRACKS = {
  centralPark: {
    name: "Central Park Walk (New York)",
    coords: [
      { lat: 40.7829, lng: -73.9654, name: "Central Park Great Lawn", battery: 82 },
      { lat: 40.7812, lng: -73.9665, name: "Metropolitan Museum of Art", battery: 81 },
      { lat: 40.7794, lng: -73.9682, name: "The Ramble", battery: 80 },
      { lat: 40.7761, lng: -73.9701, name: "Bethesda Fountain", battery: 79 },
      { lat: 40.7737, lng: -73.9709, name: "The Mall & Literary Walk", battery: 78 },
      { lat: 40.7712, lng: -73.9723, name: "Sheep Meadow", battery: 77 },
      { lat: 40.7678, lng: -73.9745, name: "Wollman Rink", battery: 76 },
      { lat: 40.7651, lng: -73.9763, name: "Grand Army Plaza Entry", battery: 75 }
    ]
  },
  siliconValley: {
    name: "Silicon Valley Drive (California)",
    coords: [
      { lat: 37.4275, lng: -122.1697, name: "Stanford University Entrance", battery: 94 },
      { lat: 37.4419, lng: -122.1430, name: "Palo Alto Caltrain Station", battery: 93 },
      { lat: 37.4529, lng: -122.1158, name: "East Palo Alto Center", battery: 92 },
      { lat: 37.4848, lng: -122.1484, name: "Meta Headquarters (1 Hacker Way)", battery: 91 },
      { lat: 37.4220, lng: -122.0841, name: "Googleplex (Mountain View)", battery: 89 },
      { lat: 37.3318, lng: -122.0312, name: "Apple Park (Cupertino)", battery: 87 }
    ]
  },
  londonSecure: {
    name: "London Secure Transit (UK)",
    coords: [
      { lat: 51.5007, lng: -0.1246, name: "Westminster Big Ben", battery: 45 },
      { lat: 51.5033, lng: -0.1195, name: "London Eye", battery: 44 },
      { lat: 51.5076, lng: -0.1141, name: "Southbank Promenade", battery: 42 },
      { lat: 51.5081, lng: -0.0975, name: "Tate Modern", battery: 40 },
      { lat: 51.5056, lng: -0.0863, name: "The Shard Crossing", battery: 39 },
      { lat: 51.5080, lng: -0.0760, name: "Tower of London", battery: 38 }
    ]
  }
};

export const INITIAL_HISTORY: LocationHistoryItem[] = [
  {
    id: "hist_1",
    latitude: 40.7829,
    longitude: -73.9654,
    timestamp: "10 minutes ago",
    batteryLevel: 82,
    status: "Online",
    addressName: "Central Park Great Lawn, NY"
  },
  {
    id: "hist_2",
    latitude: 40.7812,
    longitude: -73.9665,
    timestamp: "25 minutes ago",
    batteryLevel: 81,
    status: "Online",
    addressName: "Metropolitan Museum of Art, NY"
  },
  {
    id: "hist_3",
    latitude: 40.7794,
    longitude: -73.9682,
    timestamp: "45 minutes ago",
    batteryLevel: 80,
    status: "Online",
    addressName: "The Ramble, Central Park, NY"
  },
  {
    id: "hist_4",
    latitude: 40.7761,
    longitude: -73.9701,
    timestamp: "1 hour ago",
    batteryLevel: 79,
    status: "Online",
    addressName: "Bethesda Fountain, Central Park, NY"
  },
  {
    id: "hist_5",
    latitude: 40.7737,
    longitude: -73.9709,
    timestamp: "2 hours ago",
    batteryLevel: 78,
    status: "Online",
    addressName: "The Mall, Central Park, NY"
  }
];

export const MOCK_NOTIFICATIONS = [
  {
    id: "not_1",
    title: "Device Safe Zone Alert",
    body: "My Pixel 8 Pro has entered the 'Home' Geofence boundary successfully.",
    timestamp: "5 minutes ago",
    read: false
  },
  {
    id: "not_2",
    title: "Battery Warning Alert",
    body: "Critical Battery reached! Automated location snapshot recorded in Firestore.",
    timestamp: "1 hour ago",
    read: true
  },
  {
    id: "not_3",
    title: "System Shield Activated",
    body: "FindoraApp real-time tracking shield successfully bound to Android Background Location Manager.",
    timestamp: "1 day ago",
    read: true
  }
];
