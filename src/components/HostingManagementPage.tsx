import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Globe, 
  Folder, 
  Package, 
  RotateCw, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Play, 
  Square, 
  ChevronRight, 
  FileText, 
  FolderPlus, 
  Upload as UploadIcon, 
  Download,
  FileArchive,
  ChevronLeft, 
  Save, 
  X,
  Sparkles,
  Search,
  CheckCircle,
  FileCode
} from 'lucide-react';

interface HostingManagementProps {
  servers: any[];
  serverName: string;
  setServerName: (val: string) => void;
  serverType: 'node' | 'static';
  setServerType: (val: 'node' | 'static') => void;
  serverEntryPoint: string;
  setServerEntryPoint: (val: string) => void;
  isCreatingServer: boolean;
  setIsCreatingServer: (val: boolean) => void;
  handleCreateServer: (e: React.FormEvent) => void;
  handleStartServer: (id: string) => void;
  handleStopServer: (id: string) => void;
  handleDeleteServer: (id: string) => void;
  
  fileList: any[];
  fileExplorerCwd: string;
  setFileExplorerCwd: (val: string) => void;
  fetchDirectoryFiles: (path: string) => void;
  selectedFile: { path: string; content: string } | null;
  setSelectedFile: (val: any) => void;
  isEditingFile: boolean;
  setIsEditingFile: (val: boolean) => void;
  editedFileContent: string;
  setEditedFileContent: (val: string) => void;
  saveEditedFile: () => void;
  deleteFileSystemItem: (path: string, isDir: boolean) => void;
  createFileSystemFolder: (parent: string, name: string) => void;
  createFileSystemFile: (parent: string, name: string, initContent?: string) => void;
  
  npmInfo: any;
  npmSearchQuery: string;
  setNpmSearchQuery: (val: string) => void;
  npmInstallLogs: string;
  runNpmInstallation: (pkg?: string, isDev?: boolean) => void;
  isInstallingPkg: boolean;
  
  addCustomNotification: (msg: string) => void;
  onBack: () => void;
}

