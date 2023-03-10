import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs/promises'
import { WebSocketServer } from 'ws';


function mimeType(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  console.log('mime')
  console.log(fileName)
  console.log(ext)
  switch (ext) {
    case '.html':
      return 'text/html';
    case '.js':
      return 'text/javascript';
    case '.css':
      return 'text/css';
    case '.json':
      return 'application/json';
    case '.png':
      return 'image/png';
    case '.jpg':
      return 'image/jpg';
    default:
      return 'application/octet-stream';
  }
}

const server = http.createServer(async (req, res) => {
  console.log('-------')
  if (req.url === '/ws') {

    console.log('ws request', req.method)
    res.writeHead(200);
    res.end();

    return
  }

  if (req.method === 'GET') {
    console.log('GET', req.url);

    let normalized = path.normalize(req.url);
    if (normalized === '/' || normalized === '\\' || normalized === '') {
      normalized = '/index.html';
    }
    const filePath = path.join('./static', normalized);
    console.log(normalized)
    console.log(filePath)
    const mime = mimeType(filePath)

    try {
      const file = await fs.open(filePath, 'r');
      const data = await file.readFile();

      file.close();

      console.log(mime)
      res.setHeader('Content-Type', mime)
      res.writeHead(200);
      res.end(data);
    } catch (e) {
      if (e.code === 'ENOENT') {
        res.writeHead(404);
      } else {
        res.writeHead(500);
      }
      res.end();
    }

    return;
  }

  res.writeHead(405);
});


let socketCount = 0;
const sockets = new Map();
const wss = new WebSocketServer({ server });

wss.on('connection', function connection(ws) {
  const socketId = socketCount;
  sockets.set(socketId, ws);
  socketCount += 1;

  ws.on('error', console.error);

  ws.on('message', (data) => {
    sockets.forEach((ws, id) => {
      if (id !== socketId) {
        console.log(`Sending ${data.length} bytes: ${socketId} -> ${id}`)
        ws.send(data, { binary: true });
      }
    })
  });

  ws.on('close', () => {
    console.log(`Socket closed: ${socketId}`)
    sockets.delete(socketId);
  })
});

server.on('listening', () => {
  console.log('Listening on: ', server.address());
})

function shutdown() {
  console.log('Received interrupt, shutting down web server')
  server.closeAllConnections();
  server.close();

  console.log('exiting')
  process.exit();
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

server.listen(8080, '0.0.0.0')
