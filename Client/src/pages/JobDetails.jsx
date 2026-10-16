
import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import Header from "../Components/Header";

import axios from "axios";
import {
  ArrowLeft,
  Building2,
  MapPin,
  ExternalLink,
  CalendarDays,
  Wifi,
  BriefcaseBusiness,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function formatDate(value) {
  if (!value) return "Not specified";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not specified";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function JobDetails() {
  const { jobId } = useParams();
  const location = useLocation();

  const [job, setJob] = useState(location.state?.job || null);
  const [loading, setLoading] = useState(!location.state?.job);
  const [error, setError] = useState("");

  useEffect(() => {
    if (job) return;

    let cancelled = false;

    async function loadJob() {
      try {
        setLoading(true);
        setError("");

        const response = await axios.get(`${API_URL}/api/jobs/recent`);
        const jobs = response.data?.data || [];

        const selectedJob = jobs.find((item) => {
          const id = item.externalId || item.url;

          return id === jobId || encodeURIComponent(id || "") === jobId;
        });

        if (!selectedJob) {
          throw new Error(
            "This job was not found in the currently available listings."
          );
        }

        if (!cancelled) setJob(selectedJob);
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message || "Unable to load job details. Please try again."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadJob();

    return () => {
      cancelled = true;
    };
  }, [jobId, job]);

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16">
        <p className="text-slate-500">Loading job details...</p>
      </main>
    );
  }

  if (error || !job) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16">
        <p className="font-medium text-red-600">
          {error || "Job not found."}
        </p>
        <Link
          to="/jobs"
          className="mt-5 inline-flex items-center gap-2 text-blue-600"
        >
          <ArrowLeft size={18} />
          Back to jobs
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
        <Header/>
      <div className="mx-auto mt-8 max-w-4xl">
        <Link
          to="/jobs"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600"
        >
          <ArrowLeft size={18} />
          Back to jobs
        </Link>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <Building2 size={30} />
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                {job.title}
              </h1>

              <p className="mt-2 text-lg text-slate-600">
                {job.company || "Company not specified"}
              </p>

              <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
                <span className="inline-flex items-center gap-2">
                  <MapPin size={17} />
                  {job.location || "Location not specified"}
                </span>

                <span className="inline-flex items-center gap-2">
                  <CalendarDays size={17} />
                  Posted {formatDate(job.postedAt)}
                </span>

                {job.remote && (
                  <span className="inline-flex items-center gap-2 text-green-700">
                    <Wifi size={17} />
                    Remote
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap gap-2">
            {(job.tags || []).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="my-8 border-t border-slate-200" />

          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Job description
            </h2>

            <div
              className="prose prose-slate mt-4 max-w-none break-words text-slate-600"
              dangerouslySetInnerHTML={{
                __html: job.description || "No description available.",
              }}
            />
          </div>

          <div className="mt-9 rounded-xl bg-slate-50 p-5">
            <h2 className="font-semibold text-slate-900">
              Ready to apply?
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              Continue to the original job listing to review the
              application requirements and submit your application.
            </p>

            {job.url ? (
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
              >
                Apply for this job
                <ExternalLink size={18} />
              </a>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                An application link is not available for this listing.
              </p>
            )}

            <p className="mt-3 text-xs text-slate-500">
              Listing source: {job.source || "Arbeitnow"}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
