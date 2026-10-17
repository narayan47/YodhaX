
import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FilePlus2,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

import api from "../api/axios";

const STATUSES = [
  "applied",
  "shortlisted",
  "interview",
  "offer",
  "rejected",
  "withdrawn",
];

const LABELS = {
  applied: "Applied",
  shortlisted: "Shortlisted",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

const COLORS = {
  applied: "border-blue-400/20 bg-blue-400/10 text-blue-300",
  shortlisted: "border-violet-400/20 bg-violet-400/10 text-violet-300",
  interview: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  offer: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  rejected: "border-red-400/20 bg-red-400/10 text-red-300",
  withdrawn: "border-slate-400/20 bg-slate-400/10 text-slate-300",
};

const dateLabel = (value) => {
  if (!value) return "Not scheduled";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

function StatusBadge({ status }) {
  const value = String(status || "applied").toLowerCase();

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
        COLORS[value] || COLORS.applied
      }`}
    >
      {LABELS[value] || value}
    </span>
  );
}

function Metric({ label, value, color }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className={`mt-3 text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function ApplicationForm({
  isOfficer,
  students,
  onCreated,
  setError,
}) {
  const [form, setForm] = useState({
    studentId: "",
    jobTitle: "",
    company: "",
    applyUrl: "",
    note: "",
  });

  const [saving, setSaving] = useState(false);

  const change = (event) => {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (isOfficer && !form.studentId) {
      setError("Select the student for this application.");
      return;
    }

    setSaving(true);

    try {
      const endpoint = isOfficer
        ? "/placement/applications/manual"
        : "/me/applications/manual";

      const payload = {
        jobTitle: form.jobTitle.trim(),
        company: form.company.trim(),
        applyUrl: form.applyUrl.trim(),
        note: form.note.trim(),
      };

      if (isOfficer) {
        payload.studentId = form.studentId;
      }

      await api.post(endpoint, payload);

      setForm({
        studentId: "",
        jobTitle: "",
        company: "",
        applyUrl: "",
        note: "",
      });

      await onCreated();
    } catch (error) {
      setError(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Could not add the application."
      );
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "mt-2 w-full rounded-xl border border-white/10 bg-[#11111b] px-3 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-400";

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-white/10 bg-[#101019] p-5 sm:p-6"
    >
      <div className="flex items-center gap-3">
        <span className="rounded-xl bg-violet-400/10 p-2.5 text-violet-300">
          <FilePlus2 size={20} />
        </span>
        <div>
          <h2 className="font-semibold text-white">
            Track an external application
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Record a job you applied for outside VerifHire.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {isOfficer && (
          <label className="text-sm text-slate-300 sm:col-span-2">
            Student
            <select
              name="studentId"
              value={form.studentId}
              onChange={change}
              required
              className={inputClass}
            >
              <option value="">Select a student</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name}
                  {student.email ? ` — ${student.email}` : ""}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="text-sm text-slate-300">
          Job title
          <input
            name="jobTitle"
            value={form.jobTitle}
            onChange={change}
            required
            maxLength={200}
            placeholder="Backend Developer"
            className={inputClass}
          />
        </label>

        <label className="text-sm text-slate-300">
          Company
          <input
            name="company"
            value={form.company}
            onChange={change}
            required
            maxLength={200}
            placeholder="Company name"
            className={inputClass}
          />
        </label>

        <label className="text-sm text-slate-300 sm:col-span-2">
          Job application URL (optional)
          <input
            name="applyUrl"
            type="url"
            value={form.applyUrl}
            onChange={change}
            placeholder="https://company.com/careers/..."
            className={inputClass}
          />
        </label>

        <label className="text-sm text-slate-300 sm:col-span-2">
          Initial note (optional)
          <textarea
            name="note"
            value={form.note}
            onChange={change}
            maxLength={1000}
            rows={2}
            placeholder="Where you applied, contact details or other notes..."
            className={inputClass}
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={saving || (isOfficer && students.length === 0)}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-500 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-400 disabled:opacity-50"
      >
        {saving ? (
          <RefreshCw size={16} className="animate-spin" />
        ) : (
          <FilePlus2 size={16} />
        )}
        {saving ? "Saving..." : "Add to pipeline"}
      </button>

      {isOfficer && students.length === 0 && (
        <p className="mt-3 text-xs text-amber-300">
          No student accounts were returned. Check the placement students API.
        </p>
      )}
    </form>
  );
}

function ApplicationCard({ application, isOfficer, onUpdate, saving }) {
  const [status, setStatus] = useState(application.status);
  const [interviewDate, setInterviewDate] = useState(
    application.interviewDate
      ? String(application.interviewDate).slice(0, 10)
      : ""
  );
  const [note, setNote] = useState("");

  useEffect(() => {
    setStatus(application.status);
    setInterviewDate(
      application.interviewDate
        ? String(application.interviewDate).slice(0, 10)
        : ""
    );
  }, [application.status, application.interviewDate]);

  const student = application.student || {};
  const history = application.statusHistory || application.history || [];

  const save = () => {
    onUpdate(application.id || application._id, {
      status,
      interviewDate: interviewDate || null,
      note: note.trim(),
    });
    setNote("");
  };

  return (
    <article className="rounded-2xl border border-white/10 bg-[#101019] p-5 sm:p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={application.status} />
            <span className="text-xs text-slate-500">
              External application
            </span>
          </div>

          <h3 className="mt-3 text-lg font-semibold text-white">
            {application.jobTitle}
          </h3>
          <p className="mt-1 flex items-center gap-2 text-sm text-slate-400">
            <BriefcaseBusiness size={15} />
            {application.company}
          </p>

          {isOfficer && (
            <div className="mt-3 space-y-2 text-sm text-slate-300">
              <p className="flex items-center gap-2">
                <UserRound size={15} className="text-violet-300" />
                {student.name || "Student"}
              </p>
              {student.email && (
                <p className="text-slate-400">{student.email}</p>
              )}
            </div>
          )}

          {application.applyUrl && (
            <a
              href={application.applyUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-2 text-sm text-violet-300 hover:text-violet-200"
            >
              <ExternalLink size={15} />
              Open original job listing
            </a>
          )}
        </div>

        <div className="shrink-0 text-sm text-slate-400">
          <p className="flex items-center gap-2">
            <CalendarDays size={15} />
            Added {dateLabel(application.createdAt)}
          </p>
          {application.interviewDate && (
            <p className="mt-2 flex items-center gap-2 text-amber-300">
              <Clock3 size={15} />
              Interview {dateLabel(application.interviewDate)}
            </p>
          )}
        </div>
      </div>

      {history.length > 0 && (
        <details className="mt-5 border-t border-white/10 pt-4">
          <summary className="cursor-pointer text-sm text-slate-300">
            Status history ({history.length})
          </summary>

          <div className="mt-4 space-y-4">
            {history.slice().reverse().map((entry, index) => (
              <div
                key={entry._id || index}
                className="border-l border-violet-400/30 pl-4"
              >
                <p className="text-sm text-white">
                  {LABELS[entry.from] || entry.from}
                  {" → "}
                  {LABELS[entry.to] || entry.to}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {entry.changedByRole || "User"} ·{" "}
                  {dateLabel(entry.changedAt)}
                </p>
                {entry.note && (
                  <p className="mt-1 text-sm text-slate-400">
                    {entry.note}
                  </p>
                )}
              </div>
            ))}
          </div>
        </details>
      )}

      <div className="mt-5 border-t border-white/10 pt-5">
        <h4 className="text-sm font-semibold text-white">
          {isOfficer ? "Update student pipeline" : "Update your pipeline"}
        </h4>
        <p className="mt-1 text-xs text-slate-500">
          Changes are saved for both the student and placement officer.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-xs text-slate-400">
            Status
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#11111b] px-3 py-3 text-sm text-white outline-none focus:border-violet-400"
            >
              {STATUSES.map((value) => (
                <option key={value} value={value}>
                  {LABELS[value]}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs text-slate-400">
            Interview date
            <input
              type="date"
              value={interviewDate}
              onChange={(event) => setInterviewDate(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#11111b] px-3 py-3 text-sm text-white outline-none focus:border-violet-400"
            />
          </label>
        </div>

        <label className="mt-3 block text-xs text-slate-400">
          Update note (optional)
          <textarea
            rows={2}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={1000}
            placeholder="Add progress notes, interview details or feedback..."
            className="mt-2 w-full rounded-xl border border-white/10 bg-[#11111b] px-3 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-400"
          />
        </label>

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-400 disabled:opacity-50"
        >
          {saving ? (
            <RefreshCw size={16} className="animate-spin" />
          ) : (
            <CheckCircle2 size={16} />
          )}
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </article>
  );
}

export default function ApplicationPipeline() {
  const { user } = useAuth();
  const isOfficer = user?.role === "placementcell";

  const [applications, setApplications] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const endpoint = isOfficer
        ? "/placement/applications"
        : "/me/applications";

      const response = await api.get(endpoint);

      setApplications(response.data.applications || []);

      if (isOfficer) {
        const studentResponse = await api.get("/placement/students");
        setStudents(studentResponse.data.students || []);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          (err.response?.status === 404
            ? "Pipeline API not found. Register application.routes.js in your backend."
            : "Unable to load the application pipeline.")
      );
    } finally {
      setLoading(false);
    }
  }, [isOfficer]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const counts = useMemo(() => {
    const result = { total: applications.length };

    for (const status of STATUSES) result[status] = 0;

    for (const application of applications) {
      if (result[application.status] !== undefined) {
        result[application.status] += 1;
      }
    }

    return result;
  }, [applications]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return applications.filter((application) => {
      if (filter !== "all" && application.status !== filter) {
        return false;
      }

      const text = [
        application.jobTitle,
        application.company,
        application.student?.name,
        application.student?.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return !query || text.includes(query);
    });
  }, [applications, filter, search]);

  const createComplete = async () => {
    setNotice("Application saved successfully.");
    setError("");
    await loadApplications();
  };

  const updateApplication = async (id, payload) => {
    setSavingId(id);
    setError("");
    setNotice("");

    try {
      await api.patch(`/applications/${id}/status`, payload);
      setNotice("Application status and history saved.");
      await loadApplications();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Could not save the application update."
      );
    } finally {
      setSavingId(null);
    }
  };

  if (!user || !["student", "placementcell"].includes(user.role)) {
    return (
      <main className="min-h-screen bg-[#09090f] p-8 text-white">
        You do not have permission to view this pipeline.
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#09090f] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1.5 text-xs text-violet-200">
              <ShieldCheck size={14} />
              Shared MongoDB pipeline
            </span>
            <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
              {isOfficer ? "Placement pipeline" : "My applications"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              {isOfficer
                ? "Manage application progress across students and record placement outcomes."
                : "Record external applications and manually keep your placement progress up to date."}
            </p>
          </div>

          <button
            type="button"
            onClick={loadApplications}
            disabled={loading}
            className="inline-flex items-center gap-2 self-start rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </header>

        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-200">
            <AlertCircle size={18} className="shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {notice && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4 text-sm text-emerald-200">
            <CheckCircle2 size={18} className="shrink-0" />
            <p>{notice}</p>
          </div>
        )}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Total applications" value={counts.total} color="text-white" />
          <Metric label="Shortlisted" value={counts.shortlisted} color="text-violet-300" />
          <Metric label="Interviews" value={counts.interview} color="text-amber-300" />
          <Metric label="Offers" value={counts.offer} color="text-emerald-300" />
        </section>

        <section className="mt-8">
          <ApplicationForm
            isOfficer={isOfficer}
            students={students}
            setError={setError}
            onCreated={createComplete}
          />
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Application records</h2>
              <p className="mt-1 text-sm text-slate-400">
                {filtered.length} record(s)
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={
                    isOfficer
                      ? "Search student or company"
                      : "Search company or job"
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#11111b] py-3 pl-10 pr-4 text-sm outline-none focus:border-violet-400 sm:w-72"
                />
              </div>

              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className="rounded-xl border border-white/10 bg-[#11111b] px-4 py-3 text-sm outline-none focus:border-violet-400"
              >
                <option value="all">All statuses</option>
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {LABELS[status]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-slate-400">
              <RefreshCw size={20} className="animate-spin" />
              Loading applications...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center text-center">
              <span className="rounded-2xl bg-white/5 p-4 text-slate-400">
                <XCircle size={24} />
              </span>
              <h3 className="mt-4 font-semibold">
                {applications.length
                  ? "No matching applications"
                  : "No applications recorded yet"}
              </h3>
              <p className="mt-2 max-w-md text-sm text-slate-400">
                Add an external application using the form above. Its status
                and notes will be stored in your VerifHire database.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {filtered.map((application) => (
                <ApplicationCard
                  key={application.id || application._id}
                  application={application}
                  isOfficer={isOfficer}
                  onUpdate={updateApplication}
                  saving={savingId === (application.id || application._id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
