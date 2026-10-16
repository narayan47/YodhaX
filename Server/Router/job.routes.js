import { Router } from "express";

import Job from "../Model/Job.js";
import StudentProfile from "../Model/StudentProfile.js";

import {
  requireAuth,
  requireRole,
} from "../Middleware/auth.js";

const router = Router();

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeSkill(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\.js$/i, "js")
    .replace(/[^a-z0-9+#.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function displaySkill(value) {
  return value
    .split(/(\s+|[.+#])/)
    .map((part) =>
      part
        ? part[0].toUpperCase() + part.slice(1)
        : part
    )
    .join("");
}

// GET /api/jobs?page=1&limit=10&q=react
router.get("/", async (req, res, next) => {
  try {
    const page = Math.max(
      1,
      Number.parseInt(req.query.page, 10) || 1
    );

    const limit = Math.min(
      50,
      Math.max(
        1,
        Number.parseInt(req.query.limit, 10) || 10
      )
    );

    const q = String(req.query.q || "")
      .trim()
      .slice(0, 100);

    const filter = {
      active: true,
    };

    if (q) {
      const regex = new RegExp(
        escapeRegex(q),
        "i"
      );

      filter.$or = [
        { title: regex },
        { company: regex },
        { location: regex },
        { tags: regex },
        { requiredSkills: regex },
      ];
    }

    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .sort({ postedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      Job.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      jobs,

      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return next(error);
  }
});

// GET /api/jobs/matches?page=1&limit=20
router.get(
  "/matches",
  requireAuth,
  requireRole("student"),
  async (req, res, next) => {
    try {
      const page = Math.max(
        1,
        Number.parseInt(req.query.page, 10) || 1
      );

      const limit = Math.min(
        50,
        Math.max(
          1,
          Number.parseInt(req.query.limit, 10) || 20
        )
      );

      const profile = await StudentProfile.findOne({
        user: req.user._id,
      }).lean();

      const studentSkills = new Set(
        (profile?.skills || [])
          .map((skill) => normalizeSkill(skill.name))
          .filter(Boolean)
      );

      const jobs = await Job.find({
        active: true,
      })
        .sort({ postedAt: -1 })
        .lean();

      const matches = jobs
        .map((job) => {
          const required = [
            ...new Set(
              (job.requiredSkills || [])
                .map(normalizeSkill)
                .filter(Boolean)
            ),
          ];

          const matched = required.filter(
            (skill) => studentSkills.has(skill)
          );

          const missing = required.filter(
            (skill) => !studentSkills.has(skill)
          );

          const score = required.length
            ? Math.round(
                (matched.length / required.length) * 100
              )
            : 0;

          return {
            job,

            match: {
              matchScore: score,

              matchedSkills: matched.map(displaySkill),

              missingSkills: missing.map(displaySkill),

              explanation: required.length
                ? `${matched.length} of ${required.length} required skills match your saved skills.`
                : "No structured required skills are available for this listing.",
            },
          };
        })
        .sort(
          (a, b) =>
            b.match.matchScore - a.match.matchScore ||
            new Date(b.job.postedAt) -
              new Date(a.job.postedAt)
        );

      const start = (page - 1) * limit;

      return res.json({
        success: true,

        matches: matches.slice(
          start,
          start + limit
        ),

        pagination: {
          page,
          limit,
          total: matches.length,
          pages: Math.ceil(matches.length / limit),
        },
      });
    } catch (error) {
      return next(error);
    }
  }
);

export default router;