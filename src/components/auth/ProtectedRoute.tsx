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

	// if (isRestricted) {
	// 	if (user && isAuth) {
	// 		const role = user.role?.toLowerCase() ?? "owner";
	// 		return <Navigate to={`/dashboard/${role}`} replace />;
	// 	}
	// 	return <>{children}</>;
	// }

	// if (allowedRoles) {
	// 	if (!user || !isAuth) {
	// 		toast.error("You have to login first");
	// 		return <Navigate to="/login" replace />;
	// 	}

	// 	if (!allowedRoles.includes(user.role)) {
	// 		toast.error("You don't have permission to access this page");
	// 		return <Navigate to="/" replace />;
	// 	}
	// }

	return <>{children}</>;
};

export default ProtectedRoute;