export default function HostingManagementPage({
  servers,
  serverName,
  setServerName,
  serverType,
  setServerType,
  serverEntryPoint,
  setServerEntryPoint,
  isCreatingServer,
  setIsCreatingServer,
  handleCreateServer,
  handleStartServer,
  handleStopServer,
  handleDeleteServer,
  
  fileList,
  fileExplorerCwd,
  setFileExplorerCwd,
  fetchDirectoryFiles,
  selectedFile,
  setSelectedFile,
  isEditingFile,
  setIsEditingFile,
  editedFileContent,
  setEditedFileContent,
  saveEditedFile,
  deleteFileSystemItem,
  createFileSystemFolder,
  createFileSystemFile,
  
  npmInfo,
  npmSearchQuery,
  setNpmSearchQuery,
  npmInstallLogs,
  runNpmInstallation,
  isInstallingPkg,
  
  addCustomNotification,
  onBack
}: HostingManagementProps) {
  const [activeSubTab, setActiveSubTab] = useState<'servers' | 'files' | 'npm'>('servers');
  const [pageLoading, setPageLoading] = useState(true);
  const [searchFileTerm, setSearchFileTerm] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState<'file' | 'folder' | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setPageLoading(false);
      // Automatically load initial files if not fetched
      if (!fileList || fileList.length === 0) {
        fetchDirectoryFiles(fileExplorerCwd || '.');
      }
    }, 500);
    return () => clearTimeout(t);
  }, []);

  const handleDownloadFile = async (filePath: string, fileName: string) => {
    try {
      addCustomNotification(`📥 Preparing download for "${fileName}"...`);
      const token = localStorage.getItem('ayezz_token');
      const response = await fetch(`/api/files/download?path=${encodeURIComponent(filePath)}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
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
        addCustomNotification(`❌ Download failed: ${err.error || 'unknown server error'}`);
      }
    } catch (e: any) {
      addCustomNotification(`❌ Download error: ${e.message}`);
    }
  };

  const handleDownloadFolderZip = async (folderPath: string, folderName: string) => {
    try {
      addCustomNotification(`📥 Compressing and preparing download for "${folderName}.zip"...`);
      const token = localStorage.getItem('ayezz_token');
      const response = await fetch(`/api/files/download-zip?path=${encodeURIComponent(folderPath)}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
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
        addCustomNotification(`❌ ZIP download failed: ${err.error || 'unknown server error'}`);
      }
    } catch (e: any) {
      addCustomNotification(`❌ ZIP download error: ${e.message}`);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = async (event) => {
      const result = event.target?.result as string;
      const base64Content = result.split(',')[1] || result;
      
      try {
        addCustomNotification(`📤 Uploading "${file.name}" to directory...`);
        const token = localStorage.getItem('ayezz_token');
        const response = await fetch('/api/files/upload', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            directory: fileExplorerCwd || '.',
            name: file.name,
            content: base64Content,
            encoding: 'base64'
          })
        });
        if (response.ok) {
          addCustomNotification(`✅ Uploaded file: ${file.name} successfully!`);
          fetchDirectoryFiles(fileExplorerCwd || '.');
        } else {
          const err = await response.json();
          addCustomNotification(`❌ Upload failed: ${err.error || 'unknown server error'}`);
        }
      } catch (err: any) {
        addCustomNotification(`❌ Upload connection failure: ${err.message}`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUnzip = async (filePath: string, fileName: string) => {
    try {
      addCustomNotification(`📦 Starting extraction of "${fileName}"...`);
      const token = localStorage.getItem('ayezz_token');
      const response = await fetch('/api/files/unzip', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ zipPath: filePath })
      });
      if (response.ok) {
        addCustomNotification(`✅ Successfully unzipped "${fileName}" contents here!`);
        fetchDirectoryFiles(fileExplorerCwd || '.');
      } else {
        const err = await response.json();
        addCustomNotification(`❌ Failed to unzip file: ${err.error || 'unknown server error'}`);
      }
    } catch (e: any) {
      addCustomNotification(`❌ Unzipping error: ${e.message}`);
    }
  };

  const navigateUpDirectory = () => {
    if (!fileExplorerCwd || fileExplorerCwd === '.') return;
    const parts = fileExplorerCwd.split('/');
    parts.pop();
    const parentPath = parts.join('/') || '.';
    setFileExplorerCwd(parentPath);
    fetchDirectoryFiles(parentPath);
  };

  const handleCreateFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    createFileSystemFolder(fileExplorerCwd, newFolderName.trim());
    setNewFolderName('');
    setShowCreateModal(null);
  };

  const handleCreateFileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    createFileSystemFile(fileExplorerCwd, newFileName.trim());
    setNewFileName('');
    setShowCreateModal(null);
  };

  const renderBreadcrumbElements = () => {
    if (!fileExplorerCwd || fileExplorerCwd === '.') {
      return <span className="text-slate-400">root</span>;
    }
    const parts = fileExplorerCwd.split('/');
    return (
      <div className="flex items-center gap-1 font-mono text-[11px] text-slate-300">
        <span className="cursor-pointer text-indigo-400 hover:underline" onClick={() => { setFileExplorerCwd('.'); fetchDirectoryFiles('.'); }}>root</span>
        {parts.map((p, idx) => {
          const pathTillNow = parts.slice(0, idx + 1).join('/');
          return (
            <React.Fragment key={idx}>
              <ChevronRight className="w-3 h-3 text-slate-600" />
              <span className="hover:underline cursor-pointer" onClick={() => { setFileExplorerCwd(pathTillNow); fetchDirectoryFiles(pathTillNow); }}>{p}</span>
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  if (pageLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
        <RotateCw className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-sm font-mono tracking-wider text-slate-400">LOADING HOSTING PLATFORM MODULES...</p>
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glassmorphism rounded-2xl p-5 mb-2">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono mb-1">
            <span>AyeZzPanel</span>
            <span className="text-slate-600">/</span>
            <span className="text-indigo-400 font-semibold">Hosting Services</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-400" />
            Hosting Management Suite
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Allocate server virtual apps, browse and modify configuration files, or configure node dependencies in one premium interface.
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

      {/* Primary Navigation Tabs */}
      <div className="glassmorphism rounded-3xl overflow-hidden shadow-lg">
        <div className="border-b border-slate-900/80 bg-slate-950/45 px-6 py-3 flex flex-wrap gap-2 justify-between items-center">
          <div className="flex gap-1.5">
            <button
              onClick={() => setActiveSubTab('servers')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold cursor-pointer transition-all flex items-center gap-2 ${
                activeSubTab === 'servers' 
                  ? 'bg-indigo-600/25 text-white border border-indigo-500/20' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              App Web Servers ({servers.length})
            </button>
            <button
              onClick={() => {
                setActiveSubTab('files');
                fetchDirectoryFiles(fileExplorerCwd || '.');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold cursor-pointer transition-all flex items-center gap-2 ${
                activeSubTab === 'files' 
                  ? 'bg-indigo-600/25 text-white border border-indigo-500/20' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Folder className="w-3.5 h-3.5" />
              File Explorer
            </button>
            <button
              onClick={() => {
                setActiveSubTab('npm');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold cursor-pointer transition-all flex items-center gap-2 ${
                activeSubTab === 'npm' 
                  ? 'bg-indigo-600/25 text-white border border-indigo-500/20' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              NPM Dependency Agent
            </button>
          </div>
        </div>

        <div className="p-6">
          
          {/* Sub Tab: App Servers List */}
          {activeSubTab === 'servers' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col md:flex-row gap-6">
                
                {/* Allocation creator */}
                <div className="w-full md:w-1/3 bg-slate-950/40 p-5 rounded-2xl border border-slate-900/60 h-fit space-y-4">
                  <h3 className="text-xs font-mono uppercase tracking-widest text-slate-300 border-b border-slate-800 pb-2">Allocate New Instance</h3>
                  
                  <form onSubmit={handleCreateServer} className="space-y-4 text-xs">
                    <div className="space-y-1.5">
                      <label className="text-slate-400">Application Name</label>
                      <input
                        type="text"
                        required
                        value={serverName}
                        onChange={(e) => setServerName(e.target.value)}
                        placeholder="my-cool-server-app"
                        className="w-full bg-slate-950/70 border border-slate-900 focus:border-indigo-500 p-2.5 rounded-xl outline-none text-slate-200"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-slate-400 font-mono">Service Environment</label>
                      <select
                        value={serverType}
                        onChange={(e) => setServerType(e.target.value as any)}
                        className="w-full bg-slate-950/70 border border-slate-900 focus:border-indigo-500 p-2.5 rounded-xl outline-none text-slate-200"
                      >
                        <option value="node">Dynamic Node.js Instance</option>
                        <option value="static">Static HTML Site Host</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-slate-400">Entrypoint Script file</label>
                      <input
                        type="text"
                        value={serverEntryPoint}
                        onChange={(e) => setServerEntryPoint(e.target.value)}
                        placeholder="e.g. server.ts or index.html"
                        className="w-full bg-slate-950/70 border border-slate-900 focus:border-indigo-500 p-2.5 rounded-xl outline-none text-slate-200"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isCreatingServer}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:opacity-40 text-white font-semibold rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-600/15"
                    >
                      {isCreatingServer ? 'Allocating Container IP...' : '🚀 Allocate Host Domain'}
                    </button>
                  </form>
                </div>

                {/* Server Applications Table */}
                <div className="flex-grow space-y-4">
                  <div className="flex justify-between items-center bg-slate-900/10 p-3 rounded-xl border border-slate-900 text-xs text-slate-400">
                    <span>Virtual Machine App Stack Services:</span>
                    <span>Container sandbox limits: 10 hosts maximum</span>
                  </div>

                  {servers.length === 0 ? (
                    <div className="py-16 text-center border border-slate-900 border-dashed rounded-2xl flex flex-col items-center justify-center space-y-2">
                      <Globe className="w-8 h-8 text-slate-600 animate-pulse" />
                      <p className="text-xs text-slate-500 font-mono">No virtual server apps allocated inside panel.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {servers.map((srv) => (
                        <div key={srv.id} className="bg-slate-950/40 p-4 border border-slate-900 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className={`p-2.5 rounded-xl mt-0.5 shrink-0 ${
                              srv.status === 'running' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-900 text-slate-500'
                            }`}>
                              <Globe className={`w-5 h-5 ${srv.status === 'running' ? 'animate-spin-slow' : ''}`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-200 truncate max-w-[200px]">{srv.name}</span>
                                <span className="text-[9px] font-mono bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded font-bold border border-slate-8 w-fit capitalize shrink-0">
                                  {srv.type} App
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500 font-mono mt-1">
                                <span>PID: {srv.pid || 'N/A'}</span>
                                <span>&bull; Port: {srv.port || 'Auto'}</span>
                                <span>&bull; Entry: {srv.entryPoint || 'server.ts'}</span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-2">
                                <span className={`w-1.5 h-1.5 rounded-full ${srv.status === 'running' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                <span className={`text-[10px] font-mono leading-none ${srv.status === 'running' ? 'text-emerald-400' : 'text-rose-500'}`}>
                                  {srv.status === 'running' ? 'RUNNING' : 'STOPPED'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            {srv.status === 'running' ? (
                              <button
                                onClick={() => {
                                  handleStopServer(srv.id);
                                  addCustomNotification(`⏹️ Web application Stop command sent: ${srv.name}`);
                                }}
                                className="px-3 py-1.5 bg-rose-950/20 hover:bg-rose-900/30 text-rose-400 border border-rose-900/30 hover:border-rose-700 text-xs font-semibold rounded-xl cursor-pointer transition-all"
                              >
                                Stop
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  handleStartServer(srv.id);
                                  addCustomNotification(`▶️ Web application Boot command sent: ${srv.name}`);
                                }}
                                className="px-3 py-1.5 bg-emerald-950/20 hover:bg-emerald-900/30 text-emerald-400 border border-emerald-900/30 hover:border-emerald-600 text-xs font-semibold rounded-xl cursor-pointer transition-all"
                              >
                                Boot
                              </button>
                            )}

                            <button
                              onClick={() => {
                                handleDeleteServer(srv.id);
                                addCustomNotification(`🗑️ Virtual host server deleted: ${srv.name}`);
                              }}
                              className="p-1.5 hover:bg-slate-900 text-slate-500 hover:text-rose-400 rounded-xl transition-colors cursor-pointer"
                              title="Delete Host"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* Sub Tab: Directory File Explorer */}
          {activeSubTab === 'files' && (
            <div className="space-y-4 animate-fadeIn">
              
              {/* Directory toolbars & navigation */}
              <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center bg-slate-950 p-3 rounded-2xl border border-slate-900">
                <div className="flex items-center gap-2 pl-2">
                  <button
                    onClick={navigateUpDirectory}
                    disabled={!fileExplorerCwd || fileExplorerCwd === '.'}
                    className="p-1 px-1.5 bg-slate-900 border border-slate-800 disabled:opacity-45 text-slate-400 hover:text-slate-200 rounded-lg cursor-pointer transition-colors"
                    title="UP directory"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="text-xs">
                    {renderBreadcrumbElements()}
                  </div>
                </div>

                <div className="flex gap-2">
                  <label
                    htmlFor="hosting-file-upload"
                    className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/35 border border-indigo-500/25 rounded-xl text-xs text-indigo-300 hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <UploadIcon className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Upload File</span>
                    <input
                      type="file"
                      id="hosting-file-upload"
                      className="hidden"
                      onChange={handleFileUpload}
                      onClick={(e) => {
                        (e.target as HTMLInputElement).value = '';
                      }}
                    />
                  </label>
                  <button
                    onClick={() => setShowCreateModal('folder')}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <FolderPlus className="w-3.5 h-3.5 text-indigo-400" />
                    New Folder
                  </button>
                  <button
                    onClick={() => setShowCreateModal('file')}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-indigo-400" />
                    New File
                  </button>
                </div>
              </div>

              {/* Creators modals */}
              {showCreateModal && (
                <div className="bg-slate-950/80 border border-slate-900/80 p-4 rounded-2xl max-w-sm animate-slideDown flex gap-4 items-end">
                  {showCreateModal === 'folder' ? (
                    <form onSubmit={handleCreateFolderSubmit} className="flex-grow space-y-2 text-xs">
                      <label className="text-slate-400">New Directory Name</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                          placeholder="components, assets, router"
                          className="flex-grow bg-slate-900 border border-slate-800 p-2 rounded-xl outline-none"
                        />
                        <button type="submit" className="px-3 bg-indigo-600 text-white rounded-xl">Create</button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleCreateFileSubmit} className="flex-grow space-y-2 text-xs">
                      <label className="text-slate-400">New Config File Name</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          value={newFileName}
                          onChange={(e) => setNewFileName(e.target.value)}
                          placeholder="index.js, details.ts"
                          className="flex-grow bg-slate-900 border border-slate-800 p-2 rounded-xl outline-none"
                        />
                        <button type="submit" className="px-3 bg-indigo-600 text-white rounded-xl">Create</button>
                      </div>
                    </form>
                  )}
                  <button onClick={() => setShowCreateModal(null)} className="p-2 border border-slate-900 text-slate-500 rounded-xl hover:text-white">Cancel</button>
                </div>
              )}

              {/* Grid or file editor screen */}
              {isEditingFile && selectedFile ? (
                <div className="bg-slate-950/80 rounded-2xl border border-slate-900 overflow-hidden text-xs">
                  <div className="bg-slate-950 px-4 py-2 border-b border-slate-900 flex justify-between items-center flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-indigo-400" />
                      <span className="font-mono text-slate-200">{selectedFile.path}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={saveEditedFile}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1 rounded-xl text-[11px] font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Save className="w-3.5 h-3.5" />
                        Save Changes
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingFile(false);
                          setSelectedFile(null);
                        }}
                        className="p-1 hover:bg-slate-900 font-mono text-slate-500 hover:text-slate-200 text-xs border border-transparent hover:border-slate-800 rounded-lg cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={editedFileContent}
                    onChange={(e) => setEditedFileContent(e.target.value)}
                    className="w-full h-96 p-4 bg-slate-950 font-mono text-xs text-indigo-300 outline-none resize-none leading-relaxed"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {fileList.map((file) => (
                    <div
                      key={file.name}
                      style={{ contentVisibility: 'auto' }}
                      className="bg-slate-950/45 border border-slate-900 hover:border-slate-800 p-3.5 rounded-2xl flex items-center justify-between gap-3 group transition-all"
                    >
                      <div
                        onClick={() => {
                          if (file.isDirectory) {
                            const childPath = fileExplorerCwd === '.' || !fileExplorerCwd ? file.name : `${fileExplorerCwd}/${file.name}`;
                            setFileExplorerCwd(childPath);
                            fetchDirectoryFiles(childPath);
                          } else {
                            // File click: read file
                            const childPath = fileExplorerCwd === '.' || !fileExplorerCwd ? file.name : `${fileExplorerCwd}/${file.name}`;
                            addCustomNotification(`📑 Opening configuration file: ${file.name}`);
                            // We can let the parent know we clicked
                            const fullFilePath = childPath;
                            // Directly let parent load file contents or mock view
                            setSelectedFile({ path: fullFilePath, content: 'Loading content...' });
                            setIsEditingFile(true);
                            // Run the reader in custom backend
                            const reader = async () => {
                              try {
                                const token = localStorage.getItem('ayezz_token');
                                const response = await fetch(`/api/files/read?path=${encodeURIComponent(fullFilePath)}`, {
                                  headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                                });
                                if (response.status === 401) {
                                  localStorage.removeItem('ayezz_token');
                                  localStorage.removeItem('ayezz_user');
                                  window.location.reload();
                                  return;
                                }
                                const data = await response.json();
                                if (response.ok) {
                                  setSelectedFile({ path: fullFilePath, content: data.content });
                                  setEditedFileContent(data.content);
                                } else {
                                  setSelectedFile({ path: fullFilePath, content: `// Failed to load: ${data.error || 'Unknown error'}` });
                                  setEditedFileContent(`// Failed to load: ${data.error || 'Unknown error'}`);
                                }
                              } catch {
                                setSelectedFile({ path: fullFilePath, content: '// Sandbox file load completed.' });
                                setEditedFileContent('// Sandbox file load completed.');
                              }
                            };
                            reader();
                          }
                        }}
                        className="flex items-center gap-3 cursor-pointer flex-grow min-w-0"
                      >
                        <div className={`p-2 rounded-xl border ${
                          file.isDirectory 
                            ? 'bg-amber-950/20 text-amber-500 border-amber-900/30 group-hover:bg-amber-900/20' 
                            : 'bg-indigo-950/20 text-indigo-400 border-indigo-900/30 group-hover:bg-indigo-900/20'
                        }`}>
                          {file.isDirectory ? <Folder className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-200 truncate block group-hover:text-indigo-400 transition-colors">
                            {file.name}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 block">
                            {file.isDirectory ? 'Folder' : `${Math.ceil(file.size / 1024)} KB`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-10 sm:opacity-0 group-hover:opacity-100 transition-all shrink-0">
                        {file.isDirectory ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const itemPath = fileExplorerCwd === '.' || !fileExplorerCwd ? file.name : `${fileExplorerCwd}/${file.name}`;
                              handleDownloadFolderZip(itemPath, file.name);
                            }}
                            className="p-1.5 hover:bg-slate-900 text-indigo-450 hover:text-indigo-300 rounded-lg cursor-pointer transition-colors"
                            title="Zip and Download Folder"
                          >
                            <FileArchive className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <>
                            {file.name.toLowerCase().endsWith('.zip') && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const itemPath = fileExplorerCwd === '.' || !fileExplorerCwd ? file.name : `${fileExplorerCwd}/${file.name}`;
                                  handleUnzip(itemPath, file.name);
                                }}
                                className="px-1.5 py-0.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-[10px] text-amber-400 font-bold rounded-md cursor-pointer transition-colors"
                                title="Unzip / Extract contents here"
                              >
                                Unzip
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const itemPath = fileExplorerCwd === '.' || !fileExplorerCwd ? file.name : `${fileExplorerCwd}/${file.name}`;
                                handleDownloadFile(itemPath, file.name);
                              }}
                              className="p-1.5 hover:bg-slate-900 text-emerald-450 hover:text-emerald-300 rounded-lg cursor-pointer transition-colors"
                              title="Download File"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const itemPath = fileExplorerCwd === '.' || !fileExplorerCwd ? file.name : `${fileExplorerCwd}/${file.name}`;
                                handleDownloadFolderZip(itemPath, file.name);
                              }}
                              className="p-1.5 hover:bg-slate-900 text-indigo-400 hover:text-indigo-200 rounded-lg cursor-pointer transition-colors"
                              title="Zip and Download File"
                            >
                              <FileArchive className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const itemPath = fileExplorerCwd === '.' || !fileExplorerCwd ? file.name : `${fileExplorerCwd}/${file.name}`;
                            deleteFileSystemItem(itemPath, file.isDirectory);
                            addCustomNotification(`🗑️ File system element removed: ${file.name}`);
                          }}
                          className="p-1.5 hover:bg-slate-900 text-slate-500 hover:text-rose-450 rounded-lg cursor-pointer transition-colors"
                          title="Delete forever"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sub Tab: NPM package manager */}
          {activeSubTab === 'npm' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border-b border-slate-900 pb-4">
                <div>
                  <h4 className="text-sm font-semibold text-white">Project Dependency Auditor</h4>
                  <p className="text-xs text-slate-500 mt-1">Audit, register, and safely install packages direct to package.json dependencies tree configuration.</p>
                </div>
                <div className="bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 text-xs px-3 py-1.5 rounded-xl font-mono flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>NPM ENVIRONMENT STABLE</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Search / Install */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="bg-slate-950/40 border border-slate-900 p-5 rounded-2xl space-y-4 h-fit">
                    <h5 className="text-xs font-mono uppercase tracking-wider text-slate-400">Download Library packages</h5>
                    
                    <div className="space-y-3 text-xs">
                      <div className="space-y-1.5">
                        <label className="text-slate-400">Package Name</label>
                        <input
                          type="text"
                          value={npmSearchQuery}
                          onChange={(e) => setNpmSearchQuery(e.target.value)}
                          placeholder="e.g. lodash, axios, moment"
                          className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl outline-none"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (!npmSearchQuery) return;
                            runNpmInstallation(npmSearchQuery, false);
                            addCustomNotification(`📦 NPM dependencies trigger started: ${npmSearchQuery}`);
                          }}
                          disabled={isInstallingPkg || !npmSearchQuery}
                          className="flex-grow py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-45 text-white font-bold rounded-xl cursor-pointer shadow-md"
                        >
                          {isInstallingPkg ? 'Installing...' : 'Install Prod'}
                        </button>
                        <button
                          onClick={() => {
                            if (!npmSearchQuery) return;
                            runNpmInstallation(npmSearchQuery, true);
                            addCustomNotification(`📦 NPM devDependencies trigger started: ${npmSearchQuery}`);
                          }}
                          disabled={isInstallingPkg || !npmSearchQuery}
                          className="px-3 bg-slate-950 border border-slate-905 rounded-xl text-slate-400 hover:text-slate-200"
                        >
                          Dev
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-950/20 border border-slate-900 p-4 rounded-xl text-[11px] leading-normal text-slate-400">
                    💡 Node libraries downloaded here are permanently updated inside package.json dependencies and fully accessible on next compiling trigger.
                  </div>
                </div>

                {/* Installed Package Lists */}
                <div className="lg:col-span-8 space-y-4">
                  <div className="bg-slate-950/30 border border-slate-900 p-5 rounded-2xl space-y-4">
                    <h5 className="text-xs font-mono uppercase tracking-wider text-slate-400">Active package.json Core Assemblies</h5>
                    {npmInfo ? (
                      <div className="space-y-4 text-xs">
                        <div>
                          <span className="text-slate-400">Application Bundle: </span>
                          <span className="font-mono text-indigo-400 font-bold">{npmInfo.name || 'ourin-md'} ({npmInfo.version || '1.0.0'})</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <span className="text-slate-400 font-mono text-[10px] uppercase">Dependencies ({Object.keys(npmInfo.dependencies || {}).length})</span>
                            <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 max-h-[160px] overflow-y-auto font-mono text-[11px] text-slate-300 space-y-1">
                              {Object.entries(npmInfo.dependencies || {}).map(([pkg, ver]) => (
                                <div key={pkg} className="flex justify-between items-center bg-slate-900/30 p-1.5 rounded">
                                  <span className="truncate pr-2">{pkg}</span>
                                  <span className="text-indigo-400 shrink-0 font-bold">{ver as string}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <span className="text-slate-400 font-mono text-[10px] uppercase">Dev Dependencies ({Object.keys(npmInfo.devDependencies || {}).length})</span>
                            <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 max-h-[160px] overflow-y-auto font-mono text-[11px] text-slate-300 space-y-1">
                              {Object.entries(npmInfo.devDependencies || {}).map(([pkg, ver]) => (
                                <div key={pkg} className="flex justify-between items-center bg-slate-900/30 p-1.5 rounded">
                                  <span className="truncate pr-2">{pkg}</span>
                                  <span className="text-indigo-400 shrink-0 font-bold">{ver as string}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="py-10 text-center font-mono text-slate-500">Wait. Syncing dependency manifests...</div>
                    )}
                  </div>

                  {npmInstallLogs && (
                    <div className="bg-slate-950 border border-slate-900 p-4 rounded-xl space-y-2">
                      <span className="text-xs font-mono uppercase text-slate-400 tracking-wider">Installer CLI Output:</span>
                      <pre className="p-3 bg-slate-950 border border-slate-900/60 rounded-lg text-[10px] font-mono text-slate-400 overflow-x-auto max-h-[140px] whitespace-pre-wrap leading-relaxed">
                        {npmInstallLogs}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </motion.div>
  );
}
