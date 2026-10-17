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

function currentUserId(req) {
  return req.user?._id || req.user?.id;
}

function validId(value) {
  return mongoose.isValidObjectId(value);
}

function serialize(application) {
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

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return undefined;

  return date;
}

function isValidRole(req, role) {
  return req.user?.role === role;
}

// Students can list only their own applications.
router.get(
  "/me/applications",
  requireAuth,
  requireRole("student"),
  async (req, res, next) => {
    try {
      const applications = await JobApplication.find({
        student: currentUserId(req),
      })
        .populate("student", "name fullName full_name email role")
        .sort({ updatedAt: -1 })
        .lean();

      return res.json({
        success: true,
        applications: applications.map(serialize),
      });
    } catch (error) {
      return next(error);
    }
  }
);

// Placement officers can see the pipeline across students.
router.get(
  "/placement/applications",
  requireAuth,
  requireRole("placementcell"),
  async (req, res, next) => {
    try {
      const filter = {};

      if (req.query.status && req.query.status !== "all") {
        if (!STATUSES.includes(req.query.status)) {
          return res.status(400).json({
            success: false,
            message: "Invalid application status.",
          });
        }

        filter.status = req.query.status;
      }

      if (req.query.studentId) {
        if (!validId(req.query.studentId)) {
          return res.status(400).json({
            success: false,
            message: "Invalid student ID.",
          });
        }

        filter.student = req.query.studentId;
      }

      const applications = await JobApplication.find(filter)
        .populate("student", "name fullName full_name email role")
        .sort({ updatedAt: -1 })
        .lean();

      return res.json({
        success: true,
        applications: applications.map(serialize),
      });
    } catch (error) {
      return next(error);
    }
  }
);

// Students list eligible student accounts for officer assignment.
router.get(
  "/placement/students",
  requireAuth,
  requireRole("placementcell"),
  async (req, res, next) => {
    try {
      const students = await User.find({ role: "student" })
        .select("name fullName full_name email role")
        .sort({ name: 1 })
        .lean();

      return res.json({
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
      return next(error);
    }
  }
);

// Shared create helper. New manual entries start at "applied".
async function createManualApplication({
  studentId,
  createdBy,
  body,
}) {
  const jobTitle = String(body.jobTitle || "").trim();
  const company = String(body.company || "").trim();
  const applyUrl = parseApplyUrl(body.applyUrl);

  if (!jobTitle || !company) {
    const error = new Error("Job title and company are required.");
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

  if (body.applyUrl && applyUrl === null) {
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
    student: studentId,
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
        changedByRole: "student",
        note: String(body.note || "").trim(),
        changedAt: new Date(),
      },
    ],
  });

  return application;
}

// Student manually records a job applied for externally.
router.post(
  "/me/applications/manual",
  requireAuth,
  requireRole("student"),
  async (req, res, next) => {
    try {
      const application = await createManualApplication({
        studentId: currentUserId(req),
        createdBy: currentUserId(req),
        body: req.body || {},
      });

      const result = await JobApplication.findById(application._id)
        .populate("student", "name fullName full_name email role")
        .lean();

      return res.status(201).json({
        success: true,
        message: "External application added to your pipeline.",
        application: serialize(result),
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({
          success: false,
          message: error.message,
        });
      }

      return next(error);
    }
  }
);

// Placement officer manually records an application for a student.
router.post(
  "/placement/applications/manual",
  requireAuth,
  requireRole("placementcell"),
  async (req, res, next) => {
    try {
      const { studentId } = req.body || {};

      if (!validId(studentId)) {
        return res.status(400).json({
          success: false,
          message: "A valid studentId is required.",
        });
      }

      const application = await createManualApplication({
        studentId,
        createdBy: currentUserId(req),
        body: req.body || {},
      });

      const result = await JobApplication.findById(application._id)
        .populate("student", "name fullName full_name email role")
        .lean();

      return res.status(201).json({
        success: true,
        message: "Application added to the student's pipeline.",
        application: serialize(result),
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({
          success: false,
          message: error.message,
        });
      }

      return next(error);
    }
  }
);

// Student can update their own application.
// Placement officer can update any application.
router.patch(
  "/applications/:id/status",
  requireAuth,
  async (req, res, next) => {
    try {
      const { id } = req.params;

      if (!validId(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid application ID.",
        });
      }

      const role = req.user?.role;

      if (!["student", "placementcell"].includes(role)) {
        return res.status(403).json({
          success: false,
          message: "You cannot update this application.",
        });
      }

      const application = await JobApplication.findById(id);

      if (!application) {
        return res.status(404).json({
          success: false,
          message: "Application not found.",
        });
      }

      // Never allow a student to update another student's record.
      if (
        isValidRole(req, "student") &&
        String(application.student) !== String(currentUserId(req))
      ) {
        return res.status(403).json({
          success: false,
          message: "You can update only your own applications.",
        });
      }

      const { status, note, interviewDate } = req.body || {};

      if (!STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Status must be one of: ${STATUSES.join(", ")}.`,
        });
      }

      if (
        note !== undefined &&
        (typeof note !== "string" || note.length > 1000)
      ) {
        return res.status(400).json({
          success: false,
          message: "Note must be 1000 characters or fewer.",
        });
      }

      const parsedDate =
        interviewDate === undefined
          ? application.interviewDate
          : parseInterviewDate(interviewDate);

      if (parsedDate === undefined) {
        return res.status(400).json({
          success: false,
          message: "Interview date is invalid.",
        });
      }

      if (
        status === "interview" &&
        interviewDate !== undefined &&
        interviewDate !== null &&
        interviewDate !== "" &&
        !parsedDate
      ) {
        return res.status(400).json({
          success: false,
          message: "Provide a valid interview date.",
        });
      }

      const previousStatus = application.status;
      const nextNote = String(note || "").trim();

      application.status = status;
      application.interviewDate = parsedDate;

      // Record every manual update for transparency.
      application.statusHistory.push({
        from: previousStatus,
        to: status,
        changedBy: currentUserId(req),
        changedByRole: role,
        note: nextNote,
        interviewDate: parsedDate,
        changedAt: new Date(),
      });

      await application.save();

      const result = await JobApplication.findById(application._id)
        .populate("student", "name fullName full_name email role")
        .lean();

      return res.json({
        success: true,
        message: "Application pipeline updated.",
        application: serialize(result),
      });
    } catch (error) {
      return next(error);
    }
  }
);

export default router;