import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Cpu, 
  Terminal as TerminalIcon, 
  Activity, 
  Server, 
  Database, 
  Globe, 
  Power, 
  X, 
  Play, 
  Square, 
  List, 
  ShieldAlert, 
  ChevronsRight, 
  RotateCw, 
  Search, 
  AlertCircle,
  Clock,
  ArrowLeft
} from 'lucide-react';

interface ServerManagementProps {
  stats: any;
  processes: any[];
  killProcess: (pid: number) => Promise<any>;
  terminalLogs: string[];
  terminalInput: string;
  setTerminalInput: (val: string) => void;
  onTerminalSubmit: (e: React.FormEvent) => void;
  simulationActive: boolean;
  toggleSimulation: () => void;
  addCustomNotification: (msg: string) => void;
  onBack: () => void;
}

export default function ServerManagementPage({
  stats,
  processes,
  killProcess,
  terminalLogs,
  terminalInput,
  setTerminalInput,
  onTerminalSubmit,
  simulationActive,
  toggleSimulation,
  addCustomNotification,
  onBack
}: ServerManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [services, setServices] = useState([
    { id: 'ssh', name: 'Secure Shell Agent (SSH)', port: 22, status: 'online', type: 'System' },
    { id: 'nginx', name: 'Nginx Web Server Proxy', port: 80, status: 'online', type: 'Gateway' },
    { id: 'postgresql', name: 'PostgreSQL Relational DB', port: 5432, status: 'online', type: 'Database' },
    { id: 'node', name: 'Node.js Cluster DaemonManager', port: 3000, status: 'online', type: 'Runtime' },
  ]);
  const [serviceLoading, setServiceLoading] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'services' | 'processes' | 'terminal'>('services');
  const [pageLoading, setPageLoading] = useState(true);

  const terminalBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setPageLoading(false), 550);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (activeSubTab === 'terminal' && terminalBottomRef.current) {
      terminalBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLogs, activeSubTab]);

  const toggleService = (serviceId: string, currentStatus: string) => {
    setServiceLoading(serviceId);
    setTimeout(() => {
      const nextStatus = currentStatus === 'online' ? 'stopped' : 'online';
      setServices(prev => 
        prev.map(s => s.id === serviceId ? { ...s, status: nextStatus } : s)
      );
      setServiceLoading(null);
      addCustomNotification(`🔌 Service status for ${serviceId.toUpperCase()} updated: ${nextStatus.toUpperCase()}`);
    }, 850);
  };

  const filteredProcesses = processes.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.pid.toString().includes(searchTerm)
  );

  if (pageLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
        <RotateCw className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-sm font-mono tracking-wider text-slate-400">LOADING HOST CONTROLLERS & SERVICES...</p>
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
      {/* Premium Header / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glassmorphism rounded-2xl p-5 mb-2">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono mb-1">
            <span>AyeZzPanel</span>
            <span className="text-slate-600">/</span>
            <span className="text-indigo-400 font-semibold">Server Management</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-400" />
            Core Server Management
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Daemon processes, system commands executor, real container memory allocations & background services.
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

      {/* Grid: Stat widgets & core actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Server Health Status and Spec */}
        <div className="glassmorphism rounded-2xl p-5 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 border-b border-slate-800/40 pb-2">System Profile</h3>
            <div className="space-y-3 mt-4 text-xs">
              <div className="flex justify-between items-center bg-slate-950/45 border border-slate-900/80 p-2.5 rounded-xl">
                <span className="text-slate-500">Node Location</span>
                <span className="font-mono text-slate-200">Container Sandbox</span>
              </div>
              <div className="flex justify-between items-center bg-slate-950/45 border border-slate-900/80 p-2.5 rounded-xl">
                <span className="text-slate-500">Operation System</span>
                <span className="font-mono text-indigo-300 uppercase">{stats.platform} ({stats.arch})</span>
              </div>
              <div className="flex justify-between items-center bg-slate-950/45 border border-slate-900/80 p-2.5 rounded-xl">
                <span className="text-slate-500">Linux Release</span>
                <span className="font-mono text-slate-300 truncate max-w-[140px]" title={stats.release}>{stats.release}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-950/45 border border-slate-900/80 p-2.5 rounded-xl">
                <span className="text-slate-500">Hostname IP</span>
                <span className="font-mono text-cyan-400 capitalize">{stats.hostname}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/40">
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-mono mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span>LIVE SYSTEM STREAM ONLINE</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
              <Clock className="w-3.5 h-3.5 text-slate-600" />
              <span>Real uptime dashboard: {Math.floor(stats.uptime / 60)} minutes</span>
            </div>
          </div>
        </div>

        {/* Benchmarking Primal Stresser module */}
        <div className="glassmorphism rounded-2xl p-5 space-y-4">
          <div>
            <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 border-b border-slate-800/40 pb-2">Primal Strain Generator</h3>
            <p className="text-xs text-slate-500 leading-normal mt-3">
              Trigger high-load math calculations back-end loops (generating active CPU utilization spikes) to test server elasticity, container bounds, metrics alerts, and scaling.
            </p>
          </div>

          <div className="bg-slate-950/60 border border-slate-900 p-4 rounded-2xl relative overflow-hidden flex flex-col justify-center space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-mono block">CPU Status</span>
                <span className={`text-xs font-semibold ${simulationActive ? 'text-rose-400 animate-pulse' : 'text-slate-500'}`}>
                  {simulationActive ? '🔥 HEAVY BENCHMARK STRAIN ACTIVE' : '💤 STATUS: IDLE'}
                </span>
              </div>
              <div className={`p-2 rounded-xl border ${simulationActive ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                <Activity className={`w-4 h-4 ${simulationActive ? 'animate-bounce' : ''}`} />
              </div>
            </div>

            <button
              onClick={toggleSimulation}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold cursor-pointer transition-all duration-300 flex items-center justify-center gap-2 ${
                simulationActive 
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-950/40 border border-thin border-rose-500'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-900/30'
              }`}
            >
              {simulationActive ? (
                <>
                  <Square className="w-3.5 h-3.5" />
                  <span>Stop Active Stress Loops</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Generate Math Prime Strain</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Global Security Metrics Card */}
        <div className="glassmorphism rounded-2xl p-5 space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <ShieldAlert className="w-24 h-24 text-indigo-500" />
          </div>
          <div>
            <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 border-b border-slate-800/40 pb-2">Firewall & Security</h3>
            <div className="space-y-2 mt-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-mono">BGP Global Ports</span>
                <span className="text-amber-400 font-mono font-semibold">4 Open</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-mono">DDoS Guard Layer-7</span>
                <span className="text-emerald-400 font-mono font-semibold">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-mono">Malware ClamAV Scan</span>
                <span className="text-emerald-400 font-mono font-semibold">Clean (0)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-mono">SSL Certificates</span>
                <span className="text-emerald-400 font-mono font-semibold">Authorized</span>
              </div>
            </div>
          </div>
          <div className="bg-indigo-950/20 border border-indigo-900/40 p-3 rounded-xl text-[10px] text-slate-300 leading-normal flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <span>Incoming panel administrative connections are filtered through reverse proxy port 3000 mapping. No leakage found.</span>
          </div>
        </div>

      </div>

      {/* Primary Workspace Section with Sub Tabs */}
      <div className="bg-slate-900/20 border border-slate-900 rounded-3xl overflow-hidden shadow-lg">
        {/* Tab Headers */}
        <div className="border-b border-slate-900/80 bg-slate-950/45 px-6 py-2.5 flex flex-wrap gap-2 justify-between items-center">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveSubTab('services')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold cursor-pointer transition-all ${
                activeSubTab === 'services' 
                  ? 'bg-indigo-600/20 text-white border border-indigo-500/20' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Services (4)
            </button>
            <button
              onClick={() => setActiveSubTab('processes')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold cursor-pointer transition-all ${
                activeSubTab === 'processes' 
                  ? 'bg-indigo-600/20 text-white border border-indigo-500/20' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Process Manager ({processes.length})
            </button>
            <button
              onClick={() => setActiveSubTab('terminal')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold cursor-pointer transition-all ${
                activeSubTab === 'terminal' 
                  ? 'bg-indigo-600/20 text-white border border-indigo-500/20' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Interactive Terminal Console
            </button>
          </div>
        </div>

        <div className="p-6">
          
          {/* Sub Tab: Services */}
          {activeSubTab === 'services' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-semibold text-white">System Daemon Ports Matrix</h4>
                  <p className="text-xs text-slate-500 mt-1">Status switches simulate direct start, stop, or reload signal updates corresponding to local server components.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((svc) => (
                  <div key={svc.id} className="bg-slate-900/35 border border-slate-900 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${
                        svc.status === 'online' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {svc.id === 'postgresql' ? <Database className="w-5 h-5" /> : 
                         svc.id === 'nginx' ? <Globe className="w-5 h-5" /> :
                         svc.id === 'ssh' ? <TerminalIcon className="w-5 h-5" /> : 
                         <Server className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-200">{svc.name}</span>
                          <span className="text-[9px] font-mono bg-slate-950 text-slate-400 px-1.5 py-0.5 rounded font-bold border border-slate-8 w-fit shrink-0">
                            PORT {svc.port}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[10px] text-slate-500 font-mono capitalize">{svc.type} Layer &bull;</span>
                          <span className={`text-[10px] font-mono font-bold uppercase ${
                            svc.status === 'online' ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {svc.status === 'online' ? '● ONLINE' : '○ STOPPED'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleService(svc.id, svc.status)}
                      disabled={serviceLoading === svc.id}
                      className={`p-2 rounded-xl border cursor-pointer transition-colors ${
                        serviceLoading === svc.id 
                          ? 'bg-slate-950 text-slate-600 border-slate-900'
                          : svc.status === 'online'
                          ? 'bg-rose-950/20 text-rose-400 border-rose-900/30 hover:bg-rose-900/30'
                          : 'bg-emerald-950/20 text-emerald-400 border-emerald-900/40 hover:bg-emerald-900/35'
                      }`}
                      title={svc.status === 'online' ? 'Stop service' : 'Start service'}
                    >
                      {serviceLoading === svc.id ? (
                        <RotateCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Power className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub Tab: Processes */}
          {activeSubTab === 'processes' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
                <div>
                  <h4 className="text-sm font-semibold text-white">Live System Process Loop</h4>
                  <p className="text-xs text-slate-500 mt-1">Filter active processes running inside the node sandbox. Terminating critical tasks is permitted and logs are recorded.</p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search PID or task prefix..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-950/70 border border-slate-900 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-300 outline-none focus:border-indigo-500"
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-900 bg-slate-950/30">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-900 bg-slate-950/50 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                      <th className="p-3 pl-4">PID</th>
                      <th className="p-3">Process Command Name</th>
                      <th className="p-3">CPU utilization</th>
                      <th className="p-3">RAM utilization</th>
                      <th className="p-3">System status</th>
                      <th className="p-3 text-right pr-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProcesses.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-slate-500 font-mono">
                          No matching processes found inside sandbox list.
                        </td>
                      </tr>
                    ) : (
                      filteredProcesses.map((p) => (
                        <tr key={p.pid} className="border-b border-slate-900 hover:bg-slate-900/15 transition-colors font-mono">
                          <td className="p-3 pl-4 font-bold text-indigo-400">#{p.pid}</td>
                          <td className="p-3 font-semibold text-slate-200">{p.name}</td>
                          <td className="p-3">
                            <span className={p.cpu > 50 ? 'text-rose-400 font-bold' : p.cpu > 15 ? 'text-amber-400' : 'text-slate-300'}>
                              {p.cpu}%
                            </span>
                          </td>
                          <td className="p-3 text-slate-300">{p.memory}</td>
                          <td className="p-3">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              p.status === 'running' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30' : 'bg-slate-900 text-slate-500'
                            }`}>
                              {p.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-3 text-right pr-4">
                            <button
                              onClick={() => {
                                killProcess(p.pid);
                                addCustomNotification(`💀 Process PID #${p.pid} (${p.name}) was successfully terminated.`);
                              }}
                              className="px-2 py-1 bg-rose-950/40 hover:bg-rose-900/30 hover:text-white border border-rose-900/40 hover:border-rose-800 text-rose-400 text-[10px] rounded-lg transition-all cursor-pointer font-semibold"
                            >
                              Kill
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub Tab: Terminal */}
          {activeSubTab === 'terminal' && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <h4 className="text-sm font-semibold text-white">Full-Stack Sandboxed CLI Shell Control</h4>
                <p className="text-xs text-slate-500 mt-1">Interact cleanly with container node files system, evaluate shell scripts, run git metadata trackers safely.</p>
              </div>

              <div className="bg-slate-950 border border-slate-900 p-5 rounded-2xl h-80 overflow-y-auto font-mono text-xs text-indigo-300/90 leading-relaxed scrollbar-thin">
                <div className="text-slate-500 mb-2">// AyeZzPanel secure TTY tunnel initialized successfully.</div>
                {terminalLogs.map((log, idx) => (
                  <div key={idx} className="whitespace-pre-wrap py-0.5">{log}</div>
                ))}
                <div ref={terminalBottomRef} />
              </div>

              <form onSubmit={onTerminalSubmit} className="flex gap-2">
                <div className="relative flex-grow">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 font-mono font-bold">$</span>
                  <input
                    type="text"
                    value={terminalInput}
                    onChange={(e) => setTerminalInput(e.target.value)}
                    placeholder="Type shell command (e.g. ls, whoami, pwd, help)..."
                    className="w-full bg-slate-950/80 border border-slate-900 rounded-xl pl-8 pr-4 py-2.5 text-xs text-slate-200 font-mono outline-none focus:border-indigo-500"
                    id="cli-input-panel"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                >
                  Send
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </motion.div>
  );
}
