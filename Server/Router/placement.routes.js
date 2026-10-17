
import { Router } from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import User from "../Model/User.js";
import PlacementDrive from "../Model/PlacementDrive.js";
import { requireAuth, requireRole } from "../Middleware/auth.js";

const router = Router();

// Only authenticated placement-cell users can access these routes.
router.use(requireAuth, requireRole("placementcell"));

const getUserId = (user) => user?._id || user?.id || user?.userId;

const getStudentName = (student) =>
  student?.name || student?.full_name || student?.fullName || "Student";

// --------------------------------------------------
// GET /api/placement/dashboard
// --------------------------------------------------
router.get("/dashboard", async (req, res, next) => {
  try {
    const [
      registeredStudents,
      verifiedStudents,
      recruiters,
      activeDrives,
      pendingApprovals,
      offersReceived,
      recent,
    ] = await Promise.all([
      User.countDocuments({ role: "student" }),
      User.countDocuments({
        role: "student",
        isEmailVerified: true,
      }),
      User.countDocuments({ role: "recruiter" }),
      PlacementDrive.countDocuments({
        status: "Open",
        deadline: { $gte: new Date() },
      }),
      User.countDocuments({
        role: "student",
        verificationStatus: { $in: ["Pending", "pending"] },
      }),
      PlacementDrive.aggregate([
        { $unwind: "$applications" },
        { $match: { "applications.status": "Selected" } },
        { $count: "total" },
      ]),
      User.find({ role: "student" })
        .sort({ createdAt: -1 })
        .limit(6)
        .select("name full_name email isEmailVerified createdAt")
        .lean(),
    ]);

    res.json({
      metrics: {
        registered_students: registeredStudents,
        verified_students: verifiedStudents,
        recruiters,
        active_drives: activeDrives,
        pending_approvals: pendingApprovals,
        offers_received: offersReceived[0]?.total || 0,
      },
      recentStudents: recent.map((student) => ({
        id: String(student._id),
        name: getStudentName(student),
        email: student.email,
        isEmailVerified: Boolean(student.isEmailVerified),
        createdAt: student.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// --------------------------------------------------
// GET /api/placement/students
// List and search students.
// --------------------------------------------------
router.get("/students", async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();
    const filter = { role: "student" };

    if (q) {
      const escapedQuery = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escapedQuery, "i");

      filter.$or = [
        { name: regex },
        { full_name: regex },
        { email: regex },
      ];
    }

    const students = await User.find(filter)
      .select(
        "name full_name email isEmailVerified verificationStatus createdAt"
      )
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    res.json({
      students: students.map((student) => ({
        id: String(student._id),
        _id: String(student._id),
        name: getStudentName(student),
        full_name: student.full_name,
        email: student.email,
        isEmailVerified: Boolean(student.isEmailVerified),
        verificationStatus:
          student.verificationStatus || "Unreviewed",
        createdAt: student.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// --------------------------------------------------
// POST /api/placement/students
// Create a student account with a password.
// --------------------------------------------------
router.post("/students", async (req, res, next) => {
  try {
    const name = String(req.body?.name || "").trim();
    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();
    const password =
      typeof req.body?.password === "string"
        ? req.body.password
        : "";

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email, and password are required.",
      });
    }

    if (name.length < 2 || name.length > 100) {
      return res.status(400).json({
        message: "Name must be between 2 and 100 characters.",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        message: "Enter a valid email address.",
      });
    }

    if (password.length < 8 || password.length > 72) {
      return res.status(400).json({
        message: "Password must be between 8 and 72 characters.",
      });
    }

    const existingStudent = await User.findOne({ email }).select("_id");

    if (existingStudent) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    // Never save the plain-text password.
    const hashedPassword = await bcrypt.hash(password, 12);

    const student = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "student",
      isEmailVerified: false,
      verificationStatus: "Unreviewed",
    });

    return res.status(201).json({
      success: true,
      message: "Student account created successfully.",
      student: {
        id: String(student._id),
        _id: String(student._id),
        name: getStudentName(student),
        email: student.email,
        role: student.role,
        isEmailVerified: Boolean(student.isEmailVerified),
        verificationStatus:
          student.verificationStatus || "Unreviewed",
        createdAt: student.createdAt,
      },
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    next(error);
  }
});

// --------------------------------------------------
// GET /api/placement/drives
// --------------------------------------------------
router.get("/drives", async (req, res, next) => {
  try {
    const drives = await PlacementDrive.find()
      .populate("applications.student", "name full_name email")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      drives: drives.map((drive) => ({
        ...drive,
        id: String(drive._id),
        applicationCount: drive.applications?.length || 0,
        applications: (drive.applications || []).map((application) => ({
          ...application,
          student: application.student
            ? {
                id: String(application.student._id),
                name: getStudentName(application.student),
                email: application.student.email,
              }
            : null,
        })),
      })),
    });
  } catch (error) {
    next(error);
  }
});

// --------------------------------------------------
// POST /api/placement/drives
// --------------------------------------------------
router.post("/drives", async (req, res, next) => {
  try {
    const { companyName, role, deadline } = req.body;

    if (
      !String(companyName || "").trim() ||
      !String(role || "").trim() ||
      !deadline
    ) {
      return res.status(400).json({
        message: "Company, role and application deadline are required.",
      });
    }

    const deadlineDate = new Date(deadline);

    if (Number.isNaN(deadlineDate.getTime())) {
      return res.status(400).json({
        message: "Invalid deadline.",
      });
    }

    const drive = await PlacementDrive.create({
      companyName: String(companyName).trim(),
      role: String(role).trim(),
      description: req.body.description || "",
      location: req.body.location || "Not specified",
      employmentType: req.body.employmentType || "Full-time",
      packageLpa: Number(req.body.packageLpa || 0),
      eligibleCourses: Array.isArray(req.body.eligibleCourses)
        ? req.body.eligibleCourses
        : [],
      minCgpa: Number(req.body.minCgpa || 0),
      eligibleGraduationYears: Array.isArray(
        req.body.eligibleGraduationYears
      )
        ? req.body.eligibleGraduationYears.map(Number)
        : [],
      deadline: deadlineDate,
      driveDate: req.body.driveDate
        ? new Date(req.body.driveDate)
        : undefined,
      status: req.body.status || "Open",
      createdBy: getUserId(req.user),
    });

    res.status(201).json({
      message: "Placement drive created.",
      drive,
    });
  } catch (error) {
    next(error);
  }
});

// --------------------------------------------------
// PATCH /api/placement/drives/:id
// --------------------------------------------------
router.patch("/drives/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid drive ID.",
      });
    }

    const allowed = [
      "companyName",
      "role",
      "description",
      "location",
      "employmentType",
      "packageLpa",
      "eligibleCourses",
      "minCgpa",
      "eligibleGraduationYears",
      "deadline",
      "driveDate",
      "status",
    ];

    const update = {};

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        update[key] = req.body[key];
      }
    }

    const drive = await PlacementDrive.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!drive) {
      return res.status(404).json({
        message: "Placement drive not found.",
      });
    }

    res.json({
      message: "Placement drive updated.",
      drive,
    });
  } catch (error) {
    next(error);
  }
});

