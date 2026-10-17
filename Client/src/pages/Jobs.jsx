import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../Components/Header";
import axios from "axios";
import {
  Search,
  MapPin,
  Building2,
  BriefcaseBusiness,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  SlidersHorizontal,
  X,
  Wifi,
  Sparkles,
  TrendingUp,
  Globe2,
  ArrowUpRight,
} from "lucide-react";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const ITEMS_PER_PAGE = 8;

const formatDate = (value) => {
  if (value === null || value === undefined || value === "") {
    return "Date unavailable";
  }

  let date;

  if (typeof value === "number" || /^\d+$/.test(String(value))) {
    const timestamp = Number(value);
    date = new Date(
      timestamp < 1e12 ? timestamp * 1000 : timestamp
    );
  } else {
    date = new Date(value);
  }

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  // Avoid showing clearly invalid dates from a broken timestamp.
  if (date.getFullYear() < 2000) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

const getJobId = (job) =>
  job.externalId || job.slug || job.id || job._id;

const getApplyUrl = (job) =>
  job.applyUrl || job.url || job.redirect_url || "";

const isValidHttpUrl = (value) => {
  if (!value || typeof value !== "string") return false;

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
};

const normalizeJob = (job) => ({
  ...job,
  externalId: getJobId(job),
  title: job.title || "Untitled position",
  company:
    job.company ||
    job.company_name ||
    job.companyName ||
    "Company not specified",
  location: job.location || "Location not specified",
  description: job.description || "",
  applyUrl: getApplyUrl(job),
  tags: Array.isArray(job.tags)
    ? job.tags
    : Array.isArray(job.requiredSkills)
      ? job.requiredSkills
      : [],
  remote:
    job.remote === true ||
    job.remote === "true" ||
    job.remote === 1,
});

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [sortBy, setSortBy] = useState("recent");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `${API_URL}/api/jobs/recent`,
        { timeout: 20000 }
      );

      console.log("Jobs API response:", response.data);

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Unable to retrieve job listings."
        );
      }

      // Your backend returns { success, source, count, jobs }.
      // The data fallback supports older backend responses.
      const receivedJobs = Array.isArray(response.data.jobs)
        ? response.data.jobs
        : Array.isArray(response.data.data)
          ? response.data.data
          : [];

      const normalizedJobs = receivedJobs
        .filter((job) => job && typeof job === "object")
        .map(normalizeJob);

      setJobs(normalizedJobs);
      setCurrentPage(1);

      if (normalizedJobs.length === 0) {
        console.warn(
          "The jobs API succeeded but returned no job records."
        );
      }
    } catch (err) {
      console.error("Failed to fetch jobs:", err);

      setJobs([]);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load jobs. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const locations = useMemo(
    () =>
      [
        ...new Set(
          jobs
            .map((job) =>
              typeof job.location === "string"
                ? job.location.trim()
                : ""
            )
            .filter(Boolean)
        ),
      ].sort((a, b) => a.localeCompare(b)),
    [jobs]
  );

  const tags = useMemo(
    () =>
      [
        ...new Set(
          jobs
            .flatMap((job) =>
              Array.isArray(job.tags) ? job.tags : []
            )
            .filter(
              (tag) =>
                typeof tag === "string" && tag.trim().length > 0
            )
        ),
      ].sort((a, b) => a.localeCompare(b)),
    [jobs]
  );

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = jobs.filter((job) => {
      const jobTags = Array.isArray(job.tags) ? job.tags : [];

      const searchableText = [
        job.title,
        job.company,
        job.location,
        job.description,
        job.employmentType,
        ...jobTags,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query || searchableText.includes(query);

      const matchesLocation =
        locationFilter === "all" ||
        job.location === locationFilter;

      const matchesTag =
        tagFilter === "all" || jobTags.includes(tagFilter);

      const matchesRemote =
        !remoteOnly || job.remote === true;

      return (
        matchesSearch &&
        matchesLocation &&
        matchesTag &&
        matchesRemote
      );
    });

    if (sortBy === "company") {
      result.sort((a, b) =>
        (a.company || "").localeCompare(b.company || "")
      );
    } else {
      result.sort((a, b) => {
        const dateA = new Date(a.postedAt || 0).getTime();
        const dateB = new Date(b.postedAt || 0).getTime();

        const safeDateA = Number.isNaN(dateA) ? 0 : dateA;
        const safeDateB = Number.isNaN(dateB) ? 0 : dateB;

        return safeDateB - safeDateA;
      });
    }

    return result;
  }, [
    jobs,
    search,
    locationFilter,
    tagFilter,
    remoteOnly,
    sortBy,
  ]);

  const totalPages = Math.ceil(
    filteredJobs.length / ITEMS_PER_PAGE
  );

  const safePage = Math.min(
    currentPage,
    Math.max(totalPages, 1)
  );

  const paginatedJobs = filteredJobs.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, locationFilter, tagFilter, remoteOnly, sortBy]);

  const clearFilters = () => {
    setSearch("");
    setLocationFilter("all");
    setTagFilter("all");
    setRemoteOnly(false);
    setSortBy("recent");
    setCurrentPage(1);
  };

  const companyCount = new Set(
    jobs
      .map((job) =>
        job.company &&
        job.company !== "Company not specified"
          ? job.company.trim()
          : ""
      )
      .filter(Boolean)
  ).size;

  const remoteCount = jobs.filter(
    (job) => job.remote === true
  ).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="relative isolate overflow-hidden rounded-3xl bg-slate-950 px-6 py-8 text-white shadow-xl shadow-slate-200 sm:px-10 sm:py-10">
          <div className="absolute -right-16 -top-24 -z-10 h-72 w-72 rounded-full bg-blue-500/30 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 -z-10 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" />

          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-blue-100">
                <Sparkles size={15} />
                VerifHire
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Your next opportunity
                <span className="block text-blue-300">
                  starts with a search.
                </span>
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                Explore fresh roles from companies around the
                world and find the one that fits your next move.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/20 text-blue-200">
                <TrendingUp size={22} />
              </div>

              <div>
                <p className="text-xs font-medium text-slate-300">
                  Fresh opportunities
                </p>
                <p className="mt-0.5 text-xl font-bold">
                  {loading
                    ? "Updating..."
                    : `${jobs.length} open roles`}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Statistics */}
        <section
          aria-label="Job market overview"
          className="mt-5 grid gap-4 sm:grid-cols-3"
        >
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <BriefcaseBusiness size={21} />
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Open opportunities
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {loading ? "—" : jobs.length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Globe2 size={21} />
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Remote roles
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {loading ? "—" : remoteCount}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
              <Building2 size={21} />
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Hiring companies
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {loading ? "—" : companyCount}
              </p>
            </div>
          </div>
        </section>

        {/* Search and filters */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900">
              Find your fit
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Search roles by title, company, location, or skill.
            </p>
          </div>

          <div className="relative">
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="e.g. Product designer, React, Bengaluru"
              aria-label="Search jobs"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <SlidersHorizontal size={17} />
              Refine
            </span>

            <select
              aria-label="Filter by location"
              value={locationFilter}
              onChange={(e) =>
                setLocationFilter(e.target.value)
              }
              className="min-w-40 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700"
            >
              <option value="all">All locations</option>
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by skill"
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="min-w-40 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700"
            >
              <option value="all">All skills</option>
              {tags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>

            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={remoteOnly}
                onChange={(e) =>
                  setRemoteOnly(e.target.checked)
                }
                className="h-4 w-4 accent-blue-600"
              />
              Remote only
            </label>

            <select
              aria-label="Sort jobs"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700"
            >
              <option value="recent">Newest first</option>
              <option value="company">Company A–Z</option>
            </select>

            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-sm text-slate-600 transition hover:bg-slate-100"
            >
              <X size={16} />
              Clear
            </button>

            <button
              type="button"
              onClick={fetchJobs}
              disabled={loading}
              className="ml-auto inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh jobs
            </button>
          </div>
        </section>

        {/* Job results */}
        <section className="mt-9">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">
                  Latest opportunities
                </h2>

                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                  {loading ? "…" : filteredJobs.length}
                </span>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                {loading
                  ? "Finding roles for you..."
                  : `Showing ${filteredJobs.length} roles matching your search`}
              </p>
            </div>

            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Updated from Arbeitnow
            </span>
          </div>

          {/* Loading skeleton */}
          {loading && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div
                  key={item}
                  className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6"
                >
                  <div className="h-5 w-3/4 rounded bg-slate-200" />
                  <div className="mt-4 h-4 w-1/2 rounded bg-slate-100" />
                  <div className="mt-8 h-4 rounded bg-slate-100" />
                </div>
              ))}
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className="rounded-2xl border border-red-200 bg-white p-8 text-center">
              <p className="font-semibold text-red-700">
                {error}
              </p>

              <button
                type="button"
                onClick={fetchJobs}
                className="mt-4 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Try again
              </button>
            </div>
          )}

          {/* Empty state */}
          {!loading &&
            !error &&
            paginatedJobs.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                <Search
                  size={34}
                  className="mx-auto text-slate-400"
                />

                <h3 className="mt-4 text-lg font-semibold text-slate-900">
                  No jobs found
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Try another keyword or remove some filters.
                </p>

                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Clear filters
                </button>
              </div>
            )}

          {/* Job cards */}
          {!loading &&
            !error &&
            paginatedJobs.length > 0 && (
              <>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {paginatedJobs.map((job, index) => {
                    const jobId = getJobId(job);
                    const jobTags = Array.isArray(job.tags)
                      ? job.tags
                      : [];
                    const applyUrl = getApplyUrl(job);
                    const canApply = isValidHttpUrl(applyUrl);

                    return (
                      <article
                        key={
                          jobId ||
                          applyUrl ||
                          index
                        }
                        className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-950/5 sm:p-6"
                      >
                        <Link
                          to={
                            jobId
                              ? `/jobs/${encodeURIComponent(jobId)}`
                              : "#"
                          }
                          state={{ job }}
                          onClick={(event) => {
                            if (!jobId) event.preventDefault();
                          }}
                          className="block rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 transition group-hover:bg-blue-600 group-hover:text-white">
                              <Building2 size={22} />
                            </div>

                            <div className="min-w-0 flex-1">
                              <h3 className="line-clamp-2 text-base font-bold leading-6 text-slate-900">
                                {job.title}
                              </h3>

                              <p className="mt-1 truncate text-sm font-medium text-slate-600">
                                {job.company ||
                                  "Company not specified"}
                              </p>
                            </div>

                            <ArrowUpRight
                              size={17}
                              className="shrink-0 text-slate-400 transition group-hover:text-blue-600"
                            />
                          </div>

                          <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
                            <span className="flex items-center gap-1.5">
                              <MapPin size={15} />
                              {job.location ||
                                "Location not specified"}
                            </span>

                            {job.remote && (
                              <span className="flex items-center gap-1.5 text-emerald-700">
                                <Wifi size={15} />
                                Remote
                              </span>
                            )}
                          </div>

                          <p className="mt-3 text-xs text-slate-500">
                            Posted {formatDate(job.postedAt)}
                          </p>

                          {job.employmentType && (
                            <p className="mt-2 text-xs font-medium text-slate-500">
                              {job.employmentType}
                            </p>
                          )}

                          <div className="mt-4 flex flex-wrap gap-2">
                            {jobTags.slice(0, 4).map((tag) => (
                              <span
                                key={tag}
                                className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                              >
                                {tag}
                              </span>
                            ))}

                            {jobTags.length > 4 && (
                              <span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-500">
                                +{jobTags.length - 4}
                              </span>
                            )}
                          </div>

                          <p className="mt-5 text-sm font-semibold text-blue-600">
                            View job details
                          </p>
                        </Link>

                        {/* Apply link */}
                        <div className="mt-auto pt-5">
                          {canApply ? (
                            <a
                              href={applyUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(event) =>
                                event.stopPropagation()
                              }
                              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                            >
                              Apply on company site
                              <ExternalLink size={15} />
                            </a>
                          ) : (
                            <span className="inline-flex w-full items-center justify-center rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-500">
                              Application link unavailable
                            </span>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>

                {/* Pagination */}
                <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-5">
                  <p className="text-sm text-slate-500">
                    Showing{" "}
                    {(safePage - 1) * ITEMS_PER_PAGE + 1}–
                    {Math.min(
                      safePage * ITEMS_PER_PAGE,
                      filteredJobs.length
                    )}{" "}
                    of {filteredJobs.length} jobs
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={safePage <= 1}
                      onClick={() =>
                        setCurrentPage((page) =>
                          Math.max(1, page - 1)
                        )
                      }
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft size={17} />
                      Previous
                    </button>

                    <span className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
                      {safePage} / {Math.max(totalPages, 1)}
                    </span>

                    <button
                      type="button"
                      disabled={
                        safePage >= totalPages ||
                        totalPages === 0
                      }
                      onClick={() =>
                        setCurrentPage((page) =>
                          Math.min(totalPages, page + 1)
                        )
                      }
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                      <ChevronRight size={17} />
                    </button>
                  </div>
                </div>
              </>
            )}
        </section>
      </main>
    </div>
  );
}