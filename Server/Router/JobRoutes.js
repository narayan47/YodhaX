
import express from "express";
import { getRecentJobs } from "../Controller/JobController.js";

const router = express.Router();

router.get("/recent", getRecentJobs);

export default router;
