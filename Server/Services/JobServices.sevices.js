
import { translateJobDescription } from "./JobDescriptionService.js";

import { cleanJobDescription } from "./JobDescriptionService.js";

const ARBEITNOW_API_URL =
  "https://www.arbeitnow.com/api/job-board-api";

export const fetchRecentJobs = async () => {
  const response = await fetch(ARBEITNOW_API_URL);

  if (!response.ok) {
    throw new Error(`Arbeitnow API error: ${response.status}`);
  }

  const result = await response.json();

  const jobs = (result.data || []).map((job) => ({
    externalId: job.slug,
    title: job.title,
    company: job.company_name,
    location: job.location,
    description: cleanJobDescription(job.description),
    url: job.url,
    postedAt: job.created_at,
    remote: job.remote,
    tags: job.tags || [],
    source: "Arbeitnow",
  }));

  return translateJobDescription(jobs);
};
