import { Router } from "express";
import multer from "multer";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");
import mammoth from "mammoth";

import Resume from "../Model/Resume.js";

import {
  requireAuth,
  requireRole,
} from "../Middleware/auth.js";

const router = Router();

router.use(
  requireAuth,
  requireRole("student")
);

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },

  fileFilter: (_req, file, cb) => {
    const extensionValid =
      /\.(pdf|docx)$/i.test(file.originalname || "");

    const mimeValid = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ].includes(file.mimetype);

    if (!extensionValid || !mimeValid) {
      const error = new Error(
        "Upload a PDF or DOCX file."
      );

      error.status = 400;

      return cb(error);
    }

    return cb(null, true);
  },
});

async function getOrCreateResume(user) {
  return Resume.findOneAndUpdate(
    { user: user._id },

    {
      $setOnInsert: {
        user: user._id,
        fullName: user.name || "",
        email: user.email || "",
      },
    },

   {
  returnDocument: "after",
  upsert: true,
  setDefaultsOnInsert: true,
  runValidators: true,
}
  );
}

// GET /api/resume/profile
router.get("/profile", async (req, res, next) => {
  try {
    const profile = await getOrCreateResume(
      req.user
    );

    return res.json({
      success: true,
      profile,
    });
  } catch (error) {
    return next(error);
  }
});

// PUT /api/resume/profile
router.put("/profile", async (req, res, next) => {
  try {
    const fields = [
      "fullName",
      "email",
      "phone",
      "location",
      "linkedinUrl",
      "linkedinNotes",
      "githubUrl",
      "portfolioUrl",
      "summary",
      "education",
      "experience",
      "projects",
      "certifications",
      "achievements",
    ];

    const update = {};

    for (const field of fields) {
      if (
        Object.hasOwn(req.body || {}, field)
      ) {
        update[field] = req.body[field];
      }
    }

    const arrayFields = [
      "education",
      "experience",
      "projects",
      "certifications",
      "achievements",
    ];

    for (const field of arrayFields) {
      if (
        update[field] !== undefined &&
        !Array.isArray(update[field])
      ) {
        return res.status(400).json({
          success: false,
          message: `${field} must be an array.`,
        });
      }
    }

    if (update.email !== undefined) {
      if (
        typeof update.email !== "string" ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          update.email.trim()
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Enter a valid email address.",
        });
      }

      update.email = update.email.trim().toLowerCase();
    }

    const profile = await Resume.findOneAndUpdate(
      { user: req.user._id },

      {
        $set: update,

        $setOnInsert: {
          user: req.user._id,
          fullName: req.user.name || "",
          email: req.user.email || "",
        },
      },

      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.json({
      success: true,
      message: "Resume saved.",
      profile,
    });
  } catch (error) {
    return next(error);
  }
});

// POST /api/resume/upload
// Multipart field name: resume
router.post(
  "/upload",

  (req, res, next) => {
    upload.single("resume")(req, res, (error) => {
      if (error) {
        return next(error);
      }

      return next();
    });
  },

  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Choose a PDF or DOCX resume.",
        });
      }

      let extractedText = "";

      if (req.file.mimetype === "application/pdf") {
        const parsed = await pdf(req.file.buffer);

        extractedText = parsed.text || "";
      } else {
        const parsed = await mammoth.extractRawText({
          buffer: req.file.buffer,
        });

        extractedText = parsed.value || "";
      }

      return res.json({
        success: true,
        message: "Resume text extracted successfully.",
        filename: req.file.originalname,
        extractedText: extractedText.slice(0, 100000),
      });
    } catch (error) {
      error.status = 400;

      error.message =
        "Could not parse this file. Try a text-based PDF or a valid DOCX.";

      return next(error);
    }
  }
);

export default router;