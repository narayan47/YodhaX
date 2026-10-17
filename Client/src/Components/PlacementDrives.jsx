
import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  RefreshCw,
  Search,
  BriefcaseBusiness,
  Users,
  MapPin,
  CalendarDays,
  IndianRupee,
  Pencil,
  X,
  CircleAlert,
  CheckCircle2,
  UserPlus,
  GraduationCap,
} from "lucide-react";

import api from "../api/axios";

const INITIAL_FORM = {
  companyName: "",
  role: "",
  description: "",
  location: "",
  employmentType: "Full-time",
  packageLpa: "0",
  minCgpa: "0",
  eligibleCourses: "",
  eligibleGraduationYears: "",
  deadline: "",
  driveDate: "",
  status: "Open",
};

const DRIVE_STATUSES = ["Draft", "Open", "Closed", "Completed"];

const APPLICATION_STATUSES = [
  "Applied",
  "Shortlisted",
  "Rejected",
  "Selected",
  "Withdrawn",
];

function getError(error) {
  if (error.response?.status === 401) {
    return "Your session expired. Please log in again.";
  }

  if (error.response?.status === 403) {
    return "Only placement officers can manage placement drives.";
  }

  return (
    error.response?.data?.message ||
    "Something went wrong. Please try again."
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

function getId(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return String(value._id || value.id || "");
}

function StatusBadge({ status }) {
  const styles = {
    Open: "bg-emerald-400/10 text-emerald-300",
    Draft: "bg-slate-400/10 text-slate-300",
    Closed: "bg-amber-400/10 text-amber-300",
    Completed: "bg-blue-400/10 text-blue-300",
    Applied: "bg-blue-400/10 text-blue-300",
    Shortlisted: "bg-violet-400/10 text-violet-300",
    Selected: "bg-emerald-400/10 text-emerald-300",
    Rejected: "bg-red-400/10 text-red-300",
    Withdrawn: "bg-slate-400/10 text-slate-300",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        styles[status] || "bg-white/5 text-slate-300"
      }`}
    >
      {status || "Unknown"}
    </span>
  );
}

function Field({ label, children, className = "" }) {
  return (
    <label className={`block text-sm text-slate-300 ${className}`}>
      <span className="mb-2 block">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-white/10 bg-[#09090f] px-3 py-3 text-sm text-white outline-none transition focus:border-violet-400";

function EmptyState({ title, description }) {
  return (
    <div className="px-5 py-12 text-center">
      <BriefcaseBusiness
        size={32}
        className="mx-auto text-slate-500"
      />
      <h3 className="mt-4 font-semibold text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
        {description}
      </p>
    </div>
  );
}

export default function PlacementDrives() {
  const [drives, setDrives] = useState([]);
  const [students, setStudents] = useState([]);

  const [form, setForm] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [expandedDrive, setExpandedDrive] = useState("");
  const [studentSelections, setStudentSelections] = useState({});
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [driveResponse, studentResponse] = await Promise.all([
        api.get("/placement/drives"),
        api.get("/placement/students"),
      ]);

      const driveData = driveResponse.data;
      const studentData = studentResponse.data;

      setDrives(
        Array.isArray(driveData)
          ? driveData
          : driveData.drives || []
      );

      setStudents(
        Array.isArray(studentData)
          ? studentData
          : studentData.students || []
      );
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function updateForm(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function openCreateForm() {
    setEditingId("");
    setForm(INITIAL_FORM);
    setShowForm(true);
    setError("");
    setNotice("");
  }

  function openEditForm(drive) {
    setEditingId(getId(drive));

    setForm({
      companyName: drive.companyName || "",
      role: drive.role || "",
      description: drive.description || "",
      location: drive.location || "",
      employmentType: drive.employmentType || "Full-time",
      packageLpa: String(drive.packageLpa ?? 0),
      minCgpa: String(drive.minCgpa ?? 0),
      eligibleCourses: Array.isArray(drive.eligibleCourses)
        ? drive.eligibleCourses.join(", ")
        : "",
      eligibleGraduationYears: Array.isArray(
        drive.eligibleGraduationYears
      )
        ? drive.eligibleGraduationYears.join(", ")
        : "",
      deadline: drive.deadline
        ? new Date(drive.deadline).toISOString().slice(0, 10)
        : "",
      driveDate: drive.driveDate
        ? new Date(drive.driveDate).toISOString().slice(0, 10)
        : "",
      status: drive.status || "Open",
    });

    setShowForm(true);
    setError("");
    setNotice("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const payload = {
        companyName: form.companyName.trim(),
        role: form.role.trim(),
        description: form.description.trim(),
        location: form.location.trim() || "Not specified",
        employmentType: form.employmentType,
        packageLpa: Number(form.packageLpa),
        minCgpa: Number(form.minCgpa),
        eligibleCourses: form.eligibleCourses
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        eligibleGraduationYears: form.eligibleGraduationYears
          .split(",")
          .map((item) => Number(item.trim()))
          .filter(
            (year) =>
              Number.isInteger(year) &&
              year >= 1900 &&
              year <= 2200
          ),
        deadline: form.deadline,
        driveDate: form.driveDate || undefined,
        status: form.status,
      };

      if (
        !payload.companyName ||
        !payload.role ||
        !payload.deadline
      ) {
        setError("Company, role, and deadline are required.");
        return;
      }

      if (
        !Number.isFinite(payload.packageLpa) ||
        payload.packageLpa < 0 ||
        !Number.isFinite(payload.minCgpa) ||
        payload.minCgpa < 0 ||
        payload.minCgpa > 10
      ) {
        setError(
          "Package must be non-negative and CGPA must be between 0 and 10."
        );
        return;
      }

      if (editingId) {
        await api.patch(
          `/placement/drives/${editingId}`,
          payload
        );
        setNotice("Placement drive updated successfully.");
      } else {
        await api.post("/placement/drives", payload);
        setNotice("Placement drive created successfully.");
      }

      setForm(INITIAL_FORM);
      setEditingId("");
      setShowForm(false);

      await loadData();
    } catch (err) {
      setError(getError(err));
    } finally {
      setSaving(false);
    }
  }

  async function addStudent(drive) {
    const driveId = getId(drive);
    const studentId = studentSelections[driveId];

    if (!studentId) {
      setError("Please select a student first.");
      return;
    }

    setError("");
    setNotice("");

    try {
      const response = await api.post(
        `/placement/drives/${driveId}/students`,
        { studentId }
      );

      setNotice(
        response.data.message || "Student added to placement drive."
      );

      setStudentSelections((previous) => ({
        ...previous,
        [driveId]: "",
      }));

      await loadData();
    } catch (err) {
      setError(getError(err));
    }
  }

  async function updateApplicationStatus(
    drive,
    application,
    status
  ) {
    const driveId = getId(drive);
    const studentId = getId(application.student);

    if (!driveId || !studentId) {
      setError("Could not identify this drive or student.");
      return;
    }

    setError("");
    setNotice("");

    try {
      const response = await api.patch(
        `/placement/drives/${driveId}/students/${studentId}`,
        { status }
      );

      setNotice(
        response.data.message || "Application status updated."
      );

      await loadData();
    } catch (err) {
      setError(getError(err));
    }
  }

  const filteredDrives = drives.filter((drive) => {
    const query = search.trim().toLowerCase();

    if (!query) return true;

    return [
      drive.companyName,
      drive.role,
      drive.location,
      drive.status,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(query);
  });

  const openDrives = drives.filter(
    (drive) =>
      drive.status === "Open" &&
      new Date(drive.deadline) >= new Date()
  ).length;

  const totalApplications = drives.reduce(
    (total, drive) =>
      total +
      (drive.applicationCount ??
        drive.applications?.length ??
        0),
    0
  );

  return (
    <section className="space-y-6 text-white">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-violet-300">
            RECRUITMENT MANAGEMENT
          </p>

          <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
            Placement drives
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            Manage companies, eligibility, student applications,
            and recruitment progress.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm hover:bg-white/5 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-500 px-4 py-3 text-sm font-semibold hover:bg-violet-400"
          >
            <Plus size={17} />
            Create drive
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-200"
        >
          <CircleAlert size={18} className="mt-0.5 shrink-0" />
          <p className="flex-1">{error}</p>
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4 text-sm text-emerald-200"
        >
          <CheckCircle2 size={18} className="shrink-0" />
          <p className="flex-1">{notice}</p>
          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-[#11111b] p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">
              Total drives
            </span>
            <BriefcaseBusiness
              size={20}
              className="text-violet-300"
            />
          </div>
          <p className="mt-3 text-3xl font-bold">{drives.length}</p>
          <p className="mt-2 text-xs text-slate-500">
            All recorded placement drives
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#11111b] p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">
              Currently open
            </span>
            <CalendarDays
              size={20}
              className="text-emerald-300"
            />
          </div>
          <p className="mt-3 text-3xl font-bold">{openDrives}</p>
          <p className="mt-2 text-xs text-slate-500">
            Open drives with future deadlines
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#11111b] p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">
              Applications
            </span>
            <Users size={20} className="text-blue-300" />
          </div>
          <p className="mt-3 text-3xl font-bold">
            {totalApplications}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Applications across all drives
          </p>
        </div>
      </div>

      {/* Create/edit form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-white/10 bg-[#11111b] p-5 sm:p-6"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">
                {editingId
                  ? "Edit placement drive"
                  : "Create placement drive"}
              </h3>

              <p className="mt-1 text-sm text-slate-400">
                Enter the company details and student eligibility.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId("");
                setForm(INITIAL_FORM);
              }}
              aria-label="Close form"
              className="rounded-lg p-2 text-slate-400 hover:bg-white/5"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company name">
              <input
                name="companyName"
                value={form.companyName}
                onChange={updateForm}
                required
                maxLength={150}
                className={inputClass}
                placeholder="e.g. TCS"
              />
            </Field>

            <Field label="Job role">
              <input
                name="role"
                value={form.role}
                onChange={updateForm}
                required
                maxLength={150}
                className={inputClass}
                placeholder="e.g. Software Developer"
              />
            </Field>

            <Field label="Location">
              <input
                name="location"
                value={form.location}
                onChange={updateForm}
                className={inputClass}
                placeholder="e.g. Pune / Remote"
              />
            </Field>

            <Field label="Employment type">
              <select
                name="employmentType"
                value={form.employmentType}
                onChange={updateForm}
                className={inputClass}
              >
                {[
                  "Full-time",
                  "Internship",
                  "Contract",
                  "Part-time",
                ].map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Package (LPA)">
              <div className="relative">
                <IndianRupee
                  size={16}
                  className="absolute left-3 top-3.5 text-slate-500"
                />
                <input
                  type="number"
                  name="packageLpa"
                  min="0"
                  step="0.1"
                  value={form.packageLpa}
                  onChange={updateForm}
                  className={`${inputClass} pl-9`}
                />
              </div>
            </Field>

            <Field label="Minimum CGPA (out of 10)">
              <input
                type="number"
                name="minCgpa"
                min="0"
                max="10"
                step="0.1"
                value={form.minCgpa}
                onChange={updateForm}
                className={inputClass}
              />
            </Field>

            <Field label="Eligible courses">
              <input
                name="eligibleCourses"
                value={form.eligibleCourses}
                onChange={updateForm}
                className={inputClass}
                placeholder="BCA, MCA, B.Tech"
              />
              <span className="mt-1 block text-xs text-slate-500">
                Separate multiple courses with commas.
              </span>
            </Field>

            <Field label="Graduation years">
              <input
                name="eligibleGraduationYears"
                value={form.eligibleGraduationYears}
                onChange={updateForm}
                className={inputClass}
                placeholder="2026, 2027"
              />
              <span className="mt-1 block text-xs text-slate-500">
                Separate years with commas.
              </span>
            </Field>

            <Field label="Application deadline">
              <input
                type="date"
                name="deadline"
                value={form.deadline}
                onChange={updateForm}
                required
                className={inputClass}
              />
            </Field>

            <Field label="Drive date (optional)">
              <input
                type="date"
                name="driveDate"
                value={form.driveDate}
                onChange={updateForm}
                className={inputClass}
              />
            </Field>

            <Field label="Drive status">
              <select
                name="status"
                value={form.status}
                onChange={updateForm}
                className={inputClass}
              >
                {DRIVE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Job description">
            <textarea
              name="description"
              value={form.description}
              onChange={updateForm}
              rows={4}
              maxLength={5000}
              className={inputClass}
              placeholder="Responsibilities, required skills, selection process..."
            />
          </Field>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId("");
                setForm(INITIAL_FORM);
              }}
              className="rounded-xl border border-white/10 px-5 py-3 text-sm hover:bg-white/5"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-violet-500 px-5 py-3 text-sm font-semibold hover:bg-violet-400 disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Save changes"
                  : "Create drive"}
            </button>
          </div>
        </form>
      )}

      {/* Drive list header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-lg font-semibold">All placement drives</h3>
          <p className="mt-1 text-sm text-slate-400">
            {filteredDrives.length} drive(s) found
          </p>
        </div>

        <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#11111b] px-3 py-2.5">
          <Search size={17} className="text-slate-500" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search company or role..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-600 sm:w-64"
          />
        </label>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex min-h-40 items-center justify-center text-slate-400">
          <RefreshCw size={20} className="mr-3 animate-spin" />
          Loading placement drives...
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredDrives.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-[#11111b]">
          <EmptyState
            title={
              search
                ? "No matching placement drives"
                : "No placement drives yet"
            }
            description={
              search
                ? "Try searching for another company or job role."
                : "Create your first placement drive to start managing applications."
            }
          />
        </div>
      )}

      {/* Placement drive cards */}
      {!loading && filteredDrives.length > 0 && (
        <div className="grid gap-5 xl:grid-cols-2">
          {filteredDrives.map((drive) => {
            const driveId = getId(drive);
            const applications = drive.applications || [];
            const isExpanded = expandedDrive === driveId;

            const deadlinePassed =
              drive.deadline &&
              new Date(drive.deadline) < new Date();

            const assignedStudentIds = new Set(
              applications.map((app) => getId(app.student))
            );

            const eligibleChoices = students.filter(
              (student) =>
                !assignedStudentIds.has(getId(student))
            );

            return (
              <article
                key={driveId}
                className="overflow-hidden rounded-2xl border border-white/10 bg-[#11111b]"
              >
                <div className="space-y-5 p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-400/10 text-violet-300">
                      <BriefcaseBusiness size={23} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold">
                          {drive.companyName}
                        </h3>
                        <StatusBadge status={drive.status} />
                      </div>

                      <p className="mt-1 text-sm text-slate-300">
                        {drive.role}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => openEditForm(drive)}
                      aria-label={`Edit ${drive.companyName} drive`}
                      className="rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-white/5"
                    >
                      <Pencil size={16} />
                    </button>
                  </div>

                  {drive.description && (
                    <p className="text-sm leading-6 text-slate-400">
                      {drive.description}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-white/[0.03] p-3">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <IndianRupee size={14} />
                        Package
                      </div>
                      <p className="mt-2 font-semibold">
                        {Number(drive.packageLpa || 0) > 0
                          ? `${drive.packageLpa} LPA`
                          : "Not specified"}
                      </p>
                    </div>

                    <div className="rounded-xl bg-white/[0.03] p-3">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Users size={14} />
                        Applications
                      </div>
                      <p className="mt-2 font-semibold">
                        {drive.applicationCount ??
                          applications.length}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-slate-400">
                    <p className="flex items-center gap-2">
                      <MapPin size={15} />
                      {drive.location || "Location not specified"}
                    </p>

                    <p className="flex items-center gap-2">
                      <CalendarDays size={15} />
                      Deadline: {formatDate(drive.deadline)}
                      {deadlinePassed && (
                        <span className="text-red-300">
                          (Passed)
                        </span>
                      )}
                    </p>

                    <p className="flex items-center gap-2">
                      <GraduationCap size={15} />
                      Minimum CGPA: {drive.minCgpa ?? 0}
                    </p>

                    {drive.eligibleCourses?.length > 0 && (
                      <p>
                        Eligible courses:{" "}
                        {drive.eligibleCourses.join(", ")}
                      </p>
                    )}

                    {drive.eligibleGraduationYears?.length > 0 && (
                      <p>
                        Graduation years:{" "}
                        {drive.eligibleGraduationYears.join(", ")}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setExpandedDrive(
                        isExpanded ? "" : driveId
                      )
                    }
                    className="flex w-full items-center justify-between rounded-xl border border-white/10 px-4 py-3 text-sm font-medium hover:bg-white/5"
                  >
                    <span className="flex items-center gap-2">
                      <Users size={16} />
                      Manage student applications
                    </span>

                    <span>{isExpanded ? "−" : "+"}</span>
                  </button>

                  {isExpanded && (
                    <div className="space-y-4 border-t border-white/10 pt-4">
                      <div>
                        <h4 className="font-medium">
                          Add a student
                        </h4>

                        <p className="mt-1 text-xs text-slate-500">
                          Students already assigned to this drive
                          are excluded from the selector.
                        </p>

                        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                          <select
                            value={
                              studentSelections[driveId] || ""
                            }
                            onChange={(event) =>
                              setStudentSelections((previous) => ({
                                ...previous,
                                [driveId]: event.target.value,
                              }))
                            }
                            disabled={
                              drive.status !== "Open" ||
                              deadlinePassed ||
                              eligibleChoices.length === 0
                            }
                            className={`${inputClass} min-w-0 flex-1`}
                          >
                            <option value="">
                              {eligibleChoices.length === 0
                                ? "No unassigned students"
                                : "Select a student"}
                            </option>

                            {eligibleChoices.map((student) => (
                              <option
                                key={getId(student)}
                                value={getId(student)}
                              >
                                {student.name ||
                                  student.full_name ||
                                  "Student"}{" "}
                                — {student.email}
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            onClick={() => addStudent(drive)}
                            disabled={
                              drive.status !== "Open" ||
                              deadlinePassed ||
                              !studentSelections[driveId]
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-3 text-sm font-semibold hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <UserPlus size={16} />
                            Add
                          </button>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium">
                          Student applications ({applications.length})
                        </h4>

                        {applications.length === 0 ? (
                          <p className="mt-3 rounded-xl bg-white/[0.03] p-4 text-sm text-slate-400">
                            No students have been added to this drive.
                          </p>
                        ) : (
                          <div className="mt-3 space-y-3">
                            {applications.map((application, index) => {
                              const student = application.student;
                              const studentId = getId(student);

                              return (
                                <div
                                  key={
                                    application._id ||
                                    `${studentId}-${index}`
                                  }
                                  className="rounded-xl border border-white/5 bg-white/[0.03] p-3"
                                >
                                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-medium">
                                        {student?.name ||
                                          student?.full_name ||
                                          "Student"}
                                      </p>

                                      <p className="mt-1 break-all text-xs text-slate-500">
                                        {student?.email || ""}
                                      </p>

                                      <div className="mt-2">
                                        <StatusBadge
                                          status={application.status}
                                        />
                                      </div>
                                    </div>

                                    <label className="text-xs text-slate-400">
                                      Application status
                                      <select
                                        value={
                                          application.status ||
                                          "Applied"
                                        }
                                        onChange={(event) =>
                                          updateApplicationStatus(
                                            drive,
                                            application,
                                            event.target.value
                                          )
                                        }
                                        className={`${inputClass} mt-1 sm:w-40`}
                                      >
                                        {APPLICATION_STATUSES.map(
                                          (status) => (
                                            <option
                                              key={status}
                                              value={status}
                                            >
                                              {status}
                                            </option>
                                          )
                                        )}
                                      </select>
                                    </label>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
