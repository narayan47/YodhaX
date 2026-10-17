
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  BriefcaseBusiness,
  CheckCircle2,
  GraduationCap,
  LayoutDashboard,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
  Menu,
  X,
  Mail,
  CalendarDays,
  CircleAlert,
  LogOut,
  UserPlus,
  Eye,
  EyeOff,
  LockKeyhole,
  UserRound,
  Check,
} from "lucide-react";

import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import PlacementDrives from "../Components/PlacementDrives";
import ApplicationPipeline from "./ApplicationPipeline";

const navigation = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "students", label: "Students", icon: GraduationCap },
  { id: "drives", label: "Placement drives", icon: BriefcaseBusiness },
  { id: "verification", label: "Verification", icon: ShieldCheck },
  { id: "analytics", label: "Analytics", icon: Activity },
  { id: "application-pipeline", label: "Application pipeline", icon: Mail },
];

const initialStudentForm = {
  name: "",
  email: "",
  password: "",
};

function getErrorMessage(error) {
  if (error.response?.status === 401) {
    return "Your session has expired. Please log in again.";
  }

  if (error.response?.status === 403) {
    return "Your account does not have placement-cell permission.";
  }

  if (error.response?.status === 404) {
    return "API route not found. Check your backend route registration.";
  }

  return (
    error.response?.data?.message ||
    "Unable to load data. Check whether your backend is running."
  );
}

function MetricCard({ title, value, description, icon: Icon, color }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-[#11111b] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <p className="mt-3 text-3xl font-bold text-white">
            {value ?? 0}
          </p>
        </div>

        <div className={`rounded-xl p-3 ${color}`}>
          <Icon size={22} />
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-500">{description}</p>
    </article>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="px-5 py-12 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-slate-400">
        <CircleAlert size={22} />
      </div>

      <h3 className="mt-4 font-semibold text-white">{title}</h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
        {description}
      </p>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function initials(name = "") {
  return (
    String(name)
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] || "")
      .join("")
      .toUpperCase() || "S"
  );
}

