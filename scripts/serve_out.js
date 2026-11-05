const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const OUT_DIR = path.resolve(__dirname, '..', 'out');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8'
};

const server = http.createServer((req, res) => {
  // Strip query string and decode URI
  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // Normalize path
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(OUT_DIR, safePath);

  // Helper to send file
  function sendFile(targetFile, statusCode = 200) {
    const ext = path.extname(targetFile).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(statusCode, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Access-Control-Allow-Origin': '*'
    });
    fs.createReadStream(targetFile).pipe(res);
  }

  // Check file resolution
  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isFile()) {
      return sendFile(filePath);
    }

    if (!err && stats.isDirectory()) {
      const indexFile = path.join(filePath, 'index.html');
      if (fs.existsSync(indexFile)) {
        return sendFile(indexFile);
      }
    }

    // Try appending .html (e.g. /products/prod-tumbler -> /products/prod-tumbler.html)
    const htmlFile = filePath + '.html';
    if (fs.existsSync(htmlFile)) {
      return sendFile(htmlFile);
    }

    // Try index.html in subfolder
    const dirIndex = path.join(filePath, 'index.html');
    if (fs.existsSync(dirIndex)) {
      return sendFile(dirIndex);
    }

    // 404 fallback
    const notFoundFile = path.join(OUT_DIR, '404.html');
    if (fs.existsSync(notFoundFile)) {
      return sendFile(notFoundFile, 404);
    }

    // Root fallback
    const rootIndex = path.join(OUT_DIR, 'index.html');
    if (fs.existsSync(rootIndex)) {
      return sendFile(rootIndex, 200);
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[CNU ChaCha Store] Static server is running at http://localhost:${PORT}`);
  console.log(`[CNU ChaCha Store] Serving directory: ${OUT_DIR}`);
});
