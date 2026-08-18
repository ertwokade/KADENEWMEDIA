
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('.', import.meta.url))
const port = Number(process.env.PORT || 4180)
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.ico':'image/x-icon','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf','.otf':'font/otf','.glb':'model/gltf-binary','.gltf':'model/gltf+json','.bin':'application/octet-stream','.wasm':'application/wasm','.mp3':'audio/mpeg','.zip':'application/zip'}

createServer(async (req,res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
    const safe = normalize(pathname).replace(/^(\.\.(\/|\\|$))+/, '')
    let target = join(root, safe)
    let info = await stat(target).catch(() => null)
    if (info?.isDirectory()) { target = join(target, 'index.html'); info = await stat(target).catch(() => null) }
    if (!info) { target = join(root, safe, 'index.html'); info = await stat(target).catch(() => null) }
    if (!info) { res.writeHead(404); res.end('Not found'); return }
    res.setHeader('content-type', mime[extname(target).toLowerCase()] || 'application/octet-stream')
    res.setHeader('cache-control', 'no-store')
    createReadStream(target).pipe(res)
  } catch (error) { res.writeHead(500); res.end(String(error)) }
}).listen(port, '127.0.0.1', () => console.log('Haoqi clone: http://127.0.0.1:' + port))
