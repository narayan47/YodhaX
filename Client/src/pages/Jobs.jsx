
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
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const ITEMS_PER_PAGE = 8;

const formatDate = (value) => {
  if (!value) return "Date unavailable";

  const date =
    typeof value === "number"
      ? new Date(value < 1e12 ? value * 1000 : value)
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

const getJobId = (job) => job.externalId || job.slug;

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
        `${API_URL}/api/jobs/recent`
      );

      if (!response.data?.success) {
        throw new Error("Unable to retrieve job listings.");
      }

      setJobs(
        Array.isArray(response.data.data)
          ? response.data.data
          : []
      );
    } catch (err) {
      console.error("Failed to fetch jobs:", err);

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
            .map((job) => job.location?.trim())
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
            .filter(Boolean)
        ),
      ].sort((a, b) => a.localeCompare(b)),
    [jobs]
  );

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = jobs.filter((job) => {
      const searchableText = [
        job.title,
        job.company,
        job.location,
        job.description,
        ...(Array.isArray(job.tags) ? job.tags : []),
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
        tagFilter === "all" ||
        (Array.isArray(job.tags) &&
          job.tags.includes(tagFilter));

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

        return (
          (Number.isNaN(dateB) ? 0 : dateB) -
          (Number.isNaN(dateA) ? 0 : dateA)
        );
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

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <Header/>
      <div className="mx-auto mt-8 max-w-7xl">
        {/* Heading */}
        <div className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700">
            <BriefcaseBusiness size={16} />
            VerifHire Careers
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Find your next opportunity
          </h1>

          <p className="mt-3 max-w-2xl text-slate-600">
            Explore jobs, discover companies, and find roles
            that match your skills.
          </p>
        </div>

        {/* Search and filters */}
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="relative">
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search job title, company, location, or skill..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <SlidersHorizontal size={17} />
              Filters
            </span>

            <select
              value={locationFilter}
              onChange={(e) =>
                setLocationFilter(e.target.value)
              }
              className="min-w-40 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"
            >
              <option value="all">All locations</option>
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>

            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="min-w-40 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"
            >
              <option value="all">All skills / tags</option>
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
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"
            >
              <option value="recent">Newest first</option>
              <option value="company">Company A–Z</option>
            </select>

            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-100"
            >
              <X size={16} />
              Clear
            </button>

            <button
              type="button"
              onClick={fetchJobs}
              disabled={loading}
              className="ml-auto inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </section>

        {/* Results heading */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Available jobs
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {loading
                ? "Loading opportunities..."
                : `${filteredJobs.length} matching jobs`}
            </p>
          </div>

          <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500">
            Source: Arbeitnow
          </span>
        </div>

        {/* Loading */}
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

        {/* Error */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-white p-8 text-center">
            <p className="font-semibold text-red-700">{error}</p>
            <button
              onClick={fetchJobs}
              className="mt-4 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty results */}
        {!loading && !error && paginatedJobs.length === 0 && (
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
              onClick={clearFilters}
              className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Job cards */}
        {!loading && !error && paginatedJobs.length > 0 && (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedJobs.map((job, index) => {
                const jobId = getJobId(job);

                return (
                  <article
                    key={jobId || job.url || index}
                    className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-md sm:p-6"
                  >
                    <Link
                      to={`/jobs/${encodeURIComponent(jobId)}`}
                      state={{ job }}
                      className="block rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                          <Building2 size={23} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="line-clamp-2 text-lg font-bold text-slate-900">
                            {job.title}
                          </h3>
                          <p className="mt-1 truncate text-sm font-medium text-slate-600">
                            {job.company || "Company not specified"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <MapPin size={16} />
                          {job.location || "Location not specified"}
                        </span>

                        {job.remote && (
                          <span className="flex items-center gap-1.5 text-green-700">
                            <Wifi size={16} />
                            Remote
                          </span>
                        )}
                      </div>

                      <p className="mt-4 text-xs text-slate-500">
                        Posted: {formatDate(job.postedAt)}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {(job.tags || [])
                          .slice(0, 4)
                          .map((tag) => (
                            <span
                              key={tag}
                              className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                            >
                              {tag}
                            </span>
                          ))}

                        {(job.tags || []).length > 4 && (
                          <span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-500">
                            +{job.tags.length - 4}
                          </span>
                        )}
                      </div>

                      <p className="mt-5 text-sm font-semibold text-blue-600">
                        View job details →
                      </p>
                    </Link>

                    <div className="mt-auto pt-5">
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                      >
                        Apply on job website
                        <ExternalLink size={16} />
                      </a>
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
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={17} />
                  Previous
                </button>

                <span className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
                  {safePage} / {Math.max(totalPages, 1)}
                </span>

                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.min(totalPages, page + 1)
                    )
                  }
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
