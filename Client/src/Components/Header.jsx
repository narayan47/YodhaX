
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Menu,
  ShieldCheck,
  LayoutDashboard,
  LogOut,
  ChevronDown,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const dashboardPaths = {
  student: "/student/dashboard",
  recruiter: "/recruiter/dashboard",
  placementcell: "/placement/dashboard",
};

const homeLinks = [
  ["How it works", "/#how-it-works"],
  ["For students", "/#students"],
  ["For recruiters", "/#recruiters"],
  ["About", "/#about"],
];

export default function Header() {
  const { user, logout, authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isHomePage = location.pathname === "/";

  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const dashboardPath = user
    ? dashboardPaths[user.role]
    : null;

  const closeMobileMenu = () => setMobileOpen(false);

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      navigate("/login", { replace: true });
    } finally {
      setLoggingOut(false);
      closeMobileMenu();
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#09090f]/90 text-white backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-4 sm:px-7">
        <Link
          to="/"
          onClick={closeMobileMenu}
          className="flex items-center gap-2.5"
        >
          <span className="rounded-xl bg-violet-500/15 p-2 text-violet-300">
            <ShieldCheck size={22} />
          </span>

          <span className="text-xl font-semibold tracking-tight">
            verifhir<span className="text-violet-400">.</span>
          </span>
        </Link>

        {!authLoading && (
          <>
            {/* Desktop navigation */}
            <nav className="hidden items-center gap-7 text-sm text-slate-400 md:flex">
              {!user ? (
                isHomePage ? (
                  homeLinks.map(([label, href]) => (
                    <a
                      key={label}
                      href={href}
                      className="transition hover:text-white"
                    >
                      {label}
                    </a>
                  ))
                ) : (
                  <Link to="/" className="hover:text-white">
                    Home
                  </Link>
                )
              ) : (
                <Link
                  to={dashboardPath || "/"}
                  className="flex items-center gap-2 hover:text-white"
                >
                  <LayoutDashboard size={16} />
                  Dashboard
                </Link>
              )}
            </nav>

            {/* Desktop actions */}
            <div className="hidden items-center gap-3 md:flex">
              {!user ? (
                <>
                  <Link
                    to="/login"
                    className="rounded-xl px-4 py-2.5 text-sm text-slate-300 hover:text-white"
                  >
                    Log in
                  </Link>

                  <Link
                    to="/signup"
                    className="rounded-xl bg-violet-500 px-5 py-2.5 text-sm font-semibold hover:bg-violet-400"
                  >
                    Get started
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to={dashboardPath || "/"}
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm hover:bg-white/10"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-400/15 text-xs font-semibold text-violet-200">
                      {user.name?.charAt(0)?.toUpperCase() || "U"}
                    </span>

                    <span className="max-w-32 truncate">
                      {user.name || "My account"}
                    </span>

                    <ChevronDown size={15} />
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300 hover:border-red-400/30 hover:text-red-300 disabled:opacity-50"
                  >
                    <LogOut size={16} />
                    {loggingOut ? "Logging out..." : "Log out"}
                  </button>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              className="rounded-lg border border-white/10 p-2 md:hidden"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={21} /> : <Menu size={21} />}
            </button>
          </>
        )}
      </div>

      {/* Mobile navigation */}
      {mobileOpen && !authLoading && (
        <div className="border-t border-white/10 bg-[#0d0d15] p-4 md:hidden">
          <nav className="flex flex-col gap-2">
            {!user ? (
              <>
                {isHomePage ? (
                  homeLinks.map(([label, href]) => (
                    <a
                      key={label}
                      href={href}
                      onClick={closeMobileMenu}
                      className="rounded-lg px-3 py-3 text-sm text-slate-300 hover:bg-white/5"
                    >
                      {label}
                    </a>
                  ))
                ) : (
                  <Link
                    to="/"
                    onClick={closeMobileMenu}
                    className="rounded-lg px-3 py-3 text-sm text-slate-300 hover:bg-white/5"
                  >
                    Home
                  </Link>
                )}

                <Link
                  to="/login"
                  onClick={closeMobileMenu}
                  className="rounded-lg px-3 py-3 text-sm text-slate-300 hover:bg-white/5"
                >
                  Log in
                </Link>

                <Link
                  to="/signup"
                  onClick={closeMobileMenu}
                  className="rounded-lg bg-violet-500 px-3 py-3 text-sm font-semibold"
                >
                  Get started
                </Link>
              </>
            ) : (
              <>
                <div className="px-3 py-2">
                  <p className="font-medium">
                    {user.name || "My account"}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {user.role === "student"
                      ? "Student / Jobseeker"
                      : user.role === "recruiter"
                        ? "Recruiter"
                        : user.role === "placementcell"
                          ? "Placement cell"
                          : user.role}
                  </p>
                </div>

                <Link
                  to={dashboardPath || "/"}
                  onClick={closeMobileMenu}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm hover:bg-white/5"
                >
                  <LayoutDashboard size={17} />
                  Dashboard
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-left text-sm text-red-300 hover:bg-red-400/5 disabled:opacity-50"
                >
                  <LogOut size={17} />
                  {loggingOut ? "Logging out..." : "Log out"}
                </button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
