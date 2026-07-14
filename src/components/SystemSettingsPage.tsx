import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Settings, 
  ArrowLeft, 
  RotateCw, 
  ShieldCheck, 
  Database, 
  Cpu, 
  Clock, 
  HardDrive, 
  Bell, 
  AlertCircle,
  ToggleLeft,
  X,
  Lock,
  WifiOff
} from 'lucide-react';

interface SystemSettingsPageProps {
  currentUser: any;
  serverState: 'online' | 'maintenance' | 'offline';
  setServerState: (val: 'online' | 'maintenance' | 'offline') => void;
  addCustomNotification: (msg: string) => void;
  onBack: () => void;
}

export default function SystemSettingsPage({
  currentUser,
  serverState,
  setServerState,
  addCustomNotification,
  onBack
}: SystemSettingsPageProps) {
  const [pageLoading, setPageLoading] = useState(true);
  const [cronInterval, setCronInterval] = useState('daily');
  const [firewallSSL, setFirewallSSL] = useState(true);
  const [shellAccess, setShellAccess] = useState(true);
  const [logsRetention, setLogsRetention] = useState('30_days');
  const [backupRetention, setBackupRetention] = useState('7_days');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setPageLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      addCustomNotification('⚙️ System administrative settings were successfully synced inside metadata configuration.');
    }, 1200);
  };

  if (pageLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
        <RotateCw className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-sm font-mono tracking-wider text-slate-400">LOADING CRITICAL SYS CONFIGURATIONS...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/35 border border-white/5 rounded-2xl p-5 mb-2 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono mb-1">
            <span>AyeZzPanel</span>
            <span className="text-slate-600">/</span>
            <span className="text-indigo-400 font-semibold font-semibold">Settings Panel</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-400" />
            System Administrator Settings
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure automated system cron backups, toggle incoming reverse proxy SSL headers, or update system status modes.
          </p>
        </div>

        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold cursor-pointer transition-all shrink-0 self-start sm:self-center"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>
      </div>

      <form onSubmit={handleSaveSettings} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT PANEL: CONFIGURATION FIELDS */}
        <div className="lg:col-span-8 bg-slate-900/15 border border-slate-900 rounded-3xl p-6 space-y-6">
          <div className="border-b border-slate-900 pb-3">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold block">Daemon Parameters</span>
            <span className="text-[10px] text-slate-500 font-mono">Updates impact all hosted virtual subdomains</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-300">
            {/* Server Mode Settings */}
            <div className="space-y-2">
              <label className="text-slate-400 font-semibold block">System Operating Status Mode</label>
              <select
                value={serverState}
                onChange={(e) => {
                  const val = e.target.value as any;
                  setServerState(val);
                  addCustomNotification(`⚠️ Panel server status changed to ${val.toUpperCase()} Mode.`);
                }}
                className="w-full bg-slate-950/70 border border-slate-900 p-2.5 rounded-xl outline-none focus:border-indigo-500 text-slate-200"
              >
                <option value="online">Online & Accessible (Production)</option>
                <option value="maintenance">Maintenance mode (Internal Admin Only)</option>
                <option value="offline">Offline / Block All Incoming traffic</option>
              </select>
            </div>

            {/* Backups schedule */}
            <div className="space-y-2">
              <label className="text-slate-400 font-semibold block">Automated Backup Frequency</label>
              <select
                value={cronInterval}
                onChange={(e) => setCronInterval(e.target.value)}
                className="w-full bg-slate-950/70 border border-slate-900 p-2.5 rounded-xl outline-none focus:border-indigo-500 text-slate-200"
              >
                <option value="hourly">Every hour (High backup strain)</option>
                <option value="daily">Daily Cron Backup (Recommended)</option>
                <option value="weekly">Weekly Archival</option>
                <option value="monthly">Monthly Snapshot</option>
              </select>
            </div>

            {/* Logs Retention */}
            <div className="space-y-2">
              <label className="text-slate-400 font-semibold block">System Log Retention Duration</label>
              <select
                value={logsRetention}
                onChange={(e) => setLogsRetention(e.target.value)}
                className="w-full bg-slate-950/70 border border-slate-900 p-2.5 rounded-xl outline-none focus:border-indigo-500 text-slate-200"
              >
                <option value="7_days">7 Days (Standard audits)</option>
                <option value="30_days">30 Days (Recommended)</option>
                <option value="90_days">90 Days (Enterprise requirements)</option>
                <option value="forever">Indefinite Retention</option>
              </select>
            </div>

            {/* Host Backups Retention */}
            <div className="space-y-2">
              <label className="text-slate-400 font-semibold block">Backup Retention copies limit</label>
              <select
                value={backupRetention}
                onChange={(e) => setBackupRetention(e.target.value)}
                className="w-full bg-slate-950/70 border border-slate-900 p-2.5 rounded-xl outline-none focus:border-indigo-500 text-slate-200"
              >
                <option value="3_days">Keep last 3 snapshots</option>
                <option value="7_days">Keep last 7 snapshots</option>
                <option value="30_days">Keep last 30 snapshots</option>
              </select>
            </div>
          </div>

          <div className="border-t border-slate-900 pt-6 space-y-4">
            <h4 className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold block">Security & Toggles</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              
              <div className="bg-slate-950/40 p-4 border border-slate-900 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-slate-200 font-semibold block">DDoS Filter Layer (Nginx SSL SSL)</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">Filter invalid TCP syn headers automatically</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFirewallSSL(!firewallSSL)}
                  className={`p-1.5 rounded-xl border font-mono font-bold cursor-pointer transition-colors ${
                    firewallSSL ? 'bg-indigo-950/20 text-indigo-400 border-indigo-900/40' : 'bg-slate-900 text-slate-500 border-slate-800'
                  }`}
                >
                  {firewallSSL ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="bg-slate-950/40 p-4 border border-slate-900 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-slate-200 font-semibold block">SSH Shell Port 22 Tunneling</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">Toggle external CLI command client connects</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShellAccess(!shellAccess)}
                  className={`p-1.5 rounded-xl border font-mono font-bold cursor-pointer transition-colors ${
                    shellAccess ? 'bg-indigo-950/20 text-indigo-400 border-indigo-900/40' : 'bg-slate-900 text-slate-500 border-slate-800'
                  }`}
                >
                  {shellAccess ? 'ON' : 'OFF'}
                </button>
              </div>

            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-505 disabled:bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-colors"
          >
            {isSaving ? 'Synching daemon configuration...' : 'Synch All Systems Settings'}
          </button>
        </div>

        {/* RIGHT PANEL: STATIC INFRASTRUCTURE EXPLAINER */}
        <div className="lg:col-span-4 space-y-6">
          {/* Static warning of port 3000 mapping constraint */}
          <div className="bg-slate-900/30 border border-white/10 rounded-3xl p-5 space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 border-b border-slate-850 pb-2">Network Port 3000 Ingress Rule</h3>
            
            <div className="space-y-3.5 text-xs leading-relaxed text-slate-400">
              <div className="flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  The AyeZzPanel sandbox infrastructure binds the Cloud instance ingress exclusively to **local Port 3000**.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  As a direct security and network constraint of our reverse proxy layout, other ports (such as 3001, 8080, 5000) are globally blocked from outer public lookups.
                </span>
              </div>
              <p className="p-3 bg-indigo-950/20 border border-indigo-900/40 rounded-xl text-[10px] text-slate-350">
                ⚠️ Attempting to override the PORT parameter using in-app environment variables will fail connection checks. Ensure all virtual apps route their loops via standard Port 3000 bindings.
              </p>
            </div>
          </div>

          <div className="bg-slate-900/35 border border-slate-900 rounded-3xl p-5 space-y-3 font-mono text-[11px] text-slate-500">
            <div className="text-slate-400 uppercase tracking-widest font-bold">Panel Metadata Specs</div>
            <div>AyeZzPanel Version: v2.4.9 Admin</div>
            <div>Compiled status: Green (Successful)</div>
            <div>Security token: SHA-256 Auth Active</div>
          </div>
        </div>

      </form>
    </motion.div>
  );
}
