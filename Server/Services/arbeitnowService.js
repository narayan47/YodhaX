
import Job from "../models/Job.js";

const ARBEITNOW_API =
  "https://www.arbeitnow.com/api/job-board-api";

function normalizeJob(item) {
  const tags = Array.isArray(item.tags) ? item.tags : [];

  return {
    externalId: `arbeitnow:${item.slug || item.url}`,
    title: item.title || "Untitled position",
    company: item.company_name || "Unknown company",
    location: item.location || "Not specified",
    remote: Boolean(item.remote),
    source: "Arbeitnow",
    applyUrl: item.url,
    description: item.description || "",
    tags,
    requiredSkills: tags,
    employmentType: item.job_types?.[0] || "Not specified",
    postedAt: item.created_at
      ? new Date(item.created_at)
      : undefined,
    active: true,
  };
}

export async function syncArbeitnowJobs() {
  const response = await fetch(ARBEITNOW_API, {
    headers: {
      Accept: "application/json",
      "User-Agent": "VerifHire/1.0",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(
      `Arbeitnow API failed with status ${response.status}`
    );
  }

  const result = await response.json();
  const jobs = Array.isArray(result.data) ? result.data : [];

  let imported = 0;

  for (const item of jobs) {
    if (!item.url || !item.title) continue;

    const job = normalizeJob(item);

    await Job.updateOne(
      { externalId: job.externalId },
      { $set: job },
      { upsert: true, runValidators: true }
    );

    imported++;
  }

  return {
    fetched: jobs.length,
    imported,
    nextPage: result.links?.next || null,
  };
}
