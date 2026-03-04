import { Navigate } from "react-router";
import { useAuthStore } from "@/stores/authStore";

function RoleDashboardRedirect() {
  const user = useAuthStore((state) => state.user);
  const isAuth = useAuthStore((state) => state.isAuth);

  if (!user || !isAuth) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  const roleSlug = (user.role || "owner").toLowerCase();

  return (
    <Navigate
      to={`/dashboard/${roleSlug}`}
      replace
    />
  );
}

export default RoleDashboardRedirect;

