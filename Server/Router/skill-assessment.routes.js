
import { Router } from "express";
import StudentProfile from "../Model/StudentProfile.js";
import {
  ASSESSMENTS,
  normalizeAssessmentSkill,
} from "../Services/skill-assessment.questions.js";
import {
  calculateFinalSkillScore,
} from "../Services/skill-score.service.js";

const router = Router();

// IMPORTANT: apply your existing student authentication middleware
// before these routes, or mount this router behind that middleware.
function getUserId(req) {
  return req.user?._id || req.user?.id;
}

function findSkill(profile, requestedSkill) {
  const normalized = normalizeAssessmentSkill(requestedSkill);

  return profile.skills.find(
    (item) => normalizeAssessmentSkill(item.name) === normalized
  );
}

router.get("/assessment/:skill", async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const skillKey = normalizeAssessmentSkill(req.params.skill);
    const questions = ASSESSMENTS[skillKey];

    if (!questions) {
      return res.status(404).json({
        message: "No assessment is available for this skill yet.",
        supportedSkills: Object.keys(ASSESSMENTS),
      });
    }

    const profile = await StudentProfile.findOne({ user: userId });

    if (!profile) {
      return res.status(404).json({ message: "Student profile not found." });
    }

    const skill = findSkill(profile, skillKey);

    if (!skill) {
      return res.status(400).json({
        message: "Add this skill to your profile before taking its assessment.",
      });
    }

    // Never send the answer key to the browser.
    return res.json({
      skill: skill.name,
      questions: questions.map(({ answer, ...question }) => question),
    });
  } catch (error) {
    console.error("Load assessment:", error);

    return res.status(500).json({
      message: "Unable to load assessment.",
    });
  }
});

router.post("/assessment/:skill/submit", async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const skillKey = normalizeAssessmentSkill(req.params.skill);
    const questions = ASSESSMENTS[skillKey];

    if (!questions) {
      return res.status(404).json({
        message: "Assessment not found.",
      });
    }

    const answers = req.body?.answers;

    if (
      !answers ||
      typeof answers !== "object" ||
      Array.isArray(answers)
    ) {
      return res.status(400).json({
        message: "Submit answers as an object keyed by question ID.",
      });
    }

    const expectedIds = new Set(questions.map((question) => question.id));
    const suppliedIds = Object.keys(answers);

    if (
      suppliedIds.length !== questions.length ||
      suppliedIds.some((id) => !expectedIds.has(id))
    ) {
      return res.status(400).json({
        message: "Submit exactly one answer for every question.",
      });
    }

    for (const question of questions) {
      if (
        !Number.isInteger(answers[question.id]) ||
        answers[question.id] < 0 ||
        answers[question.id] >= question.options.length
      ) {
        return res.status(400).json({
          message: `Invalid answer for question ${question.id}.`,
        });
      }
    }

    const profile = await StudentProfile.findOne({ user: userId });

    if (!profile) {
      return res.status(404).json({ message: "Student profile not found." });
    }

    const skill = findSkill(profile, skillKey);

    if (!skill) {
      return res.status(400).json({
        message: "Add this skill to your profile before taking its assessment.",
      });
    }

    const correct = questions.reduce(
      (total, question) =>
        total + (answers[question.id] === question.answer ? 1 : 0),
      0
    );

    const assessmentScore = Math.round(
      (correct / questions.length) * 100
    );

    skill.assessmentScore = assessmentScore;
    skill.assessmentTakenAt = new Date();

    // Keep the latest result as the current assessment evidence.
    const existingEvidence = (skill.evidence || []).filter(
      (item) => item.type !== "github-assessment"
    );

    skill.evidence = [
      ...existingEvidence,
      {
        type: "github-assessment",
        title: `${skill.name} MCQ assessment`,
        score: assessmentScore,
        correctAnswers: correct,
        totalQuestions: questions.length,
        takenAt: new Date(),
      },
    ];

    skill.score = calculateFinalSkillScore(skill);
    skill.evidenceCount = skill.evidence.length;

    profile.markModified("skills");
    await profile.save();

    return res.json({
      message: "Assessment submitted successfully.",
      result: {
        skill: skill.name,
        score: assessmentScore,
        correctAnswers: correct,
        totalQuestions: questions.length,
        finalSkillScore: skill.score,
        takenAt: skill.assessmentTakenAt,
      },
      profile,
    });
  } catch (error) {
    console.error("Submit assessment:", error);

    return res.status(500).json({
      message: "Unable to submit assessment.",
    });
  }
});

export default router;
