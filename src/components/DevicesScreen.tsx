import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Smartphone, Plus, Edit2, Trash2, Check, RefreshCw, X, 
  Battery, Activity, Power, Lock, ShieldCheck, Cpu, Phone 
} from 'lucide-react';
import { DeviceDetails } from '../types';

interface DevicesScreenProps {
  devices: DeviceDetails[];
  onAddDevice: (deviceName: string, deviceModel: string, androidVersion: string, phoneNumber?: string) => void;
  onUpdateDeviceName: (deviceId: string, newName: string) => void;
  onUpdateDevicePhone?: (deviceId: string, phoneNumber: string) => void;
  onDeleteDevice: (deviceId: string) => void;
  webDeviceEnabled: boolean;
  onToggleWebDevice: (enabled: boolean) => void;
}

export default function DevicesScreen({
  devices,
  onAddDevice,
  onUpdateDeviceName,
  onUpdateDevicePhone,
  onDeleteDevice,
  webDeviceEnabled,
  onToggleWebDevice
}: DevicesScreenProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isEditingPhone, setIsEditingPhone] = useState<string | null>(null);
  const [deletingDeviceId, setDeletingDeviceId] = useState<string | null>(null);
  
  // Add state
  const [newName, setNewName] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newVersion, setNewVersion] = useState('Android 14 (U)');
  const [newPhone, setNewPhone] = useState('');

  // Edit state
  const [editedName, setEditedName] = useState('');
  const [editedPhone, setEditedPhone] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newModel) return;
    onAddDevice(newName, newModel, newVersion, newPhone || undefined);
    setNewName('');
    setNewModel('');
    setNewPhone('');
    setNewVersion('Android 14 (U)');
    setIsAdding(false);
  };

  const handleEditSubmit = (deviceId: string) => {
    if (!editedName) return;
    onUpdateDeviceName(deviceId, editedName);
    setIsEditing(null);
    setEditedName('');
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-sans tracking-tight">Protect Device Fleet</h2>
          <p className="text-xs text-slate-400 mt-1">Register and monitor your Android smartphone, tablet, and smarttag endpoints.</p>
        </div>
        
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl flex items-center gap-2 shadow-md shadow-blue-500/15 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Secure Device
          </button>
        )}
      </div>

      {/* Web Browser Tracking Toggle Banner */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${webDeviceEnabled ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-400'}`}>
            <Activity className="w-5.5 h-5.5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-800">Browser Tracker (My Web Device)</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {webDeviceEnabled 
                ? "This browser tab is acting as an active reporting secure device." 
                : "Continuous tracking of this browser is suspended."}
            </p>
          </div>
        </div>

        <button
          onClick={() => onToggleWebDevice(!webDeviceEnabled)}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition duration-200 cursor-pointer shadow-sm ${
            webDeviceEnabled 
              ? 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100' 
              : 'bg-emerald-650 bg-emerald-600 text-white hover:bg-emerald-700'
          }`}
        >
          {webDeviceEnabled ? "Remove Web Device" : "Add Web Device"}
        </button>
      </div>

      {/* Adding form */}
      {isAdding && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4"
        >
          <div className="flex justify-between items-center pb-3 border-b border-slate-50">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Register New Device Node</h3>
            <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600 transition">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleAddSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Custom Device Name</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. My Primary Pixel"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-slate-700 transition"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Model Identifier</label>
              <input
                type="text"
                required
                value={newModel}
                onChange={(e) => setNewModel(e.target.value)}
                placeholder="e.g. Google Pixel 8 Pro"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-slate-700 transition"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Phone Number</label>
              <input
                type="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="e.g. +1 (555) 019-2834"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-slate-700 transition"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Android OS Version</label>
                <select
                  value={newVersion}
                  onChange={(e) => setNewVersion(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-slate-700 transition cursor-pointer"
                >
                  <option value="Android 14 (U)">Android 14 (U)</option>
                  <option value="Android 13 (T)">Android 13 (T)</option>
                  <option value="Android 12 (S)">Android 12 (S)</option>
                </select>
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 h-[38px] bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/10 transition cursor-pointer self-end"
              >
                Register
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Devices List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {devices.map((dev) => (
          <div 
            key={dev.deviceId} 
            className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex flex-col justify-between hover:border-blue-100/60 transition duration-300"
          >
            <div className="space-y-4">
              {/* Header card info */}
              <div className="flex justify-between items-start gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-blue-50 text-[#2563EB] rounded-2xl flex items-center justify-center">
                    <Smartphone className="w-5.5 h-5.5" />
                  </div>
                  <div>
                    {isEditing === dev.deviceId ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          className="px-2 py-1 text-xs border rounded-lg focus:border-blue-500 outline-none"
                        />
                        <button 
                          onClick={() => handleEditSubmit(dev.deviceId)}
                          className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md hover:bg-emerald-100"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => setIsEditing(null)}
                          className="p-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-extrabold text-slate-800">{dev.deviceName}</h4>
                        <button 
                          onClick={() => {
                            setIsEditing(dev.deviceId);
                            setEditedName(dev.deviceName);
                          }}
                          className="text-slate-400 hover:text-slate-600 p-1"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5 font-mono">{dev.deviceModel}</span>
                  </div>
                </div>

                <div className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                  dev.isOnline ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-500 border border-slate-100'
                }`}>
                  {dev.isOnline ? 'Online' : 'Offline'}
                </div>
              </div>

              {/* Specs parameters */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl text-xs">
                <div className="space-y-1">
                  <span className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wider block">OS Platform</span>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <Cpu className="w-3.5 h-3.5 text-slate-400" />
                    <span>{dev.androidVersion}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wider block">Power Battery</span>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <Battery className="w-3.5 h-3.5 text-slate-400" />
                    <span>{dev.batteryPercentage}% {dev.isCharging && '(Charging)'}</span>
                  </div>
                </div>
              </div>

              {/* Phone Number spec */}
              <div className="bg-slate-50 p-4 rounded-2xl text-xs space-y-1">
                <span className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wider block">Device Phone Number</span>
                {isEditingPhone === dev.deviceId ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="tel"
                      value={editedPhone}
                      onChange={(e) => setEditedPhone(e.target.value)}
                      className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:border-blue-500 outline-none w-full font-mono text-slate-800"
                    />
                    <button 
                      onClick={() => {
                        if (onUpdateDevicePhone) {
                          onUpdateDevicePhone(dev.deviceId, editedPhone);
                        }
                        setIsEditingPhone(null);
                      }}
                      className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md hover:bg-emerald-100 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => setIsEditingPhone(null)}
                      className="p-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-700 font-mono">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{dev.phoneNumber || 'Not Linked'}</span>
                    </div>
                    <button
                      onClick={() => {
                        setIsEditingPhone(dev.deviceId);
                        setEditedPhone(dev.phoneNumber || '');
                      }}
                      className="text-blue-600 hover:text-blue-700 text-[10px] font-bold uppercase cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-50">
              {deletingDeviceId === dev.deviceId ? (
                <div className="flex items-center gap-2 bg-red-50/50 border border-red-100 rounded-xl px-3 py-1.5 w-full justify-between">
                  <span className="text-[10.5px] text-red-700 font-bold uppercase tracking-wider">Unregister Device?</span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => {
                        onDeleteDevice(dev.deviceId);
                        setDeletingDeviceId(null);
                      }}
                      className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-extrabold text-[9.5px] rounded-lg uppercase tracking-wider cursor-pointer transition-colors"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setDeletingDeviceId(null)}
                      className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold text-[9.5px] rounded-lg uppercase tracking-wider cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
                    ID: {dev.deviceId}
                  </span>

                  <button
                    onClick={() => setDeletingDeviceId(dev.deviceId)}
                    className="p-2 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition cursor-pointer"
                    title="Remove registration"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

          </div>
        ))}

        {devices.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white border border-slate-100 rounded-3xl p-6">
            <Smartphone className="w-12 h-12 text-slate-300 mx-auto mb-3 animate-pulse" />
            <p className="text-sm font-bold text-slate-700">No endpoints registered in your account</p>
            <p className="text-xs text-slate-400 mt-1">Use the register panel to secure a new device.</p>
          </div>
        )}
      </div>
    </div>
  );
}
