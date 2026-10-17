
import { Router } from "express";
import {
  translateJobDescription,
} from "../Services/job-translation.service.js";

const router = Router();

const ARBEITNOW_API =
  "https://www.arbeitnow.com/api/job-board-api";

router.get("/recent", async (req, res) => {
  try {
    const response = await fetch(ARBEITNOW_API, {
      headers: {
        Accept: "application/json",
        "User-Agent": "VerifHire/1.0",
      },
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) {
      throw new Error(
        `Arbeitnow API returned HTTP ${response.status}`
      );
    }

    const result = await response.json();
    const jobs = Array.isArray(result.data) ? result.data : [];

    const limit = Math.min(
      Math.max(Number.parseInt(req.query.limit, 10) || 20, 1),
      100
    );

    const recentJobs = jobs
      .filter((job) => job.title && job.url)
      .slice(0, limit)
      .map((job) => ({
        externalId: `arbeitnow:${job.slug || job.url}`,
        title: job.title || "Untitled position",
        company: job.company_name || "Unknown company",
        location: job.location || "Not specified",
        remote: Boolean(job.remote),
        source: "Arbeitnow",
        applyUrl: job.url,
        description: job.description || "",
        tags: Array.isArray(job.tags) ? job.tags : [],
        requiredSkills: Array.isArray(job.tags) ? job.tags : [],
        employmentType: job.job_types?.[0] || "Not specified",
        postedAt: job.created_at
          ? new Date(job.created_at)
          : null,
        active: true,
      }));

    return res.status(200).json({
      success: true,
      source: "Arbeitnow API",
      count: recentJobs.length,
      jobs: recentJobs,
    });
  } catch (error) {
    console.error("Recent jobs API error:", error);

    return res.status(502).json({
      success: false,
      message: "Unable to fetch jobs from Arbeitnow.",
    });
  }
});

export default router;
