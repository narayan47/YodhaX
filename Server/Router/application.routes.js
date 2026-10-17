
import { Router } from "express";
import mongoose from "mongoose";

import JobApplication from "../Model/JobApplication.js";
import User from "../Model/User.js";

import {
  requireAuth,
  requireRole,
} from "../Middleware/auth.js";

const router = Router();

const STATUSES = [
  "applied",
  "shortlisted",
  "interview",
  "offer",
  "rejected",
  "withdrawn",
];

const ALLOWED_ROLES = ["student", "placementcell"];

function currentUserId(req) {
  return req.user?._id || req.user?.id;
}

function validId(value) {
  return mongoose.isValidObjectId(value);
}

function serialize(application) {
  if (!application) return null;

  const item =
    typeof application.toObject === "function"
      ? application.toObject()
      : { ...application };

  item.id = String(item._id);
  delete item._id;
  delete item.__v;

  if (item.student && item.student._id) {
    item.student = {
      id: String(item.student._id),
      name:
        item.student.name ||
        item.student.fullName ||
        item.student.full_name ||
        "Student",
      email: item.student.email || "",
      role: item.student.role,
    };
  }

  item.appliedAt = item.createdAt;
  item.history = item.statusHistory || [];

  return item;
}

function parseApplyUrl(value) {
  if (!value) return "";

  try {
    const url = new URL(String(value).trim());

    if (!["http:", "https:"].includes(url.protocol)) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

function parseInterviewDate(value) {
  if (value === null || value === "") return null;

  if (typeof value !== "string") return undefined;

  // The frontend sends a date input in YYYY-MM-DD format.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return undefined;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    return undefined;
  }

  return date;
}

function isValidRole(req, role) {
  return req.user?.role === role;
}

function sendError(res, status, message) {
  return res.status(status).json({
    success: false,
    message,
  });
}

// ----------------------------------------------------
// GET /api/me/applications
// Student retrieves their own applications.
// ----------------------------------------------------

router.get(
  "/me/applications",
  requireAuth,
  requireRole("student"),
  async (req, res, next) => {
    try {
      const studentId = currentUserId(req);

      const applications = await JobApplication.find({
        student: studentId,
      })
        .populate(
          "student",
          "name fullName full_name email role"
        )
        .sort({ updatedAt: -1 })
        .lean();

      return res.status(200).json({
        success: true,
        count: applications.length,
        applications: applications.map(serialize),
      });
    } catch (error) {
      next(error);
    }
  }
);

// ----------------------------------------------------
// GET /api/placement/applications
// Placement officer retrieves the application pipeline.
// Optional filters: ?status=interview&studentId=...
// ----------------------------------------------------

router.get(
  "/placement/applications",
  requireAuth,
  requireRole("placementcell"),
  async (req, res, next) => {
    try {
      const filter = {};

      if (req.query.status && req.query.status !== "all") {
        if (!STATUSES.includes(req.query.status)) {
          return sendError(
            res,
            400,
            "Invalid application status."
          );
        }

        filter.status = req.query.status;
      }

      if (req.query.studentId) {
        if (!validId(req.query.studentId)) {
          return sendError(res, 400, "Invalid student ID.");
        }

        filter.student = req.query.studentId;
      }

      const applications = await JobApplication.find(filter)
        .populate(
          "student",
          "name fullName full_name email role"
        )
        .sort({ updatedAt: -1 })
        .lean();

      return res.status(200).json({
        success: true,
        count: applications.length,
        applications: applications.map(serialize),
      });
    } catch (error) {
      next(error);
    }
  }
);

// ----------------------------------------------------
// GET /api/placement/students
// Return students for the placement officer dropdown.
// ----------------------------------------------------

router.get(
  "/placement/students",
  requireAuth,
  requireRole("placementcell"),
  async (req, res, next) => {
    try {
      const students = await User.find({ role: "student" })
        .select("_id name fullName full_name email role")
        .sort({ name: 1, fullName: 1 })
        .lean();

      return res.status(200).json({
        success: true,
        students: students.map((student) => ({
          id: String(student._id),
          name:
            student.name ||
            student.fullName ||
            student.full_name ||
            student.email ||
            "Student",
          email: student.email || "",
        })),
      });
    } catch (error) {
      next(error);
    }
  }
);

// ----------------------------------------------------
// Shared helper for manually creating applications.
// ----------------------------------------------------

async function createManualApplication({
  studentId,
  createdBy,
  createdByRole,
  body,
}) {
  const jobTitle =
    typeof body.jobTitle === "string"
      ? body.jobTitle.trim()
      : "";

  const company =
    typeof body.company === "string"
      ? body.company.trim()
      : "";

  const note =
    typeof body.note === "string"
      ? body.note.trim()
      : "";

  const rawApplyUrl =
    typeof body.applyUrl === "string"
      ? body.applyUrl.trim()
      : "";

  if (!jobTitle || !company) {
    const error = new Error(
      "Job title and company are required."
    );
    error.status = 400;
    throw error;
  }

  if (jobTitle.length > 200 || company.length > 200) {
    const error = new Error(
      "Job title and company must be 200 characters or fewer."
    );
    error.status = 400;
    throw error;
  }

  if (note.length > 1000) {
    const error = new Error(
      "Note must be 1000 characters or fewer."
    );
    error.status = 400;
    throw error;
  }

  if (rawApplyUrl.length > 2048) {
    const error = new Error("Application URL is too long.");
    error.status = 400;
    throw error;
  }

  const applyUrl = parseApplyUrl(rawApplyUrl);

  if (rawApplyUrl && applyUrl === null) {
    const error = new Error(
      "Apply URL must be a valid HTTP or HTTPS URL."
    );
    error.status = 400;
    throw error;
  }

  const student = await User.findOne({
    _id: studentId,
    role: "student",
  }).select("_id");

  if (!student) {
    const error = new Error("Student account was not found.");
    error.status = 404;
    throw error;
  }

  const application = await JobApplication.create({
    student: student._id,
    createdBy,
    jobTitle,
    company,
    applyUrl,
    source: "external",
    status: "applied",
    statusHistory: [
      {
        from: "applied",
        to: "applied",
        changedBy: createdBy,
        changedByRole: createdByRole,
        note,
        changedAt: new Date(),
      },
    ],
  });

  return application;
}

// ----------------------------------------------------
// POST /api/me/applications/manual
// Student adds an external job application.
// ----------------------------------------------------

router.post(
  "/me/applications/manual",
  requireAuth,
  requireRole("student"),
  async (req, res, next) => {
    try {
      const userId = currentUserId(req);

      const application = await createManualApplication({
        studentId: userId,
        createdBy: userId,
        createdByRole: "student",
        body: req.body || {},
      });

      const result = await JobApplication.findById(
        application._id
      )
        .populate(
          "student",
          "name fullName full_name email role"
        )
        .lean();

      return res.status(201).json({
        success: true,
        message: "External application added to your pipeline.",
        application: serialize(result),
      });
    } catch (error) {
      if (error.status) {
        return sendError(res, error.status, error.message);
      }

      next(error);
    }
  }
);

// ----------------------------------------------------
// POST /api/placement/applications/manual
// Placement officer adds an application for a student.
// ----------------------------------------------------

router.post(
  "/placement/applications/manual",
  requireAuth,
  requireRole("placementcell"),
  async (req, res, next) => {
    try {
      const { studentId } = req.body || {};

      if (!validId(studentId)) {
        return sendError(
          res,
          400,
          "A valid studentId is required."
        );
      }

      const application = await createManualApplication({
        studentId,
        createdBy: currentUserId(req),
        createdByRole: "placementcell",
        body: req.body || {},
      });

      const result = await JobApplication.findById(
        application._id
      )
        .populate(
          "student",
          "name fullName full_name email role"
        )
        .lean();

      return res.status(201).json({
        success: true,
        message: "Application added to the student's pipeline.",
        application: serialize(result),
      });
    } catch (error) {
      if (error.status) {
        return sendError(res, error.status, error.message);
      }

      next(error);
    }
  }
);

// ----------------------------------------------------
// PATCH /api/applications/:id/status
// Student updates their own record.
// Placement officer updates any student's record.
// ----------------------------------------------------

router.patch(
  "/applications/:id/status",
  requireAuth,
  requireRole(...ALLOWED_ROLES),
  async (req, res, next) => {
    try {
      const { id } = req.params;

      if (!validId(id)) {
        return sendError(res, 400, "Invalid application ID.");
      }

      const application = await JobApplication.findById(id);

      if (!application) {
        return sendError(res, 404, "Application not found.");
      }

      const role = req.user.role;
      const userId = currentUserId(req);

      // Students may only modify their own applications.
      if (
        isValidRole(req, "student") &&
        String(application.student) !== String(userId)
      ) {
        return sendError(
          res,
          403,
          "You can update only your own applications."
        );
      }

      const {
        status,
        note,
        interviewDate,
      } = req.body || {};

      if (!STATUSES.includes(status)) {
        return sendError(
          res,
          400,
          `Status must be one of: ${STATUSES.join(", ")}.`
        );
      }

      if (
        note !== undefined &&
        (typeof note !== "string" || note.length > 1000)
      ) {
        return sendError(
          res,
          400,
          "Note must be 1000 characters or fewer."
        );
      }

      let parsedDate = application.interviewDate;

      if (interviewDate !== undefined) {
        parsedDate = parseInterviewDate(interviewDate);

        if (parsedDate === undefined) {
          return sendError(
            res,
            400,
            "Interview date must be a valid YYYY-MM-DD date."
          );
        }
      }

      const previousStatus = application.status;
      const nextNote =
        typeof note === "string" ? note.trim() : "";

      application.status = status;
      application.interviewDate = parsedDate;

      if (note !== undefined && nextNote) {
        application.note = nextNote;
      }

      // Keep a record of actual status changes and supplied notes.
      if (previousStatus !== status || nextNote) {
        application.statusHistory.push({
          from: previousStatus,
          to: status,
          changedBy: userId,
          changedByRole: role,
          note: nextNote,
          changedAt: new Date(),
        });
      }

      await application.save();

      const result = await JobApplication.findById(
        application._id
      )
        .populate(
          "student",
          "name fullName full_name email role"
        )
        .lean();

      return res.status(200).json({
        success: true,
        message: "Application pipeline updated.",
        application: serialize(result),
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
