import {
  fetchRecentJobs,
} from "../Services/JobServices.sevices.js";

import {
  translateJobDescription,
} from "../Services/JobDescriptionService.js";

export async function getRecentJobs(req, res, next) {
  try {
    const jobs = await fetchRecentJobs();

    return res.status(200).json({
      success: true,
      count: jobs.length,
      source: "Arbeitnow",
      data: jobs,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getTranslatedJobDescription(
  req,
  res,
  next
) {
  try {
    const jobs = await fetchRecentJobs();

    const job = jobs.find(
      (item) =>
        item.externalId === req.params.jobId ||
        item.externalId ===
          `arbeitnow:${req.params.jobId}`
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        message:
          "Job not found in the currently available listings.",
      });
    }

    const description =
      await translateJobDescription(job.description);

    return res.status(200).json({
      success: true,
      data: {
        ...job,
        description,
      },
    });
  } catch (error) {
    return next(error);
  }
}