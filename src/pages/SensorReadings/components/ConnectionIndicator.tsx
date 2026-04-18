import { useSocketStore } from "@/stores/socketStore";
import { Wifi, WifiOff } from "lucide-react";

export default function ConnectionIndicator() {
  const connected = useSocketStore((s) => s.connected);

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      {connected ? (
        <>
          <Wifi className="h-3.5 w-3.5 text-green-500" />
          <span>Realtime</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3.5 w-3.5 text-yellow-500" />
          <span>Polling</span>
        </>
      )}
    </div>
  );
}
