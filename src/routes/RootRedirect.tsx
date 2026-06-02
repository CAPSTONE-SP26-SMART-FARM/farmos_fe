import { Navigate } from "react-router";

// Root path "/" no longer renders a landing page. Auth users get bounced to
// their dashboard by ProtectedRoute (isRestricted) on /login, so a single
// redirect target covers both auth and unauth cases.
export default function RootRedirect() {
  return <Navigate to="/login" replace />;
}
