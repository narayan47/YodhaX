import "dotenv/config";

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import connectDB from "./config/db.js";

import authRoutes from "./Router/authRoutes.js";
import studentRoutes from "./Router/student.routes.js";
import resumeRoutes from "./Router/resume.routes.js";
import jobRoutes from "./Router/job.routes.js";
import jobSyncRoutes from "./Router/job-sync.routes.js";
import recentJobRoutes from "./Router/JobRoutes.js";
import placementRoutes from "./Router/placement.routes.js";
import applicationRoutes from "./Router/application.routes.js";
import joblitingRoutes from "./Router/jobliting.router.js";
import skillAssessmentRoutes from "./Router/skill-assessment.routes.js";

const app = express();
const PORT = Number(process.env.PORT) || 5000;

const allowedOrigins = (
  process.env.CLIENT_URL || "http://localhost:5173"
)
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

app.disable("x-powered-by");

app.use(
  cors({
    origin(origin, callback) {
      if (
        !origin ||
        allowedOrigins.includes(origin)
      ) {
        return callback(null, true);
      }

      return callback(
        new Error("Origin is not allowed by CORS.")
      );
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-job-sync-secret",
    ],
  })
);

app.use(express.json({ limit: "1mb" }));

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
  })
);

app.use(cookieParser());

app.use("/api/jobs", joblitingRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/jobs/sync", jobSyncRoutes);
app.use("/api/arbeitnow", recentJobRoutes);
app.use("/api", placementRoutes);
app.use("/api", applicationRoutes);
app.use("/api/placement", placementRoutes);
app.use("/api/student", skillAssessmentRoutes);


app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use((err, req, res, _next) => {
  console.error(
    `${req.method} ${req.originalUrl}:`,
    err
  );

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON request body.",
    });
  }

  if (err.name === "MulterError") {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "Resume file must be 5 MB or smaller."
        : "Invalid file upload.";

    return res.status(400).json({
      success: false,
      message,
    });
  }

  const status =
    Number.isInteger(err.status) &&
    err.status >= 400 &&
    err.status <= 599
      ? err.status
      : 500;

  return res.status(status).json({
    success: false,
    message:
      status === 500
        ? "Internal server error."
        : err.message || "Request failed.",
  });
});

async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);

      console.log(
        `Allowed frontend origins: ${allowedOrigins.join(", ")}`
      );
    });
  } catch (error) {
    console.error(
      "Failed to start server:",
      error.message
    );

    process.exit(1);
  }
}

startServer();

export default app;