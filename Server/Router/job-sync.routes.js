import { Router } from "express";

import { syncArbeitnowJobs } from "../Services/job-sync.service.js";

const router = Router();

router.post("/arbeitnow", async (req, res, next) => {
  try {
    const secret = process.env.JOB_SYNC_SECRET;

    if (!secret) {
      return res.status(503).json({
        success: false,
        message: "Job sync is not configured.",
      });
    }

    if (
      req.get("x-job-sync-secret") !== secret
    ) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    const result = await syncArbeitnowJobs();

    return res.json({
      success: true,
      message: "Arbeitnow sync completed.",
      ...result,
    });
  } catch (error) {
    return next(error);
  }
});

export default router;