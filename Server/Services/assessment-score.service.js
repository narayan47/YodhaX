
import {
  normalizeSkillName,
} from "./skill-score.service.js";

/**
 * questions must be loaded from a trusted server-side
 * question bank. Each question:
 * {
 *   _id: "...",
 *   skill: "JavaScript",
 *   correctOptionId: "option-b"
 * }
 *
 * answers:
 * [{ questionId: "...", selectedOptionId: "option-b" }]
 */
export function gradeAssessment(questions, answers) {
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error("Assessment has no questions.");
  }

  if (!Array.isArray(answers)) {
    throw new Error("Invalid assessment answers.");
  }

  const questionMap = new Map(
    questions.map((question) => [
      String(question._id),
      question,
    ])
  );

  const submittedIds = new Set();

  for (const answer of answers) {
    const questionId = String(answer.questionId);

    if (!questionMap.has(questionId)) {
      throw new Error("Answer contains an invalid question.");
    }

    if (submittedIds.has(questionId)) {
      throw new Error("Duplicate question answers are not allowed.");
    }

    submittedIds.add(questionId);
  }

  const grouped = new Map();

  for (const question of questions) {
    const skill = question.skill;
    const key = normalizeSkillName(skill);

    if (!grouped.has(key)) {
      grouped.set(key, {
        skill,
        total: 0,
        correct: 0,
      });
    }

    const result = grouped.get(key);
    result.total += 1;

    const submitted = answers.find(
      (answer) =>
        String(answer.questionId) === String(question._id)
    );

    if (
      submitted &&
      String(submitted.selectedOptionId) ===
        String(question.correctOptionId)
    ) {
      result.correct += 1;
    }
  }

  const skillResults = [...grouped.values()].map((item) => ({
    skill: item.skill,
    totalQuestions: item.total,
    correctAnswers: item.correct,
    score: Math.round(
      (item.correct / item.total) * 100
    ),
  }));

  const totalCorrect = skillResults.reduce(
    (sum, item) => sum + item.correctAnswers,
    0
  );

  const totalQuestions = skillResults.reduce(
    (sum, item) => sum + item.totalQuestions,
    0
  );

  return {
    totalQuestions,
    correctAnswers: totalCorrect,
    overallScore: Math.round(
      (totalCorrect / totalQuestions) * 100
    ),
    skillResults,
    completedAt: new Date(),
  };
}
