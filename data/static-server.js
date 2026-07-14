const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.env.PORT, 10) || 8080;
const PUBLIC_DIR = process.argv[2] || '.';

// Common MIME Types map
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg',
  '.pdf': 'application/pdf'
};

const server = http.createServer((req, res) => {
  // Clear query parameters
  const pathname = req.url.split('?')[0];
  let reqPath = pathname;
  if (reqPath === '/') {
    reqPath = '/index.html';
  }

  // Resolve target physical path
  const resolvedPublicDir = path.resolve(PUBLIC_DIR);
  let filePath = path.join(resolvedPublicDir, reqPath);

  // Path traversal security check
  if (!filePath.startsWith(resolvedPublicDir)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden - Access restricted outside directory root');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err) {
      // 404 Fallback - if a standard HTML file is requested or directory exists
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
        <div style="font-family: system-ui, sans-serif; background: #030712; color: #9f1239; min-height: 100vh; display: flex; align-items: center; justify-content: center; text-align: center; padding: 20px;">
          <div style="max-width: 450px; padding: 32px; background: #0f172a; border: 1px solid #dc262620; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.5);">
            <div style="font-size: 11px; font-weight: 700; font-family: monospace; letter-spacing: 0.1em; text-transform: uppercase; color: #ef4444; margin-bottom: 8px;">Error Code: 404</div>
            <h1 style="font-size: 18px; font-weight: 700; color: #f8fafc; margin: 0 0 12px;">File Not Found</h1>
            <p style="font-size: 13.5px; color: #94a3b8; line-height: 1.5; margin: 0 0 20px;">
              The requested resource <code>${pathname}</code> is missing inside directory: <code>${PUBLIC_DIR}</code>.
            </p>
            <div style="font-family: monospace; font-size: 10px; color: #475569;">AyeZzPanel Virtual Server Engine</div>
          </div>
        </div>
      `);
      return;
    }

    if (stats.isDirectory()) {
      // If it's a folder, search for index.html inside it
      const indexFile = path.join(filePath, 'index.html');
      fs.stat(indexFile, (errIdx, statsIdx) => {
        if (errIdx || !statsIdx.isFile()) {
          // No index.html, generate auto directory listing
          fs.readdir(filePath, (errDir, files) => {
            if (errDir) {
              res.writeHead(500, { 'Content-Type': 'text/plain' });
              res.end('500 Internal Directory Read Failure');
              return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`
              <html>
                <head>
                  <title>Index of ${pathname}</title>
                  <style>
                    body { font-family: system-ui, monospace; background-color: #030712; color: #cbd5e1; padding: 40px; margin: 0; }
                    h1 { font-size: 20px; color: #f8fafc; border-bottom: 1px solid #1e293b; padding-bottom: 12px; margin-bottom: 20px; }
                    ul { list-style: none; padding: 0; }
                    li { margin: 8.5px 0; font-size: 14px; }
                    a { color: #38bdf8; text-decoration: none; }
                    a:hover { text-decoration: underline; color: #0ea5e9; }
                    .meta { margin-top: 40px; font-size: 11px; color: #64748b; border-top: 1px solid #1e293b; padding-top: 15px; }
                  </style>
                </head>
                <body>
                  <h1>Index of ${pathname}</h1>
                  <ul>
                    ${pathname !== '/' ? `<li><a href="..">📁 .. (Parent Directory)</a></li>` : ''}
                    ${files.map(file => {
                      const isDir = fs.statSync(path.join(filePath, file)).isDirectory();
                      return `<li><a href="${pathname === '/' ? '' : pathname}/${file}">${isDir ? '📁' : '📄'} ${file}</a></li>`;
                    }).join('')}
                  </ul>
                  <div class="meta">AyeZzPanel Live Host Engine running on Node ${process.version}</div>
                </body>
              </html>
            `);
          });
          return;
        }

        // read the resolved indexFile
        fs.readFile(indexFile, (errorIdx, contentIdx) => {
          if (errorIdx) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('500 Index Read Failure');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(contentIdx);
          }
        });
      });
      return;
    }

    // Serve fine single file
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
      if (error) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`500 General Server File Read Error: ${error.message}`);
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      }
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[AyeZzPanel Static Machine] Active. Location: "${path.resolve(PUBLIC_DIR)}", URL: http://0.0.0.0:${PORT}`);
});
