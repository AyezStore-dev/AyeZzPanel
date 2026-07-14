import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  limit
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase-client';
import { useLanguage } from '../lib/translations';
import { 
  UserPlus, 
  Trash2, 
  Edit3, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Database,
  FileText,
  User,
  Mail,
  X,
  FileJson,
  Activity,
  Key,
  Sliders,
  LogOut,
  Server,
  CloudLightning,
  Terminal,
  Search,
  Filter,
  Flame,
  Globe
} from 'lucide-react';

interface ClientAccount {
  id: string;
  username: string;
  email: string;
  status: 'active' | 'suspended' | 'disabled';
  role: 'client';
  notes?: string;
  createdAt: any;
  updatedAt: any;
}

interface ClientActivityLog {
  id: string;
  clientId: string;
  username: string;
  actionType: 'login' | 'logout' | 'create_server' | 'delete_server' | 'status_change' | 'simulation' | 'deploy_app' | 'other';
  description: string;
  ipAddress?: string;
  timestamp: string;
}

export default function FirestoreClientsPage() {
  const { language } = useLanguage();
  const [clients, setClients] = useState<ClientAccount[]>([]);
  const [activityLogs, setActivityLogs] = useState<ClientActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form Fields for Client Creation
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'active' | 'suspended' | 'disabled'>('active');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit State
  const [editingClient, setEditingClient] = useState<ClientAccount | null>(null);
  const [editStatus, setEditStatus] = useState<'active' | 'suspended' | 'disabled'>('active');
  const [editNotes, setEditNotes] = useState('');

  // Simulator State
  const [selectedClientForSimulator, setSelectedClientForSimulator] = useState('');
  const [simulatedActionType, setSimulatedActionType] = useState<'login' | 'logout' | 'create_server' | 'delete_server' | 'status_change' | 'simulation' | 'deploy_app' | 'other'>('login');
  const [simulatedDescription, setSimulatedDescription] = useState('');
  const [simulatedIp, setSimulatedIp] = useState('182.253.14.99');
  const [isSubmittingLog, setIsSubmittingLog] = useState(false);

  // Debug raw JSON modal
  const [selectedDebugDoc, setSelectedDebugDoc] = useState<any | null>(null);
  const [debugDocType, setDebugDocType] = useState<'client' | 'log'>('client');

  // Multi-Filter logs state
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logFilterClient, setLogFilterClient] = useState('all');
  const [logFilterActionType, setLogFilterActionType] = useState('all');

  // Fetch client registration registry from Firestore
  const fetchClients = async () => {
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, 'client_accounts'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const list: ClientAccount[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        list.push({
          id: doc.id,
          username: data.username || '',
          email: data.email || '',
          status: data.status || 'active',
          role: data.role || 'client',
          notes: data.notes || '',
          createdAt: data.createdAt ? (data.createdAt.seconds ? new Date(data.createdAt.seconds * 1000).toLocaleString() : data.createdAt) : '-',
          updatedAt: data.updatedAt ? (data.updatedAt.seconds ? new Date(data.updatedAt.seconds * 1000).toLocaleString() : data.updatedAt) : '-',
        });
      });
      setClients(list);
    } catch (err: any) {
      console.error('Failed to resolve firestore document listing:', err);
      setError(language === 'id' 
        ? 'Gagal memuat daftar klien dari Firestore. Pastikan aturan database mengizinkan hak akses.' 
        : 'Failed to stream client accounts from Firestore. Ensure database security policies permit access.'
      );
      try {
        handleFirestoreError(err, OperationType.LIST, 'client_accounts');
      } catch (e) {
        // Logged
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch client account activity logs from Firestore
  const fetchActivityLogs = async () => {
    setLoadingLogs(true);
    try {
      const q = query(collection(db, 'client_activity_logs'));
      const querySnapshot = await getDocs(q);
      const list: ClientActivityLog[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          clientId: data.clientId || '',
          username: data.username || '',
          actionType: data.actionType || 'other',
          description: data.description || '',
          ipAddress: data.ipAddress || '',
          timestamp: data.timestamp || '',
        });
      });
      // Sort in-memory from newest to oldest based on timestamp
      list.sort((a, b) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timeB - timeA;
      });
      setActivityLogs(list);
    } catch (err: any) {
      console.error('Failed to retrieve activity log database:', err);
      try {
        handleFirestoreError(err, OperationType.LIST, 'client_activity_logs');
      } catch (e) {}
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchClients();
    fetchActivityLogs();
  }, [language]);

  // Create Client + Auto Action Logging
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !email.trim()) {
      setError(language === 'id' ? 'Harap isi semua kolom wajib' : 'Please fill all required fields');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const docId = 'client-' + Math.random().toString(36).substring(2, 11);
    const docData = {
      id: docId,
      username: username.trim(),
      email: email.trim().toLowerCase(),
      status: status,
      role: 'client' as const,
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      // 1. Write the client account document
      await setDoc(doc(db, 'client_accounts', docId), docData);

      // 2. Automatically log the registration event in our client_activity_logs
      const logId = 'log-' + Math.random().toString(36).substring(2, 11);
      const logPayload: ClientActivityLog = {
        id: logId,
        clientId: docId,
        username: username.trim(),
        actionType: 'other',
        description: `Client account created by administrator. Status: ${status}`,
        ipAddress: '127.0.0.1 (System)',
        timestamp: new Date().toISOString(),
      };
      await setDoc(doc(db, 'client_activity_logs', logId), logPayload);

      setSuccess(language === 'id' 
        ? `Akun Klien @${username} berhasil didaftarkan dan aktivitas dicatat!` 
        : `Client account @${username} registered and action auto-logged to database!`
      );
      setUsername('');
      setEmail('');
      setNotes('');
      setStatus('active');
      fetchClients();
      fetchActivityLogs();
    } catch (err: any) {
      setError(language === 'id'
        ? `Gagal mendaftarkan klien: ${err.message}`
        : `Failed to create client account: ${err.message}`
      );
      try {
        handleFirestoreError(err, OperationType.WRITE, `client_accounts/${docId}`);
      } catch (e) {}
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update Client + Auto Action Logging
  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const docRef = doc(db, 'client_accounts', editingClient.id);
    try {
      // 1. Update document
      await updateDoc(docRef, {
        status: editStatus,
        notes: editNotes.trim(),
        updatedAt: new Date().toISOString(),
      });

      // 2. If status was modified, write a specific security status change action log
      const logId = 'log-' + Math.random().toString(36).substring(2, 11);
      const isStatusChanged = editingClient.status !== editStatus;
      const logPayload: ClientActivityLog = {
        id: logId,
        clientId: editingClient.id,
        username: editingClient.username,
        actionType: isStatusChanged ? 'status_change' : 'other',
        description: isStatusChanged 
          ? `Privileges/Status changed from '${editingClient.status}' to '${editStatus}'.`
          : `Client administrative parameters & notes modified by admin.`,
        ipAddress: '127.0.0.1 (System)',
        timestamp: new Date().toISOString(),
      };
      await setDoc(doc(db, 'client_activity_logs', logId), logPayload);

      setSuccess(language === 'id' 
        ? `Akun Klien @${editingClient.username} berhasil diupdate!` 
        : `Client account @${editingClient.username} updated and log tracked!`
      );
      setEditingClient(null);
      fetchClients();
      fetchActivityLogs();
    } catch (err: any) {
      setError(language === 'id'
        ? `Gagal menyunting klien: ${err.message}`
        : `Failed to update client account: ${err.message}`
      );
      try {
        handleFirestoreError(err, OperationType.UPDATE, `client_accounts/${editingClient.id}`);
      } catch (e) {}
    } finally {
      setIsSubmitting(false);
    }
  };

  // Remove Client + Track in Action Log
  const handleRemoveClient = async (id: string, name: string) => {
    const confirmMsg = language === 'id'
      ? `Apakah Anda yakin ingin menghapus akun klien @${name} secara permanen dari Firestore?`
      : `Are you absolutely sure you want to permanently remove client @${name} from Firestore?`;
    
    if (!window.confirm(confirmMsg)) return;

    setError(null);
    setSuccess(null);

    try {
      // 1. Write deletion activity log prior/post to avoid orphans if needed
      const logId = 'log-' + Math.random().toString(36).substring(2, 11);
      const logPayload: ClientActivityLog = {
        id: logId,
        clientId: id,
        username: name,
        actionType: 'other',
        description: `Client account was permanently removed from database registry.`,
        ipAddress: '127.0.0.1 (System)',
        timestamp: new Date().toISOString(),
      };
      await setDoc(doc(db, 'client_activity_logs', logId), logPayload);

      // 2. Execute deletion
      await deleteDoc(doc(db, 'client_accounts', id));

      setSuccess(language === 'id'
        ? `Akun Klien @${name} berhasil dihapus dari Cloud Firestore.`
        : `Client account @${name} removed successfully from Cloud Firestore.`
      );
      fetchClients();
      fetchActivityLogs();
    } catch (err: any) {
      setError(language === 'id'
        ? `Gagal menghapus klien: ${err.message}`
        : `Failed to remove client account: ${err.message}`
      );
      try {
        handleFirestoreError(err, OperationType.DELETE, `client_accounts/${id}`);
      } catch (e) {}
    }
  };

  // Simulate client interactions (Login, Deploy App, NPM Install, etc.)
  const handleSimulateAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientForSimulator) {
      setError(language === 'id' ? 'Silakan pilih akun klien untuk simulasi.' : 'Please select a client account to simulate.');
      return;
    }

    const client = clients.find(c => c.id === selectedClientForSimulator);
    if (!client) return;

    setIsSubmittingLog(true);
    setError(null);
    setSuccess(null);

    const logId = 'log-' + Math.random().toString(36).substring(2, 11);
    
    // Default fallback messages for quick simulations
    let desc = simulatedDescription.trim();
    if (!desc) {
      if (simulatedActionType === 'login') desc = `Client signed in to application dashboard securely.`;
      else if (simulatedActionType === 'logout') desc = `Client session ended. Token cleared.`;
      else if (simulatedActionType === 'create_server') desc = `Client generated a new virtual microserver instance.`;
      else if (simulatedActionType === 'delete_server') desc = `Client terminated hosting nodes manually.`;
      else if (simulatedActionType === 'deploy_app') desc = `Client deployed production script bundle successful.`;
      else desc = `Client performed actions: ${simulatedActionType}.`;
    }

    const logPayload: ClientActivityLog = {
      id: logId,
      clientId: client.id,
      username: client.username,
      actionType: simulatedActionType,
      description: desc,
      ipAddress: simulatedIp.trim() || '203.111.45.18',
      timestamp: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'client_activity_logs', logId), logPayload);
      setSuccess(language === 'id'
        ? `Simulasi aktivitas klien @${client.username} berhasil dicatat!`
        : `Successful client action simulation for @${client.username}! Log updated.`
      );
      setSimulatedDescription('');
      fetchActivityLogs();
    } catch (err: any) {
      setError(language === 'id'
        ? `Gagal mencatat simulasi: ${err.message}`
        : `Failed to write simulated log: ${err.message}`
      );
      try {
        handleFirestoreError(err, OperationType.WRITE, `client_activity_logs/${logId}`);
      } catch (e) {}
    } finally {
      setIsSubmittingLog(false);
    }
  };

  // Remove individual activity log entry
  const handleRemoveLog = async (id: string) => {
    if (!window.confirm(language === 'id' ? 'Hapus baris log ini?' : 'Permanently remove this log entry?')) return;
    try {
      await deleteDoc(doc(db, 'client_activity_logs', id));
      setSuccess(language === 'id' ? 'Baris log dihapus.' : 'Log entry removed from Firestore.');
      fetchActivityLogs();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Clear all log representations matching current filter to test DB rules/scalability limits
  const handlePurgeLogs = async () => {
    if (!window.confirm(language === 'id' 
      ? 'Apakah Anda yakin ingin menghapus LOG LOKAL yang tampil? (Ini akan melakukan penghapusan satu per satu dari Firestore)' 
      : 'Are you sure you want to clean up/purge displayed activity logs? (Requires separate Firestore delete triggers)'
    )) return;

    setError(null);
    setSuccess(null);
    let count = 0;
    try {
      for (const log of filteredLogs) {
        await deleteDoc(doc(db, 'client_activity_logs', log.id));
        count++;
      }
      setSuccess(language === 'id'
        ? `Data berhasil dibersihkan! ${count} entri log dihapus dari Firestore.`
        : `Activity log database successfully purged! ${count} entries deleted.`
      );
      fetchActivityLogs();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Filter logs locally based on search keywords and client filters
  const filteredLogs = activityLogs.filter(log => {
    const matchesSearch = 
      log.username.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
      log.description.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
      (log.ipAddress && log.ipAddress.includes(logSearchQuery));
    
    const matchesClient = logFilterClient === 'all' || log.clientId === logFilterClient;
    const matchesAction = logFilterActionType === 'all' || log.actionType === logFilterActionType;

    return matchesSearch && matchesClient && matchesAction;
  });

  // Pick suitable Lucide Icons for action metrics
  const getActionIcon = (type: string) => {
    switch (type) {
      case 'login':
        return <Key className="w-4 h-4 text-emerald-400" />;
      case 'logout':
        return <LogOut className="w-4 h-4 text-slate-400" />;
      case 'create_server':
        return <Server className="w-4 h-4 text-indigo-400" />;
      case 'delete_server':
        return <Trash2 className="w-4 h-4 text-rose-400" />;
      case 'status_change':
        return <Sliders className="w-4 h-4 text-amber-400" />;
      case 'deploy_app':
        return <CloudLightning className="w-4 h-4 text-cyan-400" />;
      case 'simulation':
        return <Flame className="w-4 h-4 text-orange-400" />;
      default:
        return <Activity className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div id="firestore-management-container" className="space-y-8">
      
      {/* Notifications */}
      {error && (
        <div id="firestore-error-alert" className="bg-rose-950/30 border border-rose-900/50 text-rose-400 p-4 rounded-2xl text-xs font-mono flex items-center gap-3 animate-slideIn">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div id="firestore-success-alert" className="bg-emerald-950/30 border border-emerald-900/50 text-emerald-400 p-4 rounded-2xl text-xs font-mono flex items-center gap-3 animate-slideIn">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Registration Form / Edit Form */}
        <div className="lg:col-span-1 space-y-6">
          
          {editingClient ? (
            <div id="firestore-edit-card" className="bg-slate-900/20 border border-slate-900 rounded-3xl p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-900/80 pb-3">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400 font-mono">
                    {language === 'id' ? 'Sunting Data Klien' : 'Edit Client Data'}
                  </h3>
                </div>
                <button 
                  onClick={() => setEditingClient(null)} 
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleUpdateClient} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">Username</label>
                  <input 
                    type="text" 
                    disabled 
                    value={`@${editingClient.username}`}
                    className="w-full bg-slate-950/20 border border-slate-900/50 rounded-xl px-3 py-2 text-xs text-slate-500 font-mono outline-none cursor-not-allowed" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">Email</label>
                  <input 
                    type="text" 
                    disabled 
                    value={editingClient.email}
                    className="w-full bg-slate-950/20 border border-slate-900/50 rounded-xl px-3 py-2 text-xs text-slate-500 font-mono outline-none cursor-not-allowed" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                    {language === 'id' ? 'Status Akun Klien' : 'Client Account Status'}
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full bg-slate-950/80 border border-slate-900 rounded-xl px-3 py-2.5 text-xs text-slate-300 outline-none"
                  >
                    <option value="active">Active (Aktif)</option>
                    <option value="suspended">Suspended (Ditangguhkan)</option>
                    <option value="disabled">Disabled (Dinonaktifkan)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                    {language === 'id' ? 'Catatan Klien' : 'Client Notes'}
                  </label>
                  <textarea
                    rows={4}
                    placeholder={language === 'id' ? 'Catatan tambahan administrator...' : 'Additional administrator details...'}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-900 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500 font-mono font-normal"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold font-mono uppercase tracking-wider rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Updating...' : (language === 'id' ? 'Simpan Perubahan' : 'Save Parameters')}
                </button>
              </form>
            </div>
          ) : (
            <div id="firestore-add-card" className="bg-slate-900/20 border border-slate-900 rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-900/80 pb-3">
                <UserPlus className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200 font-mono">
                  {language === 'id' ? 'Tambah Akun Klien' : 'Add Client Account'}
                </h3>
              </div>

              <form onSubmit={handleCreateClient} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-slate-400 tracking-wider flex items-center gap-1">
                    <User className="w-3 h-3 text-indigo-400" /> Username *
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. client_abadi" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-900 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500 font-mono" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-slate-400 tracking-wider flex items-center gap-1">
                    <Mail className="w-3 h-3 text-indigo-400" /> Email *
                  </label>
                  <input 
                    type="email" 
                    required
                    placeholder="client@corporate.id" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-900 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500 font-mono" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                    {language === 'id' ? 'Status Awal' : 'Initial Status'}
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-slate-950/80 border border-slate-900 rounded-xl px-3 py-2.5 text-xs text-slate-300 outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                    {language === 'id' ? 'Catatan Administratif' : 'Administrative Notes'}
                  </label>
                  <textarea
                    rows={2}
                    placeholder={language === 'id' ? 'Catatan opsional...' : 'Optional metadata / notes...'}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-900 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold font-mono uppercase tracking-wider rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Registering...' : (language === 'id' ? 'Daftarkan ke Cloud' : 'Register to Cloud')}
                </button>
              </form>
            </div>
          )}

          {/* ACTIVITY LOGGER SIMULATOR */}
          <div id="firestore-simulation-card" className="bg-slate-900/20 border border-slate-900 rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-900/80 pb-3">
              <Flame className="w-4 h-4 text-orange-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200 font-mono">
                {language === 'id' ? 'Simulasi Aktivitas Klien' : 'Simulate Client Actions'}
              </h3>
            </div>

            <form onSubmit={handleSimulateAction} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                  {language === 'id' ? 'Pilih Akun Klien' : 'Select Client Account'}
                </label>
                <select
                  required
                  value={selectedClientForSimulator}
                  onChange={(e) => setSelectedClientForSimulator(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-900 rounded-xl px-3 py-2.5 text-xs text-slate-300 outline-none"
                >
                  <option value="">-- {language === 'id' ? 'Pilih Klien' : 'Choose Client'} --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>@{c.username} ({c.email})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                  {language === 'id' ? 'Jenis Tindakan' : 'Action Type'}
                </label>
                <select
                  value={simulatedActionType}
                  onChange={(e) => setSimulatedActionType(e.target.value as any)}
                  className="w-full bg-slate-950/80 border border-slate-900 rounded-xl px-3 py-2.5 text-xs text-slate-300 outline-none"
                >
                  <option value="login">🔐 login (Masuk)</option>
                  <option value="logout">🚪 logout (Keluar)</option>
                  <option value="create_server">⚙️ create_server (Buat Server)</option>
                  <option value="delete_server">🗑️ delete_server (Hapus Server)</option>
                  <option value="status_change">🛠️ status_change (Kondisi Privilege)</option>
                  <option value="deploy_app">🚀 deploy_app (Deploy Hosting)</option>
                  <option value="simulation">🔥 simulation (Lainnya)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                  {language === 'id' ? 'Alamat IP (Simulasi)' : 'IP Address (Simulated)'}
                </label>
                <input 
                  type="text" 
                  value={simulatedIp}
                  onChange={(e) => setSimulatedIp(e.target.value)}
                  placeholder="e.g. 180.244.180.12"
                  className="w-full bg-slate-950/50 border border-slate-900 rounded-xl px-3 py-2 text-xs text-slate-250 outline-none focus:border-indigo-500 font-mono" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                  {language === 'id' ? 'Keterangan Tindakan' : 'Log Description'}
                </label>
                <textarea
                  rows={2}
                  placeholder={language === 'id' ? 'Biarkan kosong untuk deskripsi default...' : 'Leave blank for default description...'}
                  value={simulatedDescription}
                  onChange={(e) => setSimulatedDescription(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-900 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmittingLog || !selectedClientForSimulator}
                className="w-full py-2 bg-orange-600 hover:bg-orange-500 text-slate-950 text-xs font-bold font-mono uppercase tracking-wider rounded-xl cursor-pointer disabled:opacity-40"
              >
                {isSubmittingLog ? 'Logging Action...' : (language === 'id' ? 'Simulasikan & Catat Log' : 'Simulate & Create Log')}
              </button>
            </form>
          </div>

        </div>

        {/* Clients Table Panel & Activity Logs Database */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* CLIENTS REGISTRY BOARD */}
          <div className="bg-slate-900/10 border border-slate-900 rounded-3xl p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-900">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-400" />
                <div>
                  <h4 className="text-xs font-bold text-white font-mono uppercase">
                    {language === 'id' ? 'Pusat Manajemen Klien Firestore' : 'Live Firestore Client List'}
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    {language === 'id' ? 'Satu-satunya instansi sinkronisasi real-time database cloud' : 'Synced document streams of client entries'}
                  </p>
                </div>
              </div>
              
              <button 
                onClick={fetchClients} 
                disabled={loading}
                className="p-2 bg-slate-900 hover:bg-slate-800 text-indigo-400 rounded-xl cursor-pointer disabled:opacity-55"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400 space-y-2 font-mono text-xs">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto text-indigo-500" />
                <p>{language === 'id' ? 'Memuat registri klien...' : 'Loading Client registries...'}</p>
              </div>
            ) : clients.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-1 font-mono text-xs">
                <p className="font-bold text-slate-500">{language === 'id' ? 'Belum ada klien terdaftar' : 'No clients found'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {clients.map((cli) => (
                  <div 
                    key={cli.id} 
                    id={`client-card-${cli.id}`}
                    className="bg-slate-950/40 border border-slate-900/80 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-800 transition-all"
                  >
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-xs font-bold text-slate-200 font-mono">@{cli.username}</span>
                          <span className="text-[10px] text-slate-450 font-mono block select-all">{cli.email}</span>
                        </div>
                        
                        <span className={`text-[9px] font-mono font-bold tracking-wider uppercase px-1.5 py-0.5 rounded ${
                          cli.status === 'active' 
                            ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20' 
                            : cli.status === 'suspended'
                            ? 'bg-amber-950/40 text-amber-400 border border-amber-550/20'
                            : 'bg-rose-950/40 text-rose-400 border border-rose-500/20'
                        }`}>
                          {cli.status}
                        </span>
                      </div>

                      {cli.notes && (
                        <p className="text-[10px] text-slate-400 bg-slate-950/90 p-2 rounded-lg font-mono leading-relaxed border border-slate-900">
                          {cli.notes}
                        </p>
                      )}
                    </div>

                    <div className="border-t border-slate-900/60 mt-3 pt-2.5 flex justify-between items-center">
                      <button
                        onClick={() => {
                          setLogFilterClient(cli.id);
                          setSuccess(language === 'id' ? `Menampilkan log khusus @${cli.username}` : `Filtered activity log showing @${cli.username}`);
                        }}
                        className="text-[9.5px] font-bold text-indigo-400 hover:text-indigo-350 bg-indigo-950/20 px-2 py-1 rounded-lg cursor-pointer font-mono"
                      >
                        🔎 View Logs
                      </button>

                      <div className="flex gap-1.5">
                        <button
                          onClick={() => {
                            setDebugDocType('client');
                            setSelectedDebugDoc(cli);
                          }}
                          className="p-1 bg-slate-900 hover:bg-slate-800 text-indigo-400 rounded-lg cursor-pointer"
                          title="Raw JSON"
                        >
                          <FileJson className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingClient(cli);
                            setEditStatus(cli.status);
                            setEditNotes(cli.notes || '');
                          }}
                          className="p-1 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-lg cursor-pointer"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleRemoveClient(cli.id, cli.username)}
                          className="p-1 bg-slate-900 hover:bg-slate-800 text-rose-450 rounded-lg cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* DYNAMIC ACCOUNT ACTIVITY LOG ENGINE */}
          <div id="firestore-logs-panel" className="bg-slate-900/10 border border-slate-900 rounded-3xl p-6 space-y-4">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-900">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                <div>
                  <h4 className="text-xs font-bold text-white font-mono uppercase flex items-center gap-2">
                    {language === 'id' ? 'LOG AKTIVITAS CLIENT (CLOUDFIRESTORE)' : 'CLIENT ACCOUNT ACTIVITY LOGS'}
                    <span className="text-[10px] bg-indigo-900/30 text-indigo-300 border border-indigo-700/20 font-light font-mono px-2 py-0.5 rounded-full">
                      {filteredLogs.length} live entries
                    </span>
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    {language === 'id' ? 'Status autentikasi sesi, pembuatan host, & rekam jejak operasi klien' : 'Database record of client sessions, server controls & privilege transitions'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {filteredLogs.length > 0 && (
                  <button
                    onClick={handlePurgeLogs}
                    className="text-[9.5px] font-bold font-mono uppercase bg-rose-950/20 hover:bg-rose-900/30 border border-rose-900/30 text-rose-450 px-2.5 py-1 rounded-xl cursor-pointer"
                    title="Purge Logs from Firestore"
                  >
                    🗑️ Purge Logs
                  </button>
                )}
                <button 
                  onClick={fetchActivityLogs} 
                  disabled={loadingLogs}
                  className="p-2 bg-slate-900 hover:bg-slate-800 text-emerald-400 rounded-xl cursor-pointer disabled:opacity-55"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Logs Search and Filter Multi-Workspace */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/30 p-4 rounded-2xl border border-slate-900/60">
              
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                  <Search className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  placeholder={language === 'id' ? 'Cari deskripsi, ip, user...' : 'Search logs description...'}
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-900 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <select
                  value={logFilterClient}
                  onChange={(e) => setLogFilterClient(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-900 rounded-xl px-3 py-2 text-xs text-slate-350 outline-none font-mono"
                >
                  <option value="all">👥 [ {language === 'id' ? 'Semua User Klien' : 'All Clients'} ]</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>@{c.username}</option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={logFilterActionType}
                  onChange={(e) => setLogFilterActionType(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-900 rounded-xl px-3 py-2 text-xs text-slate-350 outline-none font-mono"
                >
                  <option value="all">🛡️ [ {language === 'id' ? 'Semua Kategori' : 'All Actions'} ]</option>
                  <option value="login">🔐 login</option>
                  <option value="logout">🚪 logout</option>
                  <option value="create_server">⚙️ create_server</option>
                  <option value="delete_server">🗑️ delete_server</option>
                  <option value="status_change">🛠️ status_change</option>
                  <option value="deploy_app">🚀 deploy_app</option>
                  <option value="simulation">🔥 simulation</option>
                  <option value="other">💬 other</option>
                </select>
              </div>

            </div>

            {/* Logs Table Container */}
            <div className="bg-slate-950/20 border border-slate-900/50 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-mono text-xs">
                  <thead>
                    <tr className="bg-slate-950/80 border-b border-slate-900 text-slate-400 font-bold uppercase text-[9.5px] tracking-wider">
                      <th className="py-2.5 px-4">{language === 'id' ? 'KLIEN' : 'CLIENT'}</th>
                      <th className="py-2.5 px-4">{language === 'id' ? 'TINDAKAN' : 'ACTION'}</th>
                      <th className="py-2.5 px-4">{language === 'id' ? 'DESKRIPSI' : 'DESCRIPTION'}</th>
                      <th className="py-2.5 px-4">IP ADDRESS</th>
                      <th className="py-2.5 px-4">{language === 'id' ? 'WAKTU (UTC)' : 'TIMESTAMP'}</th>
                      <th className="py-2.5 px-4 text-center">OP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                    {loadingLogs ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500 italic">
                          {language === 'id' ? 'Melakukan kueri sinkronisasi Firestore logs...' : 'Querying Firestore database records...'}
                        </td>
                      </tr>
                    ) : filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-500 italic">
                          {language === 'id' ? 'Tidak menemukan baris log aktivitas.' : 'No account activity logs matched.'}
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="py-3 px-4 font-bold text-indigo-300">
                            @{log.username}
                          </td>
                          <td className="py-3 px-4">
                            <span className="flex items-center gap-1.5 font-bold uppercase text-[10px] tracking-tight">
                              {getActionIcon(log.actionType)}
                              {log.actionType}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-300 text-[11px] max-w-xs break-words">
                            {log.description}
                          </td>
                          <td className="py-3 px-4 text-slate-400 font-semibold select-all text-[11px]">
                            {log.ipAddress || '-'}
                          </td>
                          <td className="py-3 px-4 text-slate-450 text-[10.5px]">
                            {log.timestamp ? new Date(log.timestamp).toLocaleString() : '-'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => {
                                  setDebugDocType('log');
                                  setSelectedDebugDoc(log);
                                }}
                                className="p-1 text-indigo-400 hover:text-white hover:bg-slate-900 rounded-md cursor-pointer"
                                title="JSON representation"
                              >
                                <FileJson className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleRemoveLog(log.id)}
                                className="p-1 text-rose-455 hover:text-rose-400 hover:bg-slate-900 rounded-md cursor-pointer"
                                title="Delete Log entry"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Reset Filters Quick Shortcut banner */}
            {(logFilterClient !== 'all' || logFilterActionType !== 'all' || logSearchQuery) && (
              <div className="text-center">
                <button
                  onClick={() => {
                    setLogFilterClient('all');
                    setLogFilterActionType('all');
                    setLogSearchQuery('');
                  }}
                  className="text-[10.5px] font-bold text-indigo-400 hover:text-indigo-350 cursor-pointer font-mono"
                >
                  🧹 Clear search parameters and show all activity historical logs
                </button>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Raw JSON Debug Dialog for Clients / Logs */}
      {selectedDebugDoc && (
        <div id="firestore-json-dialog" className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center px-6 py-4 bg-slate-950/50 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-semibold text-slate-200 uppercase font-mono tracking-wider">
                  Firestore Instance {debugDocType === 'client' ? 'Client Document' : 'Activity Log Entry'} Payload
                </h3>
              </div>
              <button 
                onClick={() => setSelectedDebugDoc(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto bg-slate-950 text-indigo-300 font-mono text-xs leading-relaxed max-w-full">
              <pre className="select-all whitespace-pre-wrap break-all bg-slate-950 p-4 rounded-xl">
                {JSON.stringify(selectedDebugDoc, null, 2)}
              </pre>
            </div>

            <div className="p-4 bg-slate-900/50 border-t border-slate-800 flex justify-end">
              <button 
                onClick={() => setSelectedDebugDoc(null)}
                className="px-4 py-2 bg-slate-1000 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold font-mono cursor-pointer"
              >
                Close Representational Value
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
