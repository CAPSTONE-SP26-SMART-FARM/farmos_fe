import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/authStore";
import { disconnectSocket, getSocket, getSocketInstance } from "@/lib/socket";

/**
 * Theo dõi `accessToken` trong authStore. Khi token refresh (thay đổi), tear
 * down socket hiện tại và tạo instance mới để BE verify JWT lại — tránh
 * trường hợp socket.io-client tự reconnect với auth object cũ đã hết hạn.
 *
 * Phải mount sau `useSocketInit()` để instance tồn tại trước khi swap.
 */
export function useSocketAuthSync(): void {
  const accessToken = useAuthStore((s) => s.userToken?.accessToken);
  const prevToken = useRef<string | undefined>(accessToken);

  useEffect(() => {
    const prev = prevToken.current;
    prevToken.current = accessToken;

    if (!accessToken) return;
    if (!prev) return; // lần đầu mount — useSocketInit lo
    if (prev === accessToken) return;

    // Token đã đổi: chỉ rebuild nếu đang có socket instance.
    if (getSocketInstance()) {
      disconnectSocket();
      getSocket();
    }
  }, [accessToken]);
}
