import { Router } from "express";

import StudentProfile from "../Model/StudentProfile.js";
import {
  requireAuth,
  requireRole,
} from "../Middleware/auth.js";

const router = Router();

router.use(requireAuth, requireRole("student"));

async function getOrCreateProfile(userId) {
  return StudentProfile.findOneAndUpdate(
    { user: userId },
    {
      $setOnInsert: {
        user: userId,
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      runValidators: true,
    }
  );
}

// GET /api/student/profile
router.get("/profile", async (req, res, next) => {
  try {
    const profile = await getOrCreateProfile(
      req.user._id
    );

    return res.json({
      success: true,
      profile,
    });
  } catch (error) {
    return next(error);
  }
});

// PUT /api/student/skills
router.put("/skills", async (req, res, next) => {
  try {
    const input = req.body?.skills;

    if (!Array.isArray(input)) {
      return res.status(400).json({
        success: false,
        message: "skills must be an array.",
      });
    }

    if (input.length > 20) {
      return res.status(400).json({
        success: false,
        message: "You can add up to 20 skills.",
      });
    }

    const names = input
      .map((item) =>
        typeof item === "string"
          ? item.trim()
          : typeof item?.name === "string"
            ? item.name.trim()
            : ""
      )
      .filter(Boolean);

    const uniqueNames = [
      ...new Map(
        names.map((name) => [
          name.toLowerCase(),
          name,
        ])
      ).values(),
    ];

    if (
      uniqueNames.some((name) => name.length > 60)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Each skill must be 60 characters or fewer.",
      });
    }

    const profile = await getOrCreateProfile(
      req.user._id
    );

    const existing = new Map(
      profile.skills.map((skill) => [
        skill.name.toLowerCase(),
        skill,
      ])
    );

    profile.skills = uniqueNames.map((name) => {
      const previous = existing.get(name.toLowerCase());

      if (previous) {
        return {
          name,
          score: previous.score,
          evidenceCount: previous.evidenceCount,
          evidence: previous.evidence,
        };
      }

      return {
        name,
        score: 0,
        evidenceCount: 0,
        evidence: [],
      };
    });

    await profile.save();

    return res.json({
      success: true,
      message: "Skills saved.",
      profile,
    });
  } catch (error) {
    return next(error);
  }
});

