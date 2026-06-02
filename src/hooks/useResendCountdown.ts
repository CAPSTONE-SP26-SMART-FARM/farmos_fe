import { useCallback, useEffect, useRef, useState } from "react";

export function useCountdown(defaultDurationSeconds = 60) {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clear = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(
    (durationOverride?: number) => {
      clear();
      const duration = durationOverride ?? defaultDurationSeconds;
      setSeconds(duration);
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            clear();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [defaultDurationSeconds, clear],
  );

  const reset = useCallback(() => {
    clear();
    setSeconds(0);
  }, [clear]);

  useEffect(() => clear, [clear]);

  return { seconds, isCountingDown: seconds > 0, start, reset };
}

export const useResendCountdown = useCountdown;
