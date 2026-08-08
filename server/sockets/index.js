import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
let ioInstance = null;

function pairRoom(trainerId, clientId) {
  return `pair:${trainerId}:${clientId}`;
}

export function initSockets(io) {
  ioInstance = io;

  // Same JWT the REST API trusts — a socket can't claim an identity
  // the person's actual session doesn't have.
  io.use((socket, next) => {
    try {
      const payload = jwt.verify(socket.handshake.auth?.token, JWT_SECRET);
      socket.user = { id: payload.id, role: payload.role };
      next();
    } catch {
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.user.id}`);

    /**
     * join_thread
     * Re-checks membership server-side before letting the socket
     * subscribe — never trust that the client only asks to join its
     * own threads.
     *
     * NOTE: client-side code MUST emit "join_thread" (not "join:pair") —
     * that mismatch was the original bug that broke cross-user delivery.
     */
    socket.on("join_thread", ({ trainerId, clientId }, ack) => {
      const isMember =
        (socket.user.role === "trainer" && String(socket.user.id) === String(trainerId)) ||
        (socket.user.role === "client" && String(socket.user.id) === String(clientId));
      if (!isMember) return ack?.({ ok: false, error: "not a member" });
      socket.join(pairRoom(trainerId, clientId));
      ack?.({ ok: true });
    });

    /**
     * leave_thread
     * Lets a socket (typically the trainer, who can have many open
     * threads) drop out of a pair room when switching conversations,
     * so a later message:new for a stale room can't leak into whatever
     * thread happens to be active on the client at delivery time.
     */
    socket.on("leave_thread", ({ trainerId, clientId }) => {
      socket.leave(pairRoom(trainerId, clientId));
    });

    socket.on("typing", ({ trainerId, clientId }) => {
      socket.to(pairRoom(trainerId, clientId)).emit("typing", { role: socket.user.role });
    });
  });
}

/** Used by route handlers (messages.js, bookings.js) to push live updates. */
export function emitToPair(trainerId, clientId, event, payload) {
  ioInstance?.to(pairRoom(trainerId, clientId)).emit(event, payload);
}