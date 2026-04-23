import { useEffect } from "react";
import { getSocketInstance } from "@/lib/socket";
import { useSocketStore } from "@/stores/socketStore";
import {
  RealtimeClientEvents,
  type RealtimeAck,
} from "@/constants/realtime";

/**
 * Emit `zone.subscribe` khi socket connected + zoneId có sẵn.
 * Resubscribe tự động sau reconnect nhờ dependency `connected`.
 */
export function useZoneSubscription(zoneId: string | undefined): void {
  const connected = useSocketStore((s) => s.connected);

  useEffect(() => {
    if (!connected || !zoneId) return;
    const socket = getSocketInstance();
    if (!socket) return;

    socket.emit(
      RealtimeClientEvents.ZoneSubscribe,
      { zoneId },
      (ack: RealtimeAck) => {
        if (!ack?.ok) {
          console.warn("[realtime] zone.subscribe denied", zoneId);
        }
      },
    );
  }, [connected, zoneId]);
}

/**
 * Emit `zone.subscribe` cho danh sách zoneId khi socket connected.
 * Dùng cho dashboard nhiều khu vực để không bỏ sót alert ở zone ngoài top 3.
 */
export function useZoneSubscriptions(zoneIds: string[]): void {
  const connected = useSocketStore((s) => s.connected);

  useEffect(() => {
    if (!connected || zoneIds.length === 0) return;
    const socket = getSocketInstance();
    if (!socket) return;

    const uniqueZoneIds = [...new Set(zoneIds.filter(Boolean))];
    uniqueZoneIds.forEach((zoneId) => {
      socket.emit(
        RealtimeClientEvents.ZoneSubscribe,
        { zoneId },
        (ack: RealtimeAck) => {
          if (!ack?.ok) {
            console.warn("[realtime] zone.subscribe denied", zoneId);
          }
        },
      );
    });
  }, [connected, zoneIds]);
}
