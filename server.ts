import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import http from 'http';
import { exec, execSync, spawn, ChildProcess } from 'child_process';
import { createServer as createViteServer } from 'vite';
import AdmZip from 'adm-zip';
import archiver from 'archiver';
import axios from 'axios';

import { initializeDatabase } from './src/lib/auth-db';
import { configureAuthRoutes, requireAuth, requireRole, AuthenticatedRequest } from './src/lib/auth-server';

async function ensureLive2DAssets() {
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const assets = [
    {
      name: 'pixi.min.js',
      urls: [
        'https://cdnjs.cloudflare.com/ajax/libs/pixi.js/5.3.12/pixi.min.js',
        'https://cdn.jsdelivr.net/npm/pixi.js@5.3.12/dist/pixi.min.js'
      ]
    },
    {
      name: 'live2dcubismcore.min.js',
      urls: [
        'https://cdn.jsdelivr.net/gh/guansss/pixi-live2d-display/test/assets/live2dcubismcore.min.js',
        'https://cdn.jsdelivr.net/gh/dylanNew/live2d/webgl/Core/live2dcubismcore.js',
        'https://raw.githubusercontent.com/dylanNew/live2d/master/webgl/Core/live2dcubismcore.js',
        'https://cdn.jsdelivr.net/gh/GerritVance/pixi-live2d-display/Core/live2dcubismcore.js'
      ]
    },
    {
      name: 'pixi-live2d-display.min.js',
      urls: [
        'https://cdn.jsdelivr.net/npm/pixi-live2d-display/dist/index.min.js',
        'https://unpkg.com/pixi-live2d-display/dist/index.min.js'
      ]
    }
  ];

  for (const asset of assets) {
    const dest = path.join(publicDir, asset.name);
    if (!fs.existsSync(dest)) {
      console.log(`[Live2D Setup] Asset "${asset.name}" not found locally. Downloading...`);
      let success = false;
      for (const url of asset.urls) {
        try {
          const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
          fs.writeFileSync(dest, response.data);
          console.log(`[Live2D Setup] Successfully downloaded "${asset.name}" from ${url}`);
          success = true;
          break;
        } catch (e: any) {
          console.warn(`[Live2D Setup] Failed to download "${asset.name}" from ${url}: ${e.message}`);
        }
      }
      if (!success) {
        console.error(`[Live2D Setup] ERROR: All download attempts failed for "${asset.name}"`);
      }
    }
  }
}

// Helper for live CPU calculations
let lastCpuUsage = { idle: 0, total: 0 };
function getCpuLoad(): number {
  const cpus = os.cpus();
  if (!cpus || cpus.length === 0) return 15;
  
  let idle = 0;
  let total = 0;
  cpus.forEach(cpu => {
    for (const type in cpu.times) {
      total += (cpu.times as any)[type];
    }
    idle += cpu.times.idle;
  });
  
  const idleDiff = idle - lastCpuUsage.idle;
  const totalDiff = total - lastCpuUsage.total;
  
  // Save current values for next update cycle
  lastCpuUsage = { idle, total };
  
  if (totalDiff === 0) return 20;
  const load = Math.min(100, Math.max(0, Math.round((1 - idleDiff / totalDiff) * 100)));
  return load;
}

// Initial calculation to seed the baseline
getCpuLoad();

