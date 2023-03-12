import { Application, Router } from "oak";

const app = new Application();
const router = new Router();

let socketCount = 0;
const sockets = new Map<number, WebSocket>();

router.get("/ws", (ctx) => {
  if (!ctx.isUpgradable) {
    ctx.throw(501);
  }
  const ws = ctx.upgrade();

  const socketId = socketCount;
  sockets.set(socketId, ws);
  socketCount += 1;

  ws.onerror = (e) => {
    if('message' in e) {
      console.error('websocket error', e.message)
    }
  }

  ws.onopen = () => {
    console.log(`New websocket connection: ${socketId}`)
  };

  ws.onmessage = (message) => {
    sockets.forEach((ws, id) => {
      if (id !== socketId) {
        ws.send(message.data);
      }
    })
  };

  ws.onclose = () => {
    console.log(`Socket closed: ${socketId}`)
    sockets.delete(socketId);
  }
});

app.use(router.routes());
app.use(router.allowedMethods());

//Static content
app.use(async (context, next) => {
  try {
    await context.send({
      root: `${Deno.cwd()}/static`,
      index: "index.html",
    });
  } catch {
    await next();
  }
});

// Deno.addSignalListener("SIGINT", () => {
//   console.log("interrupted!");
//   Deno.exit();
// });

await app.listen({ port: 8080 });
