
import { fetchRecentJobs } from "../Services/JobServices.sevices.js";
import { translateJobDescription } from "../Services/JobDescriptionService.js";

export const getRecentJobs = async (req, res) => {
  try {
    const jobs = await fetchRecentJobs();

    res.status(200).json({
      success: true,
      count: jobs.length,
      source: "Arbeitnow",
      data: jobs,
    });
  } catch (error) {
    console.error("Failed to fetch jobs:", error.message);

    return res.status(502).json({
      success: false,
      message: "Unable to fetch jobs right now",
    });
  }
};

export const getTranslatedJobDescription = async (req, res) => {
  try {
    const jobs = await fetchRecentJobs();
    const job = jobs.find((item) => item.externalId === req.params.jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found in the currently available listings.",
      });
    }

    const description = await translateJobDescription(job.description);

    return res.status(200).json({
      success: true,
      data: { ...job, description },
    });
  } catch (error) {
    console.error("Failed to translate job description:", error.message);

    return res.status(502).json({
      success: false,
      message:
        "Unable to translate this job description right now. Please try again later.",
    });
  }
};