// POST /api/student/github/verify
router.post(
  "/github/verify",
  async (req, res, next) => {
    try {
      let username = String(
        req.body?.username || ""
      ).trim();

      // Accept a username or GitHub profile URL.
      if (username.includes("github.com")) {
        try {
          const url = new URL(
            username.startsWith("http")
              ? username
              : `https://${username}`
          );

          if (
            !["github.com", "www.github.com"].includes(
              url.hostname.toLowerCase()
            )
          ) {
            return res.status(400).json({
              success: false,
              message:
                "Enter a valid GitHub profile URL.",
            });
          }

          username =
            url.pathname.split("/").filter(Boolean)[0] ||
            "";
        } catch {
          return res.status(400).json({
            success: false,
            message:
              "Enter a valid GitHub username or profile URL.",
          });
        }
      }

      if (
        !/^[A-Za-z0-9-]{1,39}$/.test(username) ||
        username.startsWith("-") ||
        username.endsWith("-") ||
        username.includes("--")
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Enter a valid GitHub username or profile URL.",
        });
      }

      const headers = {
        Accept: "application/vnd.github+json",
        "User-Agent": "VerifHire-Placement-Hub",
      };

      if (process.env.GITHUB_TOKEN) {
        headers.Authorization =
          `Bearer ${process.env.GITHUB_TOKEN}`;
      }

      const userResponse = await fetch(
        `https://api.github.com/users/${encodeURIComponent(username)}`,
        {
          headers,
          signal: AbortSignal.timeout(12000),
        }
      );

      if (userResponse.status === 404) {
        return res.status(404).json({
          success: false,
          message: "GitHub user was not found.",
        });
      }

      if (!userResponse.ok) {
        return res.status(
          userResponse.status === 403 ||
          userResponse.status === 429
            ? 429
            : 502
        ).json({
          success: false,
          message:
            "GitHub API request failed. Check your rate limit or GITHUB_TOKEN.",
        });
      }

      const githubUser = await userResponse.json();

      const reposResponse = await fetch(
        `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated&type=owner`,
        {
          headers,
          signal: AbortSignal.timeout(12000),
        }
      );

      if (!reposResponse.ok) {
        return res.status(
          reposResponse.status === 403 ||
          reposResponse.status === 429
            ? 429
            : 502
        ).json({
          success: false,
          message:
            "Could not load public GitHub repositories.",
        });
      }

      const repos = await reposResponse.json();

      const publicRepos = repos.filter(
        (repo) => !repo.fork
      );

      const repositories = publicRepos
        .slice(0, 30)
        .map((repo) => ({
          name: repo.name,
          url: repo.html_url,
          language: repo.language || "Not specified",
          stars: Number(repo.stargazers_count || 0),
          description: repo.description || "",
        }));

      const totalStars = publicRepos.reduce(
        (sum, repo) =>
          sum + Number(repo.stargazers_count || 0),
        0
      );

      const languages = [
        ...new Set(
          publicRepos
            .map((repo) => repo.language)
            .filter(Boolean)
        ),
      ];

      const profile = await getOrCreateProfile(
        req.user._id
      );

      profile.githubUsername = githubUser.login;
      profile.githubUrl = githubUser.html_url;
      profile.githubVerifiedAt = new Date();

      profile.githubSummary.publicRepos = Number(
        githubUser.public_repos || publicRepos.length
      );

      profile.githubSummary.totalStars = totalStars;
      profile.githubSummary.repositories = repositories;

      profile.githubSummary.overallEvidenceScore =
        Math.min(
          100,
          Math.round(
            Math.min(publicRepos.length, 10) * 5 +
            Math.min(totalStars, 20) +
            Math.min(languages.length, 5) * 6
          )
        );

      const repoText = publicRepos
        .map(
          (repo) =>
            `${repo.name} ${repo.description || ""} ${repo.language || ""}`.toLowerCase()
        )
        .join(" ");

      profile.skills = profile.skills.map((skill) => {
        const normalized = skill.name.toLowerCase();

        const languageMatch = languages.some(
          (language) =>
            language.toLowerCase() === normalized
        );

        const matchedRepos = publicRepos
          .filter((repo) =>
            `${repo.name} ${repo.description || ""} ${repo.language || ""}`
              .toLowerCase()
              .includes(normalized)
          )
          .slice(0, 10);

        const githubEvidence = matchedRepos.map(
          (repo) => ({
            type: "github_repository",
            description: `Public repository: ${repo.name}`,
            url: repo.html_url,
            repository: repo.name,
            detectedSkills: [skill.name],
          })
        );

        const score = Math.min(
          100,
          (languageMatch ? 45 : 0) +
            (repoText.includes(normalized) ? 25 : 0) +
            Math.min(matchedRepos.length, 3) * 10
        );

        const otherEvidence = skill.evidence.filter(
          (item) =>
            item.type !== "github_repository"
        );

        return {
          name: skill.name,
          score: Math.max(skill.score || 0, score),
          evidence: [
            ...otherEvidence,
            ...githubEvidence,
          ],
          evidenceCount:
            otherEvidence.length + githubEvidence.length,
        };
      });

      await profile.save();

      return res.json({
        success: true,
        message:
          "GitHub profile and public repository analysis completed. Scores are evidence estimates, not validated proficiency tests.",
        profile,
        githubUser: {
          login: githubUser.login,
          name: githubUser.name,
          html_url: githubUser.html_url,
        },
      });
    } catch (error) {
      return next(error);
    }
  }
);

export default router;