function StudentCreationForm({ onCreated }) {
  const [form, setForm] = useState(initialStudentForm);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const password = form.password;

    if (!name || !email || !password) {
      setError("Name, email, and password are required.");
      return;
    }

    if (name.length < 2) {
      setError("Student name must contain at least 2 characters.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    setBusy(true);

    try {
      // The backend must hash this password before saving it.
      const { data } = await api.post("/placement/students", {
        name,
        email,
        password,
      });

      setSuccess(data.message || "Student account created successfully.");
      setForm(initialStudentForm);
      setShowPassword(false);

      if (onCreated) {
        await onCreated(data.student);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not create the student account."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-[#11111b] p-5 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <div className="rounded-xl bg-violet-400/10 p-3 text-violet-300">
          <UserPlus size={22} />
        </div>

        <div>
          <h3 className="font-semibold text-white">
            Create student account
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            Create a login account for a student using their name, email,
            and password.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-400/20 bg-red-400/5 p-3 text-sm text-red-200">
          <CircleAlert size={17} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-3 text-sm text-emerald-200">
          <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="student-name"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Student name
          </label>

          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#09090f] px-3">
            <UserRound size={17} className="shrink-0 text-slate-500" />

            <input
              id="student-name"
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter full name"
              autoComplete="name"
              maxLength={100}
              required
              className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-slate-600"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="student-email"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Email address
          </label>

          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#09090f] px-3">
            <Mail size={17} className="shrink-0 text-slate-500" />

            <input
              id="student-email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="student@example.com"
              autoComplete="email"
              required
              className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-slate-600"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="student-password"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Initial password
          </label>

          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#09090f] px-3">
            <LockKeyhole
              size={17}
              className="shrink-0 text-slate-500"
            />

            <input
              id="student-password"
              type={showPassword ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Minimum 8 characters"
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              required
              className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-slate-600"
            />

            <button
              type="button"
              onClick={() => setShowPassword((previous) => !previous)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="shrink-0 text-slate-400 hover:text-white"
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>

          <p className="mt-2 text-xs text-slate-500">
            Use a unique password and share it securely with the student.
          </p>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? (
            <>
              <RefreshCw size={17} className="animate-spin" />
              Creating account...
            </>
          ) : (
            <>
              <UserPlus size={17} />
              Create student account
            </>
          )}
        </button>
      </form>
    </section>
  );
}

export default function PlacementDashboard() {
  const { user, authLoading, logout } = useAuth();

  const [page, setPage] = useState("overview");
  const [mobileOpen, setMobileOpen] = useState(false);

  const [dashboard, setDashboard] = useState(null);
  const [students, setStudents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const loadDashboard = useCallback(async (quiet = false) => {
    if (quiet) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const { data } = await api.get("/placement/dashboard");
      setDashboard(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await api.get("/placement/students");

      setStudents(
        Array.isArray(data)
          ? data
          : Array.isArray(data.students)
            ? data.students
            : []
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !user || user.role !== "placementcell") {
      return;
    }

    if (page === "students") {
      loadStudents();
    } else {
      loadDashboard();
    }
  }, [authLoading, user, page, loadDashboard, loadStudents]);

  const metrics = dashboard?.metrics || {};

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return students.filter((student) =>
      [
        student.name,
        student.full_name,
        student.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [students, search]);

  function changePage(nextPage) {
    setPage(nextPage);
    setSearch("");
    setError("");
    setMobileOpen(false);
  }

  async function handleStudentCreated() {
    // Refresh dashboard counts and the student list after creation.
    await loadDashboard(true);

    try {
      const { data } = await api.get("/placement/students");

      setStudents(
        Array.isArray(data)
          ? data
          : Array.isArray(data.students)
            ? data.students
            : []
      );
    } catch {
      // Dashboard refresh has already been attempted.
    }
  }

  function refresh() {
    if (page === "students") {
      loadStudents();
    } else {
      loadDashboard(true);
    }
  }

  async function handleLogout() {
    try {
      if (typeof logout === "function") {
        await logout();
      } else {
        await api.post("/auth/logout");
      }
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      window.location.assign("/login");
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090f] text-white">
        <RefreshCw className="mr-3 animate-spin" size={20} />
        Checking your session...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090f] px-5 text-center text-white">
        <div>
          <ShieldCheck className="mx-auto text-violet-300" size={40} />
          <h1 className="mt-4 text-2xl font-bold">Login required</h1>
          <p className="mt-2 text-slate-400">
            Please log in to access your placement dashboard.
          </p>
          <a
            href="/login"
            className="mt-5 inline-block rounded-xl bg-violet-500 px-5 py-3 font-semibold"
          >
            Go to login
          </a>
        </div>
      </div>
    );
  }

  if (user.role !== "placementcell") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090f] px-5 text-center text-white">
        <div>
          <ShieldCheck className="mx-auto text-violet-300" size={40} />
          <h1 className="mt-4 text-2xl font-bold">
            Placement cell access only
          </h1>
          <p className="mt-2 text-slate-400">
            Your current account role is {user.role}.
          </p>
        </div>
      </div>
    );
  }

  const currentPage = navigation.find((item) => item.id === page);

  return (
    <div className="min-h-screen bg-[#09090f] text-white">
      {mobileOpen && (
        <button
          aria-label="Close navigation overlay"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-white/10 bg-[#0e0e18] transition-transform lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-[76px] items-center gap-3 border-b border-white/10 px-5">
          <span className="rounded-xl bg-violet-500/15 p-2.5 text-violet-300">
            <ShieldCheck size={23} />
          </span>

          <div>
            <p className="text-lg font-bold">
              VerifHire<span className="text-violet-400">.</span>
            </p>
            <p className="mt-1 text-[10px] tracking-[0.2em] text-slate-500">
              PLACEMENT CELL
            </p>
          </div>

          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto rounded-lg p-2 text-slate-400 lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-6">
          <p className="mb-4 px-3 text-[10px] font-bold tracking-[0.2em] text-slate-500">
            WORKSPACE
          </p>

          {navigation.map((item) => {
            const Icon = item.icon;
            const active = page === item.id;

            return (
              <button
                key={item.id}
                onClick={() => changePage(item.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${
                  active
                    ? "bg-violet-500/15 font-semibold text-violet-200"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-400/15 text-sm font-semibold text-violet-200">
              {initials(user.name || user.email)}
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {user.name || "Placement officer"}
              </p>
              <p className="truncate text-xs text-slate-500">
                {user.email}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="mt-4 flex w-full items-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5"
          >
            <LogOut size={16} />
            Log out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="min-h-screen lg:pl-[260px]">
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between gap-3 border-b border-white/10 bg-[#09090f]/90 px-4 backdrop-blur-xl sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
              className="rounded-lg border border-white/10 p-2 text-slate-300 lg:hidden"
            >
              <Menu size={20} />
            </button>

            <div>
              <h1 className="font-semibold">
                {currentPage?.label || "Placement overview"}
              </h1>
              <p className="mt-1 hidden text-xs text-slate-500 sm:block">
                VerifHire / Placement workspace
              </p>
            </div>
          </div>

          <button
            onClick={refresh}
            disabled={loading || refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-300 hover:bg-white/10 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={refreshing || loading ? "animate-spin" : ""}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </header>

        <main className="mx-auto max-w-[1500px] space-y-6 p-4 sm:p-6 lg:p-8">
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-200">
              <CircleAlert size={18} className="mt-0.5 shrink-0" />
              <p className="flex-1">{error}</p>
              <button
                onClick={() => setError("")}
                aria-label="Dismiss error"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex min-h-64 items-center justify-center text-slate-400">
              <RefreshCw className="mr-3 animate-spin" size={20} />
              Loading {page === "students" ? "students" : "dashboard"}...
            </div>
          ) : (
            <>
              {/* Overview */}
              {page === "overview" && (
                <>
                  <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                    <div>
                      <p className="text-sm font-medium text-violet-300">
                        PLACEMENT WORKSPACE
                      </p>
                      <h2 className="mt-2 text-3xl font-bold sm:text-4xl">
                        Welcome, {user.name?.split(" ")[0] || "Officer"}
                      </h2>
                      <p className="mt-2 text-sm text-slate-400">
                        Monitor student accounts and placement activity.
                      </p>
                    </div>

                    <button
                      onClick={() => changePage("students")}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-3 text-sm font-semibold hover:bg-violet-400"
                    >
                      <Users size={17} />
                      View students
                    </button>
                  </section>

                  <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <MetricCard
                      title="Registered students"
                      value={metrics.registered_students}
                      description="Student accounts in MongoDB"
                      icon={GraduationCap}
                      color="bg-violet-400/10 text-violet-300"
                    />

                    <MetricCard
                      title="Verified students"
                      value={metrics.verified_students}
                      description="Accounts with verified email"
                      icon={CheckCircle2}
                      color="bg-emerald-400/10 text-emerald-300"
                    />

                    <MetricCard
                      title="Recruiters"
                      value={metrics.recruiters}
                      description="Registered recruiter accounts"
                      icon={Users}
                      color="bg-blue-400/10 text-blue-300"
                    />

                    <MetricCard
                      title="Active drives"
                      value={metrics.active_drives}
                      description="Active placement drives"
                      icon={BriefcaseBusiness}
                      color="bg-amber-400/10 text-amber-300"
                    />
                  </section>

                  <section className="grid items-start gap-6 xl:grid-cols-[1.2fr_1fr]">
                    <div className="space-y-6">
                      <StudentCreationForm onCreated={handleStudentCreated} />

                      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#11111b]">
                        <div className="border-b border-white/10 px-5 py-4">
                          <h3 className="font-semibold">
                            Recently registered students
                          </h3>
                          <p className="mt-1 text-sm text-slate-400">
                            Latest student accounts from your database.
                          </p>
                        </div>

                        {dashboard?.recentStudents?.length ? (
                          <div className="divide-y divide-white/5">
                            {dashboard.recentStudents.map((student) => (
                              <div
                                key={student.id || student._id || student.email}
                                className="flex items-center gap-3 px-5 py-4"
                              >
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-400/10 text-xs font-semibold text-violet-300">
                                  {initials(student.name)}
                                </span>

                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium">
                                    {student.name}
                                  </p>
                                  <p className="mt-1 truncate text-xs text-slate-500">
                                    {student.email}
                                  </p>
                                </div>

                                <span
                                  className={`rounded-full px-2.5 py-1 text-xs ${
                                    student.isEmailVerified
                                      ? "bg-emerald-400/10 text-emerald-300"
                                      : "bg-amber-400/10 text-amber-300"
                                  }`}
                                >
                                  {student.isEmailVerified
                                    ? "Verified"
                                    : "Unverified"}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <EmptyState
                            title="No student accounts yet"
                            description="New student accounts will appear here after creation or registration."
                          />
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[#11111b] p-5">
                      <h3 className="font-semibold">Placement workspace</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        Manage student records and monitor the recruitment
                        process.
                      </p>

                      <div className="mt-5 space-y-3">
                        <button
                          onClick={() => changePage("students")}
                          className="flex w-full items-center gap-3 rounded-xl border border-white/10 p-4 text-left hover:bg-white/5"
                        >
                          <GraduationCap
                            className="text-violet-300"
                            size={20}
                          />
                          <span className="flex-1 text-sm">
                            Student directory
                          </span>
                          <span className="text-xs text-slate-500">
                            {metrics.registered_students ?? students.length}
                          </span>
                        </button>

                        <button
                          onClick={() => changePage("verification")}
                          className="flex w-full items-center gap-3 rounded-xl border border-white/10 p-4 text-left hover:bg-white/5"
                        >
                          <Mail className="text-blue-300" size={20} />
                          <span className="flex-1 text-sm">
                            Verification requests
                          </span>
                          <span className="text-xs text-slate-500">
                            {metrics.pending_approvals ?? 0}
                          </span>
                        </button>

                        <button
                          onClick={() => changePage("drives")}
                          className="flex w-full items-center gap-3 rounded-xl border border-white/10 p-4 text-left hover:bg-white/5"
                        >
                          <CalendarDays
                            className="text-amber-300"
                            size={20}
                          />
                          <span className="flex-1 text-sm">
                            Placement drives
                          </span>
                          <BriefcaseBusiness
                            size={16}
                            className="text-slate-500"
                          />
                        </button>

                        <button
                          onClick={() => changePage("application-pipeline")}
                          className="flex w-full items-center gap-3 rounded-xl border border-white/10 p-4 text-left hover:bg-white/5"
                        >
                          <Activity
                            className="text-emerald-300"
                            size={20}
                          />
                          <span className="flex-1 text-sm">
                            Application pipeline
                          </span>
                          <Mail size={16} className="text-slate-500" />
                        </button>
                      </div>
                    </div>
                  </section>
                </>
              )}

              {/* Students */}
              {page === "students" && (
                <div className="space-y-6">
                  <StudentCreationForm onCreated={handleStudentCreated} />

                  <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#11111b]">
                    <div className="flex flex-col justify-between gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-center">
                      <div>
                        <h2 className="text-xl font-semibold">
                          Student directory
                        </h2>
                        <p className="mt-1 text-sm text-slate-400">
                          {filteredStudents.length} student(s) found
                        </p>
                      </div>

                      <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#09090f] px-3 py-2.5">
                        <Search size={17} className="text-slate-500" />
                        <input
                          value={search}
                          onChange={(event) => setSearch(event.target.value)}
                          placeholder="Search students..."
                          className="w-full bg-transparent text-sm outline-none placeholder:text-slate-600 sm:w-64"
                        />
                      </label>
                    </div>

                    {filteredStudents.length ? (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[650px] text-left text-sm">
                          <thead className="border-b border-white/10 text-xs text-slate-500">
                            <tr>
                              <th className="px-5 py-4 font-medium">
                                Student
                              </th>
                              <th className="px-5 py-4 font-medium">Email</th>
                              <th className="px-5 py-4 font-medium">
                                Email status
                              </th>
                              <th className="px-5 py-4 font-medium">
                                Registered
                              </th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-white/5">
                            {filteredStudents.map((student) => (
                             
                              <tr key={student.id || student._id || student.email}>
                                <td className="px-5 py-4">
                                  <div className="flex items-center gap-3">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-400/10 text-xs font-semibold text-violet-300">
                                      {initials(
                                        student.name || student.full_name
                                      )}
                                    </span>
                                    <span className="font-medium">
                                      {student.name ||
                                        student.full_name ||
                                        "Student"}
                                    </span>
                                  </div>
                                </td>

                                <td className="px-5 py-4 text-slate-300">
                                  {student.email || "—"}
                                </td>

                                <td className="px-5 py-4">
                                  <span
                                    className={`rounded-full px-2.5 py-1 text-xs ${
                                      student.isEmailVerified
                                        ? "bg-emerald-400/10 text-emerald-300"
                                        : "bg-amber-400/10 text-amber-300"
                                    }`}
                                  >
                                    {student.isEmailVerified
                                      ? "Verified"
                                      : "Unverified"}
                                  </span>
                                </td>

                                <td className="px-5 py-4 text-slate-400">
                                  {formatDate(student.createdAt)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <EmptyState
                        title={
                          search ? "No matching students" : "No students found"
                        }
                        description={
                          search
                            ? "Try searching by another name or email."
                            : "Create a student account using the form above."
                        }
                      />
                    )}
                  </section>
                </div>
              )}

              {/* Placement drives */}
              {page === "drives" && <PlacementDrives />}

              {/* Verification */}
              {page === "verification" && (
                <section className="rounded-2xl border border-white/10 bg-[#11111b]">
                  <EmptyState
                    title="Verification queue"
                    description="Email verification status is available in the student directory. Skill and document verification need their own backend models and review routes."
                  />
                </section>
              )}

              {/* Analytics */}
              {page === "analytics" && (
                <section className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold">Placement analytics</h2>
                    <p className="mt-2 text-sm text-slate-400">
                      Current account and placement activity counts.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <MetricCard
                      title="Student accounts"
                      value={metrics.registered_students}
                      description="Total registered student accounts"
                      icon={GraduationCap}
                      color="bg-violet-400/10 text-violet-300"
                    />

                    <MetricCard
                      title="Recruiter accounts"
                      value={metrics.recruiters}
                      description="Total registered recruiter accounts"
                      icon={Users}
                      color="bg-blue-400/10 text-blue-300"
                    />

                    <MetricCard
                      title="Verified students"
                      value={metrics.verified_students}
                      description="Student accounts with verified email"
                      icon={CheckCircle2}
                      color="bg-emerald-400/10 text-emerald-300"
                    />

                    <MetricCard
                      title="Active drives"
                      value={metrics.active_drives}
                      description="Active placement drives"
                      icon={BriefcaseBusiness}
                      color="bg-amber-400/10 text-amber-300"
                    />

                    <MetricCard
                      title="Pending approvals"
                      value={metrics.pending_approvals}
                      description="Pending verification requests, if connected"
                      icon={ShieldCheck}
                      color="bg-blue-400/10 text-blue-300"
                    />

                    <MetricCard
                      title="Offers received"
                      value={metrics.offers_received}
                      description="Recorded offers, if connected"
                      icon={Check}
                      color="bg-emerald-400/10 text-emerald-300"
                    />
                  </div>
                </section>
              )}

              {/* Application pipeline */}
              {page === "application-pipeline" && <ApplicationPipeline />}
            </>
          )}

          <footer className="border-t border-white/10 pt-5 text-xs text-slate-500">
            VerifHire · Placement management
          </footer>
        </main>
      </div>
    </div>
  );
}
