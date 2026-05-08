import { Navigate } from "react-router";
import { useAuthStore } from "@/stores/authStore";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  isRestricted?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  isRestricted,
}) => {
  const user = useAuthStore((state) => state.user);
  const isAuth = useAuthStore((state) => state.isAuth);

  // Restricted routes (login, register): redirect to dashboard if already logged in
  if (isRestricted) {
    if (user && isAuth) {
      const role = user.role?.toLowerCase() ?? "owner";
      return (
        <Navigate
          to={`/dashboard/${role}`}
          replace
        />
      );
    }
    return <>{children}</>;
  }

  // Protected routes: require auth + role check
  if (allowedRoles) {
    if (!user || !isAuth) {
      return (
        <Navigate
          to="/login"
          replace
        />
      );
    }
    if (!allowedRoles.includes(user.role)) {
      return (
        <Navigate
          to={`/dashboard/${user.role}`}
          replace
        />
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
