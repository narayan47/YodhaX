
import Job from "../Model/Job.js";
import {
  cleanJobDescription,
  translateJobDescription,
} from "./job-translation.service.js";

const ARBEITNOW_API =
  "https://www.arbeitnow.com/api/job-board-api";

function normalizeJob(item, description) {
  const tags = Array.isArray(item.tags) ? item.tags : [];

  return {
    externalId: `arbeitnow:${item.slug || item.url}`,
    title: item.title || "Untitled position",
    company: item.company_name || "Unknown company",
    location: item.location || "Not specified",
    remote: Boolean(item.remote),
    source: "Arbeitnow",
    applyUrl: item.url,
    description,
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
    signal: AbortSignal.timeout(20000),
  });

  if (!response.ok) {
    throw new Error(
      `Arbeitnow API failed with status ${response.status}`
    );
  }

  const result = await response.json();
  const jobs = Array.isArray(result.data) ? result.data : [];

  let imported = 0;
  let failed = 0;
  let translationFallbacks = 0;

  for (const item of jobs) {
    if (!item.url || !item.title) continue;

    // Always clean the original description first.
    const originalDescription = cleanJobDescription(
      item.description || ""
    );

    let description = originalDescription;

    try {
      description = await translateJobDescription(
        originalDescription
      );
    } catch (error) {
      // Keep the job visible even if the translation provider fails.
      translationFallbacks++;

      console.error(
        `Translation failed for "${item.title}":`,
        error.message
      );
    }

    const job = normalizeJob(item, description);

    try {
      await Job.updateOne(
        { externalId: job.externalId },
        { $set: job },
        { upsert: true, runValidators: true }
      );

      imported++;
    } catch (error) {
      failed++;

      console.error(
        `Failed to save job "${item.title}":`,
        error.message
      );
    }
  }

  return {
    fetched: jobs.length,
    imported,
    failed,
    translationFallbacks,
    nextPage: result.links?.next || null,
  };
}
