
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  LoaderCircle,
  RotateCcw,
  Trophy,
} from "lucide-react";
import api from "../../api/axios";

const SUPPORTED_SKILLS = [
  { label: "JavaScript", apiSkill: "javascript", aliases: ["javascript", "js"] },
  { label: "Node.js", apiSkill: "nodejs", aliases: ["node.js", "nodejs", "node"] },
  { label: "React", apiSkill: "react", aliases: ["react", "react.js", "reactjs"] },
  { label: "Python", apiSkill: "python", aliases: ["python"] },
  { label: "SQL", apiSkill: "sql", aliases: ["sql"] },
];

export default function StudentSkillAssessment({
  skills = [],
  onCompleted,
}) {
  const [selectedSkill, setSelectedSkill] = useState("");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [started, setStarted] = useState(false);

  const availableSkills = useMemo(() => {
    const names = skills.map((skill) =>
      String(skill.name || "").trim().toLowerCase()
    );

    return SUPPORTED_SKILLS.filter((supported) =>
      supported.aliases.some((alias) => names.includes(alias))
    );
  }, [skills]);

  useEffect(() => {
    if (!availableSkills.length) {
      setSelectedSkill("");
      return;
    }

    setSelectedSkill((current) =>
      availableSkills.some((item) => item.apiSkill === current)
        ? current
        : availableSkills[0].apiSkill
    );
  }, [availableSkills]);

  async function startAssessment(skill = selectedSkill) {
    if (!skill) return;

    setLoading(true);
    setError("");
    setResult(null);
    setAnswers({});
    setCurrentQuestion(0);
    setQuestions([]);
    setStarted(false);

    try {
      const { data } = await api.get(
        `/student/assessment/${encodeURIComponent(skill)}`
      );

      if (!Array.isArray(data.questions) || !data.questions.length) {
        throw new Error("No questions are available for this assessment.");
      }

      setQuestions(data.questions);
      setStarted(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load the assessment."
      );
    } finally {
      setLoading(false);
    }
  }

  function selectSkill(value) {
    setSelectedSkill(value);
    setQuestions([]);
    setAnswers({});
    setResult(null);
    setError("");
    setStarted(false);
  }

  function selectAnswer(questionId, optionIndex) {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: optionIndex,
    }));
  }

  async function submitAssessment(event) {
    event.preventDefault();

    if (Object.keys(answers).length !== questions.length) {
      setError("Please answer every question before submitting.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const { data } = await api.post(
        `/student/assessment/${encodeURIComponent(selectedSkill)}/submit`,
        { answers }
      );

      setResult(data.result);
      setStarted(false);

      if (data.profile) {
        onCompleted?.(data.profile);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Assessment submission failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const answeredCount = Object.keys(answers).length;
  const progress = questions.length
    ? Math.round((answeredCount / questions.length) * 100)
    : 0;

  if (!availableSkills.length) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <ClipboardCheck className="mb-3 text-violet-400" size={30} />

        <h2 className="text-xl font-semibold">
          Technical skill assessment
        </h2>

        <p className="mt-2 text-sm text-slate-400">
          Add one of these skills to your profile to start:
          JavaScript, Node.js, React, Python, or SQL.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-7">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-violet-500/15 p-3 text-violet-300">
          <ClipboardCheck size={25} />
        </div>

        <div>
          <h2 className="text-xl font-semibold">
            Technical skill assessment
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Demonstrate your knowledge with a server-evaluated MCQ test.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <label
          htmlFor="assessment-skill"
          className="mb-2 block text-sm font-medium"
        >
          Select a skill
        </label>

        <select
          id="assessment-skill"
          value={selectedSkill}
          disabled={loading || submitting || started}
          onChange={(event) => selectSkill(event.target.value)}
          className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-violet-500"
        >
          {availableSkills.map((item) => (
            <option key={item.apiSkill} value={item.apiSkill}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-5 flex gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300"
        >
          <AlertCircle size={18} className="shrink-0" />
          {error}
        </div>
      )}

      {!started && !result && (
        <div className="mt-6 rounded-xl border border-white/10 p-5">
          <h3 className="font-medium">Ready to test your skills?</h3>

          <p className="mt-2 text-sm text-slate-400">
            Questions will be loaded from the server. Your answers
            will be evaluated after you submit.
          </p>

          <button
            type="button"
            onClick={() => startAssessment()}
            disabled={loading || !selectedSkill}
            className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 font-medium hover:bg-violet-500 disabled:opacity-50"
          >
            {loading ? (
              <LoaderCircle className="animate-spin" size={18} />
            ) : (
              <ClipboardCheck size={18} />
            )}

            {loading ? "Loading questions..." : "Start assessment"}
          </button>
        </div>
      )}

      {started && questions.length > 0 && (
        <form onSubmit={submitAssessment} className="mt-6">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-slate-300">
              Question {currentQuestion + 1} of {questions.length}
            </span>

            <span className="text-violet-300">
              {answeredCount}/{questions.length} answered
            </span>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-violet-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          <fieldset className="mt-6 rounded-xl border border-white/10 p-4 sm:p-6">
            <legend className="px-2 text-base font-semibold sm:text-lg">
              {questions[currentQuestion].question}
            </legend>

            <div className="mt-4 space-y-3">
              {questions[currentQuestion].options.map((option, index) => {
                const selected =
                  answers[questions[currentQuestion].id] === index;

                return (
                  <label
                    key={`${questions[currentQuestion].id}-${index}`}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                      selected
                        ? "border-violet-500 bg-violet-500/10"
                        : "border-white/10 hover:border-white/25"
                    }`}
                  >
                    <input
                      type="radio"
                      name={questions[currentQuestion].id}
                      checked={selected}
                      onChange={() =>
                        selectAnswer(
                          questions[currentQuestion].id,
                          index
                        )
                      }
                      className="accent-violet-500"
                    />

                    <span className="text-sm">{option}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() =>
                setCurrentQuestion((current) => Math.max(0, current - 1))
              }
              disabled={currentQuestion === 0 || submitting}
              className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 disabled:opacity-40"
            >
              <ArrowLeft size={17} />
              Previous
            </button>

            {currentQuestion < questions.length - 1 ? (
              <button
                type="button"
                onClick={() =>
                  setCurrentQuestion((current) =>
                    Math.min(questions.length - 1, current + 1)
                  )
                }
                disabled={submitting}
                className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-3 disabled:opacity-40"
              >
                Next
                <ArrowRight size={17} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={
                  submitting || answeredCount !== questions.length
                }
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-medium disabled:opacity-40"
              >
                {submitting ? (
                  <LoaderCircle className="animate-spin" size={18} />
                ) : (
                  <CheckCircle2 size={18} />
                )}

                {submitting ? "Evaluating..." : "Submit assessment"}
              </button>
            )}
          </div>

          {answeredCount !== questions.length && (
            <p className="mt-3 text-right text-xs text-amber-300">
              Answer all questions to submit.
            </p>
          )}
        </form>
      )}

      {result && (
        <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <Trophy size={30} className="text-emerald-300" />
            <div>
              <h3 className="text-lg font-semibold">
                Assessment completed!
              </h3>
              <p className="text-sm text-slate-400">
                {result.skill} knowledge assessment
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 p-4">
              <p className="text-sm text-slate-400">MCQ score</p>
              <p className="mt-1 text-2xl font-bold">
                {result.score}/100
              </p>
            </div>

            <div className="rounded-xl border border-white/10 p-4">
              <p className="text-sm text-slate-400">Correct answers</p>
              <p className="mt-1 text-2xl font-bold">
                {result.correctAnswers}/{result.totalQuestions}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 p-4">
              <p className="text-sm text-slate-400">Final skill score</p>
              <p className="mt-1 text-2xl font-bold text-emerald-300">
                {result.finalSkillScore}/100
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => startAssessment(selectedSkill)}
            disabled={loading}
            className="mt-5 flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 hover:bg-white/5 disabled:opacity-50"
          >
            <RotateCcw size={17} />
            Retake assessment
          </button>
        </div>
      )}
    </section>
  );
}
