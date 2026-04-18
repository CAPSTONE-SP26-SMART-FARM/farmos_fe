import { useEffect, useRef } from "react";
import type { Socket } from "socket.io-client";
import { getSocket, disconnectSocket, getSocketInstance } from "@/lib/socket";
import { useSocketStore } from "@/stores/socketStore";
import { useAuthStore } from "@/stores/authStore";

/**
 * Initialises the Socket.IO connection once and keeps the socketStore in sync.
 *
 * **Must be mounted exactly once** — typically inside `DashboardLayout`.
 * The socket is created when the user has a valid access token and torn
 * down when this hook unmounts (logout / navigate away from dashboard).
 */
export function useSocketInit(): void {
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  const setConnected = useSocketStore((s) => s.setConnected);
  const resetSocket = useSocketStore((s) => s.reset);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuth) {
      disconnectSocket();
      resetSocket();
      return;
    }

    const socket = getSocket();
    socketRef.current = socket;

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    // If already connected (reconnect scenario)
    if (socket.connected) setConnected(true);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, [isAuth, setConnected, resetSocket]);
}

/**
 * Subscribe the client to a specific zone room.
 * The backend will push `sensor.reading.changed` and `alert.created` events
 * scoped to this zone.
 */
export function useZoneSubscription(zoneId: string | undefined): void {
  useEffect(() => {
    const socket = getSocketInstance();
    if (!socket?.connected || !zoneId) return;

    socket.emit("zone.subscribe", { zoneId }, (res: { ok: boolean }) => {
      if (!res.ok) {
        console.warn("[socket] zone.subscribe failed for", zoneId);
      }
    });
  }, [zoneId]);
}
