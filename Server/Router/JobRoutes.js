
import express from "express";
import {
  getRecentJobs,
  getTranslatedJobDescription,
} from "../Controller/JobController.js";

const router = express.Router();

router.get("/recent", getRecentJobs);
router.get("/recent/:jobId/description", getTranslatedJobDescription);

export default router;