async function startServer() {
  // Initialize user login databases (PostgreSQL or Emulated JSON Fallback)
  await initializeDatabase();
  await ensureLive2DAssets();

  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const HOST = process.env.HOST || '0.0.0.0';

  // Store running process handles
  const activeProcesses: Record<string, any> = {};
  const processLogs: Record<string, string[]> = {};

  function freePort(port: number, id?: string) {
    try {
      if (process.platform !== 'win32') {
        try { execSync(`fuser -k -n tcp ${port}`, { stdio: 'ignore' }); } catch(err1){}
        try { execSync(`lsof -t -i :${port} | xargs kill -9`, { stdio: 'ignore' }); } catch(err2){}
        if (id) {
          logServerMessage(id, `Instantly freed port ${port} by force-killing any existing listeners.`);
        }
      }
    } catch (e: any) {
      if (id) {
        logServerMessage(id, `Port release process diagnostic: ${e.message}`);
      }
    }
  }

  interface VirtualServer {
    id: string;
    name: string;
    port: number;
    type: 'node' | 'static';
    entryPoint: string;
    status: 'running' | 'stopped';
    pid?: number;
  }

  const SERVERS_FILE = path.join(process.cwd(), 'data', 'servers.json');

  function logServerMessage(id: string, message: string) {
    if (!processLogs[id]) {
      processLogs[id] = [];
    }
    processLogs[id].push(`[${new Date().toISOString()}] ${message}`);
    if (processLogs[id].length > 500) {
      processLogs[id].shift();
    }
  }

  function getVirtualServers(): VirtualServer[] {
    try {
      if (fs.existsSync(SERVERS_FILE)) {
        const data = JSON.parse(fs.readFileSync(SERVERS_FILE, 'utf-8'));
        return data.map((s: any) => ({ ...s, status: 'stopped', pid: undefined }));
      }
    } catch (e) {
      console.error('Failed to read servers file:', e);
    }
    return [];
  }

  function saveVirtualServers(servers: VirtualServer[]) {
    try {
      const dir = path.dirname(SERVERS_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(SERVERS_FILE, JSON.stringify(servers, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save servers file:', e);
    }
  }

  let virtualServers: VirtualServer[] = getVirtualServers();

  // Virtual Server Application Reverse Proxy Endpoint
  app.all('/apps/:id*', (req, res, next) => {
    const id = (req.params as any).id;
    if (!id) return next();
    
    // Ignore internal API pathways
    if (['list', 'create', 'delete', 'start', 'stop', 'logs'].includes(id)) {
      return next();
    }

    const server = virtualServers.find(s => s.id === id);
    if (!server) {
      return next();
    }

    if (server.status !== 'running') {
      res.setHeader('Content-Type', 'text/html');
      return res.status(503).send(`
        <div style="font-family: system-ui, sans-serif; background: #030712; color: #f3f4f6; min-height: 100vh; display: flex; align-items: center; justify-content: center; text-align: center; padding: 20px;">
          <div style="max-width: 500px; padding: 40px; background: #111827; border: 1px solid #374151; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.4);">
            <div style="color: #6366f1; font-weight: bold; font-family: monospace; font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase;">Control Panel Notification</div>
            <h1 style="font-size: 20px; font-weight: 700; color: #ffffff; margin: 10px 0 16px;">App Server is Offline</h1>
            <p style="font-size: 13px; color: #9ca3af; line-height: 1.6; margin-bottom: 24px;">
              The Virtual Server "<strong>${server.name}</strong>" is currently stopped. Please open your panel, go to App Servers, and trigger the start action.
            </p>
            <a href="/" style="display: inline-block; background: #4f46e5; color: #ffffff; padding: 10px 20px; border-radius: 8px; font-size: 12px; font-weight: 600; text-decoration: none; transition: background 0.2s;">
              Return to Control Panel Dashboard
            </a>
          </div>
        </div>
      `);
    }

    // Resolve query and sub-path properly
    const originalUrl = req.originalUrl;
    const prefix = `/apps/${id}`;
    let subPath = originalUrl.substring(prefix.length) || '/';
    if (!subPath.startsWith('/')) {
      subPath = '/' + subPath;
    }

    const targetPort = server.port;
    const options = {
      hostname: '127.0.0.1',
      port: targetPort,
      path: subPath,
      method: req.method,
      headers: {
        ...req.headers,
        host: `127.0.0.1:${targetPort}`,
      }
    };

    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    });

    proxyReq.on('error', (err) => {
      res.setHeader('Content-Type', 'text/html');
      res.status(502).send(`
        <div style="font-family: system-ui, sans-serif; background: #030712; color: #f3f4f6; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px;">
          <div style="max-width: 550px; padding: 40px; background: #111827; border: 1px solid #ef4444; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.4);">
            <div style="color: #ef4444; font-weight: bold; font-family: monospace; font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase;">Proxy Pipeline Error</div>
            <h1 style="font-size: 20px; font-weight: 700; color: #ffffff; margin: 10px 0 16px;">Failed to Reach Server Target</h1>
            <p style="font-size: 13px; color: #9ca3af; line-height: 1.6; margin-bottom: 20px;">
              Failed to connect to process for "<strong>${server.name}</strong>" running on port ${targetPort}. 
              Your script may not have finished starting, or does not bind to <code>0.0.0.0</code> or <code>127.0.0.1</code>.
            </p>
            <div style="font-family: monospace; text-align: left; background: #030712; border: 1px solid #1f2937; padding: 12px; border-radius: 6px; font-size: 11px; color: #f87171; overflow-x: auto;">
              Error: ${err.message}
            </div>
            <div style="margin-top: 24px; text-align: center;">
              <a href="/" style="display: inline-block; background: #1f2937; color: #ffffff; padding: 10px 20px; border-radius: 8px; font-size: 12.5px; font-weight: 500; text-decoration: none; border: 1px solid #374151;">
                Go back to Panel
              </a>
            </div>
          </div>
        </div>
      `);
    });

    req.pipe(proxyReq, { end: true });
  });

  // JSON middleware payload support with raised limit for file uploads (up to 50MB)
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));
  app.use(express.static(path.join(process.cwd(), 'public')));

  // Mount API Authentication & User Management Routes
  configureAuthRoutes(app);

  // Secure all other API routes after auth routes are registered
  app.use('/api', (req, res, next) => {
    if (req.path.startsWith('/auth/')) {
      return next();
    }
    return requireAuth(req as any, res, next);
  });

  // API Endpoints
  
  // Real-time server telemetry
  app.get('/api/system/stats', (req, res) => {
    try {
      const cpuVal = getCpuLoad();
      
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      const ramVal = Math.min(100, Math.max(0, Math.round((usedMem / totalMem) * 100)));

      // Fetch actual host disk partition statistics
      let diskPercent = 40;
      let totalGB = 512;
      let usedGB = 205;
      try {
        const dfOut = execSync('df -k /').toString();
        const lines = dfOut.trim().split('\n');
        if (lines.length > 1) {
          const parts = lines[1].replace(/\s+/g, ' ').split(' ');
          const percentStr = parts[4] || '40%';
          diskPercent = parseInt(percentStr.replace('%', ''), 10) || 40;
          const totalKB = parseInt(parts[1], 10) || 512 * 1024 * 1024;
          const usedKB = parseInt(parts[2], 10) || 205 * 1024 * 1024;
          totalGB = Math.round(totalKB / (1024 * 1024));
          usedGB = Math.round(usedKB / (1024 * 1024));
        }
      } catch (e) {
        // Fallback for non-linux environments
      }

      res.json({
        cpu: cpuVal,
        ram: ramVal,
        disk: diskPercent,
        memoryUsedGB: (usedMem / (1024 * 1024 * 1024)).toFixed(2),
        memoryTotalGB: (totalMem / (1024 * 1024 * 1024)).toFixed(2),
        diskUsedGB: usedGB,
        diskTotalGB: totalGB,
        uptime: Math.round(os.uptime()),
        hostname: 'ayezpanel.my.id',
        platform: os.platform(),
        arch: os.arch(),
        release: os.release(),
        loadAvg: os.loadavg()
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Real-time actual process monitor list
  app.get('/api/system/processes', (req, res) => {
    try {
      // Run ps command inside the container to list real processes safely
      let cmd = 'ps -eo pid,%cpu,%mem,comm --sort=-%cpu';
      let output = '';
      try {
        output = execSync(cmd).toString();
      } catch (e) {
        // fallback in case ps doesn't support -o on specific containers
        try {
          output = execSync('ps aux').toString();
        } catch (e2) {
          // Fallback static list if no ps is available
        }
      }

      if (!output) {
        return res.json([
          { id: '1', name: 'node server.js', cpu: 1.5, memory: '1.2%', status: 'running', pid: process.pid },
          { id: '2', name: 'docker-containerd', cpu: 0.1, memory: '0.5%', status: 'running', pid: 120 }
        ]);
      }

      const lines = output.trim().split('\n');
      const processesList: any[] = [];
      
      if (lines.length > 1) {
        // Parse header dynamically to determine column positions
        const headerCols = lines[0].trim().toUpperCase().replace(/\s+/g, ' ').split(' ');
        
        let pidIdx = headerCols.indexOf('PID');
        let cpuIdx = headerCols.findIndex(h => h.includes('CPU') || h.includes('%CPU'));
        let memIdx = headerCols.findIndex(h => h.includes('MEM') || h.includes('%MEM'));
        let commIdx = headerCols.findIndex(h => h.includes('COMMAND') || h.includes('COMM') || h.includes('CMD'));

        // Smart defaults if finding columns fails
        if (pidIdx === -1) pidIdx = 0;
        if (cpuIdx === -1) cpuIdx = 1;
        if (memIdx === -1) memIdx = 2;
        if (commIdx === -1) commIdx = 3;

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const parts = line.replace(/\s+/g, ' ').split(' ');
          const maxIdx = Math.max(pidIdx, cpuIdx, memIdx, commIdx);
          
          if (parts.length > maxIdx) {
            const pid = parseInt(parts[pidIdx], 10);
            const cpu = parseFloat(parts[cpuIdx]) || 0;
            const mem = parseFloat(parts[memIdx]) || 0;
            
            // Reconstruct name command in case of path segments or spaces
            const name = commIdx >= parts.length - 1 
              ? parts.slice(commIdx).join(' ') 
              : parts[commIdx];

            if (pid && name) {
              processesList.push({
                id: String(pid),
                name: name.replace(/.*\//, ''), // clean full binary path representation
                cpu,
                memory: mem.toFixed(1) + '%',
                status: 'running',
                pid
              });
            }
          }
        }
      }

      // Sort by CPU descending
      processesList.sort((a, b) => b.cpu - a.cpu);
      res.json(processesList.slice(0, 25));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Action: SIGKILL process by PID
  app.post('/api/system/kill', (req, res) => {
    const { pid } = req.body;
    if (!pid) {
      return res.status(400).json({ error: 'PID is required.' });
    }
    
    // Safety check: protect current node server from suicide
    if (pid === process.pid) {
      return res.status(403).json({ error: 'Action denied: Cannot terminate the active virtual system server thread.' });
    }

    try {
      execSync(`kill -9 ${pid}`);
      res.json({ success: true, message: `Process with PID ${pid} terminated.` });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Secure interactive command line interface
  app.post('/api/terminal/run', requireRole(['admin']), (req, res) => {
    const { command, cwd } = req.body;
    if (!command) {
      return res.status(400).json({ error: 'Command prompt required' });
    }

    const currentWorkingDir = cwd && fs.existsSync(cwd) ? cwd : process.cwd();

    // Support sequential cd changes by executing inside directory
    exec(command, { cwd: currentWorkingDir, timeout: 8000 }, (err, stdout, stderr) => {
      let resolvedDir = currentWorkingDir;
      
      // Attempt directory resolution check on cd command sets
      const trimmed = command.trim();
      if (trimmed.startsWith('cd ')) {
        const dest = trimmed.replace(/^cd\s+/, '').replace(/["']/g, '').trim();
        const testPath = path.resolve(currentWorkingDir, dest);
        if (fs.existsSync(testPath) && fs.lstatSync(testPath).isDirectory()) {
          resolvedDir = testPath;
        }
      }

      res.json({
        stdout: stdout || '',
        stderr: stderr || (err ? err.message : ''),
        cwd: resolvedDir
      });
    });
  });

  // ==================== REAL FILE MANAGER SYSTEM ENDPOINTS ====================
  // List files inside a directory
  app.get('/api/files/list', (req, res) => {
    try {
      const targetDir = (req.query.path as string) || process.cwd();
      if (!fs.existsSync(targetDir)) {
        return res.status(404).json({ error: `Directory "${targetDir}" does not exist.` });
      }
      
      const stats = fs.statSync(targetDir);
      if (!stats.isDirectory()) {
        return res.status(400).json({ error: `Path "${targetDir}" is not a directory.` });
      }

      const files = fs.readdirSync(targetDir);
      const list = files.map(file => {
        const fullPath = path.join(targetDir, file);
        try {
          const fileStats = fs.statSync(fullPath);
          return {
            name: file,
            path: fullPath,
            isDirectory: fileStats.isDirectory(),
            size: fileStats.size,
            mtime: fileStats.mtime.toISOString(),
          };
        } catch (e) {
          return {
            name: file,
            path: fullPath,
            isDirectory: false,
            size: 0,
            mtime: new Date().toISOString(),
            error: true
          };
        }
      });

      // Sort: folders first, then alphabetically
      list.sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) {
          return a.isDirectory ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });

      res.json({ cwd: targetDir, files: list });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Read file contents
  app.get('/api/files/read', (req, res) => {
    try {
      const filePath = req.query.path as string;
      if (!filePath) {
        return res.status(400).json({ error: 'File path query parameter is required.' });
      }
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found.' });
      }
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        return res.status(400).json({ error: 'Target path is a directory, not a file.' });
      }

      // Read as text (limit file size read to 10MB to avoid process memory overflow)
      if (stats.size > 10 * 1024 * 1024) {
        return res.status(400).json({ error: 'File size exceeds 10MB limit for inline viewing.' });
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      res.json({ content });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Write file content (Edit/Create new file)
  app.post('/api/files/write', (req, res) => {
    try {
      const { filePath, content } = req.body;
      if (!filePath) {
        return res.status(400).json({ error: 'File path parameter is required.' });
      }
      
      const parentDir = path.dirname(filePath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }

      fs.writeFileSync(filePath, content !== undefined ? content : '', 'utf-8');
      res.json({ success: true, message: `File saved successfully at ${filePath}` });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create folder directory
  app.post('/api/files/create-folder', (req, res) => {
    try {
      const { folderPath } = req.body;
      if (!folderPath) {
        return res.status(400).json({ error: 'Folder path parameter is required.' });
      }
      if (fs.existsSync(folderPath)) {
        return res.status(400).json({ error: 'Path already exists.' });
      }

      fs.mkdirSync(folderPath, { recursive: true });
      res.json({ success: true, message: `Directory created successfully at ${folderPath}` });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete file or folder
  app.post('/api/files/delete', (req, res) => {
    try {
      const { targetPath } = req.body;
      if (!targetPath) {
        return res.status(400).json({ error: 'Target path parameter is required.' });
      }
      if (!fs.existsSync(targetPath)) {
        return res.status(404).json({ error: 'Path does not exist.' });
      }

      const stats = fs.statSync(targetPath);
      if (stats.isDirectory()) {
        fs.rmSync(targetPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(targetPath);
      }

      res.json({ success: true, message: `Successfully deleted target path: ${targetPath}` });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // File Upload API using base64 payload transfer
  app.post('/api/files/upload', (req, res) => {
    try {
      const { directory, name, content, encoding } = req.body;
      if (!directory || !name) {
        return res.status(400).json({ error: 'Directory and filename parameters are required.' });
      }

      const targetPath = path.join(directory, name);
      const fileBuffer = encoding === 'base64' 
        ? Buffer.from(content, 'base64') 
        : Buffer.from(content, 'utf-8');

      fs.writeFileSync(targetPath, fileBuffer);
      res.json({ success: true, message: `File uploaded successfully to ${targetPath}`, path: targetPath });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Extract .zip archive contents using pure-JS AdmZip engine
  app.post('/api/files/unzip', (req, res) => {
    try {
      const { zipPath, destinationDir } = req.body;
      if (!zipPath) {
        return res.status(400).json({ error: 'Zip file path parameter is required.' });
      }
      if (!fs.existsSync(zipPath)) {
        return res.status(404).json({ error: `Zip file not found at path: ${zipPath}` });
      }

      const targetDir = destinationDir || path.dirname(zipPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const zip = new AdmZip(zipPath);
      zip.extractAllTo(targetDir, true);

      res.json({ success: true, message: `Successfully unzipped file contents to folder: ${targetDir}` });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Download a single file directly
  app.get('/api/files/download', (req, res) => {
    try {
      const filePath = req.query.path as string;
      if (!filePath) {
        return res.status(400).json({ error: 'File path query parameter is required.' });
      }
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found.' });
      }
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        return res.status(400).json({ error: 'Cannot download a directory directly. Use download-zip instead.' });
      }
      res.download(filePath);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Archive and download folder/file as a zip
  app.get('/api/files/download-zip', (req, res) => {
    try {
      const targetPath = req.query.path as string;
      if (!targetPath) {
        return res.status(400).json({ error: 'Path query parameter is required.' });
      }
      if (!fs.existsSync(targetPath)) {
        return res.status(404).json({ error: `Path not found: ${targetPath}` });
      }

      const stats = fs.statSync(targetPath);
      const filename = path.basename(targetPath) || 'folder';

      res.setHeader('Content-Disposition', `attachment; filename="${filename}.zip"`);
      res.setHeader('Content-Type', 'application/zip');

      const archive = archiver('zip', { zlib: { level: 9 } });

      archive.on('warning', (err) => {
        if (err.code === 'ENOENT') {
          console.warn('Archiver warning:', err);
        } else {
          throw err;
        }
      });

      archive.on('error', (err) => {
        if (!res.headersSent) {
          res.status(500).send({ error: err.message });
        }
      });

      archive.pipe(res);

      if (stats.isDirectory()) {
        archive.directory(targetPath, false);
      } else {
        archive.file(targetPath, { name: filename });
      }

      archive.finalize();
    } catch (error: any) {
      if (!res.headersSent) {
        res.status(500).json({ error: error.message });
      }
    }
  });

  // ==================== AUTOMATED NPM INSTANCE SERVICE ENDPOINTS ====================
  // List current dependencies from package.json
  app.get('/api/npm/list', (req, res) => {
    try {
      const pkgPath = path.join(process.cwd(), 'package.json');
      if (!fs.existsSync(pkgPath)) {
        return res.status(404).json({ error: 'package.json not found in root.' });
      }
      const pkgContent = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      res.json({
        name: pkgContent.name,
        version: pkgContent.version,
        dependencies: pkgContent.dependencies || {},
        devDependencies: pkgContent.devDependencies || {}
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // NPM Install run action
  app.post('/api/npm/install', (req, res) => {
    const { packageName, isDev } = req.body;
    
    // Command is empty or blank -> full dynamic npm install!
    let cmd = 'npm install --no-audit --no-fund';
    if (packageName && packageName.trim()) {
      cmd = `npm install ${packageName.trim()} ${isDev ? '--save-dev' : '--save'} --no-audit --no-fund`;
    }

    // Run the process
    exec(cmd, { cwd: process.cwd(), timeout: 180000 }, (err, stdout, stderr) => {
      res.json({
        success: !err,
        stdout: stdout || '',
        stderr: stderr || '',
        message: err ? err.message : `Command "${cmd}" executed successfully.`
      });
    });
  });

  // ==================== WEB SERVICES / VIRTUAL SERVERS HOSTING ENDPOINTS ====================
  // List server configurations
  app.get('/api/servers/list', (req, res) => {
    res.json(virtualServers);
  });

  // Create a new virtual server profile
  app.post('/api/servers/create', requireRole(['admin', 'reseller']), (req, res) => {
    try {
      const { name, type, entryPoint } = req.body;
      if (!name || !type || !entryPoint) {
        return res.status(400).json({ error: 'Name, type, and entryPoint are required fields.' });
      }

      const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `server-${Date.now()}`;
      if (virtualServers.find(s => s.id === id)) {
        return res.status(400).json({ error: `A server app with identification slug "${id}" already exists.` });
      }

      let resolvedEntryPoint = entryPoint;
      if (!path.isAbsolute(entryPoint)) {
        resolvedEntryPoint = path.resolve(process.cwd(), entryPoint);
      }

      // Automatically allocate standard free ports starting 4001+
      let port = 4001;
      const usedPorts = new Set(virtualServers.map(s => s.port));
      while (usedPorts.has(port)) {
        port++;
      }

      const newServer: VirtualServer = {
        id,
        name,
        port,
        type,
        entryPoint: resolvedEntryPoint,
        status: 'stopped'
      };

      virtualServers.push(newServer);
      saveVirtualServers(virtualServers);

      logServerMessage(id, `Server created. Type: ${type}, Path: ${resolvedEntryPoint}, Port Node Allocation: ${port}`);
      res.json({ success: true, server: newServer });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Start process daemon
  app.post('/api/servers/start', (req, res) => {
    try {
      const { id } = req.body;
      const server = virtualServers.find(s => s.id === id);
      if (!server) {
        return res.status(404).json({ error: 'Virtual server profile not configuration registered.' });
      }

      if (activeProcesses[id]) {
        return res.status(400).json({ error: 'Server thread process represents active running state.' });
      }

      if (!fs.existsSync(server.entryPoint)) {
        return res.status(400).json({ error: `Target Entry Point file or folder is missing at path: "${server.entryPoint}". Check in file explorer.` });
      }

      logServerMessage(id, `Pre-emptively freeing port: ${server.port}...`);
      freePort(server.port, id);

      logServerMessage(id, `Spawning dynamic child process on port allocation: ${server.port}...`);

      let child;
      if (server.type === 'node') {
        const isTypeScript = server.entryPoint.endsWith('.ts');
        const runner = isTypeScript ? 'npx' : 'node';
        const args = isTypeScript ? ['tsx', server.entryPoint] : [server.entryPoint];
        
        child = spawn(runner, args, {
          cwd: path.dirname(server.entryPoint),
          env: { ...process.env, PORT: String(server.port) }
        });
      } else {
        // Run our 100% reliable local high-performance static server
        child = spawn('node', [path.join(process.cwd(), 'data', 'static-server.js'), server.entryPoint], {
          cwd: path.dirname(server.entryPoint),
          env: { ...process.env, PORT: String(server.port) }
        });
      }

      if (!child || !child.pid) {
        logServerMessage(id, `FATAL: Command execution failed to generate process ID.`);
        return res.status(500).json({ error: 'Spawn failure on background server daemon process.' });
      }

      activeProcesses[id] = child;
      server.status = 'running';
      server.pid = child.pid;
      saveVirtualServers(virtualServers);

      logServerMessage(id, `SERVER LIVE (PID: ${child.pid}). Listening on port: ${server.port}.`);

      child.stdout?.on('data', (data) => {
        logServerMessage(id, data.toString().trim());
      });

      child.stderr?.on('data', (data) => {
        logServerMessage(id, `[STDERR] ${data.toString().trim()}`);
      });

      child.on('close', (code) => {
        logServerMessage(id, `DAEMON EXITED with shutdown code: ${code}`);
        delete activeProcesses[id];
        const s = virtualServers.find(serv => serv.id === id);
        if (s) {
          s.status = 'stopped';
          s.pid = undefined;
          saveVirtualServers(virtualServers);
        }
      });

      child.on('error', (err) => {
        logServerMessage(id, `SYSTEM EXEC FAILURE error: ${err.message}`);
      });

      res.json({ success: true, status: 'running', pid: child.pid });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Kill running process gracefully/forcefully
  app.post('/api/servers/stop', (req, res) => {
    try {
      const { id } = req.body;
      const server = virtualServers.find(s => s.id === id);
      if (!server) {
        return res.status(404).json({ error: 'Server config profile not found in directory.' });
      }

      const child = activeProcesses[id];
      if (!child) {
        server.status = 'stopped';
        server.pid = undefined;
        saveVirtualServers(virtualServers);
        return res.json({ success: true, message: 'Process thread marks offline status.' });
      }

      logServerMessage(id, `Issuing clean SIGTERM signal and freeing port ${server.port}...`);
      
      try {
        freePort(server.port, id);
        child.kill('SIGTERM');
        // fallback kill loop trigger
        setTimeout(() => {
          if (activeProcesses[id]) {
            logServerMessage(id, 'Hanging thread process, issuing SIGKILL execution...');
            child.kill('SIGKILL');
            freePort(server.port, id);
          }
        }, 1200);
      } catch (e: any) {
        logServerMessage(id, `SIGTERM action error trace: ${e.message}`);
      }

      res.json({ success: true, message: `Issued termination command pipeline.` });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete virtual hosting server template
  app.post('/api/servers/delete', requireRole(['admin', 'reseller']), (req, res) => {
    try {
      const { id } = req.body;
      const idx = virtualServers.findIndex(s => s.id === id);
      if (idx === -1) {
        return res.status(404).json({ error: 'Server profile not identified.' });
      }

      if (activeProcesses[id]) {
        try {
          activeProcesses[id].kill('SIGKILL');
          delete activeProcesses[id];
        } catch (e) {}
      }

      virtualServers.splice(idx, 1);
      saveVirtualServers(virtualServers);

      res.json({ success: true, message: `Host configuration deleted successfully: "${id}"` });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Read logs for virtual server console logging
  app.get('/api/servers/logs/:id', (req, res) => {
    const { id } = req.params;
    const logs = processLogs[id] || [`[SYSTEM INFO] Console logger initialized for "${id}". No active trace records yet.`];
    res.json({ logs });
  });

  // Vite middleware setup for Development/Production router pipeline
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`[AyeZzPanel Server] running on http://${HOST}:${PORT}`);
  });
}

startServer();
