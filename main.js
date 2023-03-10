import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs/promises'
import crypto from 'node:crypto';


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

function websocketHandshake(socket, secHeader) {
  //Modern browsers require the sec-websocket-key header
  if (!secHeader) {
    socket.end("HTTP/1.1 400 Bad Request");
    return;
  }

  //Hash websocket security key
  const keySuffix = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
  const sha1 = crypto.createHash("sha1");
  sha1.update(secHeader + keySuffix, "ascii");
  const key = sha1.digest("base64");

  socket.write('HTTP/1.1 101 Switching Protocols\r\n' +
    'Upgrade: websocket\r\n' +
    'Connection: Upgrade\r\n' +
    'sec-websocket-accept: ' + key + '\r\n' +
    '\r\n');
}

let socketCount = 0;
const sockets = new Map();

server.on('upgrade', (req, socket, head) => {
  const socketId = socketCount;
  sockets.set(socketId, socket);
  socketCount += 1;

  //Send all data to other sockets
  socket.on('data', data => {
    sockets.forEach((s, id) => {
      if (id !== socketId) {
        console.log(`Sending ${data.length} bytes: ${socketId} -> ${id}`)
        if (data.length < 50) console.log(data.toString())
        s.write(data);
      }
    })
  });

  socket.on('end', () => {
    console.log(`Socket ended: ${socketId}`)
    sockets.delete(socketId);
  });

  socket.on('error', (err) => {
    console.log(`Socket error: ${socketId}`)
    console.log(err)
  })

  const secHeader = req.headers["sec-websocket-key"];
  websocketHandshake(socket, secHeader);
  console.log(`New socket: ${socketId}`)
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
