import { useAuthStore } from "@/stores/authStore";
import { authService } from "@/services/authService";
import { jwtDecode } from "jwt-decode";
import type { JwtPayload } from "jwt-decode";
import { useEffect } from "react";
import { useLocation } from "react-router";

// Not check those paths
const NOT_CHECK_PATHS = ["/login", "/register", "/forgot-password"] as const;

function RefreshToken() {
  const isAuth = useAuthStore((state) => state.isAuth);
  const setTokens = useAuthStore((state) => state.setTokens);

  const location = useLocation();
  const pathName = location.pathname;

  useEffect(() => {
    if (
      NOT_CHECK_PATHS.includes(pathName as (typeof NOT_CHECK_PATHS)[number])
    ) {
      return;
    }

    const interval = setInterval(async () => {
      const now = Math.floor(Date.now() / 1000);
      const accessToken = localStorage.getItem("accessToken") || null;
      const refreshToken = localStorage.getItem("refreshToken") || null;

      if (!accessToken || !refreshToken) {
        return;
      }

      try {
        const decodeAccessToken = jwtDecode<JwtPayload>(accessToken);
        const exp = decodeAccessToken.exp ?? 0;

        // Token expiring within 60 seconds OR already expired
        if ((now <= exp && now >= exp - 60) || now >= exp) {
          try {
            const result = await authService.refreshToken({ refreshToken });

            localStorage.setItem("accessToken", result.accessToken);
            localStorage.setItem("refreshToken", result.refreshToken);
            setTokens({
              accessToken: result.accessToken,
              refreshToken: result.refreshToken,
            });
          } catch (error) {
            console.error("Token refresh failed:", error);
            // Do not force logout here. User logs out manually.
          }
        }
      } catch (error) {
        console.error("Token decode error:", error);
        // Non-JWT token (e.g., local dummy account) should not force logout.
      }
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, [pathName, setTokens]);

  if (!isAuth) {
    return null;
  }

  return null;
}

export default RefreshToken;
