
import { Router } from "express";

import StudentProfile from "../Model/StudentProfile.js";
import {
  requireAuth,
  requireRole,
} from "../Middleware/auth.js";

const router = Router();

router.use(requireAuth, requireRole("student"));

const GITHUB_API = "https://api.github.com";
const GITHUB_TIMEOUT_MS = 12000;

// Create the student's profile if it does not exist.
async function getOrCreateProfile(userId) {
  return StudentProfile.findOneAndUpdate(
    { user: userId },
    {
      $setOnInsert: {
        user: userId,
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

// Normalize a GitHub username or profile URL.
function parseGitHubUsername(input) {
  let username = String(input || "").trim();

  if (!username) {
    return {
      error: "GitHub username or profile URL is required.",
    };
  }

  if (/github\.com/i.test(username)) {
    try {
      const url = new URL(
        /^https?:\/\//i.test(username)
          ? username
          : `https://${username}`
      );

      if (
        !["github.com", "www.github.com"].includes(
          url.hostname.toLowerCase()
        ) ||
        url.search ||
        url.hash
      ) {
        return {
          error: "Enter a valid GitHub profile URL.",
        };
      }

      const segments = url.pathname
        .split("/")
        .filter(Boolean);

      if (segments.length !== 1) {
        return {
          error:
            "Enter a GitHub profile URL, not a repository URL.",
        };
      }

      username = segments[0];
    } catch {
      return {
        error: "Enter a valid GitHub username or profile URL.",
      };
    }
  }

  if (
    !/^[A-Za-z0-9-]{1,39}$/.test(username) ||
    username.startsWith("-") ||
    username.endsWith("-") ||
    username.includes("--")
  ) {
    return {
      error: "Enter a valid GitHub username.",
    };
  }

  return { username };
}

// GitHub API headers.
// GITHUB_TOKEN is optional for public repositories.
function getGitHubHeaders() {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "VerifHire-Placement-Hub",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const token = process.env.GITHUB_TOKEN?.trim();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

// Make a GitHub API request with a timeout.
async function githubRequest(path) {
  const response = await fetch(`${GITHUB_API}${path}`, {
    headers: getGitHubHeaders(),
    signal: AbortSignal.timeout(GITHUB_TIMEOUT_MS),
  });

  if (response.status === 401) {
    const error = new Error(
      "GitHub token is invalid or expired. Check GITHUB_TOKEN."
    );
    error.status = 502;
    throw error;
  }

  if (response.status === 403 || response.status === 429) {
    const error = new Error(
      "GitHub API rate limit or permission restriction. Try again later or configure GITHUB_TOKEN."
    );
    error.status = 429;
    throw error;
  }

  if (response.status === 404) {
    const error = new Error(
      "GitHub user or resource was not found."
    );
    error.status = 404;
    throw error;
  }

  if (!response.ok) {
    const error = new Error(
      `GitHub API request failed with status ${response.status}.`
    );
    error.status = 502;
    throw error;
  }

  return response.json();
}

// GET /api/student/profile
router.get("/profile", async (req, res, next) => {
  try {
    const profile = await getOrCreateProfile(req.user._id);

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

    if (names.some((name) => name.length > 60)) {
      return res.status(400).json({
        success: false,
        message:
          "Each skill must be 60 characters or fewer.",
      });
    }

    const uniqueNames = [
      ...new Map(
        names.map((name) => [
          name.toLowerCase(),
          name,
        ])
      ).values(),
    ];

    const profile = await getOrCreateProfile(req.user._id);

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
router.post("/github/verify", async (req, res, next) => {
  try {
    const parsed = parseGitHubUsername(req.body?.username);

    if (parsed.error) {
      return res.status(400).json({
        success: false,
        message: parsed.error,
      });
    }

    const username = parsed.username;

    // Check whether the server has a configured API token.
    if (!process.env.GITHUB_TOKEN?.trim()) {
      console.warn(
        "GITHUB_TOKEN is not configured. Using unauthenticated GitHub API requests."
      );
    }

    // Fetch the GitHub account and its public repositories.
    const githubUser = await githubRequest(
      `/users/${encodeURIComponent(username)}`
    );

    const repos = await githubRequest(
      `/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated&type=owner`
    );

    // Exclude forks when evaluating original work.
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

    const profile = await getOrCreateProfile(req.user._id);

    profile.githubUsername = githubUser.login;
    profile.githubUrl = githubUser.html_url;
    profile.githubVerifiedAt = new Date();

    profile.githubSummary.publicRepos = Number(
      githubUser.public_repos ?? publicRepos.length
    );

    profile.githubSummary.totalStars = totalStars;
    profile.githubSummary.repositories = repositories;

    // This is an evidence indicator, not a validated skill test.
    profile.githubSummary.overallEvidenceScore = Math.min(
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
          `${repo.name} ${repo.description || ""} ${
            repo.language || ""
          }`.toLowerCase()
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
          `${repo.name} ${repo.description || ""} ${
            repo.language || ""
          }`
            .toLowerCase()
            .includes(normalized)
        )
        .slice(0, 10);

      const githubEvidence = matchedRepos.map((repo) => ({
        type: "github_repository",
        description: `Public repository: ${repo.name}`,
        url: repo.html_url,
        repository: repo.name,
        detectedSkills: [skill.name],
      }));

      const score = Math.min(
        100,
        (languageMatch ? 45 : 0) +
          (repoText.includes(normalized) ? 25 : 0) +
          Math.min(matchedRepos.length, 3) * 10
      );

      const otherEvidence = skill.evidence.filter(
        (item) => item.type !== "github_repository"
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
    if (error.name === "TimeoutError" ||
        error.name === "AbortError") {
      return res.status(504).json({
        success: false,
        message: "GitHub API request timed out. Please try again.",
      });
    }

    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }

    return next(error);
  }
});

export default router;
