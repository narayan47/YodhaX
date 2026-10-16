import Job from "../Model/Job.js";

const ARBEITNOW_API =
  "https://www.arbeitnow.com/api/job-board-api";

function normalizeJob(item) {
  const tags = Array.isArray(item.tags)
    ? item.tags.filter(
        (value) => typeof value === "string"
      )
    : [];

  const date = item.created_at
    ? new Date(item.created_at)
    : new Date();

  return {
    externalId: `arbeitnow:${item.slug || item.url}`,

    title: String(
      item.title || "Untitled position"
    ).trim(),

    company: String(
      item.company_name || "Unknown company"
    ).trim(),

    location: item.location || "Not specified",

    remote: Boolean(item.remote),

    source: "Arbeitnow",

    applyUrl: item.url || "",

    description: item.description || "",

    tags,

    requiredSkills: tags,

    employmentType:
      Array.isArray(item.job_types) &&
      item.job_types[0]
        ? item.job_types[0]
        : "Not specified",

    postedAt: Number.isNaN(date.getTime())
      ? new Date()
      : date,

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

  const jobs = Array.isArray(result.data)
    ? result.data
    : [];

  const operations = jobs
    .filter((item) => item?.url && item?.title)
    .map((item) => {
      const job = normalizeJob(item);

      return {
        updateOne: {
          filter: {
            externalId: job.externalId,
          },

          update: {
            $set: job,
          },

          upsert: true,
        },
      };
    });

  if (operations.length > 0) {
    await Job.bulkWrite(operations, {
      ordered: false,
    });
  }

  return {
    fetched: jobs.length,
    imported: operations.length,
    nextPage: result.links?.next || null,
  };
}