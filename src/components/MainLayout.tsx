import React, { useState, useEffect, useRef } from 'react';
import { 
  Cpu, 
  Globe, 
  HardDrive, 
  Layers, 
  Activity, 
  Terminal as TerminalIcon, 
  Settings, 
  CreditCard,
  LifeBuoy, 
  Bell, 
  Power, 
  Search, 
  User, 
  Server, 
  Play, 
  Square, 
  Clock, 
  Flame, 
  TrendingUp, 
  ShieldCheck, 
  Layers3, 
  ChevronRight, 
  Sliders, 
  Menu, 
  X, 
  Network,
  RotateCw,
  Sparkles,
  Command,
  Info,
  Folder,
  FolderPlus,
  FileText,
  Upload as UploadIcon,
  Plus,
  Trash2,
  Edit as EditIcon,
  Save,
  Download,
  Package,
  Copy
} from 'lucide-react';

import ServerManagementPage from './ServerManagementPage';
import HostingManagementPage from './HostingManagementPage';
import TicketSupportPage from './TicketSupportPage';
import BillingPage from './BillingPage';
import SystemSettingsPage from './SystemSettingsPage';
import AccountProfilePage from './AccountProfilePage';
import SshTerminalPage from './SshTerminalPage';
import { useLanguage } from '../lib/translations';
import FirestoreClientsPage from './FirestoreClientsPage';
import AnimeCharacter from './AnimeCharacter';
import AnimeVideo from './AnimeVideo';

interface SystemProcess {
  id: string;
  name: string;
  cpu: number;
  memory: string;
  status: 'running' | 'idle' | 'stopped';
  pid: number;
}

interface ServerStats {
  cpu: number;
  ram: number;
  disk: number;
  memoryUsedGB: string;
  memoryTotalGB: string;
  diskUsedGB: number;
  diskTotalGB: number;
  uptime: number;
  hostname: string;
  platform: string;
  arch: string;
  release: string;
  loadAvg: number[];
}

