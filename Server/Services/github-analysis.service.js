
const GITHUB_API = "https://api.github.com";

function getHeaders() {
  return {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    ...(process.env.GITHUB_TOKEN
      ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
      : {}),
  };
}

export function extractGithubUsername(input) {
  const value = String(input || "").trim();

  const match = value.match(
    /^(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9-]+)\/?$|^([a-zA-Z0-9-]+)$/
  );

  return match ? (match[1] || match[2]) : null;
}

async function githubGet(url) {
  const response = await fetch(url, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("GitHub user or repository not found.");
    }

    if (response.status === 403 || response.status === 429) {
      throw new Error(
        "GitHub API rate limit reached. Try again later or configure GITHUB_TOKEN."
      );
    }

    throw new Error(`GitHub API returned ${response.status}.`);
  }

  return response.json();
}

export async function analyzeGithub(username) {
  const user = await githubGet(
    `${GITHUB_API}/users/${encodeURIComponent(username)}`
  );

  const repositories = [];
  const perPage = 100;
  const maxPages = 3;

  for (let page = 1; page <= maxPages; page++) {
    const batch = await githubGet(
      `${GITHUB_API}/users/${encodeURIComponent(username)}/repos` +
      `?type=owner&sort=updated&per_page=${perPage}&page=${page}`
    );

    repositories.push(...batch.filter((repo) => !repo.fork));

    if (batch.length < perPage) break;
  }

  // Analyze language data for every repository included in this scan.
  const analyzedRepositories = await Promise.all(
    repositories.map(async (repo) => {
      let languages = {};

      try {
        languages = await githubGet(repo.languages_url);
      } catch {
        // Keep the repository, but do not invent language evidence.
      }

      return {
        name: repo.name,
        description: repo.description,
        html_url: repo.html_url,
        language: repo.language,
        languages,
        topics: repo.topics || [],
        stargazers_count: repo.stargazers_count || 0,
        updated_at: repo.updated_at,
      };
    })
  );

  return {
    username: user.login,
    profileUrl: user.html_url,
    publicRepos: user.public_repos || 0,
    totalStars: analyzedRepositories.reduce(
      (sum, repo) => sum + repo.stargazers_count,
      0
    ),
    repositories: analyzedRepositories,
    verifiedAt: new Date(),
  };
}
