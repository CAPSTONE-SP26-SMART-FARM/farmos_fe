import { Navigate } from "react-router";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

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
      toast.error("Bạn cần đăng nhập để truy cập trang này");
      return (
        <Navigate
          to="/login"
          replace
        />
      );
    }
    if (!allowedRoles.includes(user.role)) {
      toast.error("Bạn không có quyền truy cập trang này");
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