export default function MainLayout() {
  const { language, setLanguage, t } = useLanguage();
  // Scoped fetch wrapper to securely inject JWT token for authorized API requests
  const fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const token = localStorage.getItem('ayezz_token');
    const url = typeof input === 'string' ? input : (input instanceof Request ? input.url : (input as any).url || '');

    let modifiedInit = init ? { ...init } : {};

    if (token && url.includes('/api/') && !url.includes('/api/auth/login')) {
      const headers = new Headers(modifiedInit.headers || {});
      if (!headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      modifiedInit.headers = headers;
    }
    const response = await window.fetch(input, modifiedInit);
    if (response.status === 401 && !url.includes('/api/auth/login')) {
      localStorage.removeItem('ayezz_token');
      localStorage.removeItem('ayezz_user');
      setToken('');
      setCurrentUser(null);
    }
    return response;
  };

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [serverState, setServerState] = useState<'online' | 'maintenance' | 'offline'>('online');
  const [currentTab, setCurrentTab] = useState<'overview' | 'processes' | 'terminal' | 'system' | 'files' | 'npm' | 'servers' | 'users' | 'audit' | 'server' | 'hosting' | 'tickets' | 'billing' | 'settings' | 'profile' | 'ssh-term' | 'database' | 'monitoring'>('overview');
  
  // Dynamic background video visibility toggle
  const [bgVideoActive, setBgVideoActive] = useState<boolean>(() => {
    return localStorage.getItem('ayezz_anime_video_layout') === 'background';
  });

  useEffect(() => {
    const handleStorageChange = () => {
      setBgVideoActive(localStorage.getItem('ayezz_anime_video_layout') === 'background');
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('ayezz_video_layout_changed', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('ayezz_video_layout_changed', handleStorageChange);
    };
  }, []);
  
  // Virtual Servers State Modules
  interface VirtualServer {
    id: string;
    name: string;
    port: number;
    type: 'node' | 'static';
    entryPoint: string;
    status: 'running' | 'stopped';
    pid?: number;
  }
  const [servers, setServers] = useState<VirtualServer[]>([]);
  const [serverName, setServerName] = useState('');
  const [serverType, setServerType] = useState<'node' | 'static'>('node');
  const [serverEntryPoint, setServerEntryPoint] = useState('');
  const [serverLogs, setServerLogs] = useState<string>('');
  const [viewingLogsId, setViewingLogsId] = useState<string | null>(null);
  const [isCreatingServer, setIsCreatingServer] = useState(false);
  
  // File Explorer State Modules
  const [fileList, setFileList] = useState<{ name: string; path: string; isDirectory: boolean; size: number; mtime: string; error?: boolean }[]>([]);
  const [fileExplorerCwd, setFileExplorerCwd] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<{ path: string; content: string } | null>(null);
  const [isEditingFile, setIsEditingFile] = useState<boolean>(false);
  const [editedFileContent, setEditedFileContent] = useState<string>('');
  const [newFileName, setNewFileName] = useState<string>('');
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [showFileModal, setShowFileModal] = useState<'file' | 'folder' | null>(null);
  
  // NPM Packages State Modules
  const [npmInfo, setNpmInfo] = useState<{ name: string; version: string; dependencies: Record<string, string>; devDependencies: Record<string, string> } | null>(null);
  const [npmSearchQuery, setNpmSearchQuery] = useState<string>('');
  const [npmInstallLogs, setNpmInstallLogs] = useState<string>('');
  const [isInstallingPkg, setIsInstallingPkg] = useState<boolean>(false);
  
  // Real stats gathered from backend API
  const [stats, setStats] = useState<ServerStats>({
    cpu: 0,
    ram: 0,
    disk: 0,
    memoryUsedGB: '0.00',
    memoryTotalGB: '0.00',
    diskUsedGB: 0,
    diskTotalGB: 0,
    uptime: 0,
    hostname: 'ayezpanel.my.id',
    platform: 'linux',
    arch: 'x64',
    release: 'kernel',
    loadAvg: [0, 0, 0]
  });

  const [processes, setProcesses] = useState<SystemProcess[]>([]);
  const [cpuHistory, setCpuHistory] = useState<number[]>([12, 14, 18, 11, 20, 15, 25, 21, 16]);
  const [ramHistory, setRamHistory] = useState<number[]>([32, 33, 34, 32, 33, 34, 32, 33, 32]);
  
  // Terminal execution states
  const [terminalInput, setTerminalInput] = useState('');
  const [cwd, setCwd] = useState<string>('');
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    'Welcome to AyeZzPanel Dedicated Secure SSH Hub.',
    'System established direct API connection with Cloud Shell Node.',
    'Type "help" to start inspecting system directories.'
  ]);
  const terminalBottomRef = useRef<HTMLDivElement>(null);

  // Load Simulators (Allows generating real CPU stress loops in the container backend)
  const [simulationActive, setSimulationActive] = useState(false);
  const [stressIntervalId, setStressIntervalId] = useState<any>(null);

  // Notification items
  const [notifications, setNotifications] = useState<string[]>([
    'Secure web socket console fully authorized.',
    'Telemetry connected successfully to Google Cloud Run environment.'
  ]);
  const [showNotifications, setShowNotifications] = useState(false);

  // ==================== AYEZZPANEL AUTENTIKASI DAN ADMIN PORTAL STATES ====================
  const [token, setToken] = useState<string>(() => localStorage.getItem('ayezz_token') || '');
  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const stored = localStorage.getItem('ayezz_user');
      return stored ? JSON.parse(stored) : null;
    } catch (_) {
      return null;
    }
  });

  // Login View States
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // User Management Admin Lists & Form Dialog States
  const [usersList, setUsersList] = useState<any[]>([]);
  const [auditLogsList, setAuditLogsList] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);

  // Create User Inputs
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'reseller' | 'client'>('client');
  const [newStatus, setNewStatus] = useState<'active' | 'suspended' | 'disabled'>('active');
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [createUserError, setCreateUserError] = useState('');

  // Edit User / Status State Target
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'reseller' | 'client'>('client');
  const [editStatus, setEditStatus] = useState<'active' | 'suspended' | 'disabled'>('active');
  
  // Set Password Target
  const [passwordTargetUser, setPasswordTargetUser] = useState<any | null>(null);
  const [passwordTargetValue, setPasswordTargetValue] = useState('');
  const [passwordTargetError, setPasswordTargetError] = useState('');
  const [userSubTab, setUserSubTab] = useState<'local' | 'firestore'>('firestore');

  // Custom Futuristic features state
  const [filesSearchQuery, setFilesSearchQuery] = useState('');
  const [filesViewType, setFilesViewType] = useState<'grid' | 'list'>('grid');
  const [dbQueryText, setDbQueryText] = useState('SELECT * FROM live_bot_plugins WHERE enabled = true;');
  const [dbQueryResult, setDbQueryResult] = useState<string>('');
  const [dbStatus, setDbStatus] = useState<'Disconnected' | 'Connected' | 'Testing'>('Connected');
  const [dbList, setDbList] = useState<any[]>([
    { id: 'ayezz_main_db', name: 'ayezz_firestore_client', type: 'Firestore NoSQL', size: '154 KB', status: 'Online', tables: 'clients, logs, sessions' },
    { id: 'ayezz_relational', name: 'ayezz_postgresql_core', type: 'PostgreSQL Relational', size: '24.1 MB', status: 'Online', tables: 'users, channels, transactions' }
  ]);
  const [activeLogSearch, setActiveLogSearch] = useState('');
  const [terminalSearchQuery, setTerminalSearchQuery] = useState('');
  const [terminalHistory, setTerminalHistory] = useState<string[]>([
    'ls -la',
    'uname -a',
    'cat package.json',
    'df -h',
    'free -m'
  ]);
  
  // Realtime Chart History values for monitoring tab
  const [realtimeCpuHist, setRealtimeCpuHist] = useState<number[]>([24, 28, 30, 25, 40, 22, 50, 42, 38, 45, 50, 48]);
  const [realtimeRamHist, setRealtimeRamHist] = useState<number[]>([52, 53, 54, 52, 55, 54, 53, 55, 56, 52, 53, 54]);
  const [realtimeDiskHist, setRealtimeDiskHist] = useState<number[]>([72, 72, 72, 72, 72, 72, 72, 72, 72, 72, 72, 72]);
  const [realtimeNetHist, setRealtimeNetHist] = useState<number[]>([12, 18, 14, 25, 30, 16, 22, 45, 28, 35, 12, 19]);

  useEffect(() => {
    if (currentTab !== 'monitoring') return;
    const interval = setInterval(() => {
      setRealtimeCpuHist(prev => [...prev.slice(1), Math.floor(Math.random() * 20) + (simulationActive ? 60 : 15)]);
      setRealtimeRamHist(prev => [...prev.slice(1), Math.floor(Math.random() * 5) + 50]);
      setRealtimeNetHist(prev => [...prev.slice(1), Math.floor(Math.random() * 40) + 10]);
    }, 2000);
    return () => clearInterval(interval);
  }, [currentTab, simulationActive]);

  // Tab trigger for admin fetching
  useEffect(() => {
    if (!token) return;
    if (currentTab === 'users' && currentUser?.role === 'admin') {
      fetchUsersList();
    } else if (currentTab === 'audit' && currentUser?.role === 'admin') {
      fetchAuditLogs();
    }
  }, [currentTab, token]);

  // Auth gateway submit pipeline
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername.trim() || !loginPassword.trim()) {
      setLoginError('Sila isi semua ruangan.');
      return;
    }

    setIsLoggingIn(true);
    setLoginError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginUsername.trim(),
          password: loginPassword.trim()
        })
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('ayezz_token', data.token);
        localStorage.setItem('ayezz_user', JSON.stringify(data.user));
        
        setToken(data.token);
        setCurrentUser(data.user);
        
        addCustomNotification(`🔓 Autentikasi berhasil: Selamat datang kembali, @${data.user.username}!`);
        
        // Bootstrap active statistics fetching
        fetchStats();
        fetchProcesses();
        fetchServers();
      } else {
        setLoginError(data.error || 'Autentikasi gagal.');
      }
    } catch (err: any) {
      setLoginError('Koneksi portal gateway terputus. Pastikan server aktif.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Logout session dissolution
  const handleLogOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (_) {}
    
    localStorage.removeItem('ayezz_token');
    localStorage.removeItem('ayezz_user');
    setToken('');
    setCurrentUser(null);
    setLoginUsername('');
    setLoginPassword('');
    setLoginError('');
    addCustomNotification('🔐 Selesai! Sesi aman Anda telah ditutup.');
  };

  // Load registered users (Admin access)
  const fetchUsersList = async () => {
    setUsersLoading(true);
    try {
      const response = await fetch('/api/auth/users');
      if (response.ok) {
        const data = await response.json();
        setUsersList(data);
      } else {
        const err = await response.json();
        addCustomNotification(`Gagal memuat pengguna: ${err.error}`);
      }
    } catch (e: any) {
      addCustomNotification('Macet saat membaca daftar pengguna.');
    } finally {
      setUsersLoading(false);
    }
  };

  // Load audit activities trail log (Admin access)
  const fetchAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const response = await fetch('/api/auth/logs');
      if (response.ok) {
        const data = await response.json();
        setAuditLogsList(data);
      } else {
        const err = await response.json();
        addCustomNotification(`Gagal memuat log audit: ${err.error}`);
      }
    } catch (e: any) {
      addCustomNotification('Macet saat membaca riwayat audit.');
    } finally {
      setAuditLoading(false);
    }
  };

  // Create User submit (Admin access)
  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newEmail || !newPassword) {
      setCreateUserError('Semua field wajib diisi.');
      return;
    }

    setCreateUserError('');
    try {
      const response = await fetch('/api/auth/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUsername.trim(),
          email: newEmail.trim(),
          password: newPassword,
          role: newRole,
          status: newStatus
        })
      });

      const data = await response.json();
      if (response.ok) {
        addCustomNotification(`👤 Akun pengguna @${newUsername} berhasil didaftarkan!`);
        setNewUsername('');
        setNewEmail('');
        setNewPassword('');
        setNewRole('client');
        setNewStatus('active');
        setIsCreatingUser(false);
        fetchUsersList();
      } else {
        setCreateUserError(data.error || 'Gagal mendaftarkan akun.');
      }
    } catch (err: any) {
      setCreateUserError('Kesalahan jaringan internal server.');
    }
  };

  // Update profile variables (Admin access)
  const handleUpdateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const response = await fetch(`/api/auth/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: editEmail.trim(),
          role: editRole,
          status: editStatus
        })
      });

      const data = await response.json();
      if (response.ok) {
        addCustomNotification(`👤 Akun @${editingUser.username} berhasil di-update.`);
        setEditingUser(null);
        fetchUsersList();
      } else {
        alert(data.error || 'Gagal memperbarui pengguna.');
      }
    } catch (err: any) {
      addCustomNotification('Macet saat menyimpan update pengguna.');
    }
  };

  // Admin and Self change password gateway action
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordTargetUser || !passwordTargetValue) return;

    setPasswordTargetError('');
    try {
      const response = await fetch(`/api/auth/users/${passwordTargetUser.id}/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordTargetValue })
      });

      const data = await response.json();
      if (response.ok) {
        addCustomNotification(`🔑 Password untuk @${passwordTargetUser.username} berhasil diubah.`);
        setPasswordTargetValue('');
        setPasswordTargetUser(null);
      } else {
        setPasswordTargetError(data.error || 'Gagal mengubah password.');
      }
    } catch (e: any) {
      setPasswordTargetError('Gangguan jaringan pengiriman data.');
    }
  };

  // Toggle quick suspended / active states
  const handleToggleStatusQuick = async (user: any) => {
    const targetStatus = user.status === 'active' ? 'suspended' : 'active';
    try {
      const response = await fetch(`/api/auth/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus })
      });
      if (response.ok) {
        addCustomNotification(`🔒 Status @${user.username} diubah menjadi: ${targetStatus}`);
        fetchUsersList();
      } else {
        const err = await response.json();
        addCustomNotification(`Gagal merubah status: ${err.error}`);
      }
    } catch (e) {
      addCustomNotification('Gangguan koneksi update status.');
    }
  };

  // Delete User database trace (Admin exclusive)
  const handleDeleteUserClick = async (user: any) => {
    if (user.id === currentUser?.id) {
      addCustomNotification('❌ Tindakan dicegah: Anda tidak dapat menghapus akun Anda sendiri.');
      return;
    }

    const conf = window.confirm(`Apakah Anda benar-benar yakin ingin menghapus akun @${user.username} secara permanen? Data tidak dapat dipulihkan.`);
    if (!conf) return;

    try {
      const response = await fetch(`/api/auth/users/${user.id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (response.ok) {
        addCustomNotification(`🗑️ Akun @${user.username} berhasil dihapus.`);
        fetchUsersList();
      } else {
        addCustomNotification(`Gagal menghapus: ${data.error}`);
      }
    } catch (e) {
      addCustomNotification('Gangguan koneksi database saat menghapus.');
    }
  };

  // =======================================================================================

  // Fetch real statistics from server
  const fetchStats = async () => {
    if (!token) return;
    try {
      const response = await fetch('/api/system/stats');
      if (response.ok) {
        const data: ServerStats = await response.json();
        setStats(data);
        
        // Append values to sparklines
        setCpuHistory(prev => [...prev.slice(1), data.cpu]);
        setRamHistory(prev => [...prev.slice(1), data.ram]);
      }
    } catch (e: any) {
      console.warn('System stats API is temporarily unavailable. Retrying on next tick...', e);
    }
  };

  // Fetch exact container process table from server
  const fetchProcesses = async () => {
    if (!token) return;
    try {
      const response = await fetch('/api/system/processes');
      if (response.ok) {
        const data: SystemProcess[] = await response.json();
        setProcesses(data);
      }
    } catch (e: any) {
      console.warn('System processes list API is temporarily unavailable. Retrying on next tick...', e);
    }
  };

  // Poll system details regularly
  useEffect(() => {
    if (!token) return;
    
    fetchStats();
    fetchProcesses();
    fetchServers();

    const intervalStats = setInterval(fetchStats, 2000);
    const intervalProc = setInterval(fetchProcesses, 3000);
    const intervalServers = setInterval(fetchServers, 4000);

    return () => {
      clearInterval(intervalStats);
      clearInterval(intervalProc);
      clearInterval(intervalServers);
    };
  }, [token]);

  // Poll server process stdout logs when active
  useEffect(() => {
    if (!viewingLogsId) return;
    fetchServerLogs(viewingLogsId);
    const interval = setInterval(() => {
      fetchServerLogs(viewingLogsId);
    }, 2000);
    return () => clearInterval(interval);
  }, [viewingLogsId]);

  // Fetch Directory Files from real system
  const fetchDirectoryFiles = async (targetPath: string) => {
    try {
      const response = await fetch(`/api/files/list?path=${encodeURIComponent(targetPath)}`);
      if (response.ok) {
        const data = await response.json();
        setFileList(data.files || []);
        setFileExplorerCwd(data.cwd);
      } else {
        const err = await response.json();
        addCustomNotification(`Directory fetch error: ${err.error}`);
      }
    } catch (e: any) {
      addCustomNotification(`Directory fetch fail: ${e.message}`);
    }
  };

  // Navigate folder up
  const navigateFolderUp = () => {
    if (!fileExplorerCwd) return;
    const parts = fileExplorerCwd.split('/');
    if (parts.length <= 1) return;
    parts.pop();
    const parentPath = parts.join('/') || '/';
    fetchDirectoryFiles(parentPath);
  };

  // Inspect or Open File content
  const openFileStream = async (filePath: string) => {
    try {
      const response = await fetch(`/api/files/read?path=${encodeURIComponent(filePath)}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedFile({ path: filePath, content: data.content });
        setEditedFileContent(data.content);
        setIsEditingFile(true);
      } else {
        const err = await response.json();
        alert(`Failed to load file: ${err.error}`);
      }
    } catch (e: any) {
      alert(`File reading error: ${e.message}`);
    }
  };

  // Save modified file to the server
  const saveEditedFile = async () => {
    if (!selectedFile) return;
    try {
      const response = await fetch('/api/files/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: selectedFile.path, content: editedFileContent })
      });
      if (response.ok) {
        addCustomNotification(`Saved file successfully: ${selectedFile.path.split('/').pop()}`);
        setIsEditingFile(false);
        setSelectedFile(null);
        fetchDirectoryFiles(fileExplorerCwd);
      } else {
        const err = await response.json();
        alert(`Failed to save file: ${err.error}`);
      }
    } catch (e: any) {
      alert(`File write error: ${e.message}`);
    }
  };

  // Create new blank file
  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    const fullPath = `${fileExplorerCwd}/${newFileName.trim()}`;
    try {
      const response = await fetch('/api/files/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: fullPath, content: '' })
      });
      if (response.ok) {
        addCustomNotification(`Created file "${newFileName.trim()}"`);
        setNewFileName('');
        setShowFileModal(null);
        fetchDirectoryFiles(fileExplorerCwd);
      } else {
        const err = await response.json();
        alert(`Failed to create file: ${err.error}`);
      }
    } catch (e: any) {
      alert(`File creation error: ${e.message}`);
    }
  };

  // Create new directory folder
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const fullPath = `${fileExplorerCwd}/${newFolderName.trim()}`;
    try {
      const response = await fetch('/api/files/create-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderPath: fullPath })
      });
      if (response.ok) {
        addCustomNotification(`Created directory "${newFolderName.trim()}"`);
        setNewFolderName('');
        setShowFileModal(null);
        fetchDirectoryFiles(fileExplorerCwd);
      } else {
        const err = await response.json();
        alert(`Failed to create folder: ${err.error}`);
      }
    } catch (e: any) {
      alert(`Folder creation error: ${e.message}`);
    }
  };

  // Delete file or folder
  const deleteFileOrFolder = async (targetPath: string, isDir: boolean) => {
    const name = targetPath.split('/').pop();
    if (confirm(`Are you sure you want to delete this ${isDir ? 'folder' : 'file'}: "${name}"?`)) {
      try {
        const response = await fetch('/api/files/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetPath })
        });
        if (response.ok) {
          addCustomNotification(`Deleted "${name}"`);
          fetchDirectoryFiles(fileExplorerCwd);
        } else {
          const err = await response.json();
          alert(`Delete failure: ${err.error}`);
        }
      } catch (e: any) {
        alert(`Error executing delete: ${e.message}`);
      }
    }
  };

  // Extract .zip file contents
  const handleUnzip = async (zipPath: string) => {
    const filename = zipPath.split('/').pop() || 'file.zip';
    try {
      addCustomNotification(`Starting extraction of "${filename}"...`);
      const response = await fetch('/api/files/unzip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipPath })
      });
      if (response.ok) {
        const data = await response.json();
        addCustomNotification(`Successfully extracted "${filename}"!`);
        fetchDirectoryFiles(fileExplorerCwd);
      } else {
        const err = await response.json();
        alert(`Failed to unzip file: ${err.error}`);
      }
    } catch (e: any) {
      alert(`Unzipping failed: ${e.message}`);
    }
  };

  // Download standard file
  const handleDownloadFile = async (filePath: string) => {
    const fileName = filePath.split('/').pop() || 'file';
    try {
      addCustomNotification(`📥 Preparing download for "${fileName}"...`);
      const response = await fetch(`/api/files/download?path=${encodeURIComponent(filePath)}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        addCustomNotification(`💾 Downloaded "${fileName}" successfully!`);
      } else {
        const err = await response.json();
        alert(`Download failed: ${err.error || 'unknown server error'}`);
      }
    } catch (e: any) {
      alert(`Download error: ${e.message}`);
    }
  };

  // Compress and download folder/file as a zip
  const handleDownloadFolderZip = async (folderPath: string) => {
    const folderName = folderPath.split('/').pop() || 'folder';
    try {
      addCustomNotification(`📥 Compressing and preparing download for "${folderName}.zip"...`);
      const response = await fetch(`/api/files/download-zip?path=${encodeURIComponent(folderPath)}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${folderName}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        addCustomNotification(`💾 Downloaded "${folderName}.zip" successfully!`);
      } else {
        const err = await response.json();
        alert(`ZIP Download failed: ${err.error || 'unknown server error'}`);
      }
    } catch (e: any) {
      alert(`ZIP Download error: ${e.message}`);
    }
  };

  // ==================== WEB SERVICES / VIRTUAL SERVERS HANDLERS ====================
  const fetchServers = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/servers/list');
      if (res.ok) {
        const data = await res.json();
        setServers(data);
      }
    } catch (e: any) {
      console.warn('Servers list API is temporarily unavailable. Retrying on next tick...', e);
    }
  };

  const executeServerCreation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverName.trim() || !serverEntryPoint.trim()) {
      alert('Please enter a name and entry point path.');
      return;
    }
    try {
      const res = await fetch('/api/servers/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: serverName.trim(),
          type: serverType,
          entryPoint: serverEntryPoint.trim()
        })
      });
      if (res.ok) {
        addCustomNotification(`Created web server: "${serverName.trim()}"`);
        setServerName('');
        setServerEntryPoint('');
        setIsCreatingServer(false);
        fetchServers();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (err: any) {
      alert(`Failed to create server: ${err.message}`);
    }
  };

  const handleStartServer = async (id: string, name: string) => {
    try {
      addCustomNotification(`Starting app server "${name}"...`);
      const res = await fetch('/api/servers/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        addCustomNotification(`App server "${name}" is now ONLINE`);
        fetchServers();
        if (viewingLogsId === id) {
          fetchServerLogs(id);
        }
      } else {
        const err = await res.json();
        alert(`Error starting: ${err.error}`);
      }
    } catch (err: any) {
      alert(`Error starting: ${err.message}`);
    }
  };

  const handleStopServer = async (id: string, name: string) => {
    try {
      addCustomNotification(`Stopping app server "${name}"...`);
      const res = await fetch('/api/servers/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        addCustomNotification(`App server "${name}" stop signal sent.`);
        setTimeout(fetchServers, 1000);
      } else {
        const err = await res.json();
        alert(`Error stopping: ${err.error}`);
      }
    } catch (err: any) {
      alert(`Error stopping: ${err.message}`);
    }
  };

  const handleDeleteServer = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete Web Server "${name}"?`)) return;
    try {
      const res = await fetch('/api/servers/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        addCustomNotification(`Deleted server profile: "${name}"`);
        if (viewingLogsId === id) setViewingLogsId(null);
        fetchServers();
      } else {
        const err = await res.json();
        alert(`Error deleting: ${err.error}`);
      }
    } catch (err: any) {
      alert(`Error deleting: ${err.message}`);
    }
  };

  const fetchServerLogs = async (id: string) => {
    try {
      const res = await fetch(`/api/servers/logs/${id}`);
      if (res.ok) {
        const data = await res.json();
        setServerLogs(data.logs.join('\n'));
      }
    } catch (e) {}
  };

  // File drag & drop or manual upload handler (Base64 encoding pipeline)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = async (event) => {
      const result = event.target?.result as string;
      const base64Content = result.split(',')[1] || result;
      
      try {
        const response = await fetch('/api/files/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            directory: fileExplorerCwd,
            name: file.name,
            content: base64Content,
            encoding: 'base64'
          })
        });
        if (response.ok) {
          addCustomNotification(`Uploaded file: ${file.name}`);
          fetchDirectoryFiles(fileExplorerCwd);
        } else {
          const err = await response.json();
          alert(`Upload failed: ${err.error}`);
        }
      } catch (err: any) {
        alert(`Upload connection failure: ${err.message}`);
      }
    };
    reader.readAsDataURL(file);
  };

  // Load real workspace package.json dependencies
  const fetchNpmPackageJson = async () => {
    try {
      const response = await fetch('/api/npm/list');
      if (response.ok) {
        const data = await response.json();
        setNpmInfo(data);
      }
    } catch (e) {
      console.error('Failed to load local packages configuration', e);
    }
  };

  // Run install payload
  const runNpmInstallation = async (pkgName?: string, isDev = false) => {
    setIsInstallingPkg(true);
    setNpmInstallLogs(`> Resolving package dependencies...\n> Running npm installation task in workspace. Please hold...\n\n`);
    
    try {
      const response = await fetch('/api/npm/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageName: pkgName, isDev })
      });
      
      const data = await response.json();
      setIsInstallingPkg(false);
      
      if (response.ok && data.success) {
        setNpmInstallLogs(curr => curr + `[SUCCESS]: NPM Installation completed successfully!\n\nStandard output:\n${data.stdout}`);
        addCustomNotification(pkgName ? `Installed package "${pkgName}"` : `All standard packages installed!`);
        fetchNpmPackageJson();
        setNpmSearchQuery('');
      } else {
        setNpmInstallLogs(curr => curr + `[ERROR]: Installation failed!\n\nStandard error:\n${data.stderr || data.message}`);
        addCustomNotification(`NPM installation task failed.`);
      }
    } catch (e: any) {
      setIsInstallingPkg(false);
      setNpmInstallLogs(curr => curr + `[SHUTDOWN ERROR]: Internal service failure: ${e.message}`);
    }
  };

  // Set default current working directory on mount
  useEffect(() => {
    // Run simple command to fetch target workspace root directory path
    const initializeCwd = async () => {
      try {
        const res = await fetch('/api/terminal/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: 'pwd' })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.cwd) {
            setCwd(data.cwd);
            setTerminalLogs(prev => [...prev, `Authorized Shell Session: CWD established as [${data.cwd}]`]);
            fetchDirectoryFiles(data.cwd);
            fetchNpmPackageJson();
          }
        }
      } catch (e) {}
    };
    if (token) {
      initializeCwd();
    }
  }, []);

  // Automatically scroll terminal viewport
  useEffect(() => {
    if (terminalBottomRef.current) {
      terminalBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLogs]);

  // Terminal manual command submitter
  const executeTerminalCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    const cmdText = terminalInput.trim();
    if (!cmdText) return;

    // Add to history
    setTerminalHistory(prev => {
      const filtered = prev.filter(h => h !== cmdText);
      return [cmdText, ...filtered].slice(0, 50); // Keep last 50, newest first
    });

    if (cmdText.toLowerCase() === 'clear') {
      setTerminalLogs([]);
      setTerminalInput('');
      return;
    }

    if (cmdText.toLowerCase() === 'help') {
      setTerminalLogs(prev => [
        ...prev,
        `guest@ayezz-panel:${cwd || '~'}# ${cmdText}`,
        'Available Console Commands:',
        '  • help             List diagnostic instruction lines',
        '  • clear            Flush active command logs view',
        '  • ls -la           Display directory structure detailing file sizes',
        '  • uname -a         Output active server kernel representation',
        '  • cat <filename>   Read file contents instantly (e.g. cat package.json)',
        '  • df -h            Identify hardware storage partitions',
        '  • free -m          Verify available container memory bounds',
        '  • find . -name "*" Query nested file indexes',
        '  • whoami           Output active user profile credentials'
      ]);
      setTerminalInput('');
      return;
    }

    try {
      // Append user command immediately
      setTerminalLogs(prev => [...prev, `guest@ayezz-panel:${cwd || '~'}# ${cmdText}`]);

      const res = await fetch('/api/terminal/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmdText, cwd })
      });

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
        if (data.cwd) {
          setCwd(data.cwd);
        }
      } else {
        setTerminalLogs(prev => [...prev, '[Terminal error Connection broken to API gateway]']);
      }
    } catch (err: any) {
      setTerminalLogs(prev => [...prev, `[System failure]: ${err.message}`]);
    }

    setTerminalInput('');
    fetchStats();
    fetchProcesses();
  };

  // Copy standard terminal output to clipboard
  const copyStandardTerminalLogs = () => {
    if (terminalLogs.length === 0) {
      addCustomNotification('No terminal output to copy');
      return;
    }
    const logsText = terminalLogs.join('\n');
    navigator.clipboard.writeText(logsText);
    addCustomNotification('📋 Terminal logs copied to clipboard successfully!');
  };

  // Signal kill request to real process
  const killProcessByPid = async (pid: number, name: string) => {
    if (confirm(`Do you want to terminate process "${name}" (PID: ${pid})?`)) {
      try {
        const response = await fetch('/api/system/kill', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pid })
        });
        const result = await response.json();
        if (response.ok) {
          addCustomNotification(`Successfully terminated thread "${name}" (PID ${pid}).`);
          setTerminalLogs(prev => [...prev, `[PROCESS TERMINATION]: Dispatched SIGKILL payload. Thread (${name}) PID: ${pid} stopped.`]);
          fetchProcesses();
          fetchStats();
        } else {
          alert(`Error: ${result.error}`);
        }
      } catch (err: any) {
        alert(`Failed to execute termination command: ${err.message}`);
      }
    }
  };

  // Simulate Load Strain using real mathematical calculations in container thread
  const togglePeakClusterStrain = () => {
    if (simulationActive) {
      // Terminate any active cpu strain loops
      if (stressIntervalId) {
        clearInterval(stressIntervalId);
      }
      setStressIntervalId(null);
      setSimulationActive(false);
      addCustomNotification('Real-time CPU host cooling active.');
      setTerminalLogs(prev => [...prev, '[SYSALERT]: Terminated CPU calculation stress benchmarks. Loading normalizes.']);
    } else {
      setSimulationActive(true);
      addCustomNotification('Active benchmark calculation stream started.');
      setTerminalLogs(prev => [...prev, '[SYSALERT]: Spearheaded container calculation loops to simulate CPU load strain.']);
      
      // Calculate active prime numbers over block intervals
      const interval = setInterval(() => {
        let count = 0;
        for (let i = 0; i < 300000; i++) {
          let isPrime = true;
          for (let j = 2; j <= Math.sqrt(i); j++) {
            if (i % j === 0) {
              isPrime = false;
              break;
            }
          }
          if (isPrime) count++;
        }
      }, 50);

      setStressIntervalId(interval);
    }
  };

  const addCustomNotification = (message: string) => {
    setNotifications(prev => [message, ...prev.slice(0, 5)]);
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${days}d ${hours}h ${mins}m ${secs}s`;
  };

  if (!token || !currentUser) {
    return (
      <div id="login-root" className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans antialiased selection:bg-indigo-500/20">
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-indigo-900/15 rounded-full blur-[140px] pointer-events-none select-none"></div>
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-cyan-950/10 rounded-full blur-[140px] pointer-events-none select-none"></div>
        
        <div className="w-full max-w-md bg-slate-900/40 backdrop-blur-xl border border-slate-900 rounded-3xl p-8 space-y-6 shadow-2xl relative z-10 transition-all">
          <div className="text-center space-y-3">
            <div className="mx-auto w-12 h-12 bg-gradient-to-tr from-indigo-500 to-cyan-400 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/10">
              <Layers3 className="w-6 h-6 text-slate-950 font-bold" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent font-sans">AyeZzPanel</h1>
              <p className="text-xs text-slate-400 mt-1 font-sans">Sistem Dashboard Kontrol Admin Utama</p>
            </div>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {loginError && (
              <div className="bg-rose-950/25 border border-rose-900/50 text-rose-400 p-3.5 rounded-2xl text-[11px] font-mono leading-relaxed flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono tracking-wider uppercase text-slate-400">Username</label>
              <input
                type="text"
                required
                value={loginUsername}
                onChange={(e) => { setLoginUsername(e.target.value); setLoginError(''); }}
                placeholder="Masukkan username"
                className="w-full bg-slate-950/50 border border-slate-900 focus:border-indigo-500 rounded-2xl px-4 py-3 text-sm text-slate-200 outline-none transition-colors"
                id="login-username-input"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono tracking-wider uppercase text-slate-400">Password</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => { setLoginPassword(e.target.value); setLoginError(''); }}
                placeholder="••••••••"
                className="w-full bg-slate-950/50 border border-slate-900 focus:border-indigo-500 rounded-2xl px-4 py-3 text-sm text-slate-200 outline-none transition-colors"
                id="login-password-input"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-2xl transition-all cursor-pointer shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 block text-center"
              id="login-submit-btn"
            >
              {isLoggingIn ? 'Memverifikasi...' : 'Masuk ke Panel'}
            </button>
          </form>

          <div className="border-t border-slate-900/50 pt-4 text-center">
            <span className="text-[10px] font-mono text-slate-500 block leading-relaxed leading-normal">
              🔐 SECURED GATEWAY &bull; REAL DB INTEGRATION
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="aye-container" className={`min-h-screen ${bgVideoActive ? 'bg-slate-950/20' : 'bg-slate-950'} text-slate-100 flex overflow-hidden font-sans antialiased relative transition-all duration-700`}>
      
      {/* Visual background glows */}
      <div id="mesh-gradient-1" className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-indigo-900/15 rounded-full blur-[120px] pointer-events-none select-none"></div>
      <div id="mesh-gradient-2" className="absolute -bottom-[15%] -right-[10%] w-[60%] h-[60%] bg-cyan-900/10 rounded-full blur-[140px] pointer-events-none select-none"></div>
      <div id="mesh-gradient-3" className="absolute top-[30%] left-[40%] w-[35%] h-[35%] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none select-none"></div>

      {/* ==================== GLASSMORPHISM SIDEBAR (Desktop) ==================== */}
      <aside 
        id="desktop-sidebar" 
        className="hidden md:flex flex-col w-72 bg-[#050816]/75 backdrop-blur-2xl border-r border-[#1e295d]/35 p-5 h-screen shrink-0 z-30 transition-all duration-300 relative shadow-[5px_0_25px_-5px_rgba(5,8,22,0.6)]"
      >
        <div id="sidebar-brand" className="pb-5 pt-1 px-3 border-b border-[#1e295d]/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#00f2fe] via-[#3b82f6] to-[#050816] rounded-xl shadow-[0_0_15px_rgba(0,242,254,0.3)] flex items-center justify-center border border-[#00f2fe]/40 animate-pulse">
              <Layers3 className="w-5 h-5 text-slate-950 font-bold" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-wider text-white capitalize bg-gradient-to-r from-white via-[#00f2fe] to-[#3b82f6] bg-clip-text text-transparent font-sans">
                AyeZzBot
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] font-mono tracking-widest text-[#00f2fe] uppercase font-bold">WORKSPACE LIVE</span>
              </div>
            </div>
          </div>
        </div>

        {/* User Profile Avatar Section */}
        <div className="my-4 p-3 bg-[#0a1020]/50 border border-[#1e295d]/30 rounded-2xl flex items-center gap-3 relative overflow-hidden group hover:border-[#00f2fe]/30 transition-all">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00f2fe]/30 to-transparent"></div>
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00f2fe] to-[#3b82f6] p-[1.5px] shadow-[0_0_10px_rgba(59,130,246,0.2)]">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center font-bold text-xs text-[#00f2fe] uppercase">
                {currentUser?.username?.substring(0, 2).toUpperCase() || 'AZ'}
              </div>
            </div>
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-slate-200 capitalize truncate group-hover:text-white transition-colors">{currentUser?.username || 'Zann Dev'}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span className="text-[9px] font-mono tracking-wider font-semibold uppercase text-slate-500">
                {currentUser?.role || 'administrator'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav id="sidebar-navigation" className="flex-grow space-y-4 py-2 overflow-y-auto max-h-[calc(100vh-320px)] scrollbar-none">
          
          {/* CATEGORY 1: WORKSPACE PORTAL */}
          <div className="space-y-1">
            <p className="px-3 text-[9px] font-mono uppercase tracking-widest text-slate-500 font-bold mb-1 w-full block">WORKSPACE PORTAL</p>
            
            <button
              onClick={() => setCurrentTab('profile')}
              className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer border ${
                currentTab === 'profile' 
                  ? 'bg-[#3b82f6]/10 border-[#3b82f6]/35 text-white shadow-inner' 
                  : 'text-slate-400 hover:bg-[#0a1020]/55 hover:text-[#00f2fe] border-transparent'
              }`}
            >
              <User className="w-3.5 h-3.5 text-[#00f2fe]" />
              <span>My Profile</span>
            </button>

            <button
              onClick={() => setCurrentTab('settings')}
              className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer border ${
                currentTab === 'settings' 
                  ? 'bg-[#3b82f6]/10 border-[#3b82f6]/35 text-white shadow-inner' 
                  : 'text-slate-400 hover:bg-[#0a1020]/55 hover:text-[#00f2fe] border-transparent'
              }`}
            >
              <Settings className="w-3.5 h-3.5 text-[#00f2fe]" />
              <span>System Settings</span>
            </button>

            {currentUser?.role === 'admin' && (
              <>
                <button
                  onClick={() => setCurrentTab('users')}
                  className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer border ${
                    currentTab === 'users' 
                      ? 'bg-[#3b82f6]/10 border-[#3b82f6]/35 text-white shadow-inner' 
                      : 'text-slate-400 hover:bg-[#0a1020]/55 hover:text-[#00f2fe] border-transparent'
                  }`}
                >
                  <User className="w-3.5 h-3.5 text-[#00f2fe]" />
                  <span>User Management</span>
                </button>

                <button
                  onClick={() => setCurrentTab('audit')}
                  className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer border ${
                    currentTab === 'audit' 
                      ? 'bg-[#3b82f6]/10 border-[#3b82f6]/35 text-white shadow-inner' 
                      : 'text-slate-400 hover:bg-[#0a1020]/55 hover:text-[#00f2fe] border-transparent'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#00f2fe]" />
                  <span>Security Auditing</span>
                </button>
              </>
            )}
          </div>

          {/* CATEGORY 2: HOSTING ENGINE */}
          <div className="space-y-1">
            <p className="px-3 text-[9px] font-mono uppercase tracking-widest text-slate-500 font-bold mb-1 w-full block">HOSTING ENGINE</p>

            <button
              onClick={() => setCurrentTab('server')}
              className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer border ${
                currentTab === 'server' 
                  ? 'bg-[#3b82f6]/10 border-[#3b82f6]/35 text-white shadow-inner' 
                  : 'text-slate-400 hover:bg-[#0a1020]/55 hover:text-[#00f2fe] border-transparent'
              }`}
            >
              <Server className="w-3.5 h-3.5 text-[#00f2fe]" />
              <span>Server Management</span>
            </button>

            <button
              onClick={() => setCurrentTab('processes')}
              className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer border ${
                currentTab === 'processes' 
                  ? 'bg-[#3b82f6]/10 border-[#3b82f6]/35 text-white shadow-inner' 
                  : 'text-slate-400 hover:bg-[#0a1020]/55 hover:text-[#00f2fe] border-transparent'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-[#00f2fe]" />
              <span>Container Manager</span>
            </button>

            <button
              onClick={() => {
                setCurrentTab('files');
                fetchDirectoryFiles(fileExplorerCwd || '.');
              }}
              className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer border ${
                currentTab === 'files' 
                  ? 'bg-[#3b82f6]/10 border-[#3b82f6]/35 text-white shadow-inner' 
                  : 'text-slate-400 hover:bg-[#0a1020]/55 hover:text-[#00f2fe] border-transparent'
              }`}
            >
              <Folder className="w-3.5 h-3.5 text-[#00f2fe]" />
              <span>File Explorer</span>
            </button>

            <button
              onClick={() => {
                setCurrentTab('database');
              }}
              className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer border ${
                currentTab === 'database' 
                  ? 'bg-[#3b82f6]/10 border-[#3b82f6]/35 text-white shadow-inner' 
                  : 'text-slate-400 hover:bg-[#0a1020]/55 hover:text-[#00f2fe] border-transparent'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-[#00f2fe]" />
              <span>Database Control</span>
            </button>
          </div>

          {/* CATEGORY 3: RESOURCES & LOGS */}
          <div className="space-y-1">
            <p className="px-3 text-[9px] font-mono uppercase tracking-widest text-slate-500 font-bold mb-1 w-full block">RESOURCES & LOGS</p>

            <button
              onClick={() => setCurrentTab('servers')}
              className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer border ${
                currentTab === 'servers' 
                  ? 'bg-[#3b82f6]/10 border-[#3b82f6]/35 text-white shadow-inner' 
                  : 'text-slate-400 hover:bg-[#0a1020]/55 hover:text-[#00f2fe] border-transparent'
              }`}
            >
              <Network className="w-3.5 h-3.5 text-[#00f2fe]" />
              <span>Network Tools</span>
            </button>

            <button
              onClick={() => setCurrentTab('audit')}
              className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer border ${
                currentTab === 'audit' 
                  ? 'bg-[#3b82f6]/10 border-[#3b82f6]/35 text-white shadow-inner' 
                  : 'text-slate-400 hover:bg-[#0a1020]/55 hover:text-[#00f2fe] border-transparent'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-[#00f2fe]" />
              <span>Activity Logs</span>
            </button>

            <button
              onClick={() => setCurrentTab('billing')}
              className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer border ${
                currentTab === 'billing' 
                  ? 'bg-[#3b82f6]/10 border-[#3b82f6]/35 text-white shadow-inner' 
                  : 'text-slate-400 hover:bg-[#0a1020]/55 hover:text-[#00f2fe] border-transparent'
              }`}
            >
              <Save className="w-3.5 h-3.5 text-[#00f2fe]" />
              <span>Backup Center</span>
            </button>

            <button
              onClick={() => {
                setCurrentTab('hosting');
                fetchDirectoryFiles(fileExplorerCwd || '.');
                fetchNpmPackageJson();
                fetchServers();
              }}
              className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer border ${
                currentTab === 'hosting' 
                  ? 'bg-[#3b82f6]/10 border-[#3b82f6]/35 text-white shadow-inner' 
                  : 'text-slate-400 hover:bg-[#0a1020]/55 hover:text-[#00f2fe] border-transparent'
              }`}
            >
              <Command className="w-3.5 h-3.5 text-[#00f2fe]" />
              <span>API Manager</span>
            </button>
          </div>
        </nav>

        {/* Bottom Metadata Info Card */}
        <div id="sidebar-footer" className="bg-slate-950/40 border border-slate-900 rounded-xl p-3.5 mt-auto flex flex-col gap-2.5">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center font-bold text-xs text-slate-950 hover:opacity-90 shadow-inner shrink-0">
                {currentUser?.username?.substring(0, 2).toUpperCase() || 'AZ'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-slate-200 truncate capitalize">{currentUser?.username || 'User'}</p>
                <p className="text-[8px] text-indigo-400 font-mono tracking-wider uppercase font-semibold">{currentUser?.role || 'client'}</p>
              </div>
            </div>
            <button
              onClick={handleLogOut}
              className="p-1 px-[7px] text-rose-400 hover:text-white bg-slate-900 hover:bg-rose-950/30 border border-slate-800 hover:border-rose-900/50 rounded-lg cursor-pointer transition-colors"
              title="Sign Out"
              id="sidebar-sign-out-btn"
            >
              <Power className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center justify-between text-[9px] text-slate-500 border-t border-slate-900/50 pt-2 font-mono">
            <span>Server State</span>
            <span className="text-emerald-400 font-bold">ONLINE</span>
          </div>
        </div>
      </aside>

      {/* ==================== SCREEN SIDEBAR OVERLAY (Mobile Drawer) ==================== */}
      {mobileSidebarOpen && (
        <div 
          id="mobile-sidebar-backdrop"
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-40 md:hidden"
        />
      )}
      
      <aside 
        id="mobile-sidebar"
        className={`fixed top-0 bottom-0 left-0 w-64 bg-slate-950/95 backdrop-blur-2xl border-r border-slate-900 p-5 z-50 flex flex-col transition-transform duration-300 transform md:hidden ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div id="mobile-sidebar-header" className="flex items-center justify-between pb-6 pt-2 border-b border-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <Layers3 className="w-5 h-5 text-slate-950" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-white to-indigo-300 bg-clip-text text-transparent">AyeZzPanel</span>
          </div>
          <button 
            id="close-sidebar-btn"
            onClick={() => setMobileSidebarOpen(false)}
            className="p-1 px-1.5 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav id="mobile-sidebar-navigation" className="flex-grow space-y-1.5 py-6">
          <button
            onClick={() => { setCurrentTab('overview'); setMobileSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              currentTab === 'overview' ? 'bg-indigo-600/30 text-white' : 'text-slate-400'
            }`}
          >
            <Activity className="w-4 h-4" />
            {t('nav_overview')}
          </button>
          
          <button
            onClick={() => { setCurrentTab('processes'); setMobileSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              currentTab === 'processes' ? 'bg-indigo-600/30 text-white' : 'text-slate-400'
            }`}
          >
            <Server className="w-4 h-4" />
            {t('nav_processes')}
          </button>

          <button
            onClick={() => { setCurrentTab('terminal'); setMobileSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              currentTab === 'terminal' ? 'bg-indigo-600/30 text-white' : 'text-slate-400'
            }`}
          >
            <TerminalIcon className="w-4 h-4" />
            {t('nav_shell')}
          </button>

          <button
            onClick={() => { setCurrentTab('ssh-term'); setMobileSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              currentTab === 'ssh-term' ? 'bg-indigo-600/30 text-white' : 'text-slate-400'
            }`}
          >
            <TerminalIcon className="w-4 h-4" />
            {t('nav_ssh_term')}
          </button>

          <button
            onClick={() => { setCurrentTab('system'); setMobileSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              currentTab === 'system' ? 'bg-indigo-600/30 text-white' : 'text-slate-400'
            }`}
          >
            <Info className="w-4 h-4" />
            {t('nav_system')}
          </button>

          <button
            onClick={() => { setCurrentTab('files'); setMobileSidebarOpen(false); if (fileExplorerCwd) fetchDirectoryFiles(fileExplorerCwd); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              currentTab === 'files' ? 'bg-indigo-600/30 text-white' : 'text-slate-400'
            }`}
          >
            <Folder className="w-4 h-4" />
            {t('nav_files')}
          </button>

          <button
            onClick={() => { setCurrentTab('npm'); setMobileSidebarOpen(false); fetchNpmPackageJson(); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              currentTab === 'npm' ? 'bg-indigo-600/30 text-white' : 'text-slate-400'
            }`}
          >
            <Package className="w-4 h-4" />
            {t('nav_npm')}
          </button>

          {currentUser?.role === 'admin' && (
            <>
              <div className="border-t border-slate-900 my-2 pt-2"></div>
              <button
                onClick={() => { setCurrentTab('users'); setMobileSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  currentTab === 'users' ? 'bg-indigo-600/30 text-white' : 'text-slate-400'
                }`}
                id="mobile-nav-btn-users"
              >
                <User className="w-4 h-4" />
                {t('nav_users')}
              </button>

              <button
                onClick={() => { setCurrentTab('audit'); setMobileSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  currentTab === 'audit' ? 'bg-indigo-600/30 text-white' : 'text-slate-400'
                }`}
                id="mobile-nav-btn-audit"
              >
                <ShieldCheck className="w-4 h-4" />
                {t('nav_audit')}
              </button>
            </>
          )}
        </nav>

        <div className="bg-slate-900/60 p-3.5 rounded-xl mt-auto">
          <p className="text-[10px] text-slate-400 mb-2">Simulate prime number test load:</p>
          <button
            onClick={togglePeakClusterStrain}
            className={`w-full py-1.5 rounded-lg text-xs font-mono font-medium text-center ${
              simulationActive ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-800 text-slate-300'
            }`}
          >
            {simulationActive ? 'Stop Benchmark' : 'Start Benchmark'}
          </button>
        </div>
      </aside>

      {/* ==================== MAIN CONTENT AREA ==================== */}
      <section 
        id="content-area" 
        className={`flex-grow flex flex-col h-screen overflow-y-auto overflow-x-hidden relative z-10 transition-all duration-700 ${
          bgVideoActive 
            ? 'bg-gradient-to-br from-[#02040d]/40 via-[#050816]/50 to-[#0a1020]/60 backdrop-blur-[6px]' 
            : 'bg-gradient-to-br from-[#02040d] via-[#050816] to-[#0a1020]'
        }`}
      >
        
        {/* Sticky Glass Header */}
        <header id="content-header" className="sticky top-0 bg-[#050816]/75 backdrop-blur-xl border-b border-[#1e295d]/35 p-4 md:px-6 flex flex-col lg:flex-row items-center justify-between gap-4 z-20 shadow-[0_4px_30px_rgba(5,8,22,0.4)]">
          
          <div className="flex items-center justify-between w-full lg:w-auto gap-3">
            <button
              id="mobile-menu-hamburger"
              onClick={() => setMobileSidebarOpen(true)}
              className="p-1 px-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 md:hidden hover:text-white cursor-pointer hover:bg-slate-800 animate-pulse"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></div>
              <div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono tracking-wider">
                  <span>AyeZzBot</span>
                  <span>&bull;</span>
                  <span className="text-cyan-400 font-bold uppercase tracking-widest">{currentTab}</span>
                </div>
                <h1 className="text-xs font-bold font-mono text-slate-400 mt-0.5 tracking-tight truncate max-w-[150px]">
                  {stats.hostname || 'ayezz-dev-node'}
                </h1>
              </div>
            </div>
          </div>

          {/* FUTURISTIC WORKSPACE CENTER MENU */}
          <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-2xl border border-[#1e295d]/35 overflow-x-auto max-w-full scrollbar-none shadow-inner">
            <button
              onClick={() => setCurrentTab('overview')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold tracking-wide transition-all ${
                currentTab === 'overview'
                  ? 'bg-gradient-to-r from-blue-650 to-cyan-550 text-white shadow-[0_0_15px_rgba(0,242,254,0.3)] border border-cyan-400/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#0a1020]/40'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setCurrentTab('terminal')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold tracking-wide transition-all ${
                currentTab === 'terminal'
                  ? 'bg-gradient-to-r from-blue-650 to-cyan-550 text-white shadow-[0_0_15px_rgba(0,242,254,0.3)] border border-cyan-400/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#0a1020]/40'
              }`}
            >
              <TerminalIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span>Console</span>
            </button>

            <button
              onClick={() => {
                setCurrentTab('files');
                fetchDirectoryFiles(fileExplorerCwd || '.');
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold tracking-wide transition-all ${
                currentTab === 'files'
                  ? 'bg-gradient-to-r from-blue-650 to-cyan-550 text-white shadow-[0_0_15px_rgba(0,242,254,0.3)] border border-cyan-400/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#0a1020]/40'
              }`}
            >
              <Folder className="w-3.5 h-3.5 text-cyan-400" />
              <span>Files</span>
            </button>

            <button
              onClick={() => setCurrentTab('database')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold tracking-wide transition-all ${
                currentTab === 'database'
                  ? 'bg-gradient-to-r from-blue-650 to-cyan-550 text-white shadow-[0_0_15px_rgba(0,242,254,0.3)] border border-cyan-400/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#0a1020]/40'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Database</span>
            </button>

            <button
              onClick={() => setCurrentTab('servers')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold tracking-wide transition-all ${
                currentTab === 'servers'
                  ? 'bg-gradient-to-r from-blue-650 to-cyan-550 text-white shadow-[0_0_15px_rgba(0,242,254,0.3)] border border-cyan-400/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#0a1020]/40'
              }`}
            >
              <Network className="w-3.5 h-3.5 text-cyan-400" />
              <span>Network</span>
            </button>

            <button
              onClick={() => setCurrentTab('settings')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold tracking-wide transition-all ${
                currentTab === 'settings'
                  ? 'bg-gradient-to-r from-blue-650 to-cyan-550 text-white shadow-[0_0_15px_rgba(0,242,254,0.3)] border border-cyan-400/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#0a1020]/40'
              }`}
            >
              <Settings className="w-3.5 h-3.5 text-cyan-400" />
              <span>Settings</span>
            </button>

            <button
              onClick={() => setCurrentTab('monitoring')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold tracking-wide transition-all ${
                currentTab === 'monitoring'
                  ? 'bg-gradient-to-r from-blue-650 to-cyan-550 text-white shadow-[0_0_15px_rgba(0,242,254,0.3)] border border-cyan-400/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#0a1020]/40'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
              <span>Monitoring</span>
            </button>
          </div>

          <div id="header-right-widgets" className="flex items-center gap-3">
            
            {/* Real Uptime Panel */}
            <div className="hidden sm:flex items-center gap-2 bg-[#0a1020]/80 border border-[#1e295d]/35 rounded-xl px-3.5 py-1.5 text-[11px] text-slate-300 font-mono shadow-inner group hover:border-cyan-400/30 transition-all">
              <Clock className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
              <span className="text-slate-500 font-bold">UPTIME:</span>
              <span className="font-extrabold text-[#00f2fe]">{formatUptime(stats.uptime)}</span>
            </div>

            {/* Quick Action Button for Shell */}
            <button
              id="header-nav-shell-fast"
              onClick={() => setCurrentTab('terminal')}
              className="lg:flex items-center gap-1.5 bg-slate-900/50 hover:bg-slate-800/80 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 transition-colors cursor-pointer hidden"
            >
              <TerminalIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span>Shell Hub</span>
            </button>

            {/* Language Selection Switcher */}
            <div className="flex bg-slate-900/40 border border-slate-800 rounded-xl p-1 shrink-0">
              <button
                id="lang-btn-en"
                onClick={() => {
                  setLanguage('en');
                  addCustomNotification('Language changed to English');
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono tracking-wider transition-all cursor-pointer ${
                  language === 'en' 
                    ? 'bg-indigo-600/30 text-white shadow-inner' 
                    : 'text-slate-450 hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                id="lang-btn-id"
                onClick={() => {
                  setLanguage('id');
                  addCustomNotification('Bahasa diubah ke Indonesia');
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono tracking-wider transition-all cursor-pointer ${
                  language === 'id' 
                    ? 'bg-indigo-600/30 text-white shadow-inner' 
                    : 'text-slate-450 hover:text-white'
                }`}
              >
                ID
              </button>
            </div>

            {/* Notification center */}
            <div className="relative">
              <button
                id="header-notification-bell"
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2.5 bg-slate-900/40 hover:bg-slate-800/50 border border-slate-800 rounded-xl text-slate-400 hover:text-white relative cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping"></span>
                )}
              </button>

              {/* Notification glass dropdown */}
              {showNotifications && (
                <div id="notifications-box" className="absolute right-0 mt-2.5 w-80 bg-slate-900/95 border border-slate-800/80 backdrop-blur-2xl rounded-2xl p-4 shadow-xl z-50">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800/50 mb-2">
                    <span className="text-xs font-semibold text-slate-200">Panel Alerts & Syslogs</span>
                    <button 
                      onClick={() => setNotifications([])} 
                      className="text-[10px] text-indigo-400 hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-500">
                      No warning alerts inside logs.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {notifications.map((notif, index) => (
                        <div key={index} className="p-2 bg-slate-950 border border-slate-800/40 rounded-lg text-[11px] leading-relaxed text-slate-300">
                          {notif}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Dynamic Session User Identity Widget */}
            <div id="topbar-identity-widget" className="flex items-center gap-2.5 pl-2 border-l border-slate-900/60 h-8">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-200 capitalize leading-tight">
                  {currentUser?.username || 'Guest'}
                </span>
                <span className="text-[8px] text-indigo-400 font-mono uppercase tracking-wider leading-none mt-0.5 font-semibold">
                  {currentUser?.role || 'user'}
                </span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center font-bold text-xs text-slate-950 shadow-sm border border-slate-800 shrink-0">
                {currentUser?.username?.substring(0, 2).toUpperCase() || 'GU'}
              </div>
            </div>

          </div>

        </header>

        {/* Global Warning banner when stress loops are calculated */}
        {simulationActive && (
          <div className="bg-rose-500/10 border-b border-rose-500/20 px-6 py-2 text-center text-xs text-rose-400 font-mono flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
            ACTIVE CONTAINER BENCHMARK STRESS TEST LOAD RUNNING. CPU LOAD GAUGE HAS FLUCTUATED.
          </div>
        )}

        <main id="dashboard-content" className="p-4 md:p-8 max-w-7xl w-full mx-auto space-y-8 flex-grow">

          {/* ==================================== WEB SSH TERMINAL TAB ==================================== */}
          {currentTab === 'ssh-term' && (
            <SshTerminalPage
              currentUser={currentUser}
              addCustomNotification={addCustomNotification}
              onBack={() => setCurrentTab('overview')}
            />
          )}

          {/* ==================================== CONSOLIDATED SERVER MANAGEMENT TAB ==================================== */}
          {currentTab === 'server' && (
            <ServerManagementPage
              stats={stats}
              processes={processes}
              killProcess={(pid) => killProcessByPid(pid, '')}
              terminalLogs={terminalLogs}
              terminalInput={terminalInput}
              setTerminalInput={setTerminalInput}
              onTerminalSubmit={executeTerminalCommand}
              simulationActive={simulationActive}
              toggleSimulation={togglePeakClusterStrain}
              addCustomNotification={addCustomNotification}
              onBack={() => setCurrentTab('overview')}
            />
          )}

          {/* ==================================== CONSOLIDATED HOSTING MANAGEMENT TAB ==================================== */}
          {currentTab === 'hosting' && (
            <HostingManagementPage
              servers={servers}
              serverName={serverName}
              setServerName={setServerName}
              serverType={serverType}
              setServerType={setServerType}
              serverEntryPoint={serverEntryPoint}
              setServerEntryPoint={setServerEntryPoint}
              isCreatingServer={isCreatingServer}
              setIsCreatingServer={setIsCreatingServer}
              handleCreateServer={executeServerCreation}
              handleStartServer={(id) => handleStartServer(id, '')}
              handleStopServer={(id) => handleStopServer(id, '')}
              handleDeleteServer={(id) => handleDeleteServer(id, '')}
              
              fileList={fileList}
              fileExplorerCwd={fileExplorerCwd}
              setFileExplorerCwd={setFileExplorerCwd}
              fetchDirectoryFiles={fetchDirectoryFiles}
              selectedFile={selectedFile}
              setSelectedFile={setSelectedFile}
              isEditingFile={isEditingFile}
              setIsEditingFile={setIsEditingFile}
              editedFileContent={editedFileContent}
              setEditedFileContent={setEditedFileContent}
              saveEditedFile={saveEditedFile}
              deleteFileSystemItem={deleteFileOrFolder}
              createFileSystemFolder={async (parent, name) => {
                const fullPath = `${parent}/${name}`;
                try {
                  const response = await fetch('/api/files/create-folder', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ folderPath: fullPath })
                  });
                  if (response.ok) {
                    addCustomNotification(`Created directory "${name}"`);
                    fetchDirectoryFiles(parent);
                  } else {
                    const err = await response.json();
                    alert(`Failed to create folder: ${err.error}`);
                  }
                } catch (e: any) {
                  alert(`Folder creation error: ${e.message}`);
                }
              }}
              createFileSystemFile={async (parent, name) => {
                const fullPath = `${parent}/${name}`;
                try {
                  const response = await fetch('/api/files/write', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ filePath: fullPath, content: '' })
                  });
                  if (response.ok) {
                    addCustomNotification(`Created file "${name}"`);
                    fetchDirectoryFiles(parent);
                  } else {
                    const err = await response.json();
                    alert(`Failed to create file: ${err.error}`);
                  }
                } catch (e: any) {
                  alert(`File creation error: ${e.message}`);
                }
              }}
              
              npmInfo={npmInfo}
              npmSearchQuery={npmSearchQuery}
              setNpmSearchQuery={setNpmSearchQuery}
              npmInstallLogs={npmInstallLogs}
              runNpmInstallation={runNpmInstallation}
              isInstallingPkg={isInstallingPkg}
              
              addCustomNotification={addCustomNotification}
              onBack={() => setCurrentTab('overview')}
            />
          )}

          {/* ==================================== SUPPORT TICKETS TAB ==================================== */}
          {currentTab === 'tickets' && (
            <TicketSupportPage
              currentUser={currentUser}
              addCustomNotification={addCustomNotification}
              onBack={() => setCurrentTab('overview')}
            />
          )}

          {/* ==================================== BILLING / PAYMENTS TAB ==================================== */}
          {currentTab === 'billing' && (
            <BillingPage
              currentUser={currentUser}
              addCustomNotification={addCustomNotification}
              onBack={() => setCurrentTab('overview')}
            />
          )}

          {/* ==================================== SYSTEM SETTINGS TAB ==================================== */}
          {currentTab === 'settings' && (
            <SystemSettingsPage
              currentUser={currentUser}
              serverState={serverState}
              setServerState={setServerState}
              addCustomNotification={addCustomNotification}
              onBack={() => setCurrentTab('overview')}
            />
          )}

          {/* ==================================== ACCOUNT PROFILE TAB ==================================== */}
          {currentTab === 'profile' && (
            <AccountProfilePage
              currentUser={currentUser}
              updateCurrentUser={(user) => {
                setCurrentUser(user);
                localStorage.setItem('ayezz_user', JSON.stringify(user));
              }}
              addCustomNotification={addCustomNotification}
              onBack={() => setCurrentTab('overview')}
            />
          )}

          {/* ==================================== OVERVIEW TAB ==================================== */}
          {currentTab === 'overview' && (
            <div id="overview-layout-container" className="space-y-8">
              
              {/* Stat Cards Dials */}
              <div id="stat-cards-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* 1. PROCESSOR CARD */}
                <div id="cpu-stat-card" className="glassmorphism rounded-2xl p-5 shadow-[0_4px_30px_rgba(0,0,0,0.5)] relative overflow-hidden group hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(0,242,254,0.15)] transition-all duration-300">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-300">
                    <Cpu className="w-24 h-24 text-cyan-400" />
                  </div>
                  
                  <div className="flex items-center justify-between pb-3 border-b border-[#1e295d]/20">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-cyan-900/15 rounded-xl border border-cyan-500/20 text-[#00f2fe] shadow-[0_0_10px_rgba(0,242,254,0.2)]">
                        <Cpu className={`w-5 h-5 ${simulationActive ? 'animate-spin' : 'animate-pulse'}`} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-100">Processor (vCPU)</h3>
                        <p className="text-[10px] text-slate-400 font-mono tracking-wider">LIVE HOST CORE LOAD</p>
                      </div>
                    </div>
                    
                    <span className="text-xs font-mono text-[#00f2fe] font-bold bg-cyan-950 px-2.5 py-0.5 rounded-md border border-cyan-400/30">
                      {stats.cpu}%
                    </span>
                  </div>

                  <div className="py-4 flex flex-row items-center gap-6">
                    {/* Visual Animated Progressive Spinner with neon drop shadow */}
                    <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                      <svg className="w-24 h-24 transform -rotate-90 drop-shadow-[0_0_8px_rgba(0,242,254,0.5)]">
                        <circle
                          cx="48"
                          cy="48"
                          r="38"
                          className="stroke-slate-900"
                          strokeWidth="7"
                          fill="transparent"
                        />
                        <circle
                          cx="48"
                          cy="48"
                          r="38"
                          className="stroke-[#00f2fe] transition-all duration-500"
                          strokeWidth="7"
                          fill="transparent"
                          strokeDasharray="238.8"
                          strokeDashoffset={238.8 - (stats.cpu / 100) * 238.8}
                          strokeLinecap="round"
                        />
                      </svg>
                      {/* Inner text metric label */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
                        <span className="text-lg font-black font-mono tracking-tighter text-white leading-none">
                          {stats.cpu}%
                        </span>
                        <span className="text-[8px] font-mono uppercase text-[#00f2fe] font-bold tracking-wider leading-none mt-1">
                          load
                        </span>
                      </div>
                    </div>

                    {/* Meta stats and history line */}
                    <div id="cpu-stats-details" className="flex-grow space-y-2.5 w-full">
                      <div className="flex flex-col text-xs">
                        <span className="text-slate-400">Clock speed:</span>
                        <span className="text-sm font-mono font-bold text-[#00f2fe] mt-0.5">~3.40 GHz Active</span>
                      </div>

                      {/* Sparkline column block */}
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[8.5px] font-mono text-slate-500 uppercase tracking-wider">Dynamic Threads</span>
                          <span className="text-[8px] font-mono text-[#00f2fe]">{simulationActive ? '8 Core Stress' : '8 Cores Stable'}</span>
                        </div>
                        <div className="h-6 flex items-end gap-1 pt-0.5">
                          {cpuHistory.map((val, idx) => (
                            <div 
                              key={idx}
                              className="flex-1 rounded-sm bg-cyan-500/35 transition-all duration-500 hover:bg-[#00f2fe]"
                              style={{ height: `${Math.max(8, val)}%` }}
                              title={`Load: ${val}%`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3.5 border-t border-[#1e295d]/20 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <div className="flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-rose-500" />
                      <span>{Math.max(...cpuHistory)}% PEAK CORE LOAD</span>
                    </div>
                    <span>{stats.arch}</span>
                  </div>
                </div>

                {/* 2. MEMORY RAM CARD */}
                <div id="ram-stat-card" className="glassmorphism rounded-2xl p-5 shadow-[0_4px_30px_rgba(0,0,0,0.5)] relative overflow-hidden group hover:border-[#00f2fe]/50 hover:shadow-[0_0_20px_rgba(0,242,254,0.15)] transition-all duration-300">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-305">
                    <Activity className="w-24 h-24 text-cyan-400" />
                  </div>
                  
                  <div className="flex items-center justify-between pb-3 border-b border-[#1e295d]/20">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-900/15 rounded-xl border border-indigo-500/20 text-[#00f2fe] shadow-[0_0_10px_rgba(0,242,254,0.2)]">
                        <Activity className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-100">Memory (RAM)</h3>
                        <p className="text-[10px] text-slate-400 font-mono tracking-wider">CONTAINER BUFFER LIMIT</p>
                      </div>
                    </div>
                    
                    <span className="text-xs font-mono text-cyan-400 font-bold bg-cyan-950 px-2.5 py-0.5 rounded-md border border-cyan-400/30">
                      {stats.ram}%
                    </span>
                  </div>

                  <div className="py-4 flex flex-col sm:flex-row items-center gap-6">
                    {/* Visual Progress Dial */}
                    <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                      <svg className="w-24 h-24 transform -rotate-90 drop-shadow-[0_0_8px_rgba(59,130,246,0.4)]">
                        <circle
                          cx="48"
                          cy="48"
                          r="38"
                          className="stroke-slate-900"
                          strokeWidth="7"
                          fill="transparent"
                        />
                        <circle
                          cx="48"
                          cy="48"
                          r="38"
                          className="stroke-cyan-500 transition-all duration-500"
                          strokeWidth="7"
                          fill="transparent"
                          strokeDasharray="238.8"
                          strokeDashoffset={238.8 - (stats.ram / 100) * 238.8}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
                        <span className="text-lg font-black font-mono tracking-tighter text-white leading-none">
                          {stats.ram}%
                        </span>
                        <span className="text-[8px] font-mono uppercase text-[#00f2fe] font-bold tracking-wider leading-none mt-1">
                          used
                        </span>
                      </div>
                    </div>

                    {/* Meta stats and history line */}
                    <div id="ram-stats-details" className="flex-grow space-y-2.5 w-full">
                      <div className="flex flex-col text-xs">
                        <span className="text-slate-400">Allocated RAM:</span>
                        <span className="text-sm font-mono font-bold text-slate-200 mt-0.5">
                          {stats.memoryUsedGB} GB / {stats.memoryTotalGB} GB 
                        </span>
                      </div>

                      {/* Sparkline column block */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[8.5px] font-mono text-slate-500 uppercase tracking-wider">Storage Buffers Line</span>
                        <div className="h-6 flex items-end gap-1 pt-0.5">
                          {ramHistory.map((val, idx) => (
                            <div 
                              key={idx}
                              className="flex-1 rounded-sm bg-blue-500/35 transition-all duration-500 hover:bg-cyan-400"
                              style={{ height: `${Math.max(10, val)}%` }}
                              title={`Memory: ${val}%`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3.5 border-t border-[#1e295d]/20 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <div className="flex items-center gap-1.5">
                      <Network className="w-3.5 h-3.5 text-cyan-400" />
                      <span>PLATFORM: {stats.platform}</span>
                    </div>
                    <span>Stable Mem</span>
                  </div>
                </div>

                {/* 3. DISK STORAGE CARD */}
                <div id="disk-stat-card" className="glassmorphism rounded-2xl p-5 shadow-[0_4px_30px_rgba(0,0,0,0.5)] relative overflow-hidden group hover:border-[#00f2fe]/50 hover:shadow-[0_0_20px_rgba(0,242,254,0.15)] transition-all duration-300">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-310">
                    <HardDrive className="w-24 h-24 text-cyan-400" />
                  </div>
                  
                  <div className="flex items-center justify-between pb-3 border-b border-[#1e295d]/20">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-950/20 rounded-xl border border-emerald-500/20 text-[#00f2fe] shadow-[0_0_10px_rgba(0,242,254,0.2)]">
                        <HardDrive className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-100">Disk Storage</h3>
                        <p className="text-[10px] text-slate-400 font-mono tracking-wider">ROOT SSD PARITIONS</p>
                      </div>
                    </div>
                    
                    <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950 px-2.5 py-0.5 rounded-md border border-emerald-400/30">
                      {stats.disk}%
                    </span>
                  </div>

                  <div className="py-4 flex flex-col sm:flex-row items-center gap-6">
                    {/* Visual Progress Dial */}
                    <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                      <svg className="w-24 h-24 transform -rotate-90 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]">
                        <circle
                          cx="48"
                          cy="48"
                          r="38"
                          className="stroke-slate-900"
                          strokeWidth="7"
                          fill="transparent"
                        />
                        <circle
                          cx="48"
                          cy="48"
                          r="38"
                          className="stroke-emerald-500 transition-all duration-500"
                          strokeWidth="7"
                          fill="transparent"
                          strokeDasharray="238.8"
                          strokeDashoffset={238.8 - (stats.disk / 100) * 238.8}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
                        <span className="text-lg font-black font-mono tracking-tighter text-white leading-none">
                          {stats.disk}%
                        </span>
                        <span className="text-[8px] font-mono uppercase text-emerald-400 font-bold tracking-wider leading-none mt-1">
                          space
                        </span>
                      </div>
                    </div>

                    {/* Meta stats and check system */}
                    <div id="disk-stats-details" className="flex-grow space-y-2.5 w-full">
                      <div className="flex flex-col text-xs">
                        <span className="text-slate-400">Disk Capacity:</span>
                        <span className="text-sm font-mono font-bold text-slate-200 mt-0.5">
                          {stats.diskUsedGB} GB / {stats.diskTotalGB} GB 
                        </span>
                      </div>

                      {/* HDD check button */}
                      <div className="bg-[#0a1020]/95 p-2 rounded-xl border border-[#1e295d]/35 flex items-center justify-between">
                        <div>
                          <span className="text-[8.5px] text-emerald-400 block font-semibold uppercase font-mono leading-none">FS STATE</span>
                          <span className="text-[8px] text-slate-500 block leading-tight mt-0.5">df mountings</span>
                        </div>
                        <button
                          onClick={() => {
                            setCurrentTab('terminal');
                            setTerminalLogs(prev => [...prev, 'guest@ayezz-panel:~# df -h', 'Filesystem      Size  Used Avail Use% Mounted on', '/dev/root        50G   36G   14G  72% /', 'Parsed system storage structures successfully.']);
                          }}
                          className="px-2.5 py-1 text-[8.5px] font-bold font-mono text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-md transition-colors cursor-pointer"
                        >
                          df -h
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3.5 border-t border-[#1e295d]/20 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                      <span>SYS VOLUME: ENCRYPTED EXT4</span>
                    </div>
                    <span>EXT4 mount</span>
                  </div>
                </div>

                {/* 4. NETWORK MONITOR CARD */}
                <div id="network-stat-card" className="glassmorphism rounded-2xl p-5 shadow-[0_4px_30px_rgba(0,0,0,0.5)] relative overflow-hidden group hover:border-[#00f2fe]/50 hover:shadow-[0_0_20px_rgba(0,242,254,0.15)] transition-all duration-305">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-300">
                    <Network className="w-24 h-24 text-cyan-400" />
                  </div>
                  
                  <div className="flex items-center justify-between pb-3 border-b border-[#1e295d]/20">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-900/15 rounded-xl border border-blue-500/20 text-[#00f2fe] shadow-[0_0_10px_rgba(0,242,254,0.2)]">
                        <Network className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-100">Network Telemetry</h3>
                        <p className="text-[10px] text-slate-400 font-mono tracking-wider">SOCKET PIPES FLOW</p>
                      </div>
                    </div>
                    
                    <span className="text-xs font-mono text-[#00f2fe] font-bold bg-[#0a1020]/80 px-2.5 py-0.5 rounded-md border border-[#00f2fe]/20">
                      100 Gbps
                    </span>
                  </div>

                  <div className="py-4 space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-[#0a1020]/60 p-2 border border-[#1e295d]/20 rounded-xl text-center">
                        <span className="text-[9px] text-slate-500 font-mono block font-bold leading-none mb-1">DOWNLOAD</span>
                        <span className="text-xs font-bold font-mono text-cyan-400">12.8 MB/s</span>
                      </div>
                      <div className="bg-[#0a1020]/60 p-2 border border-[#1e295d]/20 rounded-xl text-center">
                        <span className="text-[9px] text-slate-500 font-mono block font-bold leading-none mb-1">UPLOAD</span>
                        <span className="text-xs font-bold font-mono text-indigo-400">4.1 MB/s</span>
                      </div>
                      <div className="bg-[#0a1020]/60 p-2 border border-[#1e295d]/20 rounded-xl text-center">
                        <span className="text-[9px] text-slate-500 font-mono block font-bold leading-none mb-1">LATENCY</span>
                        <span className="text-xs font-bold font-mono text-emerald-400">14 ms</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 pt-1">
                      <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono">
                        <span>DATA DISPATCH RATE:</span>
                        <span className="text-slate-350">Optimal latency</span>
                      </div>
                      {/* Dynamic simulation curves background bar */}
                      <div className="h-6 w-full bg-[#0a1020]/90 rounded-md overflow-hidden p-1 flex items-end gap-[2px] border border-[#1e295d]/10">
                        {realtimeCpuHist.slice(-15).map((val, i) => (
                          <div 
                            key={i} 
                            style={{ height: `${Math.max(10, val * 0.8)}%` }} 
                            className="flex-1 bg-gradient-to-t from-blue-700 to-cyan-400 rounded-sm"
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3.5 border-t border-[#1e295d]/20 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <div className="flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                      <span>ICMP & SOCKET ROUTINGS: PASS</span>
                    </div>
                  </div>
                </div>

                {/* 5. SERVER STATE CARD */}
                <div id="state-stat-card" className="glassmorphism rounded-2xl p-5 shadow-[0_4px_30px_rgba(0,0,0,0.5)] relative overflow-hidden group hover:border-[#00f2fe]/50 hover:shadow-[0_0_20px_rgba(0,242,254,0.15)] transition-all duration-305">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-300">
                    <Sliders className="w-24 h-24 text-cyan-400" />
                  </div>
                  
                  <div className="flex items-center justify-between pb-3 border-b border-[#1e295d]/20">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-900/15 rounded-xl border border-indigo-500/20 text-[#00f2fe] shadow-[0_0_10px_rgba(0,242,254,0.2)]">
                        <Sliders className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-100">Container State</h3>
                        <p className="text-[10px] text-slate-400 font-mono tracking-wider">CONTAINER LIFECYCLE MONITOR</p>
                      </div>
                    </div>
                  </div>

                  <div className="py-4 space-y-3 w-full">
                    <div className="flex items-center gap-3 bg-[#0a1020]/75 p-3 rounded-2xl border border-[#1e295d]/35 shadow-inner">
                      <div className="relative flex h-3 w-3 select-none">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                      </div>
                      <div>
                        <span className="text-xs block font-bold text-slate-250 leading-none">ONLINE ACTIVE</span>
                        <span className="text-[9px] text-[#00f2fe] block font-mono mt-1">Docker host up & running</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="text-xs">
                        <span className="text-slate-500 block text-[9.5px] font-mono font-bold leading-none uppercase">UPTIME CLOCK:</span>
                        <span className="font-bold text-slate-300 font-mono block mt-1">{formatUptime(stats.uptime)}</span>
                      </div>
                      <div className="text-xs">
                        <span className="text-slate-500 block text-[9.5px] font-mono font-bold leading-none uppercase">CORE RESTARTS:</span>
                        <span className="font-bold text-slate-300 font-mono block mt-1">0 Faults</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3.5 border-t border-[#1e295d]/20 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>NO DOCKER REBOOTS EXPECTED</span>
                    </div>
                  </div>
                </div>

                {/* 6. CYBER SECURITY STATUS */}
                <div id="security-stat-card" className="glassmorphism rounded-2xl p-5 shadow-[0_4px_30px_rgba(0,0,0,0.5)] relative overflow-hidden group hover:border-[#00f2fe]/50 hover:shadow-[0_0_20px_rgba(0,242,254,0.15)] transition-all duration-305">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-300">
                    <ShieldCheck className="w-24 h-24 text-[#00f2fe]" />
                  </div>
                  
                  <div className="flex items-center justify-between pb-3 border-b border-[#1e295d]/20">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-cyan-900/15 rounded-xl border border-cyan-500/20 text-[#00f2fe] shadow-[0_0_10px_rgba(0,242,254,0.2)]">
                        <ShieldCheck className="w-5 h-5 text-emerald-400 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-100">Cyber Security</h3>
                        <p className="text-[10px] text-slate-400 font-mono tracking-wider">FIREWALL SECURED RATINGS</p>
                      </div>
                    </div>
                    
                    <span className="text-xs font-mono text-emerald-400 font-bold bg-[#031d10]/60 px-2.5 py-0.5 rounded-md border border-emerald-500/30">
                      SECURED
                    </span>
                  </div>

                  <div className="py-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">Health Configuration Score:</span>
                      <span className="text-xs font-black font-mono text-[#00f2fe]">98%</span>
                    </div>
                    {/* Health meter bar */}
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full shadow-[0_0_6px_rgba(16,185,129,0.5)]" style={{ width: '98%' }}></div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 text-[10.5px]">
                      <div className="flex items-center gap-1.5 text-[#00f2fe]">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        <span className="font-mono">FIREWALL: ACTIVE</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#00f2fe]">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        <span className="font-mono">SSL: VALID</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3.5 border-t border-[#1e295d]/20 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#00f2fe]" />
                      <span>LAST AUDITED: SECONDS AGO</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Cluster Core Summary */}
              <div id="quickops-banner" className="bg-slate-900/10 border border-slate-900 rounded-2xl p-6 relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-6">
                <div className="space-y-1.5 text-center lg:text-left">
                  <div className="flex items-center justify-center lg:justify-start gap-2 text-indigo-400 text-xs font-mono">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 animate-pulse" />
                    <span>SECURE SANDBOX ENVIRONMENT LIVE PORT BINDINGS ACTIVE</span>
                  </div>
                  <h2 className="text-base font-bold text-slate-100 tracking-tight">Genuine Operating System Integration</h2>
                  <p className="text-slate-400 text-xs leading-normal">
                    You are connected to a live sandbox environment! Inspect real directories, query operating system settings using the terminal, list CPU tasks directly via the process tables, or simulate primals benchmarking safely.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <button
                    onClick={togglePeakClusterStrain}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Flame className="w-4 h-4 text-orange-300 animate-bounce" />
                    {simulationActive ? 'Disable Benchmark Burner' : 'Benchmark Prime Calculations'}
                  </button>
                  
                  <button
                    onClick={fetchStats}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-350 rounded-xl text-xs font-semibold border border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    Force Refresh
                  </button>
                </div>
              </div>

              {/* Micro-tables Split View */}
              <div id="data-terminal-split-view" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Micro table for processes */}
                <div className="lg:col-span-7 bg-slate-900/20 border border-slate-900 rounded-2xl p-5 md:p-6 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-900">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                        <Server className="w-4 h-4 text-indigo-400" />
                        Top Active Host Processes
                      </h3>
                      <p className="text-[10px] text-slate-500">Real process table extracted directly using ps command API</p>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                      Instances: {processes.length} total
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-[10px] font-mono tracking-widest uppercase border-b border-slate-900 text-slate-500 pb-2">
                          <th className="py-2 font-normal">Command Name</th>
                          <th className="py-2 font-normal">PID</th>
                          <th className="py-2 font-normal">CPU %</th>
                          <th className="py-2 font-normal">Mem Block</th>
                          <th className="py-2 font-normal text-right">Interrupt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900/40">
                        {processes.slice(0, 6).map(process => (
                          <tr key={process.id} className="text-slate-300 hover:bg-slate-900/10 group">
                            <td className="py-2">
                              <span className="font-semibold text-slate-200 block truncate max-w-[200px]" title={process.name}>
                                {process.name}
                              </span>
                            </td>
                            <td className="py-2 font-mono text-[10px] text-slate-500">{process.pid}</td>
                            <td className="py-2 font-mono text-xs text-indigo-400">{process.cpu}%</td>
                            <td className="py-2 font-mono text-xs text-slate-400">{process.memory}</td>
                            <td className="py-2 text-right">
                              <button
                                onClick={() => killProcessByPid(process.pid, process.name)}
                                title="SIGKILL Process"
                                className="p-1 text-rose-400 hover:bg-rose-500/20 rounded border border-rose-500/20 cursor-pointer text-[10px] font-mono"
                              >
                                Kill
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="pt-2 text-center border-t border-slate-900">
                    <button
                      onClick={() => setCurrentTab('processes')}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1.5 mx-auto cursor-pointer"
                    >
                      Inspect all active system process threads
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Small terminal viewport section inside overview dashboard */}
                <div className="lg:col-span-5 bg-slate-950 border border-slate-900 rounded-2xl overflow-hidden flex flex-col max-h-[350px]">
                  <div className="bg-slate-900/80 px-4.5 py-3 border-b border-slate-900 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TerminalIcon className="w-4 h-4 text-emerald-500 animate-pulse" />
                      <span className="text-xs font-mono text-slate-300 font-semibold uppercase tracking-wider">Quick Shell TTY</span>
                    </div>
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-950 font-mono text-[11px] text-slate-300 overflow-y-auto flex-grow space-y-2 max-h-[220px]">
                    <div className="text-slate-500"># Direct commands available: try "ls", "free", "df"</div>
                    {terminalLogs.slice(-6).map((log, index) => (
                      <div key={index} className="whitespace-pre-wrap leading-tight font-mono tracking-tight text-slate-350">
                        {log}
                      </div>
                    ))}
                  </div>

                  <form onSubmit={executeTerminalCommand} className="border-t border-slate-900 bg-slate-900 px-4 py-2 flex items-center gap-2">
                    <span className="text-xs text-emerald-400 font-mono">$</span>
                    <input
                      type="text"
                      className="flex-grow bg-transparent text-xs font-mono text-white focus:outline-none border-none placeholder-slate-600"
                      placeholder="Type client command... (type help)"
                      value={terminalInput}
                      onChange={(e) => setTerminalInput(e.target.value)}
                    />
                    <button type="submit" className="text-[10px] font-mono text-slate-400 hover:text-white uppercase transition-colors">Submit</button>
                  </form>
                </div>

              </div>

            </div>
          )}

          {/* ==================================== PROCESSES TAB ==================================== */}
          {currentTab === 'processes' && (
            <div id="processes-container" className="space-y-6">
              <div className="glassmorphism rounded-2xl p-6 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-900">
                  <div>
                    <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                      <Server className="w-5 h-5 text-indigo-400" />
                      Live Container System Tasks Table
                    </h2>
                    <p className="text-xs text-slate-400">
                      Lists active memory space and central processing tasks scheduled inside the environment kernel.
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={fetchProcesses}
                      className="px-3.5 py-2 bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-300 text-xs font-mono rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCw className="w-3.5 h-3.5 animate-spin-slow" />
                      Refresh List
                    </button>
                    <span className="text-xs font-mono text-emerald-400 border border-emerald-950 px-3 py-1.5 bg-emerald-950/15 rounded-xl">
                      Processes running: {processes.length}
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-[10px] font-mono tracking-widest uppercase border-b border-slate-900 text-slate-500 pb-3">
                        <th className="py-3">PID</th>
                        <th className="py-3">Task Executable binary</th>
                        <th className="py-3 text-indigo-400">vCPU Allocation</th>
                        <th className="py-3 text-cyan-400">Memory Load</th>
                        <th className="py-3">Core Status</th>
                        <th className="py-3 text-right">Intervention</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900/30">
                      {processes.map((p) => (
                        <tr key={p.id} className="text-slate-300 hover:bg-slate-900/10 transition-colors">
                          <td className="py-3 font-mono text-slate-400 font-semibold">{p.pid}</td>
                          <td className="py-3 font-mono">
                            <span className="text-slate-200 block truncate max-w-sm" title={p.name}>
                              {p.name}
                            </span>
                          </td>
                          <td className="py-3 font-mono text-indigo-400 font-bold">{p.cpu}%</td>
                          <td className="py-3 font-mono text-cyan-400">{p.memory}</td>
                          <td className="py-3">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono capitalize bg-emerald-500/10 text-emerald-400 border border-emerald-950">
                              Active run
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => killProcessByPid(p.pid, p.name)}
                              className="px-3 py-1 bg-rose-950/20 text-rose-400 border border-rose-900/40 rounded-lg text-xs hover:bg-rose-900/25 transition-colors cursor-pointer font-mono"
                            >
                              SIGKILL
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
            </div>
          )}

          {/* ==================================== TERMINAL TAB ==================================== */}
          {currentTab === 'terminal' && (
            <div id="tty-shell-tab-container" className="space-y-6 select-none bg-gradient-to-br from-[#020512] via-[#050816] to-[#0a1020] p-1 rounded-2xl border border-[#1e295d]/35">
              <div className="glassmorphism rounded-2xl overflow-hidden flex flex-col lg:flex-row h-[650px] shadow-[0_10px_50px_rgba(0,0,0,0.6)] relative">
                
                {/* Left Mini Panel: Command Memory History */}
                <div className="w-full lg:w-60 bg-slate-950/80 border-r border-[#1e295d]/30 flex flex-col p-4 shrink-0 font-mono">
                  <div className="flex items-center gap-2 pb-3 border-b border-[#1e295d]/20 mb-3">
                    <Command className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-slate-300 tracking-wider">COMMAND HISTORY</span>
                  </div>
                  
                  <p className="text-[10px] text-slate-500 mb-3 leading-snug">
                    Memory stack of previous entries. Click on any command bubble to copy back into your active prompt terminal.
                  </p>

                  <div className="flex-grow overflow-y-auto space-y-1.5 pr-1 scrollbar-none max-h-[160px] lg:max-h-none">
                    {terminalHistory.length === 0 ? (
                      <span className="text-[10px] text-slate-600 block italic">Empty queue...</span>
                    ) : (
                      terminalHistory.map((cmd, idx) => (
                        <button
                          key={idx}
                          onClick={() => setTerminalInput(cmd)}
                          className="w-full text-left p-2.5 bg-[#0a1020]/75 border border-[#1e295d]/20 hover:border-cyan-400/50 hover:bg-slate-950 rounded-xl text-[11px] text-slate-300 font-semibold transition-all truncate hover:shadow-[0_0_8px_rgba(0,242,254,0.1)] block cursor-pointer group"
                        >
                          <span className="text-[9px] text-indigo-400 font-bold block mb-0.5">#{terminalHistory.length - idx} Entry</span>
                          <span className="font-mono text-slate-200 group-hover:text-cyan-400 transition-colors">{cmd}</span>
                        </button>
                      ))
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#1e295d]/20 mt-3 flex items-center justify-between text-[10px] text-slate-500">
                    <span>Stored states: {terminalHistory.length}</span>
                    <button 
                      onClick={() => setTerminalHistory(['ls -la', 'uname -a', 'cat package.json', 'df -h', 'free -m'])}
                      className="text-indigo-400 hover:text-cyan-400 transition-colors uppercase font-bold"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {/* Right Area: Large VS Code Terminal Screen */}
                <div className="flex-grow flex flex-col h-full bg-slate-950/40 relative overflow-hidden">
                  
                  {/* Styled VS Code Tab Header */}
                  <div className="bg-[#030611] px-4 py-3 border-b border-[#1e295d]/35 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-inner">
                    <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
                      <div className="flex items-center gap-1 bg-[#0c142e] border-t-2 border-cyan-400 border-x border-[#1e295d]/40 px-3 py-1.5 text-xs font-mono text-white rounded-t-md font-semibold shrink-0 select-none">
                        <TerminalIcon className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                        <span>bash (sh)</span>
                      </div>
                      <div className="flex items-center gap-1 px-3 py-1.5 text-xs font-mono text-slate-500 hover:text-slate-300 transition-all rounded-t-md cursor-pointer shrink-0 select-none">
                        <span>node.js</span>
                      </div>
                      <div className="flex items-center gap-1 px-3 py-1.5 text-xs font-mono text-slate-500 hover:text-slate-300 transition-all rounded-t-md cursor-pointer shrink-0 select-none">
                        <span>powershell</span>
                      </div>
                    </div>
                    
                    {/* Modern Toolbar widgets for Search and File Controls */}
                    <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 font-mono">
                      {/* Search Bar */}
                      <div className="relative w-full sm:w-44 focus-within:w-56 transition-all duration-300">
                        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={terminalSearchQuery}
                          onChange={(e) => setTerminalSearchQuery(e.target.value)}
                          placeholder="Search lines..."
                          className="w-full bg-slate-950/80 border border-[#1e295d]/30 hover:border-[#1e295d]/65 text-[11px] font-semibold text-slate-300 pl-8 pr-3 py-1 rounded-lg focus:outline-none focus:border-cyan-400 placeholder-slate-600 transition-all"
                        />
                      </div>

                      {/* Clear Logs */}
                      <button
                        onClick={() => setTerminalLogs([])}
                        title="Flush Logs Content"
                        className="p-1 px-2.5 bg-[#0a1020] hover:bg-slate-900 border border-[#1e295d]/30 hover:border-cyan-400/40 text-slate-400 hover:text-cyan-400 rounded-lg text-[10px] font-bold transition-all cursor-pointer shrink-0"
                      >
                        Clear
                      </button>

                      {/* Download Logs */}
                      <button
                        onClick={() => {
                          const fileData = terminalLogs.join('\n');
                          const blob = new Blob([fileData], { type: 'text/plain' });
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.download = 'ayezz_terminal_log.log';
                          link.href = url;
                          link.click();
                          URL.revokeObjectURL(url);
                        }}
                        title="Download standard terminal text output"
                        className="p-1 px-2.5 bg-[#0a1020] hover:bg-slate-900 border border-[#1e295d]/30 hover:border-cyan-400/40 text-slate-400 hover:text-[#00f2fe] rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0"
                      >
                        <Download className="w-3 h-3" />
                        <span>Log</span>
                      </button>
                    </div>
                  </div>

                  {/* Terminal Outputs View with Dynamic Inline Syntax Highlighting */}
                  <div className="p-5 bg-slate-950/90 text-slate-300 overflow-y-auto flex-grow font-mono text-xs leading-relaxed space-y-1 select-text scrollbar-thin">
                    <div className="text-slate-500 text-[10px] pb-3 border-b border-[#1e295d]/10 mb-3 select-none leading-normal">
                      # AYEPBOT DEV SYSTEMS INTEGRATION KERNEL SHELL PORT ACTIVE [TTY #1]<br />
                      # BASH SYNTAX COLORING MODULE INJECTED. USE "help" TO VIEW DIAGNOSTICS.<br />
                      # CLOUD CONTAINERS CONNECTED TO SERVER NODE GUEST INTERFACE PORT 3000.
                    </div>
                    
                    {/* Filter terminalLogs by search term */}
                    {(terminalSearchQuery.trim()
                      ? terminalLogs.filter(log => log.toLowerCase().includes(terminalSearchQuery.toLowerCase()))
                      : terminalLogs
                    ).map((line, index) => {
                      // Custom inline bash syntax styling highlighting
                      if (line.includes('guest@ayezz-panel:')) {
                        const parts = line.split('#');
                        const prompt = parts[0] + '#';
                        const cmd = parts.slice(1).join('#').trim();
                        
                        // Parse command keywords
                        const cmdWords = cmd.split(' ');
                        const commandName = cmdWords[0];
                        const remaining = cmdWords.slice(1).join(' ');

                        return (
                          <div key={index} className="font-mono tracking-wide leading-relaxed py-0.5 border-l-2 border-cyan-400 pl-2 bg-[#091024]/45 rounded">
                            <span className="text-emerald-400 font-bold">{prompt}</span>{' '}
                            <span className="text-[#00f2fe] font-extrabold">{commandName}</span>{' '}
                            <span className="text-slate-300 font-semibold">{remaining}</span>
                          </div>
                        );
                      }

                      // Errors format
                      if (line.startsWith('[Error]') || line.startsWith('[Terminal error')) {
                        return (
                          <div key={index} className="font-mono text-rose-400 py-0.5 break-all">
                            {line}
                          </div>
                        );
                      }

                      return (
                        <div key={index} className="font-mono text-slate-300 whitespace-pre-wrap leading-tight py-0.5 break-word select-text">
                          {line}
                        </div>
                      );
                    })}
                    <div ref={terminalBottomRef} />
                  </div>

                  {/* Terminal Form prompt */}
                  <form 
                    onSubmit={executeTerminalCommand} 
                    className="border-t border-[#1e295d]/35 bg-[#030611] px-5 py-4 flex items-center gap-3 shadow-2xl relative z-10"
                  >
                    <div className="flex items-center gap-1 font-mono text-xs select-none shrink-0">
                      <span className="text-emerald-400 font-bold">system-admin::</span>
                      <span className="text-[#00f2fe] font-extrabold">{cwd ? cwd.split('/').pop() || '/' : '~'}</span>
                      <span className="text-indigo-400 font-extrabold">&gt;&gt;</span>
                    </div>
                    
                    <input
                      type="text"
                      className="flex-grow bg-transparent text-xs font-mono text-[#00f2fe] focus:outline-none border-none placeholder-slate-700 font-extrabold tracking-wide"
                      placeholder="Input bash terminal actions... (type 'help' or click history items)"
                      value={terminalInput}
                      onChange={(e) => setTerminalInput(e.target.value)}
                      autoFocus
                    />
                    
                    <button 
                      type="submit" 
                      className="px-4.5 py-2 bg-gradient-to-r from-blue-600 to-cyan-550 hover:from-blue-500 hover:to-cyan-400 text-white font-mono text-xs font-bold rounded-xl transition-all cursor-pointer shadow-[0_0_15px_rgba(0,242,254,0.35)] shrink-0 border border-cyan-400/30"
                    >
                      EXECUTE
                    </button>
                  </form>

                </div>
              </div>
            </div>
          )}

          {/* ==================================== DEPLOYMENT AND HARDWARE SYSTEMS TAB ==================================== */}
          {currentTab === 'system' && (
            <div id="system-architect-container" className="space-y-6 animate-fade-in text-slate-300">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Spec details card */}
                <div className="lg:col-span-7 glassmorphism rounded-2xl p-6 space-y-6">
                  <div className="border-b border-slate-900 pb-4">
                    <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                      <Info className="w-5 h-5 text-indigo-400" />
                      Hardware Node Core Parameters
                    </h2>
                    <p className="text-xs text-slate-400">Detailed specifications queried natively using OS module metrics.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-900 text-xs">
                      <span className="text-slate-500 font-mono block">Node Hostname</span>
                      <span className="text-slate-200 block font-semibold mt-1 font-mono">{stats.hostname}</span>
                    </div>

                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-900 text-xs">
                      <span className="text-slate-500 font-mono block">Operating System</span>
                      <span className="text-slate-200 block font-semibold mt-1 font-mono capitalize">{stats.platform} ({stats.release || 'Debian Kernel'})</span>
                    </div>

                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-900 text-xs">
                      <span className="text-slate-500 font-mono block">Core Architecture</span>
                      <span className="text-slate-200 block font-semibold mt-1 font-mono">{stats.arch} micro-instruction</span>
                    </div>

                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-900 text-xs">
                      <span className="text-slate-500 font-mono block">Uptime count</span>
                      <span className="text-slate-200 block font-semibold mt-1 font-mono">{formatUptime(stats.uptime)}</span>
                    </div>

                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-900 text-xs md:col-span-2">
                      <span className="text-slate-500 font-mono block">CPU Multi-Thread Load Averages</span>
                      <div className="flex gap-4 mt-2 font-mono text-sm font-semibold text-indigo-400">
                        <div>1 min: <span className="text-slate-200 font-medium">{(stats.loadAvg[0] || 0.1).toFixed(2)}</span></div>
                        <div>5 min: <span className="text-slate-200 font-medium">{(stats.loadAvg[1] || 0.15).toFixed(2)}</span></div>
                        <div>15 min: <span className="text-slate-200 font-medium">{(stats.loadAvg[2] || 0.12).toFixed(2)}</span></div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Micro operational checklists */}
                <div className="lg:col-span-5 glassmorphism rounded-2xl p-6 space-y-6">
                  <div className="border-b border-slate-900 pb-4">
                    <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      Sandbox Ecosystem Diagnostics
                    </h3>
                    <p className="text-[11px] text-slate-500">Live dependencies installed and fully functional.</p>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    
                    <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-900">
                      <div>
                        <span className="font-semibold text-slate-200 block">Express Framework Engine</span>
                        <span className="text-[9.5px] text-slate-500 font-mono block mt-0.5">PORT 3000 Pipeline API Gateway</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-mono px-2 py-0.5 bg-emerald-950/15 border border-emerald-950/40 rounded">active</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-900">
                      <div>
                        <span className="font-semibold text-slate-200 block">Vite Bundler Integrations</span>
                        <span className="text-[9.5px] text-slate-500 font-mono block mt-0.5">Compiled react-ts code streams</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-mono px-2 py-0.5 bg-emerald-950/15 border border-emerald-950/40 rounded">active</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-900">
                      <div>
                        <span className="font-semibold text-slate-200 block">Operating System Shell TTY</span>
                        <span className="text-[9.5px] text-slate-500 font-mono block mt-0.5">Exec child procedures dispatcher</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-mono px-2 py-0.5 bg-emerald-950/15 border border-emerald-950/40 rounded">authorized</span>
                    </div>

                  </div>
                </div>

              </div>
            </div>
          )}

           {/* ==================================== SYSTEM FILE EXPLORER AND EDITOR TAB ==================================== */}
          {currentTab === 'files' && (
            <div id="file-explorer-viewport" className="space-y-6 animate-fade-in text-slate-300">
              
              {/* File editor overlay for editing text content */}
              {isEditingFile && selectedFile && (
                <div className="bg-[#050816]/95 border border-cyan-400/50 rounded-2xl p-6 space-y-4 shadow-[0_10px_40px_rgba(0,242,254,0.15)] animate-fade-in relative z-30">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-[#1e295d]/35 pb-4">
                    <div>
                      <span className="text-[10px] uppercase font-mono tracking-widest text-[#00f2fe] font-black">ADMINISTRATIVE EDITOR</span>
                      <h3 className="text-sm font-bold text-white truncate font-mono mt-0.5">{selectedFile.path}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={saveEditedFile}
                        className="bg-gradient-to-r from-blue-650 to-cyan-550 hover:from-blue-600 hover:to-cyan-500 text-white px-4 py-2 rounded-xl text-xs font-mono font-bold cursor-pointer flex items-center gap-2 transition-all shadow-[0_4px_15px_rgba(0,242,254,0.25)] border border-cyan-400/30"
                      >
                        <Save className="w-3.5 h-3.5" />
                        Save Changes
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingFile(false);
                          setSelectedFile(null);
                        }}
                        className="bg-slate-900 hover:bg-slate-850 text-slate-300 px-4 py-2 rounded-xl text-xs font-mono font-bold border border-slate-800 cursor-pointer transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={editedFileContent}
                    onChange={(e) => setEditedFileContent(e.target.value)}
                    rows={18}
                    className="w-full bg-slate-950 border border-[#1e295d]/35 rounded-xl p-4 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400 leading-relaxed shadow-inner"
                    placeholder="File content text..."
                  />
                </div>
              )}

              {/* Primary Browser Panel */}
              <div className="glassmorphism rounded-2xl p-6 space-y-6 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
                
                {/* Directory Controls and Interactive Breadcrumbs */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b border-[#1e295d]/20 pb-4">
                  <div className="space-y-1.5 w-full xl:w-auto">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">CURRENT DIRECTORY BREADCRUMBS</span>
                    <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs text-slate-300 select-none">
                      <button 
                        onClick={() => {
                          setFileExplorerCwd('.');
                          fetchDirectoryFiles('.');
                        }}
                        className="text-[#00f2fe] hover:underline flex items-center gap-1 hover:text-white transition-colors"
                      >
                        <Folder className="w-3.5 h-3.5" />
                        <span>root</span>
                      </button>
                      
                      {(() => {
                        const segments = (fileExplorerCwd || '').split('/').filter(s => s && s !== '.');
                        let accumulatedPath = '.';
                        return segments.map((seg, sIdx) => {
                          accumulatedPath += `/${seg}`;
                          const currentPathToFetch = accumulatedPath;
                          return (
                            <React.Fragment key={sIdx}>
                              <span className="text-slate-600">/</span>
                              <button
                                onClick={() => {
                                  setFileExplorerCwd(currentPathToFetch);
                                  fetchDirectoryFiles(currentPathToFetch);
                                }}
                                className="text-indigo-400 hover:text-cyan-400 hover:underline transition-colors"
                              >
                                {seg}
                              </button>
                            </React.Fragment>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto xl:justify-end">
                    {/* View Type Toggle */}
                    <div className="bg-slate-950 p-1 rounded-xl border border-[#1e295d]/35 flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setFilesViewType('grid')}
                        className={`px-3 py-1 text-[10px] font-mono font-bold rounded-lg transition-all ${
                          filesViewType === 'grid'
                            ? 'bg-cyan-500/20 text-[#00f2fe]'
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        GRID
                      </button>
                      <button
                        onClick={() => setFilesViewType('list')}
                        className={`px-3 py-1 text-[10px] font-mono font-bold rounded-lg transition-all ${
                          filesViewType === 'list'
                            ? 'bg-cyan-500/20 text-[#00f2fe]'
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        LIST
                      </button>
                    </div>

                    {/* Navigation Up */}
                    <button
                      onClick={navigateFolderUp}
                      disabled={!fileExplorerCwd || fileExplorerCwd === '.' || fileExplorerCwd === '/'}
                      className="bg-slate-900 border border-slate-850 hover:border-slate-700 disabled:opacity-40 text-slate-350 px-3 py-1.5 rounded-xl text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      &larr; Up
                    </button>

                    {/* New File Trigger */}
                    <button
                      onClick={() => setShowFileModal('file')}
                      className="bg-slate-950 hover:bg-slate-900 border border-[#1e295d]/35 px-3.5 py-1.5 rounded-xl text-xs font-mono text-slate-200 transition-all flex items-center gap-1.5 cursor-pointer hover:border-cyan-400/40"
                    >
                      <Plus className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                      New File
                    </button>

                    {/* New Folder Trigger */}
                    <button
                      onClick={() => setShowFileModal('folder')}
                      className="bg-slate-950 hover:bg-slate-900 border border-[#1e295d]/35 px-3.5 py-1.5 rounded-xl text-xs font-mono text-slate-200 transition-all flex items-center gap-1.5 cursor-pointer hover:border-cyan-400/40"
                    >
                      <FolderPlus className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                      New Folder
                    </button>

                    {/* Upload button wrapper */}
                    <label className="bg-gradient-to-r from-blue-650 to-cyan-550 hover:from-blue-600 hover:to-cyan-500 text-white px-4 py-1.5 rounded-xl text-xs font-mono font-bold cursor-pointer flex items-center gap-2 transition-all shadow-[0_4px_15px_rgba(0,242,254,0.2)] border border-cyan-400/30 shrink-0">
                      <UploadIcon className="w-3.5 h-3.5" />
                      <span>Upload</span>
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Search File Query and Directory Meta statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                  <div className="relative md:col-span-2">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={filesSearchQuery}
                      onChange={(e) => setFilesSearchQuery(e.target.value)}
                      placeholder="Filter files by name in this directory view segment..."
                      className="w-full bg-slate-950/80 border border-[#1e295d]/35 text-xs text-slate-200 pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-cyan-400 placeholder-slate-600 font-mono"
                    />
                  </div>

                  {/* Meta stats display row */}
                  <div className="md:col-span-2 bg-[#0a1020]/40 border border-[#1e295d]/20 py-2.5 px-4 rounded-xl flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500">Directories: <span className="text-[#00f2fe] font-bold">{fileList.filter(f => f.isDirectory).length}</span></span>
                    <span className="text-slate-500">Files: <span className="text-[#00f2fe] font-bold">{fileList.filter(f => !f.isDirectory).length}</span></span>
                    <span className="text-slate-500">Size Aggregate: <span className="text-emerald-400 font-bold">
                      {(() => {
                        const totalBytes = fileList.reduce((acc, f) => acc + (f.size || 0), 0);
                        if (totalBytes === 0) return '0 B';
                        const k = 1024;
                        const sizes = ['B', 'KB', 'MB', 'GB'];
                        const i = Math.floor(Math.log(totalBytes) / Math.log(k));
                        return parseFloat((totalBytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
                      })()}
                    </span></span>
                  </div>
                </div>

                {/* Inline Creation Dialog Modal overlays */}
                {showFileModal && (
                  <form
                    onSubmit={showFileModal === 'file' ? handleCreateFile : handleCreateFolder}
                    className="bg-slate-950/90 border border-cyan-400/40 p-4 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center gap-3 animate-fade-in"
                  >
                    <div className="flex-grow">
                      <label className="text-[10px] text-cyan-400 font-mono uppercase block mb-1 font-bold">
                        Create New {showFileModal === 'file' ? 'File' : 'Directory Folder'}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={showFileModal === 'file' ? 'e.g. index.css' : 'e.g. assets'}
                        value={showFileModal === 'file' ? newFileName : newFolderName}
                        onChange={(e) => showFileModal === 'file' ? setNewFileName(e.target.value) : setNewFolderName(e.target.value)}
                        className="w-full bg-[#050816] border border-[#1e295d]/40 rounded-xl px-4.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div className="flex items-end gap-2 shrink-0">
                      <button
                        type="submit"
                        className="bg-gradient-to-r from-blue-650 to-cyan-550 text-white px-4 py-2 rounded-xl text-xs font-mono font-bold cursor-pointer border border-cyan-400/20"
                      >
                        Create
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowFileModal(null);
                          setNewFileName('');
                          setNewFolderName('');
                        }}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-350 px-3 py-1.5 rounded-lg text-xs"
                      >
                        Close
                      </button>
                    </div>
                  </form>
                )}

                {/* Files directory list/grid toggle */}
                {filesViewType === 'grid' ? (
                  /* ================= GRID VIEW ================= */
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {(() => {
                      const filteredList = filesSearchQuery.trim()
                        ? fileList.filter(f => f.name.toLowerCase().includes(filesSearchQuery.toLowerCase()))
                        : fileList;

                      if (filteredList.length === 0) {
                        return (
                          <div className="col-span-full py-16 text-center text-slate-500 font-mono tracking-wide">
                            No files or matching directory items found.
                          </div>
                        );
                      }

                      return filteredList.map((file) => {
                        const parts = file.name.split('.');
                        const extension = parts.length > 1 ? parts.pop()?.toUpperCase() : '';
                        const isZip = file.name.toLowerCase().endsWith('.zip');

                        return (
                          <div 
                            key={file.path} 
                            className="bg-[#0a1020]/50 border border-[#1e295d]/20 hover:border-cyan-400/40 rounded-2xl p-4 flex flex-col justify-between h-40 transition-all group hover:shadow-[0_4px_15px_rgba(0,242,254,0.1)] hover:-translate-y-0.5"
                          >
                            <div className="flex items-start justify-between">
                              {file.isDirectory ? (
                                <Folder 
                                  onClick={() => fetchDirectoryFiles(file.path)}
                                  className="w-8 h-8 text-indigo-400 group-hover:scale-105 transition-transform cursor-pointer" 
                                />
                              ) : (
                                <FileText 
                                  onClick={() => openFileStream(file.path)}
                                  className={`w-8 h-8 cursor-pointer ${isZip ? 'text-[#00f2fe]' : 'text-slate-400'}`} 
                                />
                              )}
                              
                              {/* Action drops or click tags */}
                              <div className="text-[9px] font-mono uppercase bg-[#050816] px-1.5 py-0.5 rounded border border-[#1e295d]/35 text-slate-500 leading-none">
                                {file.isDirectory ? 'DIR' : extension || 'FILE'}
                              </div>
                            </div>

                            <div className="mt-4">
                              <span 
                                onClick={() => file.isDirectory ? fetchDirectoryFiles(file.path) : openFileStream(file.path)}
                                className="text-xs font-bold font-mono text-slate-200 block truncate hover:underline hover:text-white cursor-pointer"
                                title={file.name}
                              >
                                {file.name}{file.isDirectory ? '/' : ''}
                              </span>
                              
                              <span className="text-[9px] font-mono text-slate-500 block mt-1">
                                {file.isDirectory ? 'Directory' : `${Math.ceil((file.size || 0)/1024)} KB`}
                              </span>
                            </div>

                            {/* Hover Actions Bar inside grid frame */}
                            <div className="mt-2.5 pt-2.5 border-t border-[#1e295d]/10 flex items-center justify-between gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="flex gap-1">
                                {!file.isDirectory && (
                                  <button
                                    onClick={() => openFileStream(file.path)}
                                    className="px-1.5 py-0.5 text-[8px] font-mono font-bold bg-[#0a1020] border border-[#1e295d]/30 text-indigo-400 hover:text-[#00f2fe] rounded"
                                  >
                                    Edit
                                  </button>
                                )}
                                {isZip && (
                                  <button
                                    onClick={() => handleUnzip(file.path)}
                                    className="px-1.5 py-0.5 text-[8px] font-mono font-bold bg-[#00f2fe]/10 border border-[#00f2fe]/30 text-cyan-400 hover:text-white rounded"
                                  >
                                    Unzip
                                  </button>
                                )}
                                {file.isDirectory && (
                                  <button
                                    onClick={() => handleDownloadFolderZip(file.path)}
                                    className="px-1.5 py-0.5 text-[8px] font-mono font-bold bg-indigo-950/30 border border-indigo-900/30 text-indigo-400 hover:text-white rounded"
                                  >
                                    Zip
                                  </button>
                                )}
                              </div>

                              <button
                                onClick={() => deleteFileOrFolder(file.path, file.isDirectory)}
                                className="px-1.5 py-0.5 text-[8px] font-[#340c11] bg-[#340c11]/40 border border-rose-950 text-rose-400 hover:bg-rose-900 hover:text-white rounded"
                              >
                                Delete
                              </button>
                            </div>

                          </div>
                        );
                      });
                    })()}
                  </div>
                ) : (
                  /* ================= LIST VIEW (TABLE) ================= */
                  <div className="overflow-x-auto border border-[#1e295d]/35 rounded-2xl bg-slate-950/20 shadow-inner">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[#1e295d]/35 bg-slate-950/60 font-mono text-slate-500">
                          <th className="p-3.5 font-normal">Name</th>
                          <th className="p-3.5 font-normal">Type</th>
                          <th className="p-3.5 font-normal">Size</th>
                          <th className="p-3.5 font-normal">Modified Time</th>
                          <th className="p-3.5 font-normal text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1e295d]/10 text-slate-350">
                        {(() => {
                          const filteredList = filesSearchQuery.trim()
                            ? fileList.filter(f => f.name.toLowerCase().includes(filesSearchQuery.toLowerCase()))
                            : fileList;

                          if (filteredList.length === 0) {
                            return (
                              <tr>
                                <td colSpan={5} className="p-12 text-center text-slate-500 font-mono tracking-wide">
                                  No files or matching directory items found.
                                </td>
                              </tr>
                            );
                          }

                          return filteredList.map((file) => {
                            const parts = file.name.split('.');
                            const extension = parts.length > 1 ? parts.pop()?.toUpperCase() : '';
                            const isZip = file.name.toLowerCase().endsWith('.zip');

                            const formatSize = (bytes: number) => {
                              if (bytes === 0) return '0 B';
                              const k = 1024;
                              const sizes = ['B', 'KB', 'MB', 'GB'];
                              const i = Math.floor(Math.log(bytes) / Math.log(k));
                              return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i].toString();
                            };

                            return (
                              <tr key={file.path} className="hover:bg-[#0a1020]/45 transition-all font-mono group">
                                <td className="p-3.5 font-normal flex items-center gap-3">
                                  {file.isDirectory ? (
                                    <Folder 
                                      className="w-4 h-4 text-indigo-400 group-hover:scale-105 transition-all cursor-pointer shrink-0" 
                                      onClick={() => fetchDirectoryFiles(file.path)}
                                    />
                                  ) : (
                                    <FileText className={`w-4 h-4 shrink-0 ${isZip ? 'text-cyan-400 animate-pulse' : 'text-slate-400'}`} />
                                  )}
                                  {file.isDirectory ? (
                                    <span 
                                      onClick={() => fetchDirectoryFiles(file.path)}
                                      className="text-indigo-300 hover:text-indigo-200 cursor-pointer hover:underline font-semibold font-mono truncate max-w-[200px]"
                                    >
                                      {file.name}/
                                    </span>
                                  ) : (
                                    <span 
                                      onClick={() => openFileStream(file.path)}
                                      className="text-slate-200 hover:text-white cursor-pointer hover:underline truncate max-w-[200px]"
                                    >
                                      {file.name}
                                    </span>
                                  )}
                                </td>
                                <td className="p-3.5 text-slate-500">
                                  {file.isDirectory ? 'DIR' : `${extension || 'FILE'}`}
                                </td>
                                <td className="p-3.5 text-slate-400">
                                  {file.isDirectory ? '-' : formatSize(file.size)}
                                </td>
                                <td className="p-3.5 text-slate-500 text-[10.5px]">
                                  {file.mtime ? new Date(file.mtime).toLocaleString('en-US', { hour12: false }) : ''}
                                </td>
                                <td className="p-3.5 text-right space-x-1">
                                  {!file.isDirectory && (
                                    <button
                                      onClick={() => openFileStream(file.path)}
                                      className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] text-indigo-400 hover:text-[#00f2fe] transition-all rounded-md cursor-pointer"
                                    >
                                      Edit
                                    </button>
                                  )}
                                  {isZip && (
                                    <button
                                      onClick={() => handleUnzip(file.path)}
                                      className="px-2 py-1 bg-cyan-950/40 hover:bg-cyan-600 border border-cyan-900/60 text-[10px] text-cyan-400 hover:text-white transition-all rounded-md cursor-pointer"
                                    >
                                      Unzip
                                    </button>
                                  )}
                                  {file.isDirectory ? (
                                    <button
                                      onClick={() => handleDownloadFolderZip(file.path)}
                                      className="px-2 py-1 bg-[#0a1020] border border-[#1e295d]/35 hover:bg-indigo-900 text-[10px] text-indigo-400 hover:text-white transition-all rounded-md cursor-pointer"
                                    >
                                      Zip
                                    </button>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => handleDownloadFile(file.path)}
                                        className="px-2 py-1 bg-[#051c10] hover:bg-emerald-800 border border-emerald-950 text-[10px] text-emerald-400 hover:text-white transition-all rounded-md cursor-pointer"
                                      >
                                        Dl
                                      </button>
                                      <button
                                        onClick={() => handleDownloadFolderZip(file.path)}
                                        className="px-2 py-1 bg-slate-900 hover:bg-indigo-900 border border-slate-800 text-[10px] text-slate-400 hover:text-white transition-all rounded-md cursor-pointer"
                                      >
                                        ZipDl
                                      </button>
                                    </>
                                  )}
                                  <button
                                    onClick={() => deleteFileOrFolder(file.path, file.isDirectory)}
                                    className="px-2 py-1 bg-[#250a0f] hover:bg-red-800 border border-red-950 text-[10px] text-red-100 hover:text-white transition-all rounded-md cursor-pointer"
                                  >
                                    Del
                                  </button>
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================================== AUTOMATED NPM INSTALLER TAB ==================================== */}
          {currentTab === 'npm' && (
            <div id="npm-installer-viewport" className="space-y-6 animate-fade-in text-slate-300">
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Installed list column */}
                <div className="lg:col-span-12 xl:col-span-7 space-y-6">
                  
                  {/* Package banner description */}
                  <div className="glassmorphism rounded-2xl p-6 space-y-6">
                    <div className="border-b border-slate-900 pb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-1.5 py-0.5 bg-indigo-950/30 border border-indigo-900/40 text-indigo-400 rounded-md font-mono">workspace</span>
                        <span className="text-[10px] font-mono text-slate-500">Node JS Engine</span>
                      </div>
                      <h2 className="text-base font-bold text-slate-100 mt-1 flex items-center gap-2">
                        <Package className="w-5 h-5 text-indigo-400 animate-pulse" />
                        {npmInfo ? npmInfo.name || 'unnamed-project' : 'Retrieving system config...'}
                      </h2>
                      <p className="text-xs text-slate-400">Actual workspace compiled node module dependency lists inside the system framework.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Dependencies */}
                      <div className="space-y-3.5">
                        <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider font-mono">Dependencies ({npmInfo ? Object.keys(npmInfo.dependencies || {}).length : 0})</h3>
                        <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                          {npmInfo && Object.keys(npmInfo.dependencies || {}).length > 0 ? (
                            Object.entries(npmInfo.dependencies).map(([dep, ver]) => (
                              <div key={dep} className="flex items-center justify-between p-2.5 bg-slate-950 rounded-lg border border-slate-900 text-xs font-mono">
                                <span className="text-slate-300 truncate max-w-[130px]">{dep}</span>
                                <span className="text-indigo-400 text-[10.5px] font-semibold">{ver}</span>
                              </div>
                            ))
                          ) : (
                            <div className="text-[11px] text-slate-500 italic">No production dependencies list found.</div>
                          )}
                        </div>
                      </div>

                      {/* Dev Dependencies */}
                      <div className="space-y-3.5">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Dev Dependencies ({npmInfo ? Object.keys(npmInfo.devDependencies || {}).length : 0})</h3>
                        <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                          {npmInfo && Object.keys(npmInfo.devDependencies || {}).length > 0 ? (
                            Object.entries(npmInfo.devDependencies).map(([dep, ver]) => (
                              <div key={dep} className="flex items-center justify-between p-2.5 bg-slate-950 rounded-lg border border-slate-900 text-xs font-mono">
                                <span className="text-slate-400 truncate max-w-[130px]">{dep}</span>
                                <span className="text-teal-400 text-[10.5px] font-semibold">{ver}</span>
                              </div>
                            ))
                          ) : (
                            <div className="text-[11px] text-slate-500 italic">No developmental dependencies config found.</div>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Quick installations card */}
                  <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-200">Common Administrative NPM Pack Addons</h3>
                      <p className="text-xs text-slate-400">Instantly integrate popular tools in single-click commands with automated package installation.</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        { label: 'Lodash Utility', val: 'lodash' },
                        { label: 'Axios Fetcher', val: 'axios' },
                        { label: 'Zod Validator', val: 'zod' },
                        { label: 'Clsx Styling', val: 'clsx' },
                        { label: 'Framer Motion', val: 'motion' },
                        { label: 'Date FNs', val: 'date-fns' }
                      ].map((addon) => (
                        <button
                          key={addon.val}
                          onClick={() => runNpmInstallation(addon.val)}
                          disabled={isInstallingPkg}
                          className="p-3 bg-slate-950 hover:bg-slate-900 border border-slate-950 rounded-xl text-center text-xs text-indigo-400 hover:text-white transition-all cursor-pointer font-mono font-medium truncate duration-100"
                        >
                          + {addon.val}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Terminal installer logs column */}
                <div className="lg:col-span-12 xl:col-span-5 space-y-6">
                  
                  {/* Dynamic Installer trigger card */}
                  <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 space-y-4">
                    <div className="border-b border-slate-900 pb-3">
                      <h3 className="text-sm font-semibold text-slate-200">Automatically Execute npm install</h3>
                      <p className="text-xs text-slate-400">Dynamic installer service connecting with real terminal instance.</p>
                    </div>

                    <div className="space-y-4">
                      
                      <div className="space-y-2">
                        <label className="text-[10px] text-slate-500 font-mono uppercase block">Custom package name (optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. lodash"
                          disabled={isInstallingPkg}
                          value={npmSearchQuery}
                          onChange={(e) => setNpmSearchQuery(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => runNpmInstallation(npmSearchQuery ? npmSearchQuery : undefined, false)}
                          disabled={isInstallingPkg}
                          className="flex-grow bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all shadow-md shadow-indigo-600/15 text-center block duration-150"
                        >
                          {isInstallingPkg ? 'Installing...' : npmSearchQuery ? `Install ${npmSearchQuery}` : 'Run npm install'}
                        </button>
                        
                        {npmSearchQuery && (
                          <button
                            onClick={() => runNpmInstallation(npmSearchQuery, true)}
                            disabled={isInstallingPkg}
                            className="bg-slate-800 hover:bg-slate-705 disabled:opacity-40 text-slate-200 px-4 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all block duration-150"
                          >
                            As Dev
                          </button>
                        )}
                      </div>

                    </div>
                  </div>

                  {/* Real-time installation terminal output logs */}
                  <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono">Standard Installer stdout</h3>
                      {isInstallingPkg && (
                        <span className="flex items-center gap-1 text-[10px] font-mono text-indigo-400 animate-pulse">
                          <RotateCw className="w-2.5 h-2.5 animate-spin" />
                          installing...
                        </span>
                      )}
                    </div>

                    <div className="bg-slate-950 border border-slate-900 rounded-xl p-4 h-[220px] overflow-y-auto font-mono text-[11px] text-slate-400 leading-relaxed whitespace-pre-wrap flex flex-col">
                      {npmInstallLogs ? (
                        npmInstallLogs
                      ) : (
                        <span className="text-slate-600 italic block my-auto text-center">
                          Spawn state logs will display here upon executing NPM packages setup.
                        </span>
                      )}
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* ==================================== WEB SERVICES / VIRTUAL SERVERS MANAGER ==================================== */}
          {currentTab === 'servers' && (
            <div id="virtual-servers-viewport" className="space-y-6 animate-fade-in text-slate-300">
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Active Server Instances Card List */}
                <div className="lg:col-span-12 xl:col-span-8 space-y-6">
                  
                  <div className="glassmorphism rounded-2xl p-6 space-y-6">
                    <div className="border-b border-slate-900 pb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-1.5 py-0.5 bg-emerald-950/30 border border-emerald-900/40 text-emerald-400 rounded-md font-mono">system service</span>
                        <span className="text-[10px] font-mono text-slate-500">Virtual Host Proxy Routing</span>
                      </div>
                      <h2 className="text-base font-bold text-slate-100 mt-1 flex items-center gap-2">
                        <Globe className="w-5 h-5 text-emerald-400" />
                        Live App Server Daemons ({servers.length})
                      </h2>
                      <p className="text-xs text-slate-400">
                        Create and pilot standalone background processes or folders on designated private ports. All servers are tunneled through standard proxy addresses securely.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {servers.length > 0 ? (
                        servers.map((server) => {
                          const isOnline = server.status === 'running';
                          const publicUrl = `${window.location.protocol}//${window.location.host}/apps/${server.id}`;
                          return (
                            <div key={server.id} className="p-4 bg-slate-950 rounded-xl border border-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-800 transition-all">
                              <div className="space-y-1.5 overflow-hidden">
                                <div className="flex flex-wrap items-center gap-2.5">
                                  <h3 className="text-sm font-bold text-slate-200">{server.name}</h3>
                                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                                    isOnline 
                                      ? 'bg-emerald-950/40 border-emerald-900/50 text-emerald-400' 
                                      : 'bg-slate-900 border-slate-800 text-slate-400'
                                  }`}>
                                    ● {server.status.toUpperCase()}
                                  </span>
                                  <span className="text-[10.5px] px-1.5 py-0.5 bg-slate-900 border border-slate-800 text-slate-400 rounded-md font-mono uppercase">
                                    {server.type}
                                  </span>
                                </div>
                                <div className="space-y-1 font-mono text-xs text-slate-400">
                                  <p className="truncate block">
                                    <span className="text-slate-600">Entry File:</span> {server.entryPoint}
                                  </p>
                                  <p className="flex items-center gap-4 flex-wrap">
                                    <span>
                                      <span className="text-slate-600">Port Alloc:</span> <span className="text-indigo-400 font-semibold">{server.port}</span>
                                    </span>
                                    {server.pid && (
                                      <span>
                                        <span className="text-slate-600">Process PID:</span> <span className="text-cyan-400">{server.pid}</span>
                                      </span>
                                    )}
                                  </p>
                                </div>
                                {isOnline && (
                                  <div className="pt-2">
                                    <a 
                                      href={publicUrl} 
                                      target="_blank" 
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-mono transition-all underline decoration-cyan-400/30 hover:decoration-cyan-400"
                                    >
                                      <span>🌐 Visit Web App Host &rarr;</span>
                                      <span className="text-[9.5px] bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded border border-slate-800 truncate max-w-[280px]">
                                        /apps/{server.id}
                                      </span>
                                    </a>
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-2 md:self-center">
                                {!isOnline ? (
                                  <button
                                    onClick={() => handleStartServer(server.id, server.name)}
                                    className="px-3.5 py-2 bg-emerald-650 hover:bg-emerald-600 hover:scale-105 border border-emerald-900/60 text-xs text-white transition-all rounded-xl font-medium cursor-pointer shadow-md shadow-emerald-900/20"
                                  >
                                    ▶ Start Process
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleStopServer(server.id, server.name)}
                                    className="px-3.5 py-2 bg-rose-950/20 hover:bg-rose-950 hover:scale-105 border border-rose-900 text-xs text-rose-400 hover:text-white transition-all rounded-xl font-medium cursor-pointer"
                                  >
                                    ■ Kill Process
                                  </button>
                                )}

                                <button
                                  onClick={() => {
                                    setViewingLogsId(server.id);
                                    fetchServerLogs(server.id);
                                  }}
                                  className={`px-3 py-2 border text-xs transition-all rounded-xl cursor-pointer ${
                                    viewingLogsId === server.id 
                                      ? 'bg-indigo-600/20 border-indigo-500 text-white' 
                                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                                  }`}
                                >
                                  📄 Console Output
                                </button>

                                <button
                                  onClick={() => handleDeleteServer(server.id, server.name)}
                                  className="p-2 bg-slate-900 hover:bg-rose-950 border border-slate-800 hover:border-rose-900 text-slate-400 hover:text-rose-400 transition-all rounded-xl cursor-pointer"
                                  title="Delete host config"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="py-12 border border-dashed border-slate-900 rounded-2xl flex flex-col items-center justify-center text-center space-y-3">
                          <Globe className="w-10 h-10 text-slate-700 animate-spin-slow" />
                          <div>
                            <p className="text-sm font-semibold text-slate-400">No Custom Servers Allocated</p>
                            <p className="text-xs text-slate-500 max-w-sm mt-1">
                              Get started by defining an entry endpoint file or web folder directory to run your custom HTTP daemons.
                            </p>
                          </div>
                          <button
                            onClick={() => setIsCreatingServer(true)}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs text-white rounded-xl transition-all cursor-pointer font-medium"
                          >
                            + Allocate First Web Server
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Real-time server diagnostics tail console */}
                  {viewingLogsId && (
                    <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 space-y-4 animate-fade-in">
                      <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                        <div>
                          <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-widest font-mono">Console Trace Feed</h3>
                          <p className="text-[10px] text-slate-500">Live stdout/stderr stream from Virtual Server: <strong>{servers.find(s => s.id === viewingLogsId)?.name}</strong></p>
                        </div>
                        <button
                          onClick={() => setViewingLogsId(null)}
                          className="text-xs px-2.5 py-1 bg-slate-950 hover:bg-slate-900 border border-slate-900 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer font-mono"
                        >
                          Clear Watcher
                        </button>
                      </div>

                      <div className="bg-slate-950 border border-slate-900 rounded-xl p-4 h-[300px] overflow-y-auto font-mono text-[11px] text-slate-400 leading-relaxed whitespace-pre-wrap flex flex-col justify-start">
                        {serverLogs ? (
                          serverLogs
                        ) : (
                          <span className="text-slate-600 italic block m-auto text-center font-sans">
                            Awaiting process runtime logs output stream...
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                </div>

                {/* Create Virtual App Server Profile Column */}
                <div className="lg:col-span-12 xl:col-span-4 space-y-6">
                  
                  <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 space-y-6">
                    <div className="border-b border-slate-900 pb-3">
                      <h3 className="text-sm font-semibold text-slate-200">Register Virtual Daemon Server</h3>
                      <p className="text-xs text-slate-400">Add an application endpoint listening on customized, isolated port allocations.</p>
                    </div>

                    <form onSubmit={executeServerCreation} className="space-y-4">
                      
                      <div className="space-y-2">
                        <label className="text-[10px] text-slate-500 font-mono uppercase block">Friendly App Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. My REST API Server"
                          value={serverName}
                          onChange={(e) => setServerName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] text-slate-500 font-mono uppercase block">Execution Daemon Type</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setServerType('node')}
                            className={`p-2.5 rounded-xl border text-xs font-mono font-medium transition-all text-center cursor-pointer ${
                              serverType === 'node'
                                ? 'bg-indigo-950/30 border-indigo-500/50 text-indigo-400'
                                : 'bg-slate-950 border-slate-900/60 text-slate-400 hover:border-slate-800'
                            }`}
                          >
                            Node JS Script
                          </button>
                          <button
                            type="button"
                            onClick={() => setServerType('static')}
                            className={`p-2.5 rounded-xl border text-xs font-mono font-medium transition-all text-center cursor-pointer ${
                              serverType === 'static'
                                ? 'bg-indigo-950/30 border-indigo-500/50 text-indigo-400'
                                : 'bg-slate-950 border-slate-900/60 text-slate-400 hover:border-slate-800'
                            }`}
                          >
                            Static Directory
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] text-slate-500 font-mono uppercase block">
                          {serverType === 'node' ? 'Entry File Script Path' : 'Static Public Web Directory'}
                        </label>
                        <input
                          type="text"
                          required
                          placeholder={serverType === 'node' ? 'e.g. index.js or plugins/app.js' : 'e.g. assets/public or /'}
                          value={serverEntryPoint}
                          onChange={(e) => setServerEntryPoint(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                        />
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <span className="text-[10px] text-slate-500 self-center mr-1 font-mono">Suggested:</span>
                          {serverType === 'node' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setServerEntryPoint('server.ts');
                                  if (!serverName.trim()) setServerName('Custom TS Core API');
                                }}
                                className="text-[10px] font-mono px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-indigo-400 border border-slate-800 rounded transition-all cursor-pointer"
                              >
                                server.ts
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setServerEntryPoint('index.js');
                                  if (!serverName.trim()) setServerName('Default JS Bot');
                                }}
                                className="text-[10px] font-mono px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-indigo-400 border border-slate-800 rounded transition-all cursor-pointer"
                              >
                                index.js
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setServerEntryPoint('.');
                                  if (!serverName.trim()) setServerName('Main Root Web');
                                }}
                                className="text-[10px] font-mono px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-indigo-400 border border-slate-800 rounded transition-all cursor-pointer"
                              >
                                Root (.)
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setServerEntryPoint('dist');
                                  if (!serverName.trim()) setServerName('Dist Folder Live');
                                }}
                                className="text-[10px] font-mono px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-indigo-400 border border-slate-800 rounded transition-all cursor-pointer"
                              >
                                dist
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setServerEntryPoint('public');
                                  if (!serverName.trim()) setServerName('Public Assets');
                                }}
                                className="text-[10px] font-mono px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-indigo-400 border border-slate-800 rounded transition-all cursor-pointer"
                              >
                                public
                              </button>
                            </>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 leading-relaxed font-mono pt-1 bg-slate-950/30 p-2 rounded border border-slate-900/50 leading-normal">
                          {serverType === 'node' 
                            ? '💡 Set absolute path or path relative to workspace. Passes isolated PORT variable in runtime environment variables.' 
                            : '💡 Spins up a dynamic high-performance server reading static folders. Serves public files out-of-the-box.'}
                        </p>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-md shadow-indigo-600/10 block text-center"
                      >
                        🚀 Allocate Server App
                      </button>

                    </form>
                  </div>

                  <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 space-y-3">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono">Real-Host Sandbox Notice</h3>
                    <p className="text-[10.5px] text-slate-500 leading-normal tracking-wide font-mono">
                      Unlike other simulated visual configurations, you are interacting with real system services. Your Node apps can load dependencies, create filesystem logs, and bind real network tunnels.
                    </p>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* ==================== TAB: AYEZZPANEL USER MANAGEMENT ==================== */}
          {currentTab === 'users' && currentUser?.role === 'admin' && (
            <div id="users-tab-view" className="p-6 md:p-8 space-y-6 animate-fadeIn">
              
              {/* Segmented Controller for subtabs */}
              <div className="flex bg-slate-900/40 border border-slate-800 rounded-2xl p-1 shrink-0 max-w-sm">
                <button
                  id="tab-btn-firestore"
                  type="button"
                  onClick={() => setUserSubTab('firestore')}
                  className={`flex-1 py-1.5 rounded-xl text-[10.5px] font-bold font-mono tracking-wider transition-all cursor-pointer ${
                    userSubTab === 'firestore' 
                      ? 'bg-indigo-600/30 text-white shadow-inner border border-indigo-500/10' 
                      : 'text-slate-450 hover:text-white'
                  }`}
                >
                  📡 {language === 'id' ? 'KLIEN FIRESTORE' : 'FIRESTORE CLIENTS'}
                </button>
                <button
                  id="tab-btn-local"
                  type="button"
                  onClick={() => setUserSubTab('local')}
                  className={`flex-1 py-1.5 rounded-xl text-[10.5px] font-bold font-mono tracking-wider transition-all cursor-pointer ${
                    userSubTab === 'local' 
                      ? 'bg-indigo-600/30 text-white shadow-inner border border-indigo-500/10' 
                      : 'text-slate-450 hover:text-white'
                  }`}
                >
                  💻 {language === 'id' ? 'OPERATOR SEKTORAL' : 'LOCAL OPERATORS'}
                </button>
              </div>

              {userSubTab === 'firestore' ? (
                <FirestoreClientsPage />
              ) : (
                <>
                  {/* Header section with register trigger */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/10 p-6 rounded-3xl border border-slate-900/50">
                <div className="space-y-1">
                  <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-indigo-400" />
                    AyeZzPanel User Management Control Center
                  </h1>
                  <p className="text-xs text-slate-400 max-w-2xl">
                    Register, edit, delete, and configure roles or statuses of virtual panel administrators. Users can login with credentials authorized here.
                  </p>
                </div>
                {!isCreatingUser && !editingUser && !passwordTargetUser && (
                  <button
                    onClick={() => {
                      setIsCreatingUser(true);
                      setEditingUser(null);
                      setPasswordTargetUser(null);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-md shadow-indigo-600/15"
                    id="add-user-btn-trigger"
                  >
                    <Plus className="w-4 h-4" />
                    Register New User Profile
                  </button>
                )}
              </div>

              {/* Form panel: Register New User */}
              {isCreatingUser && (
                <div id="create-user-card" className="bg-slate-900/30 border border-slate-900 rounded-3xl p-6 space-y-4 animate-slideDown">
                  <div className="flex justify-between items-center border-b border-slate-900/80 pb-3">
                    <h2 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">Add User Registration</h2>
                    <button
                      onClick={() => setIsCreatingUser(false)}
                      className="text-xs text-slate-400 hover:text-white font-mono"
                    >
                      Cancel
                    </button>
                  </div>
                  <form onSubmit={handleCreateUserSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {createUserError && (
                      <div className="col-span-full bg-rose-950/20 border border-rose-900/50 text-rose-400 p-3.5 rounded-2xl text-xs font-mono">
                        {createUserError}
                      </div>
                    )}
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">Username</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. masi_z"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        className="w-full bg-slate-950/50 border border-slate-900 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500"
                        id="new-username-field"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">Email Address</label>
                      <input
                        type="email"
                        required
                        placeholder="masiz@panel.net"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="w-full bg-slate-950/50 border border-slate-900 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500"
                        id="new-email-field"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">Password</label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-slate-950/50 border border-slate-900 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500"
                        id="new-password-field"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">Status</label>
                        <select
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value as any)}
                          className="w-full bg-slate-950/80 border border-slate-900 rounded-xl px-2 py-2 text-xs text-slate-300 outline-none"
                        >
                          <option value="active">Active</option>
                          <option value="suspended">Suspended</option>
                          <option value="disabled">Disabled</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">Role privilege</label>
                        <select
                          value={newRole}
                          onChange={(e) => setNewRole(e.target.value as any)}
                          className="w-full bg-slate-950/80 border border-slate-900 rounded-xl px-2 py-2 text-xs text-slate-300 outline-none"
                        >
                          <option value="client">Client</option>
                          <option value="reseller">Reseller</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-span-full pt-2">
                      <button
                        type="submit"
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl cursor-pointer"
                        id="submit-register-btn"
                      >
                        Register Account
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Form panel: Edit User Parameters */}
              {editingUser && (
                <div id="edit-user-card" className="bg-slate-900/30 border border-slate-900 rounded-3xl p-6 space-y-4 animate-slideDown">
                  <div className="flex justify-between items-center border-b border-slate-900/80 pb-3">
                    <h2 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">
                      Edit User Parameters: @{editingUser.username}
                    </h2>
                    <button
                      onClick={() => setEditingUser(null)}
                      className="text-xs text-slate-400 hover:text-white font-mono"
                    >
                      Cancel
                    </button>
                  </div>
                  <form onSubmit={handleUpdateUserSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1 col-span-full md:col-span-1">
                      <label className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">Email Address</label>
                      <input
                        type="email"
                        required
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full bg-slate-950/50 border border-slate-900 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500"
                        id="edit-email-field"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3 col-span-full md:col-span-1">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">Account Status</label>
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value as any)}
                          className="w-full bg-slate-950/80 border border-slate-900 rounded-xl px-2 py-2 text-xs text-slate-300 outline-none"
                        >
                          <option value="active">Active</option>
                          <option value="suspended">Suspended</option>
                          <option value="disabled">Disabled</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">Privilege Role</label>
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value as any)}
                          className="w-full bg-slate-950/80 border border-slate-900 rounded-xl px-2 py-2 text-xs text-slate-300 outline-none"
                        >
                          <option value="client">Client</option>
                          <option value="reseller">Reseller</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-span-full pt-2">
                      <button
                        type="submit"
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl cursor-pointer"
                        id="submit-edit-btn"
                      >
                        Save Configurations
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Form panel: Set Password Override */}
              {passwordTargetUser && (
                <div id="password-user-card" className="bg-slate-900/30 border border-slate-900 rounded-3xl p-6 space-y-4 animate-slideDown">
                  <div className="flex justify-between items-center border-b border-slate-900/80 pb-3">
                    <h2 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">
                      Override Password for: @{passwordTargetUser.username}
                    </h2>
                    <button
                      onClick={() => {
                        setPasswordTargetUser(null);
                        setPasswordTargetValue('');
                        setPasswordTargetError('');
                      }}
                      className="text-xs text-slate-400 hover:text-white font-mono"
                    >
                      Cancel
                    </button>
                  </div>
                  <form onSubmit={handleChangePasswordSubmit} className="space-y-3 max-w-md">
                    {passwordTargetError && (
                      <div className="bg-rose-950/20 border border-rose-900/50 text-rose-400 p-2.5 rounded-xl text-xs font-mono">
                        {passwordTargetError}
                      </div>
                    )}
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">New Password Value</label>
                      <input
                        type="password"
                        required
                        placeholder="Enter direct custom string"
                        value={passwordTargetValue}
                        onChange={(e) => setPasswordTargetValue(e.target.value)}
                        className="w-full bg-slate-950/50 border border-slate-900 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500"
                        id="override-password-field"
                      />
                    </div>
                    <button
                      type="submit"
                      className="py-1.5 px-4 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl cursor-pointer"
                      id="submit-override-pwd-btn"
                    >
                      Execute Password Rewrite
                    </button>
                  </form>
                </div>
              )}

              {/* Users Listing Datagrid Table */}
              <div className="bg-slate-900/20 border border-slate-900/65 rounded-3xl overflow-hidden">
                <div className="p-5 border-b border-slate-900/80 bg-slate-900/10 flex justify-between items-center">
                  <h2 className="text-sm font-semibold text-white font-mono tracking-wide uppercase">Operator Profiles Registry</h2>
                  <button
                    onClick={fetchUsersList}
                    disabled={usersLoading}
                    className="p-1.5 text-slate-400 hover:text-white bg-slate-950 border border-slate-900 rounded-lg hover:border-slate-800 transition-colors"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${usersLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-900/60 bg-slate-950/10 text-slate-400 text-[10px] uppercase font-mono tracking-wider">
                        <th className="p-4 pl-6">Operator Node</th>
                        <th className="p-4">Email Address</th>
                        <th className="p-4">Authority Scope</th>
                        <th className="p-4">Account state</th>
                        <th className="p-4 text-right pr-6">Action pipeline</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900/40 text-xs">
                      {usersLoading ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-500 font-mono">
                            Decrypting relational user records...
                          </td>
                        </tr>
                      ) : usersList.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-500 font-mono">
                            No active operator profiles registered.
                          </td>
                        </tr>
                      ) : (
                        usersList.map((usr: any) => (
                          <tr key={usr.id} className="hover:bg-slate-900/20 transition-colors">
                            <td className="p-4 pl-6 font-semibold text-white flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-inner block"></span>
                              @{usr.username}
                              {usr.id === currentUser?.id && (
                                <span className="text-[10px] bg-indigo-950 border border-indigo-900 text-indigo-400 px-1.5 py-0.2 rounded font-mono uppercase">
                                  You
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-slate-300 font-mono font-medium text-[11px]">{usr.email}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider border ${
                                usr.role === 'admin' 
                                  ? 'bg-indigo-950/60 text-indigo-400 border-indigo-900' 
                                  : usr.role === 'reseller'
                                  ? 'bg-cyan-950/60 text-cyan-400 border-cyan-900'
                                  : 'bg-slate-900/60 text-slate-400 border-slate-800'
                              }`}>
                                {usr.role}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono leading-none border ${
                                usr.status === 'active'
                                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-900'
                                  : usr.status === 'suspended'
                                  ? 'bg-amber-950/60 text-amber-400 border-amber-900'
                                  : 'bg-rose-950/60 text-rose-400 border-rose-900'
                              }`}>
                                {usr.status}
                              </span>
                            </td>
                            <td className="p-4 text-right pr-6 space-x-2">
                              <button
                                onClick={() => {
                                  setPasswordTargetUser(usr);
                                  setPasswordTargetValue('');
                                  setPasswordTargetError('');
                                  setIsCreatingUser(false);
                                  setEditingUser(null);
                                }}
                                className="px-2 py-1 bg-slate-950 hover:bg-slate-900 text-rose-400 hover:text-rose-300 border border-slate-900 rounded-lg text-[10px] h-7 font-mono outline-none"
                                title="Override password string"
                              >
                                🔑 pwd
                              </button>
                              
                              <button
                                onClick={() => handleToggleStatusQuick(usr)}
                                className={`px-2 py-1 rounded-lg text-[10px] h-7 font-mono border ${
                                  usr.status === 'active'
                                    ? 'bg-amber-950/20 text-amber-400 border-amber-900/30 hover:bg-amber-950/30'
                                    : 'bg-emerald-950/20 text-emerald-400 border-emerald-900/30 hover:bg-emerald-950/30'
                                }`}
                                title="Quick Status toggle"
                              >
                                {usr.status === 'active' ? '🔒 Suspend' : '🔓 Active'}
                              </button>

                              <button
                                onClick={() => {
                                  setEditingUser(usr);
                                  setEditEmail(usr.email);
                                  setEditRole(usr.role);
                                  setEditStatus(usr.status);
                                  setIsCreatingUser(false);
                                  setPasswordTargetUser(null);
                                }}
                                className="p-1 px-1.5 bg-slate-950 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-900 rounded-lg"
                                title="Edit variables"
                              >
                                ✏️
                              </button>

                              <button
                                onClick={() => handleDeleteUserClick(usr)}
                                disabled={usr.id === currentUser?.id}
                                className="p-1 px-1.5 bg-slate-950 hover:bg-rose-950/50 text-slate-500 hover:text-rose-400 border border-slate-900 hover:border-rose-900/50 rounded-lg disabled:opacity-20 disabled:cursor-not-allowed"
                                title="Delete profile"
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
                </>
              )}

            </div>
          )}

          {/* ==================== TAB: AUDIT TRAILS & SESSION HISTORY ==================== */}
          {currentTab === 'audit' && currentUser?.role === 'admin' && (
            <div id="audit-tab-view" className="p-6 md:p-8 space-y-6 animate-fadeIn">
              
              {/* Header block with stats summaries */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/10 p-6 rounded-3xl border border-slate-900/50">
                <div className="space-y-1">
                  <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-400" />
                    AyeZzPanel Cluster Activity Audit Ledger
                  </h1>
                  <p className="text-xs text-slate-400 max-w-2xl">
                    Tracks modifications, SSH executions, system restarts, and authentication status. Securely persisted to safeguard operational integrity.
                  </p>
                </div>
                <div className="flex items-center gap-2 font-mono text-[10px] bg-slate-950 px-3 py-1.5 border border-slate-900 rounded-xl">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                  <span>SESSION KEY VALIDATIONS ACTIVE</span>
                </div>
              </div>

              {/* Grid Statistics Counters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-4 space-y-1.5">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Audit Entries</span>
                  <p className="text-2xl font-bold text-white font-mono">{auditLogsList.length}</p>
                </div>
                <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-4 space-y-1.5">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Valid Logins</span>
                  <p className="text-2xl font-bold text-emerald-400 font-mono">
                    {auditLogsList.filter(l => l.action === 'login').length}
                  </p>
                </div>
                <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-4 space-y-1.5">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Security Alerts</span>
                  <p className="text-2xl font-bold text-amber-500 font-mono">
                    {auditLogsList.filter(l => l.action === 'login_denied' || l.action === 'brute_force_blocked').length}
                  </p>
                </div>
              </div>

              {/* Layout splits: Audit log table + Permission Manager */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Audit table (Takes 2/3 space) */}
                <div className="lg:col-span-2 bg-slate-900/20 border border-slate-900/65 rounded-3xl overflow-hidden flex flex-col">
                  <div className="p-5 border-b border-slate-900/80 bg-slate-900/10 flex justify-between items-center shrink-0">
                    <h2 className="text-xs font-semibold text-white font-mono uppercase tracking-wider">Live System Logs Tracker</h2>
                    <button
                      onClick={fetchAuditLogs}
                      disabled={auditLoading}
                      className="p-1 px-[7px] text-slate-400 hover:text-white bg-slate-950 border border-slate-900 rounded-lg hover:border-slate-800 transition-all font-mono text-[10px] cursor-pointer flex items-center gap-1.5"
                    >
                      <RotateCw className={`w-3 h-3 ${auditLoading ? 'animate-spin' : ''}`} />
                      Reload Trails
                    </button>
                  </div>

                  <div className="overflow-x-auto flex-grow max-h-[480px]">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-900 bg-slate-950/20 text-slate-500 text-[9px] uppercase tracking-wider font-mono">
                          <th className="p-3 pl-5">Timestamp</th>
                          <th className="p-3">User</th>
                          <th className="p-3">Event code</th>
                          <th className="p-3">Details / Target</th>
                          <th className="p-3 text-right pr-5">Client IP</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900/40 font-mono text-[10px] text-slate-400">
                        {auditLoading ? (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-600">
                              Deciphering audit database blobs...
                            </td>
                          </tr>
                        ) : auditLogsList.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-600">
                              No events registered in log registry.
                            </td>
                          </tr>
                        ) : (
                          auditLogsList.map((log: any) => (
                            <tr key={log.id} className="hover:bg-slate-900/10">
                              <td className="p-3 pl-5 text-[9.5px] text-slate-500">
                                {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString()}
                              </td>
                              <td className="p-3 font-semibold text-slate-300">@{log.username}</td>
                              <td className="p-3">
                                <span className={`px-1.5 py-0.2 rounded text-[9px] border font-semibold ${
                                  log.action?.includes('login') && !log.action.includes('denied')
                                    ? 'bg-emerald-950/65 text-emerald-400 border-emerald-900/50'
                                    : log.action?.includes('delete') || log.action?.includes('denied') || log.action?.includes('blocked')
                                    ? 'bg-rose-950/30 text-rose-400 border-rose-900/50'
                                    : 'bg-indigo-950/30 text-indigo-400 border-indigo-900/50'
                                }`}>
                                  {log.action}
                                </span>
                              </td>
                              <td className="p-3 text-slate-300 max-w-[200px] truncate" title={log.details}>
                                {log.details}
                              </td>
                              <td className="p-3 text-right pr-5 text-slate-500">{log.ip}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Role / Permission Manager Matrix (Takes 1/3 space) */}
                <div className="bg-slate-900/20 border border-slate-900/65 rounded-3xl p-5 space-y-4">
                  <div className="border-b border-slate-900 pb-3">
                    <h2 className="text-xs font-semibold text-white font-mono tracking-wider uppercase">
                      AyeZzPanel RBAC Matrix
                    </h2>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                      Detailed Role-Based Access Control matrix. Restricts node command execution, file alterations, and VM generation based on operator priority status.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-slate-950/40 p-3 rounded-2xl border border-slate-900 space-y-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-bold block">
                        🛡️ ADMIN SCOPE
                      </span>
                      <ul className="text-[10.5px] font-mono leading-relaxed text-slate-400 space-y-1">
                        <li className="flex items-center gap-1.5">✅ Global Interactive live terminal</li>
                        <li className="flex items-center gap-1.5">✅ Operator CRUD + Role settings</li>
                        <li className="flex items-center gap-1.5">✅ Create, start, stop, delete app VMs</li>
                        <li className="flex items-center gap-1.5">✅ Inspect audit records and terminal logs</li>
                      </ul>
                    </div>

                    <div className="bg-slate-950/40 p-3 rounded-2xl border border-slate-900 space-y-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold block">
                        📈 RESELLER SCOPE
                      </span>
                      <ul className="text-[10.5px] font-mono leading-relaxed text-slate-400 space-y-1">
                        <li className="flex items-center gap-1.5">❌ No root live terminal control</li>
                        <li className="flex items-center gap-1.5">❌ No user registry administration</li>
                        <li className="flex items-center gap-1.5">✅ Read stats, processes lists</li>
                        <li className="flex items-center gap-1.5">✅ Create, manage, shut down own VMs</li>
                      </ul>
                    </div>

                    <div className="bg-slate-950/40 p-3 rounded-2xl border border-slate-900 space-y-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                        👤 CLIENT SCOPE
                      </span>
                      <ul className="text-[10.5px] font-mono leading-relaxed text-slate-400 space-y-1">
                        <li className="flex items-center gap-1.5">❌ Restricted virtual server controls</li>
                        <li className="flex items-center gap-1.5">❌ No file write or container alters</li>
                        <li className="flex items-center gap-1.5">✅ View-only stats & file structures</li>
                        <li className="flex items-center gap-1.5">✅ View active app running status</li>
                      </ul>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

        </main>

        <footer id="footer" className="w-full py-6 px-8 border-t border-slate-900 bg-slate-950 text-center text-[10px] text-slate-500 font-mono tracking-tight flex flex-col sm:flex-row justify-between items-center gap-4 mt-auto">
          <div>
            AyeZzPanel v2.4.9 Admin &bull; Live Container Port 3000
          </div>
          <div className="text-slate-400">
            Node: {stats.hostname} ({stats.platform})
          </div>
        </footer>

      </section>

      <AnimeCharacter />
      <AnimeVideo />
    </div>
  );
}
