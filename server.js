import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
const root = resolve('.');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.json': 'application/json', '.md': 'text/plain' };
const server = createServer(async (request, response) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); }
  catch { response.writeHead(400); return response.end('Bad request'); }
  if (pathname === '/api/health') { response.writeHead(200, { 'Content-Type': 'application/json' }); return response.end('{"status":"ok"}'); }
  const relative = pathname === '/' ? 'public/index.html' : pathname.startsWith('/src/') ? pathname.slice(1) : `public${pathname}`;
  const file = resolve(root, relative);
  if (!file.startsWith(`${root}/public/`) && !file.startsWith(`${root}/src/`)) { response.writeHead(403); return response.end('Forbidden'); }
  try {
    const body = await readFile(file);
    response.writeHead(200, { 'Content-Type': `${types[extname(file)] ?? 'application/octet-stream'}; charset=utf-8`, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-cache' });
    response.end(body);
  } catch { response.writeHead(404); response.end('Not found'); }
});
server.listen(process.env.PORT || 3000, '0.0.0.0', () => console.log(`Refactor Lab: http://localhost:${process.env.PORT || 3000}`));
