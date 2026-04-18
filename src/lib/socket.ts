import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

/**
 * Get or create a Socket.IO client singleton.
 * Auth token is read fresh from localStorage on each call so reconnects
 * pick up refreshed tokens automatically.
 */
export function getSocket(): Socket {
  if (socket?.connected) return socket;

  const token = localStorage.getItem("accessToken");

  // Disconnect stale instance before creating a new one
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }

  socket = io(import.meta.env.VITE_WS_URL ?? import.meta.env.VITE_API_URL, {
    auth: { token: token ? `Bearer ${token}` : "" },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30000,
    autoConnect: true,
  });

  return socket;
}

/**
 * Return the current socket instance (may be null if never initialised).
 */
export function getSocketInstance(): Socket | null {
  return socket;
}

/**
 * Tear down socket completely (used on logout).
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}
