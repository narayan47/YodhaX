
import { Router } from "express";
import mongoose from "mongoose";
import User from "../Model/User.js";
import { protect } from "../Middleware/authMiddleware.js";

const router = Router();

router.use(protect);

function requirePlacementCell(req, res, next) {
  if (req.user?.role !== "placementcell") {
    return res.status(403).json({
      success: false,
      message: "Placement cell access required.",
    });
  }

  next();
}

router.use(requirePlacementCell);

// GET /api/placement/dashboard
router.get("/dashboard", async (req, res) => {
  try {
    const [
      registeredStudents,
      verifiedStudents,
      recruiters,
      placementOfficers,
    ] = await Promise.all([
      User.countDocuments({ role: "student" }),
      User.countDocuments({
        role: "student",
        isEmailVerified: true,
      }),
      User.countDocuments({ role: "recruiter" }),
      User.countDocuments({ role: "placementcell" }),
    ]);

    const recentStudents = await User.find({ role: "student" })
      .select("name email isEmailVerified createdAt")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.json({
      success: true,
      metrics: {
        registered_students: registeredStudents,
        verified_students: verifiedStudents,
        active_drives: 0,
        pending_approvals: 0,
        offers_received: 0,
        recruiters,
        placement_officers: placementOfficers,
      },
      recentStudents: recentStudents.map((student) => ({
        id: student._id.toString(),
        name: student.name,
        email: student.email,
        isEmailVerified: student.isEmailVerified,
        createdAt: student.createdAt,
      })),
    });
  } catch (error) {
    console.error("Placement dashboard:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load placement dashboard.",
    });
  }
});




router.post("/students", async (req, res, next) => {
  try {
    const { name, email } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !email.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Student name and email are required.",
      });
    }

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    // Prevent duplicate student accounts.
    const existingStudent = await User.findOne({
      email: normalizedEmail,
    });

    if (existingStudent) {
      return res.status(409).json({
        success: false,
        message: "This email is already registered.",
      });
    }

    // Use the existing User schema and authentication flow.
    const student = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      role: "student",
      isEmailVerified: false,
    });

    return res.status(201).json({
      success: true,
      message: "Student saved successfully.",
      student: {
        id: String(student._id),
        _id: String(student._id),
        name: student.name,
        email: student.email,
        role: student.role,
        isEmailVerified: Boolean(student.isEmailVerified),
        createdAt: student.createdAt,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This email is already registered.",
      });
    }

    next(error);
  }
});



// GET /api/placement/students
router.get("/students", async (req, res) => {
  try {
    const students = await User.find({ role: "student" })
      .select("name email isEmailVerified createdAt")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      students: students.map((student) => ({
        id: student._id.toString(),
        name: student.name,
        full_name: student.name,
        email: student.email,
        isEmailVerified: student.isEmailVerified,
        createdAt: student.createdAt,
      })),
    });
  } catch (error) {
    console.error("Placement students:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load student records.",
    });
  }
});

// GET /api/placement/students/:id
router.get("/students/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID.",
      });
    }

    const student = await User.findOne({
      _id: req.params.id,
      role: "student",
    })
      .select("name email isEmailVerified createdAt")
      .lean();

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    res.json({
      success: true,
      student: {
        id: student._id.toString(),
        name: student.name,
        email: student.email,
        isEmailVerified: student.isEmailVerified,
        createdAt: student.createdAt,
      },
    });
  } catch (error) {
    console.error("Placement student details:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load student details.",
    });
  }
});

export default router;
