import { createReadStream, existsSync, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = 3000;
const ROOT = fileURLToPath(new URL('../out/', import.meta.url));

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function getContentType(filePath) {
  return MIME_TYPES[extname(filePath)] || 'application/octet-stream';
}

function resolvePath(urlPath) {
  const normalizedPath = normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, '');
  const candidatePath = join(ROOT, normalizedPath === '/' ? 'index.html' : normalizedPath);

  if (existsSync(candidatePath)) {
    const stats = statSync(candidatePath);
    if (stats.isDirectory()) {
      return join(candidatePath, 'index.html');
    }
    return candidatePath;
  }

  return join(ROOT, 'index.html');
}

const server = createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url || '/', `http://localhost:${PORT}`);
    const filePath = resolvePath(requestUrl.pathname);

    if (!existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    if (extname(filePath) === '.html') {
      const html = await readFile(filePath, 'utf8');
      res.writeHead(200, {
        'Cache-Control': 'no-store',
        'Content-Type': 'text/html; charset=utf-8',
      });
      res.end(html);
      return;
    }

    res.writeHead(200, {
      'Cache-Control': 'no-store',
      'Content-Type': getContentType(filePath),
    });
    createReadStream(filePath).pipe(res);
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(error instanceof Error ? error.message : 'Server error');
  }
});

server.listen(PORT, () => {
  console.log(`Link Checker static server running at http://localhost:${PORT}`);
});