// --------------------------------------------------
// POST /api/placement/drives/:id/students
// Assign a student to a drive.
// --------------------------------------------------
router.post("/drives/:id/students", async (req, res, next) => {
  try {
    const { studentId } = req.body;

    if (
      !mongoose.isValidObjectId(req.params.id) ||
      !mongoose.isValidObjectId(studentId)
    ) {
      return res.status(400).json({
        message: "Valid drive and student IDs are required.",
      });
    }

    const [drive, student] = await Promise.all([
      PlacementDrive.findById(req.params.id),
      User.findOne({
        _id: studentId,
        role: "student",
      }).select("_id"),
    ]);

    if (!drive) {
      return res.status(404).json({
        message: "Placement drive not found.",
      });
    }

    if (!student) {
      return res.status(404).json({
        message: "Student not found.",
      });
    }

    if (drive.status !== "Open") {
      return res.status(400).json({
        message: "Only open drives can accept students.",
      });
    }

    if (drive.deadline < new Date()) {
      return res.status(400).json({
        message: "This drive's application deadline has passed.",
      });
    }

    const alreadyAdded = drive.applications.some(
      (application) =>
        String(application.student) === String(studentId)
    );

    if (alreadyAdded) {
      return res.status(409).json({
        message: "This student is already added to the drive.",
      });
    }

    drive.applications.push({
      student: studentId,
      status: "Applied",
    });

    await drive.save();

    res.status(201).json({
      message: "Student added to placement drive.",
      drive,
    });
  } catch (error) {
    next(error);
  }
});

// --------------------------------------------------
// PATCH /api/placement/drives/:id/students/:studentId
// Update a student's drive status.
// --------------------------------------------------
router.patch(
  "/drives/:id/students/:studentId",
  async (req, res, next) => {
    try {
      const statuses = [
        "Applied",
        "Shortlisted",
        "Rejected",
        "Selected",
        "Withdrawn",
      ];

      if (!statuses.includes(req.body.status)) {
        return res.status(400).json({
          message: "Invalid application status.",
        });
      }

      const drive = await PlacementDrive.findById(req.params.id);

      if (!drive) {
        return res.status(404).json({
          message: "Placement drive not found.",
        });
      }

      const application = drive.applications.find(
        (item) =>
          String(item.student) === String(req.params.studentId)
      );

      if (!application) {
        return res.status(404).json({
          message: "Student application not found.",
        });
      }

      application.status = req.body.status;
      await drive.save();

      res.json({
        message: "Application status updated.",
        application,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
