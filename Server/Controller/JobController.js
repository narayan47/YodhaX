
import { fetchRecentJobs } from "../Services/JobServices.sevices.js";

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

    res.status(502).json({
      success: false,
      message: "Unable to fetch jobs right now",
    });
  }
};
