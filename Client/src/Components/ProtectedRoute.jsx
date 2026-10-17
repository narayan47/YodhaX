
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const dashboardPaths = {
  student: "/student/dashboard",
  recruiter: "/recruiter/dashboard",
  placementcell: "/placement/dashboard",
  alumni: "/alumni/dashboard",
};

export default function ProtectedRoute({
  allowedRoles = [],
  children,
}) {
  const { user, authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090f] text-slate-300">
        Checking your session...
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  const userRole = user.role?.toLowerCase();

  const normalizedAllowedRoles = allowedRoles.map((role) =>
    role.toLowerCase()
  );

  if (
    normalizedAllowedRoles.length > 0 &&
    !normalizedAllowedRoles.includes(userRole)
  ) {
    return (
      <Navigate
        to={dashboardPaths[userRole] || "/"}
        replace
      />
    );
  }

  // Supports both direct children and nested routes.
  return children ?? <Outlet />;
}
