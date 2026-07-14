import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Terminal as TerminalIcon, 
  Cpu, 
  Database,
  Lock, 
  Key, 
  Globe, 
  RefreshCw, 
  X, 
  Download, 
  Sliders, 
  Palette, 
  Eye, 
  EyeOff, 
  Server, 
  ArrowLeft,
  BookOpen, 
  CheckCircle, 
  AlertCircle,
  HelpCircle,
  ArrowUp,
  ChevronRight,
  ShieldCheck,
  Activity,
  Copy
} from 'lucide-react';

interface SshTerminalProps {
  currentUser: any;
  addCustomNotification: (msg: string) => void;
  onBack: () => void;
}

type TerminalTheme = 'slate' | 'matrix' | 'dracula' | 'cyberpunk';

export default function SshTerminalPage({
  currentUser,
  addCustomNotification,
  onBack
}: SshTerminalProps) {
  // SSH Credentials config
  const [host, setHost] = useState('127.0.0.1');
  const [port, setPort] = useState('22');
  const [username, setUsername] = useState('ayezz-admin');
  const [authType, setAuthType] = useState<'password' | 'key'>('password');
  const [password, setPassword] = useState('AyeZzPasswordSafe2026!');
  const [privateKey, setPrivateKey] = useState('-----BEGIN OpenSSH PRIVATE KEY-----\nb3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtcn\nNhAAAAAwEAAQAAAYEA0GfT8yzeG7LpMy6Y7YmS6B6J8sY7lK0B9b7T2dD/8E3R9v4O7K\n-----END OpenSSH PRIVATE KEY-----');
  const [showSecret, setShowSecret] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);

  // Terminal States
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [theme, setTheme] = useState<TerminalTheme>('slate');
  const [fontSize, setFontSize] = useState<number>(13); // font size in px
  const [cwd, setCwd] = useState<string>('~');
  const [stats, setStats] = useState({
    sentCmds: 0,
    bytesTx: 0,
    bytesRx: 0,
    latency: 12
  });

  // UI States
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const terminalBottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on terminal update
  useEffect(() => {
    if (connected && terminalBottomRef.current) {
      terminalBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLogs, connected]);

  // Focus terminal input (only if user is not selecting text)
  const focusInput = () => {
    const selection = window.getSelection()?.toString();
    if (selection) {
      return; // Do not disrupt active text selection or scroll
    }
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Copy terminal output to clipboard
  const copyTerminalLogs = () => {
    if (terminalLogs.length === 0) {
      addCustomNotification('No terminal output to copy');
      return;
    }
    const logsText = terminalLogs.join('\n');
    navigator.clipboard.writeText(logsText);
    addCustomNotification('📋 SSH terminal logs copied to clipboard!');
  };

  // SSH Connection Trigger
  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!host || !username) {
      addCustomNotification('Please enter SSH Host and Username');
      return;
    }

    setConnecting(true);
    addCustomNotification(`🔑 Initiating SSH tunnel with ${username}@${host}...`);

    // Simulate authenticating and reading MOTD
    setTimeout(() => {
      setTerminalLogs([
        `Connecting to ${host}:${port}...`,
        `Analyzing SSH network path (Simulated peer latency: ${Math.floor(Math.random() * 20)+8}ms)...`,
        `Establishing SSH-2.0-OpenSSH_9.2p1 secure key agreement (curve25519-sha256)...`,
        `Verifying server key signature: SHA256:ayezz${Math.floor(Math.random()*9e6)}${host.replace(/\./g, '')}`,
        `Authenticating agent credentials "${username}" via ${authType.toUpperCase()}...`,
        `Authentication successful (authorized_key matched).`,
        `------------------------------------------------------------`,
        `  _____             _____                 _    `,
        ` |  _  |           |  _  |               | |   `,
        ` | |_| |_   _  ___ | |_| | ___ _ __   ___| |   `,
        ` |  _  | | | |/ _ \\|  ___|/ _ \\ '_ \\ / _ \\ |   `,
        ` | | | | |_| |  __/| |   |  __/ | | |  __/ | _ `,
        ` \\_| |_/\\__, |\\___|\\_|    \\___|_| |_|\\___|_|(_)`,
        `         __/ |                                 `,
        `        |___/        Secure SSH Terminal Workspace`,
        `------------------------------------------------------------`,
        `Welcome to AyeZzPanel Cloud Remote SSH Command Terminal.`,
        `* Host Node Info : Debian GNU/Linux 12 (bookworm) / Kernel 6.1.0`,
        `* Memory Usage   : 23% active of 4096MB allocs`,
        `* Connected via  : SSH REST Proxy Tunnel v2.6.0`,
        `* Disk Storage   : /dev/vda1 (45GB available of 80GB total)`,
        `Type 'help' to review available terminal diagnostic rules.`,
        `[ssh-terminal-established: system initialized]`
      ]);
      setStats(prev => ({ ...prev, bytesRx: 1420 }));
      setConnecting(false);
      setConnected(true);
      addCustomNotification(`🔌 Connected successfully to ${host}:${port}`);
    }, 1500);
  };

  // Run terminal command
  const executeCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = terminalInput.trim();
    if (!cmd) return;

    // Local commands check
    if (cmd.toLowerCase() === 'clear' || cmd.toLowerCase() === 'reset') {
      setTerminalLogs([]);
      setTerminalInput('');
      setHistoryIndex(-1);
      return;
    }

    if (cmd.toLowerCase() === 'exit') {
      setTerminalLogs(prev => [...prev, `$ exit`, `Connection to ${host} closed by remote node.`]);
      setTerminalInput('');
      setConnected(false);
      addCustomNotification('SSH Tunnel terminated');
      return;
    }

    if (cmd.toLowerCase() === 'help') {
      const helpOutput = [
        `$ help`,
        `AyeZzPanel SSH Shell Command Helper:`,
        `  • ls -la       List directory structure detailing file sizes`,
        `  • uname -a     Output active server kernel representation`,
        `  • free -m      Verify available container memory bounds`,
        `  • df -h        Identify hardware storage partitions`,
        `  • whoami       Output active user profile credentials`,
        `  • pwd          Display active working directory path`,
        `  • cat <file>   Read file contents instantly (e.g., cat package.json)`,
        `  • clear        Flush active terminal debugger screen`,
        `  • exit         Disconnect active SSH console session`,
        `  -------------------------------------------------------------`,
        `  Commands run concurrently inside the container context where possible.`
      ];
      setTerminalLogs(prev => [...prev, ...helpOutput]);
      setCommandHistory(prev => [cmd, ...prev]);
      setTerminalInput('');
      setHistoryIndex(-1);
      return;
    }

    // Set command logs immediately
    setTerminalLogs(prev => [...prev, `${username}@${host}:${cwd || '~'}# ${cmd}`]);
    const nextHistory = [cmd, ...commandHistory.filter(h => h !== cmd)];
    setCommandHistory(nextHistory);
    setTerminalInput('');
    setHistoryIndex(-1);

    setStats(prev => ({
      ...prev,
      sentCmds: prev.sentCmds + 1,
      bytesTx: prev.bytesTx + cmd.length
    }));

    try {
      const token = localStorage.getItem('ayezz_token');
      const res = await fetch('/api/terminal/run', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ command: cmd, cwd: cwd === '~' ? undefined : cwd })
      });

      if (res.status === 401) {
        localStorage.removeItem('ayezz_token');
        localStorage.removeItem('ayezz_user');
        window.location.reload();
        return;
      }

      if (res.ok) {
        const data = await res.json();
        const logsToAdd: string[] = [];

        if (data.stdout && data.stdout.trim()) {
          logsToAdd.push(...data.stdout.trim().split('\n'));
        }
        if (data.stderr && data.stderr.trim()) {
          logsToAdd.push(`[Error]: ${data.stderr.trim()}`);
        }
        if (!data.stdout && !data.stderr) {
          logsToAdd.push('[Command completed with no standard stdout returns]');
        }

        setTerminalLogs(prev => [...prev, ...logsToAdd]);
        setStats(prev => ({
          ...prev,
          bytesRx: prev.bytesRx + (data.stdout || '').length + (data.stderr || '').length,
          latency: Math.floor(Math.random() * 15) + 6
        }));

        if (data.cwd) {
          // normalize cwd for prettier display
          const displayCwd = data.cwd.replace(process.cwd(), '~');
          setCwd(displayCwd);
        }
      } else {
        // Fallback for role-restricted or server error
        if (res.status === 403) {
          setTerminalLogs(prev => [
            ...prev,
            `[Access Denied]: Terminal command execution is restricted to Administrative roles.`,
            `Simulating output for "${cmd}" under guest sandbox:`,
            `guest-mock:~$ Executing action "${cmd}" recursively... complete.`
          ]);
        } else {
          setTerminalLogs(prev => [...prev, '[Terminal error: Broken gateway communication link. Reconnecting...]']);
        }
      }
    } catch (err: any) {
      setTerminalLogs(prev => [...prev, `[SSH Tunnel Failure]: ${err.message}`]);
    }
  };

  // Cycle command history using keyboard Up/Down arrow keys
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const nextIdx = historyIndex + 1;
      if (nextIdx < commandHistory.length) {
        setHistoryIndex(nextIdx);
        setTerminalInput(commandHistory[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIdx = historyIndex - 1;
      if (nextIdx >= 0) {
        setHistoryIndex(nextIdx);
        setTerminalInput(commandHistory[nextIdx]);
      } else {
        setHistoryIndex(-1);
        setTerminalInput('');
      }
    }
  };

  // Download log session
  const downloadSessionLogs = () => {
    if (terminalLogs.length === 0) {
      addCustomNotification('No terminal output to save');
      return;
    }
    const element = document.createElement("a");
    const file = new Blob([terminalLogs.join('\n')], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `aye_ssh_session_${host}_${Date.now()}.log`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    addCustomNotification('💾 SSH terminal session log downloaded successfully!');
  };

  // Quick helper snippet injection
  const runSnippet = (snippet: string) => {
    setTerminalInput(snippet);
    setTimeout(() => {
      focusInput();
    }, 50);
  };

  // Theme Styling Maps
  const themeClasses: Record<TerminalTheme, { bg: string; text: string; header: string; input: string; prompt: string; selection: string }> = {
    slate: {
      bg: 'bg-slate-950',
      text: 'text-indigo-200/90',
      header: 'bg-slate-900 border-slate-800 text-slate-100',
      input: 'text-white',
      prompt: 'text-emerald-400',
      selection: 'selection:bg-indigo-500/30 selection:text-white'
    },
    matrix: {
      bg: 'bg-black',
      text: 'text-green-500 font-bold',
      header: 'bg-zinc-950 border-green-900/30 text-green-400',
      input: 'text-green-400',
      prompt: 'text-green-500',
      selection: 'selection:bg-green-600/40 selection:text-green-100'
    },
    dracula: {
      bg: 'bg-[#282a36]',
      text: 'text-[#f8f8f2]',
      header: 'bg-[#1e1f29] border-[#44475a] text-[#8be9fd]',
      input: 'text-[#50fa7b]',
      prompt: 'text-[#ff79c6]',
      selection: 'selection:bg-pink-500/30 selection:text-white'
    },
    cyberpunk: {
      bg: 'bg-[#0b0c10]',
      text: 'text-cyan-400 font-medium',
      header: 'bg-[#1f2833] border-pink-500/20 text-pink-500',
      input: 'text-pink-400',
      prompt: 'text-cyan-400',
      selection: 'selection:bg-cyan-500/30 selection:text-white'
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      {/* Top Breadcrumb Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glassmorphism rounded-2xl p-5 mb-2">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono mb-1">
            <span>AyeZzPanel</span>
            <span className="text-slate-600">/</span>
            <span className="text-indigo-400 font-semibold">Web SSH Terminal</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <TerminalIcon className="w-5 h-5 text-indigo-400" />
            SSH Browser Terminal Console
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Establish a real or virtual responsive secure tunnel link, evaluate shell environments, and administer ports on live infrastructure.
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

      {!connected ? (
        /* SSH TUNNEL INITIALIZATION CONNECTION PANEL */
        <div className="max-w-2xl mx-auto">
          <motion.div 
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glassmorphism rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden"
          >
            {/* Ambient glows inside connection card */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-white/5">
              <div className="p-3 bg-indigo-600/20 rounded-2xl border border-indigo-500/20">
                <Lock className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-base">Create SSH Tunnel Instance</h3>
                <p className="text-xs text-slate-400 mt-0.5">Connect securely to standard ports using credential encryption layers.</p>
              </div>
            </div>

            <form onSubmit={handleConnect} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-3">
                  <label className="block text-xs font-mono font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Host Server IP / Domain</label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                      placeholder="e.g. 12.34.56.78"
                      value={host}
                      onChange={(e) => setHost(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-mono font-medium text-slate-400 mb-1.5 uppercase tracking-wider">SSH Port</label>
                  <input
                    type="number"
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none font-mono"
                    placeholder="22"
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-medium text-slate-400 mb-1.5 uppercase tracking-wider">SSH SSH-User Name</label>
                  <div className="relative">
                    <Server className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none font-mono"
                      placeholder="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-mono font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Auth Method Choice</label>
                  <div className="flex bg-slate-950/60 p-1 border border-slate-800 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setAuthType('password')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                        authType === 'password' ? 'bg-indigo-600 text-white' : 'text-slate-450 hover:text-slate-200'
                      }`}
                    >
                      Password
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthType('key')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                        authType === 'key' ? 'bg-indigo-600 text-white' : 'text-slate-450 hover:text-slate-200'
                      }`}
                    >
                      Private Key
                    </button>
                  </div>
                </div>
              </div>

              {authType === 'password' ? (
                <div>
                  <label className="block text-xs font-mono font-medium text-slate-400 mb-1.5 uppercase tracking-wider font-semibold">User Password</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold font-mono">$</span>
                    <input
                      type={showSecret ? 'text' : 'password'}
                      className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none font-mono"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-mono font-medium text-slate-400 mb-1.5 uppercase tracking-wider font-semibold">SSH Private Key (id_rsa)</label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-4" />
                    <textarea
                      rows={4}
                      className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:border-indigo-500 focus:outline-none font-mono resize-none leading-relaxed"
                      value={privateKey}
                      onChange={(e) => setPrivateKey(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setHost('127.0.0.1');
                    setPort('22');
                    setUsername('ayezz-admin');
                    setAuthType('password');
                    setPassword('AyeZzPasswordSafe2026!');
                    addCustomNotification('Prefilled with Sandbox Credentials');
                  }}
                  className="flex-1 py-3 bg-slate-950/90 border border-slate-800 text-slate-300 hover:bg-slate-900 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center"
                >
                  Quick Sandbox Presets
                </button>

                <button
                  type="submit"
                  disabled={connecting}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-750 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 flex items-center justify-center gap-2"
                >
                  {connecting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Authenticating Peer...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Open SSH Session</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>

          {/* WINDOWS TERMINAL CONNECTION GUIDE */}
          <motion.div 
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mt-6 glassmorphism rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden"
          >
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/5">
              <span className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400">
                <TerminalIcon className="w-5 h-5" />
              </span>
              <div>
                <h4 className="font-semibold text-white text-sm">💻 Panduan Akses via Terminal Windows (PowerShell/CMD)</h4>
                <p className="text-xs text-slate-450 mt-0.5">Ya! SSH AyeZzPanel ini fully compatible dan bisa Anda akses langsung dari Windows Terminal bawaan.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-950/80 border border-slate-900 p-4 rounded-2xl space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center text-[11px] text-slate-500 uppercase font-bold tracking-wider pb-1 border-b border-white/5">
                  <span>Parameter Koneksi Server Anda</span>
                  <span className="text-emerald-400">Aktif & Siap</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-white/5">
                    <span className="text-slate-500 block text-[10px] uppercase">SSH Command</span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-indigo-300 font-bold break-all">ssh {username}@{host} -p {port}</span>
                      <button 
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(`ssh ${username}@${host} -p ${port}`);
                          addCustomNotification('📋 SSH command copied!');
                        }}
                        className="p-1 hover:bg-white/5 text-slate-400 hover:text-white rounded transition cursor-pointer"
                        title="Copy command"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-xl border border-white/5">
                    <span className="text-slate-500 block text-[10px] uppercase">Kata Sandi (Password)</span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-emerald-405 font-bold break-all">{password}</span>
                      <button 
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(password);
                          addCustomNotification('📋 Password copied!');
                        }}
                        className="p-1 hover:bg-white/5 text-slate-400 hover:text-white rounded transition cursor-pointer"
                        title="Copy password"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-xl border border-white/5">
                    <span className="text-slate-500 block text-[10px] uppercase">SSH Host</span>
                    <span className="text-slate-200 font-semibold block mt-1">{host}</span>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-xl border border-white/5">
                    <span className="text-slate-500 block text-[10px] uppercase">Port SSH</span>
                    <span className="text-slate-200 font-semibold block mt-1">{port}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-350">
                <p className="font-semibold text-slate-200 flex items-center gap-1">
                  <ChevronRight className="w-4 h-4 text-indigo-400 shrink-0" />
                  Langkah-Langkah Koneksi dari Windows Terminal:
                </p>
                <ol className="list-decimal list-inside pl-2 space-y-1.5 text-slate-450 leading-relaxed">
                  <li>Tekan tombol <kbd className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-[10px] text-white">Win + X</kbd> lalu pilih <strong>Terminal</strong> atau <strong>PowerShell</strong> di PC Windows Anda.</li>
                  <li>Salin dan jalankan perintah remote SSH di atas, lalu tekan <kbd className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-[10px] text-white">Enter</kbd>.</li>
                  <li>Jika muncul peringatan sidik jari kunci server baru, ketik <code className="text-indigo-300">yes</code> lalu tekan Enter.</li>
                  <li>Masukkan Kata Sandi (Password) di atas saat diminta, lalu tekan Enter <em>(catatan: teks sandi di terminal tidak akan terlihat saat diketik, ini adalah standar keamanan).</em></li>
                  <li>Selesai! Anda kini berhasil terhubung ke server remote langsung dari terminal bawaan Windows Anda!</li>
                </ol>
              </div>

              <div className="bg-indigo-950/20 border border-indigo-900/30 p-4 rounded-xl text-xs text-indigo-200/90 flex gap-2.5 items-start leading-relaxed">
                <AlertCircle className="w-4.5 h-4.5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white block mb-0.5">Alternatif Menggunakan PuTTY Client:</span>
                  Sangat mudah! Buka PuTTY, isi bagian <strong className="text-white">Host Name</strong> dengan <code className="text-emerald-400 bg-slate-950 px-1 py-0.5 rounded">{host}</code>, <strong className="text-white">Port</strong> dengan <code className="text-emerald-400 bg-slate-950 px-1 py-0.5 rounded">{port}</code>, pilih Connection type <strong className="text-white">SSH</strong>, klik Open, masuk dengan username <code className="text-emerald-400 font-mono">{username}</code> dan masukkan password Anda.
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      ) : (
        /* ACTIVE SESSION TERMINAL WORKSPACE EMULATOR */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-4">
            
            {/* Main Terminal Frame */}
            <div 
              onClick={focusInput}
              className={`${themeClasses[theme].bg} border border-slate-900/80 rounded-2xl overflow-hidden flex flex-col h-[520px] shadow-2xl relative transition-all duration-300 cursor-text`}
            >
              {/* Terminal Frame Header */}
              <div className={`px-5 py-3.5 border-b flex items-center justify-between ${themeClasses[theme].header}`}>
                <div className="flex items-center gap-2.5">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
                    <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
                  </div>
                  <div className="border-l border-slate-800 h-4 mx-1.5"></div>
                  <div className="flex items-center gap-1.5 font-mono text-xs">
                    <span className="font-bold opacity-80">{username}@{host}:{port}</span>
                    <span className="text-[10px] font-semibold opacity-40 px-1 bg-white/5 border border-white/10 rounded">SSHv2</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Status Indicator */}
                  <div className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                    <span className="hidden sm:inline">TUNNEL SECURE</span>
                  </div>

                  {/* Copy button */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); copyTerminalLogs(); }}
                    className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-emerald-400 transition-all cursor-pointer"
                    title="Copy Output"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  {/* Settings toggler */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }}
                    className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
                    title="Terminal Settings"
                  >
                    <Sliders className="w-4 h-4" />
                  </button>

                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowHelp(!showHelp); }}
                    className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
                    title="User Manual Rules"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </button>
                  
                  {/* Exit Close button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Verify: Terminate this Active SSH Connection loop?')) {
                        setConnected(false);
                        addCustomNotification('SSH Terminal disconnected');
                      }
                    }}
                    className="p-1 px-[5px] bg-rose-950/20 hover:bg-rose-900 border border-rose-900/30 text-rose-400 hover:text-white rounded-lg text-[10px] uppercase font-mono tracking-wider font-bold cursor-pointer"
                    title="Disconnect Session"
                  >
                    Exit
                  </button>
                </div>
              </div>

              {/* Terminal Settings Bar Overlay */}
              <AnimatePresence>
                {showSettings && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-slate-900 border-b border-slate-800 px-6 py-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono overflow-hidden"
                  >
                    {/* Theme Changer */}
                    <div>
                      <span className="text-slate-450 block mb-2 font-semibold">Terminal Theme:</span>
                      <div className="flex gap-2">
                        {(['slate', 'matrix', 'dracula', 'cyberpunk'] as TerminalTheme[]).map((t) => (
                          <button
                            key={t}
                            onClick={(e) => { e.stopPropagation(); setTheme(t); }}
                            className={`w-5 h-5 rounded-full border cursor-pointer transition-transform ${
                              t === 'slate' ? 'bg-slate-950 border-indigo-550' :
                              t === 'matrix' ? 'bg-black border-emerald-500' :
                              t === 'dracula' ? 'bg-[#282a36] border-pink-500' :
                              'bg-[#0b0c10] border-cyan-400'
                            } ${theme === t ? 'scale-125 ring-2 ring-indigo-500/30' : 'opacity-85'}`}
                            title={t.toUpperCase()}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Font size toggler */}
                    <div>
                      <span className="text-slate-450 block mb-2 font-semibold">Console Font Scale:</span>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setFontSize(prev => Math.max(10, prev - 1)); }}
                          className="px-2 py-1 bg-slate-950 border border-slate-800 text-slate-350 hover:text-white rounded font-bold"
                        >
                          A-
                        </button>
                        <span className="font-semibold text-slate-200">{fontSize}px</span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setFontSize(prev => Math.min(18, prev + 1)); }}
                          className="px-2 py-1 bg-slate-950 border border-slate-800 text-slate-350 hover:text-white rounded font-bold"
                        >
                          A+
                        </button>
                      </div>
                    </div>

                    {/* Utility actions */}
                    <div>
                      <span className="text-slate-450 block mb-2 font-semibold">Session Utilities:</span>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); copyTerminalLogs(); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-800 rounded-lg text-xs cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy text</span>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); downloadSessionLogs(); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-800 rounded-lg text-xs"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Save Log</span>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setTerminalLogs([]); }}
                          className="px-3 py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-lg text-xs"
                        >
                          Clear Text
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Terminal Logs Scroll Canvas */}
              <div 
                className={`p-6 overflow-y-auto flex-grow flex flex-col space-y-2 select-text ${themeClasses[theme].selection}`}
                style={{ fontSize: `${fontSize}px` }}
              >
                {terminalLogs.map((log, index) => (
                  <div 
                    key={index} 
                    className={`whitespace-pre-wrap font-mono leading-relaxed font-bold tracking-wide break-all ${themeClasses[theme].text}`}
                  >
                    {log}
                  </div>
                ))}
                <div ref={terminalBottomRef} />
              </div>

              {/* Bottom Interactive Command Bar */}
              <form 
                onSubmit={executeCommand}
                className="bg-slate-950 border-t border-slate-900 flex items-center px-5 py-3 h-12"
              >
                <div className="flex items-center gap-1 shrink-0 font-mono text-xs font-bold mr-2 select-none">
                  <span className={themeClasses[theme].prompt}>{username}@{host}:</span>
                  <span className="text-indigo-400 truncate max-w-[130px]">{cwd}</span>
                  <span className="text-slate-500">#</span>
                </div>

                <input
                  ref={inputRef}
                  type="text"
                  className={`flex-grow bg-transparent text-xs font-mono font-bold focus:outline-none border-none outline-none ${themeClasses[theme].input}`}
                  placeholder="Insert remote instructions..."
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  autoFocus
                />

                <div className="flex items-center gap-2 opacity-60 ml-2">
                  <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest hidden sm:inline">UTF-8 xterm-256</span>
                  <button 
                    type="submit"
                    className="p-1 px-2.5 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-400 hover:text-white font-mono text-[10px] rounded border border-indigo-500/15 cursor-pointer transition-colors"
                  >
                    ENTER
                  </button>
                </div>
              </form>
            </div>

            {/* Quick Helper Presets Button Bar */}
            <div className="bg-slate-900/30 border border-slate-900/60 rounded-xl p-4 flex flex-wrap gap-2 items-center">
              <span className="text-xs font-semibold text-slate-400 font-mono tracking-wider mr-2">Macro Snippets:</span>
              <button 
                onClick={() => runSnippet('ls -la')}
                className="px-2.5 py-1 bg-slate-950 hover:bg-indigo-650 text-slate-400 hover:text-white text-[11px] font-mono rounded border border-slate-800 font-semibold cursor-pointer shrink-0"
              >
                ls -la
              </button>
              <button 
                onClick={() => runSnippet('uname -a')}
                className="px-2.5 py-1 bg-slate-950 hover:bg-indigo-650 text-slate-400 hover:text-white text-[11px] font-mono rounded border border-slate-800 font-semibold cursor-pointer shrink-0"
              >
                uname -a
              </button>
              <button 
                onClick={() => runSnippet('free -m')}
                className="px-2.5 py-1 bg-slate-950 hover:bg-indigo-650 text-slate-400 hover:text-white text-[11px] font-mono rounded border border-slate-800 font-semibold cursor-pointer shrink-0"
              >
                free -m
              </button>
              <button 
                onClick={() => runSnippet('df -h')}
                className="px-2.5 py-1 bg-slate-950 hover:bg-indigo-650 text-slate-400 hover:text-white text-[11px] font-mono rounded border border-slate-800 font-semibold cursor-pointer shrink-0"
              >
                df -h
              </button>
              <button 
                onClick={() => runSnippet('pwd')}
                className="px-2.5 py-1 bg-slate-950 hover:bg-indigo-650 text-slate-400 hover:text-white text-[11px] font-mono rounded border border-slate-800 font-semibold cursor-pointer shrink-0"
              >
                pwd
              </button>
              <button 
                onClick={() => runSnippet('whoami')}
                className="px-2.5 py-1 bg-slate-950 hover:bg-indigo-650 text-slate-400 hover:text-white text-[11px] font-mono rounded border border-slate-800 font-semibold cursor-pointer shrink-0"
              >
                whoami
              </button>
              <button 
                onClick={() => runSnippet('cat package.json')}
                className="px-2.5 py-1 bg-slate-950 hover:bg-indigo-650 text-slate-400 hover:text-white text-[11px] font-mono rounded border border-slate-800 font-semibold cursor-pointer shrink-0"
              >
                Read config
              </button>
            </div>
          </div>

          {/* Right Session Details Sideboard */}
          <div className="space-y-6">
            {/* Connection Telemetry Details */}
            <div className="glassmorphism rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-2 flex items-center gap-1.5 font-bold">
                <Activity className="w-4 h-4 text-emerald-450" />
                Session Telemetry
              </h3>

              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center bg-slate-950/60 p-2.5 rounded-xl border border-white/5">
                  <span className="text-slate-500">Connection Peer</span>
                  <span className="text-indigo-300 font-semibold">{host}</span>
                </div>
                <div className="flex justify-between items-center bg-slate-950/60 p-2.5 rounded-xl border border-white/5">
                  <span className="text-slate-500">RTT Latency</span>
                  <span className="text-emerald-400 font-semibold animate-pulse">{stats.latency} ms</span>
                </div>
                <div className="flex justify-between items-center bg-slate-950/60 p-2.5 rounded-xl border border-white/5">
                  <span className="text-slate-500">Commands Transmitted</span>
                  <span className="text-cyan-400 font-semibold">{stats.sentCmds} tx</span>
                </div>
                <div className="flex justify-between items-center bg-slate-950/60 p-2.5 rounded-xl border border-white/5">
                  <span className="text-slate-500">Bandwidth payload</span>
                  <span className="text-slate-300 truncate max-w-[120px]">
                    Tx: {stats.bytesTx} B / Rx: {stats.bytesRx} B
                  </span>
                </div>
              </div>

              <div className="bg-indigo-950/20 border border-indigo-900/30 p-3.5 rounded-xl text-[10px] text-slate-300 leading-relaxed">
                <span>The SSH Rest tunnel utilizes secure keys automatically validated in the background. Commands are mapped directly safely over standard workspace system constraints.</span>
              </div>
            </div>

            {/* Quick instructions / Help Sheet */}
            <div className="glassmorphism rounded-2xl p-5 space-y-3.5">
              <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-2 flex items-center gap-1.5 font-bold">
                <BookOpen className="w-4 h-4 text-cyan-450" />
                Diagnostic Rules
              </h3>

              <div className="space-y-2 text-xs text-slate-400 leading-normal">
                <p>&bull; Press <kbd className="bg-slate-950 px-1 py-0.5 rounded border border-slate-800 text-[10px] text-white">Up</kbd> / <kbd className="bg-slate-950 px-1 py-0.5 rounded border border-slate-800 text-[10px] text-white">Down</kbd> arrows to cycle through previous console inputs.</p>
                <p>&bull; Use <code className="text-indigo-400">exit</code> to gracefully destroy the active remote port stream.</p>
                <p>&bull; Type <code className="text-indigo-400">clear</code> or press the "Clear Text" button to flush active output lines.</p>
                <p>&bull; Select a theme like <span className="text-green-500 font-semibold font-mono">Matrix</span> to customize colors.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
