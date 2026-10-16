import { cleanJobDescription } from "./JobDescriptionService.js";

const ARBEITNOW_API_URL =
  "https://www.arbeitnow.com/api/job-board-api";

export async function fetchRecentJobs() {
  const response = await fetch(ARBEITNOW_API_URL, {
    headers: {
      Accept: "application/json",
      "User-Agent": "VerifHire/1.0",
    },

    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(
      `Arbeitnow API error: ${response.status}`
    );
  }

  const result = await response.json();

  const data = Array.isArray(result.data)
    ? result.data
    : [];

  return data
    .filter(
      (job) => job && job.url && job.title
    )
    .map((job) => ({
      externalId: `arbeitnow:${job.slug || job.url}`,

      title: job.title || "Untitled position",

      company: job.company_name || "Unknown company",

      location: job.location || "Not specified",

      description: cleanJobDescription(
        job.description
      ),

      applyUrl: job.url,

      url: job.url,

      postedAt: job.created_at
        ? new Date(job.created_at)
        : null,

      remote: Boolean(job.remote),

      tags: Array.isArray(job.tags)
        ? job.tags
        : [],

      requiredSkills: Array.isArray(job.tags)
        ? job.tags
        : [],

      employmentType:
        Array.isArray(job.job_types) &&
        job.job_types[0]
          ? job.job_types[0]
          : "Not specified",

      source: "Arbeitnow",
    }));
}