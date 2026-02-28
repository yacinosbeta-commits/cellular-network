/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  IonApp, 
  IonPage, 
  IonHeader, 
  IonContent, 
  IonToolbar, 
  IonTitle, 
  IonButtons, 
  IonButton, 
  IonFooter, 
  IonRefresher, 
  IonRefresherContent,
  RefresherEventDetail
} from '@ionic/react';
import { 
  MapPin, 
  Radio, 
  Activity, 
  RefreshCw, 
  Copy, 
  Info,
  Shield,
  Smartphone,
  Zap,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---

interface NetworkData {
  operator: string;
  technology: string;
  cid: string;
  lac: string;
  mcc: string;
  mnc: string;
  rssi: number;
  rsrp: number;
  rsrq: number;
  band: string;
  frequency: string;
  timestamp: string;
  isRealData?: boolean;
}

// --- Mock Data Generator ---
const generateMockData = (): NetworkData => {
  const technologies = ['4G (LTE)', '5G (NR)', '3G (UMTS)', '4G+ (LTE-A)'];
  const operators = ['Mobilis', 'Djezzy', 'Ooredoo', 'Verizon', 'T-Mobile', 'Vodafone'];
  const bands = [
    { name: 'LTE Band 1', freq: '2100 MHz (L2100)' },
    { name: 'LTE Band 3', freq: '1800 MHz (L1800)' },
    { name: 'LTE Band 20', freq: '800 MHz (L800)' },
    { name: '5G NR n78', freq: '3500 MHz' },
    { name: '5G NR n41', freq: '2500 MHz' },
  ];

  const selectedTech = technologies[Math.floor(Math.random() * technologies.length)];
  const selectedBand = bands[Math.floor(Math.random() * bands.length)];
  
  return {
    operator: operators[Math.floor(Math.random() * operators.length)],
    technology: selectedTech,
    cid: Math.floor(Math.random() * 99999999).toString(),
    lac: Math.floor(Math.random() * 99999).toString(),
    mcc: '603',
    mnc: '01',
    rssi: -70 - Math.floor(Math.random() * 30),
    rsrp: -90 - Math.floor(Math.random() * 20),
    rsrq: -10 - Math.floor(Math.random() * 10),
    band: selectedBand.name,
    frequency: selectedBand.freq,
    timestamp: new Date().toLocaleTimeString(),
  };
};

// --- Components ---

const StatCard = ({ icon: Icon, label, value, subValue, colorClass = "text-emerald-500" }: { 
  icon: any, 
  label: string, 
  value: string | number, 
  subValue?: string,
  colorClass?: string 
}) => (
  <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl flex flex-col gap-2 hover:border-zinc-700 transition-colors">
    <div className="flex items-center gap-2 text-zinc-500">
      <Icon size={16} />
      <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
    </div>
    <div className="flex flex-col">
      <span className={`text-xl font-semibold ${colorClass}`}>{value}</span>
      {subValue && <span className="text-xs text-zinc-500 font-mono">{subValue}</span>}
    </div>
  </div>
);

export default function App() {
  const [data, setData] = useState<NetworkData>(generateMockData());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [usingRealHardware, setUsingRealHardware] = useState(false);

  // Listen for native bridge events
  useEffect(() => {
    const handleNativeNetworkUpdate = (event: any) => {
      if (event.detail) {
        setData({
          ...event.detail,
          timestamp: new Date().toLocaleTimeString(),
          isRealData: true
        });
        setUsingRealHardware(true);
      }
    };

    window.addEventListener('nativeNetworkUpdate', handleNativeNetworkUpdate);
    return () => window.removeEventListener('nativeNetworkUpdate', handleNativeNetworkUpdate);
  }, []);

  const refreshData = useCallback((event?: CustomEvent<RefresherEventDetail>) => {
    setIsRefreshing(true);
    
    if (!usingRealHardware) {
      setTimeout(() => {
        setData(generateMockData());
        setIsRefreshing(false);
        if (event) event.detail.complete();
      }, 600);
    } else {
      // Trigger native refresh if available
      setTimeout(() => {
        setIsRefreshing(false);
        if (event) event.detail.complete();
      }, 600);
    }
  }, [usingRealHardware]);

  useEffect(() => {
    const interval = setInterval(() => refreshData(), 5000);
    return () => clearInterval(interval);
  }, [refreshData]);

  const handleRequestPermission = () => {
    setPermissionGranted(true);
  };

  const copyToClipboard = () => {
    const text = JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(text);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  if (!permissionGranted) {
    return (
      <IonApp>
        <IonPage className="bg-black">
          <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center p-6 font-sans">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-md w-full bg-zinc-900 border border-zinc-800 p-8 rounded-3xl text-center space-y-6"
            >
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
                <Shield className="text-emerald-500" size={40} />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold">Permissions Required</h1>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  To display detailed cellular information, this application requires access to your phone state and location data.
                </p>
              </div>
              <button 
                onClick={handleRequestPermission}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-4 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                Grant Access
              </button>
              <p className="text-zinc-600 text-xs">
                Note: This is an Ionic demonstration. Real hardware access requires a native Android application.
              </p>
            </motion.div>
          </div>
        </IonPage>
      </IonApp>
    );
  }

  return (
    <IonApp>
      <IonPage className="bg-black">
        <IonHeader className="ion-no-border">
          <IonToolbar className="bg-black/80 backdrop-blur-md px-4" style={{ '--background': 'transparent', '--border-color': 'transparent' }}>
            <div className="flex items-center gap-3 py-2">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                <Radio className="text-black" size={24} />
              </div>
              <div>
                <h1 className="font-bold text-lg leading-tight text-white">NetMonitor</h1>
                <div className="flex items-center gap-2">
                  <span className={`flex h-2 w-2 rounded-full ${usingRealHardware ? 'bg-blue-500' : 'bg-emerald-500'} animate-pulse`} />
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                    {usingRealHardware ? 'Hardware Active' : 'Live Tracking'}
                  </span>
                </div>
              </div>
            </div>
            <IonButtons slot="end">
              <IonButton onClick={() => refreshData()} disabled={isRefreshing}>
                <RefreshCw size={20} className={`${isRefreshing ? "animate-spin" : ""} text-white`} />
              </IonButton>
              <IonButton onClick={copyToClipboard}>
                <Copy size={20} className="text-white" />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <IonContent className="ion-padding bg-black" style={{ '--background': '#000' }}>
          <IonRefresher slot="fixed" onIonRefresh={refreshData}>
            <IonRefresherContent pullingText="Pull to refresh" refreshingSpinner="crescent" />
          </IonRefresher>

          <main className="max-w-2xl mx-auto space-y-6 pb-24">
            {/* Main Connection Status */}
            <section className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 p-6 rounded-3xl space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Current Operator</span>
                  <h2 className="text-3xl font-bold text-white">{data.operator}</h2>
                </div>
                <div className={`px-3 py-1 rounded-full border ${usingRealHardware ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
                  <span className="text-xs font-bold">{data.technology}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Signal Strength</span>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-mono font-bold text-white">{data.rssi}</span>
                    <span className="text-xs text-zinc-500 mb-1">dBm</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(0, Math.min(100, (data.rssi + 120) * 1.5))}%` }}
                      className={`h-full ${usingRealHardware ? 'bg-blue-500' : 'bg-emerald-500'}`}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Band / Frequency</span>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-zinc-200">{data.band}</span>
                    <span className="text-xs text-zinc-500 font-mono">{data.frequency}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Detailed Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StatCard 
                icon={MapPin} 
                label="Cell ID (CID)" 
                value={data.cid} 
                subValue="Unique Sector ID"
              />
              <StatCard 
                icon={Activity} 
                label="LAC / TAC" 
                value={data.lac} 
                subValue="Tracking Area Code"
              />
              <StatCard 
                icon={Globe} 
                label="MCC / MNC" 
                value={`${data.mcc} / ${data.mnc}`} 
                subValue="Mobile Country/Network Code"
              />
              <StatCard 
                icon={Zap} 
                label="RSRP / RSRQ" 
                value={`${data.rsrp} / ${data.rsrq}`} 
                subValue="Reference Signal Power/Quality"
                colorClass="text-blue-400"
              />
            </div>

            {/* Technical Info Section */}
            <section className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-4 flex items-start gap-3">
              <Info className="text-zinc-500 shrink-0" size={18} />
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Technical Note</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  This Ionic dashboard provides a real-time visualization of cellular telemetry. 
                  The full 100% Native Kotlin source code is available in the <b>native-android-source.md</b> file in this project.
                </p>
              </div>
            </section>

            {/* Footer Info */}
            <div className="text-center space-y-2 pt-4">
              <p className="text-[10px] text-zinc-600 uppercase tracking-[0.2em]">
                Last Updated: {data.timestamp}
              </p>
              <div className="flex justify-center gap-4">
                <div className="flex items-center gap-1 text-zinc-500">
                  <Smartphone size={12} />
                  <span className="text-[10px]">Ionic Hybrid App</span>
                </div>
                <div className="flex items-center gap-1 text-zinc-500">
                  <Globe size={12} />
                  <span className="text-[10px]">Dual SIM Support</span>
                </div>
              </div>
            </div>
          </main>

          {/* Toast Notification */}
          <AnimatePresence>
            {showToast && (
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-zinc-800 text-white px-6 py-3 rounded-2xl shadow-2xl border border-zinc-700 flex items-center gap-2 z-50"
              >
                <Copy size={16} className="text-emerald-500" />
                <span className="text-sm font-medium">Data copied to clipboard</span>
              </motion.div>
            )}
          </AnimatePresence>
        </IonContent>

        <IonFooter className="ion-no-border">
          <IonToolbar className="bg-black/80 backdrop-blur-xl border-t border-zinc-800" style={{ '--background': 'transparent' }}>
            <div className="flex justify-around items-center py-2">
              <button className="text-emerald-500 flex flex-col items-center gap-1">
                <Radio size={24} />
                <span className="text-[10px] font-bold uppercase">Monitor</span>
              </button>
              <button className="text-zinc-500 flex flex-col items-center gap-1 opacity-50 cursor-not-allowed">
                <MapPin size={24} />
                <span className="text-[10px] font-bold uppercase">Map</span>
              </button>
              <button className="text-zinc-500 flex flex-col items-center gap-1 opacity-50 cursor-not-allowed">
                <Info size={24} />
                <span className="text-[10px] font-bold uppercase">About</span>
              </button>
            </div>
          </IonToolbar>
        </IonFooter>
      </IonPage>
    </IonApp>
  );
}
