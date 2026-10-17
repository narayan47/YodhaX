
import { Router } from "express";
import multer from "multer";
import { createRequire } from "node:module";
import mammoth from "mammoth";

import Resume from "../Model/Resume.js";

import {
  requireAuth,
  requireRole,
} from "../Middleware/auth.js";

const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

const router = Router();

router.use(requireAuth, requireRole("student"));

// --------------------------------------------------
// Multer configuration
// --------------------------------------------------

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },

  fileFilter: (_req, file, cb) => {
    const extensionValid = /\.(pdf|docx)$/i.test(
      file.originalname || ""
    );

    const mimeValid = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ].includes(file.mimetype);

    if (!extensionValid || !mimeValid) {
      const error = new Error("Upload a PDF or DOCX file.");
      error.status = 400;
      return cb(error);
    }

    return cb(null, true);
  },
});

// --------------------------------------------------
// GET or create resume profile
// --------------------------------------------------

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

// --------------------------------------------------
// GET /api/resume/profile
// --------------------------------------------------

router.get("/profile", async (req, res, next) => {
  try {
    const profile = await getOrCreateResume(req.user);

    return res.json({
      success: true,
      profile,
    });
  } catch (error) {
    return next(error);
  }
});

// --------------------------------------------------
// PUT /api/resume/profile
// --------------------------------------------------

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

    // Only accept explicitly allowed fields.
    for (const field of fields) {
      if (Object.hasOwn(req.body || {}, field)) {
        update[field] = req.body[field];
      }
    }

    // ----------------------------------------------
    // Validate array fields
    // ----------------------------------------------

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

    // ----------------------------------------------
    // Validate full name
    // ----------------------------------------------

    if (update.fullName !== undefined) {
      if (typeof update.fullName !== "string") {
        return res.status(400).json({
          success: false,
          message: "Full name must be a string.",
        });
      }

      update.fullName = update.fullName.trim();
    }

    // ----------------------------------------------
    // Validate email
    // ----------------------------------------------

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

    // ----------------------------------------------
    // Prevent conflicting MongoDB update operators
    // ----------------------------------------------

    // Remove fields from $set when they are already being
    // initialized by $setOnInsert.
    //
    // $setOnInsert supplies initial values only when a
    // profile is first created. Existing profiles can
    // update fullName and email normally.

    const insertFields = {
      user: req.user._id,
      fullName: req.user.name || "",
      email: req.user.email || "",
    };

    const setOnInsert = {
      user: req.user._id,
    };

    // On insertion, prefer the submitted values if provided.
    setOnInsert.fullName =
      update.fullName !== undefined
        ? update.fullName
        : insertFields.fullName;

    setOnInsert.email =
      update.email !== undefined
        ? update.email
        : insertFields.email;

    // Do not update fullName/email through both operators.
    const setFields = { ...update };

    delete setFields.fullName;
    delete setFields.email;

    const profile = await Resume.findOneAndUpdate(
      { user: req.user._id },

      {
        $set: setFields,
        $setOnInsert: setOnInsert,
      },

      {
        returnDocument: "after",
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    // If the profile already existed, update these fields
    // separately in the same update operation without
    // creating conflicting paths.
    //
    // Use an update pipeline to choose initial values only
    // for a newly inserted document would be more complex.
    // Instead, the profile is initialized first below when
    // necessary, then the submitted values are saved.

    // For an existing profile, apply fullName/email updates.
    const hasNameOrEmail =
      update.fullName !== undefined ||
      update.email !== undefined;

    let finalProfile = profile;

    if (hasNameOrEmail) {
      const followUpUpdate = {};

      if (update.fullName !== undefined) {
        followUpUpdate.fullName = update.fullName;
      }

      if (update.email !== undefined) {
        followUpUpdate.email = update.email;
      }

      finalProfile = await Resume.findOneAndUpdate(
        { user: req.user._id },
        { $set: followUpUpdate },
        {
          returnDocument: "after",
          runValidators: true,
        }
      );
    }

    return res.json({
      success: true,
      message: "Resume saved.",
      profile: finalProfile,
    });
  } catch (error) {
    return next(error);
  }
});

// --------------------------------------------------
// POST /api/resume/upload
// Multipart field name: resume
// --------------------------------------------------

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
