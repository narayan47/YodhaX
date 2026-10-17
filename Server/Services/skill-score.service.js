
const clamp = (value, min = 0, max = 100) =>
  Math.max(min, Math.min(max, Number(value) || 0));

const normalize = (value = "") =>
  String(value).toLowerCase().replace(/[^a-z0-9+#.]/g, "");

export function calculateFinalSkillScore(skill) {
  const githubScore = skill.githubScore;
  const assessmentScore = skill.assessmentScore;

  const hasGithub =
    githubScore !== undefined &&
    githubScore !== null &&
    Number.isFinite(Number(githubScore));

  const hasAssessment =
    assessmentScore !== undefined &&
    assessmentScore !== null &&
    Number.isFinite(Number(assessmentScore));

  // Both evidence sources are available.
  if (hasGithub && hasAssessment) {
    return Math.round(
      clamp(githubScore) * 0.6 +
      clamp(assessmentScore) * 0.4
    );
  }

  // Do not penalize a student for not having a second evidence source.
  if (hasGithub) return Math.round(clamp(githubScore));
  if (hasAssessment) return Math.round(clamp(assessmentScore));

  return 0;
}

export function analyzeRepositoriesForSkill(skillName, repositories) {
  const skill = normalize(skillName);
  let languageMatches = 0;
  let descriptionMatches = 0;
  let matchedRepositories = 0;

  const evidence = [];

  for (const repo of repositories) {
    const languages = Object.keys(repo.languages || {});
    const text = normalize(
      `${repo.name || ""} ${repo.description || ""} ${
        repo.topics?.join(" ") || ""
      }`
    );

    const languageMatch = languages.some(
      (language) => normalize(language) === skill
    );

    // Match repository descriptions, names, and topics too.
    const textMatch = text.includes(skill);

    if (languageMatch) languageMatches++;
    if (textMatch) descriptionMatches++;

    if (languageMatch || textMatch) {
      matchedRepositories++;

      evidence.push({
        type: "github",
        title: repo.name,
        url: repo.html_url,
        description: repo.description || "",
        language: repo.language || "",
        stars: repo.stargazers_count || 0,
        updatedAt: repo.updated_at,
      });
    }
  }

  const languageScore = Math.min(45, languageMatches * 15);
  const textScore = Math.min(25, descriptionMatches * 10);
  const repositoryScore = Math.min(30, matchedRepositories * 10);

  return {
    score: clamp(languageScore + textScore + repositoryScore),
    evidence,
    evidenceCount: evidence.length,
  };
}

export function rebuildSkill(skill, repositories) {
  const github = analyzeRepositoriesForSkill(
    skill.name,
    repositories
  );

  const updated = {
    ...skill,
    githubScore: github.score,
    githubEvidence: github.evidence,
    githubEvidenceCount: github.evidenceCount,
  };

  updated.score = calculateFinalSkillScore(updated);

  // Preserve assessment evidence while replacing stale GitHub evidence.
  updated.evidence = [
    ...(skill.evidence || []).filter(
      (item) => item.type !== "github"
    ),
    ...github.evidence,
    ...(skill.evidence || []).filter(
      (item) => item.type === "github-assessment"
    ),
  ];

  updated.evidenceCount = updated.evidence.length;

  return updated;
}
