import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Shield, Radio } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-[#0F172A] flex flex-col items-center justify-center z-50 overflow-hidden select-none">
      {/* Background soft ambient glowing lights */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-blue-600/10 blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-indigo-600/10 blur-[100px] animate-pulse" style={{ animationDelay: '1.5s' }}></div>

      <div className="relative flex flex-col items-center max-w-sm px-6 text-center">
        {/* Animated Radar/Shield Beacon */}
        <div className="relative flex items-center justify-center mb-8">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [1, 2.2, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="absolute w-28 h-28 rounded-full border-2 border-blue-500/30"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", delay: 0.5 }}
            className="absolute w-24 h-24 rounded-full border border-blue-400/20"
          />
          
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 120, delay: 0.2 }}
            className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#2563EB] to-[#1D4ED8] flex items-center justify-center shadow-[0_15px_40px_rgba(37,99,235,0.4)] relative z-10"
          >
            <Shield className="w-10 h-10 text-white" />
          </motion.div>
          
          {/* Radio signal blinker */}
          <span className="absolute -top-1 -right-1 flex h-4 w-4 z-20">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-[#0F172A]"></span>
          </span>
        </div>

        {/* Brand Text */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="text-3xl font-extrabold text-white tracking-tight font-sans"
        >
          FindoraApp
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ delay: 1.1, duration: 0.5 }}
          className="text-sm text-blue-200 mt-2 font-medium tracking-wide"
        >
          Find. Protect. Connect.
        </motion.p>

        {/* Loading details */}
        <div className="absolute bottom-[-140px] left-1/2 transform -translate-x-1/2 flex flex-col items-center w-64">
          <div className="w-12 h-1 bg-blue-950 rounded-full overflow-hidden mb-3">
            <motion.div 
              initial={{ left: "-100%" }}
              animate={{ left: "100%" }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              className="relative h-full w-1/2 bg-blue-500 rounded-full"
            />
          </div>
          <span className="text-[10px] text-blue-300/60 font-mono tracking-widest uppercase">
            Securing Connection...
          </span>
        </div>
      </div>
    </div>
  );
}
