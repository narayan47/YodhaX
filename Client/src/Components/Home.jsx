import { useState } from "react";
import { FaGithub } from "react-icons/fa";
import { Link } from "react-router-dom";
import Header from "./Header";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  Check,
  Code2,
  FileCheck2,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Zap,
  CircleCheck,
} from "lucide-react";

/* -------------------- DATA -------------------- */

const skills = [
  {
    name: "React.js",
    score: 92,
    proof: "4 repositories · 3 projects",
    color: "from-violet-500 to-fuchsia-400",
  },
  {
    name: "Node.js",
    score: 86,
    proof: "2 APIs · 18 merged commits",
    color: "from-emerald-400 to-teal-300",
  },
  {
    name: "Problem solving",
    score: 78,
    proof: "12 assessed challenges",
    color: "from-amber-300 to-orange-400",
  },
];

const evidence = [
  {
    icon: FaGithub,
    title: "GitHub activity",
    description: "Repositories and contributions",
    status: "Connected",
  },
  {
    icon: Code2,
    title: "Evaluated project",
    description: "Product Review System",
    status: "Reviewed",
  },
  {
    icon: FileCheck2,
    title: "Skill assessment",
    description: "JavaScript fundamentals",
    status: "Passed · 88%",
  },
];

const steps = [
  {
    number: "01",
    icon: FaGithub,
    title: "Connect your work",
    description:
      "Link GitHub repositories and review project activity, contributions, and code.",
    tag: "GitHub evidence",
  },
  {
    number: "02",
    icon: FileCheck2,
    title: "Validate your skills",
    description:
      "Combine assessments, evaluated projects, and practical evidence to build a stronger skill profile.",
    tag: "Assessment + projects",
  },
  {
    number: "03",
    icon: BarChart3,
    title: "Share your proof",
    description:
      "Share a profile with skill scores and direct links to the evidence supporting them.",
    tag: "Proof-linked profile",
  },
];

const studentBenefits = [
  "Show the projects and code behind your skills",
  "Identify strengths and areas to improve",
  "Share one profile instead of scattered links",
  "Control which profile information you share",
];

const recruiterBenefits = [
  {
    icon: ShieldCheck,
    title: "Evidence-first review",
    description:
      "Inspect the projects and assessments behind each skill.",
  },
  {
    icon: Users,
    title: "Talent discovery",
    description:
      "Explore student profiles by demonstrated skills.",
  },
  {
    icon: BarChart3,
    title: "Transparent scoring",
    description:
      "Use documented evaluation criteria to compare candidates.",
  },
  {
    icon: Zap,
    title: "Less guesswork",
    description:
      "Focus on relevant work instead of resume keywords alone.",
  },
];

/* -------------------- REUSABLE BUTTON -------------------- */

function Button({
  children,
  variant = "primary",
  onClick,
  className = "",
}) {
  const styles =
    variant === "primary"
      ? "bg-violet-500 text-white hover:bg-violet-400 shadow-lg shadow-violet-500/20"
      : "border border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition ${styles} ${className}`}
    >
      {children}
    </button>
  );
}

/* -------------------- SCORE RING -------------------- */

function ScoreRing({ score = 87 }) {
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

  return (
    <div className="relative grid h-24 w-24 shrink-0 place-items-center">
      <svg
        viewBox="0 0 88 88"
        className="-rotate-90"
        width="96"
        height="96"
        role="img"
        aria-label={`Illustrative score: ${score} out of 100`}
      >
        <defs>
          <linearGradient id="score-gradient">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#55e6d0" />
          </linearGradient>
        </defs>

        <circle
          cx="44"
          cy="44"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,.08)"
          strokeWidth="7"
        />

        <circle
          cx="44"
          cy="44"
          r={radius}
          fill="none"
          stroke="url(#score-gradient)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>

      <div className="absolute text-center">
        <div className="text-2xl font-bold">{score}</div>
        <div className="text-[10px] text-slate-500">
          out of 100
        </div>
      </div>
    </div>
  );
}

/* -------------------- SKILL ROW -------------------- */

function SkillRow({ skill }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between gap-3 text-sm">
        <span className="font-medium text-slate-200">
          {skill.name}
        </span>

        <span className="font-semibold">
          {skill.score}
          <span className="text-slate-500">/100</span>
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-white/[0.07]">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${skill.color}`}
          style={{ width: `${skill.score}%` }}
        />
      </div>

      <p className="text-xs text-slate-500">
        {skill.proof}
      </p>
    </div>
  );
}

/* -------------------- DASHBOARD PREVIEW -------------------- */

function DashboardPreview() {
  return (
    <div className="relative mx-auto w-full max-w-xl">
      <div className="absolute -inset-8 rounded-full bg-violet-500/10 blur-3xl" />

      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#10121c] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/[0.08] p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500/15 text-violet-300">
              <ShieldCheck size={20} />
            </div>

            <div>
              <h3 className="text-sm font-semibold">
                Verified skill profile
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Evidence-linked portfolio
              </p>
            </div>
          </div>

          <span className="flex items-center gap-1 rounded-full border border-emerald-300/20 bg-emerald-300/[0.08] px-2.5 py-1 text-xs text-emerald-300">
            <BadgeCheck size={13} />
            Preview
          </span>
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 font-bold">
                NC
              </div>

              <div>
                <h3 className="font-semibold">
                  Narayan Charan
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Full-stack developer
                </p>

                <a
                  href="https://github.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 flex items-center gap-1 text-xs text-slate-400 transition hover:text-white"
                >
                  <FaGithub size={14} />
                  GitHub profile
                  <ArrowUpRight size={12} />
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:ml-auto">
              <ScoreRing score={87} />

              <div>
                <p className="text-xs text-slate-400">
                  Evidence score
                </p>

                <p className="mt-1 text-sm font-semibold text-teal-300">
                  Profile overview
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Illustrative data
                </p>
              </div>
            </div>
          </div>

          <div className="my-6 h-px bg-white/[0.07]" />

          <div className="mb-5 flex items-center justify-between">
            <h4 className="text-sm font-semibold">
              Skill breakdown
            </h4>

            <span className="text-xs text-slate-500">
              {skills.length} skills
            </span>
          </div>

          <div className="space-y-5">
            {skills.map((skill) => (
              <SkillRow key={skill.name} skill={skill} />
            ))}
          </div>

          <div className="my-6 h-px bg-white/[0.07]" />

          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-slate-400">
                Evidence sources
              </p>

              <p className="mt-1 text-lg font-bold">
                {evidence.length}
                <span className="text-xs font-normal text-slate-500">
                  {" "}examples
                </span>
              </p>
            </div>

            <div className="flex -space-x-2">
              {[FaGithub, Code2, FileCheck2].map(
                (Icon, index) => (
                  <div
                    key={index}
                    className="grid h-9 w-9 place-items-center rounded-xl border-2 border-[#10121c] bg-[#202235]"
                  >
                    <Icon size={15} />
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-white/[0.07] bg-white/[0.02] px-5 py-3 text-xs text-slate-500">
          <ShieldCheck size={14} />
          Skills should link to their supporting evidence.
        </div>
      </div>
    </div>
  );
}

/* -------------------- MAIN HOME PAGE -------------------- */

function Home() {
  const [notice, setNotice] = useState("");

  const showNotice = () => {
    setNotice(
      "Demo only: connect this button to your authentication and signup API."
    );

    window.setTimeout(() => setNotice(""), 4000);
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#080910] text-white selection:bg-violet-400/30">
      {/* Shared Header is rendered by your application layout. */}
        <Header/>
      <main>
        {/* HERO */}

        <section className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 pb-24 pt-16 sm:px-8 sm:pt-20 lg:grid-cols-2 lg:px-12 lg:py-24">
          <div className="pointer-events-none absolute -left-48 top-10 -z-0 h-96 w-96 rounded-full bg-violet-600/[0.09] blur-[120px]" />

          <div className="relative">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-300/[0.07] px-3.5 py-2 text-xs font-medium text-violet-200">
              <Sparkles size={14} />
              A better signal for early-career talent
              <ArrowUpRight size={13} />
            </div>

            <h1 className="text-[clamp(2.8rem,6vw,5.2rem)] font-semibold leading-[1.05] tracking-[-0.065em]">
              Don't just claim it.
              <br />
              <span className="gradient-text">
                Prove your skills.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">
              Verifhir turns your GitHub work, evaluated projects,
              and assessments into a skill profile backed by real
              evidence — so your potential speaks louder than
              your resume.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button onClick={showNotice} className="min-h-12">
                Build my skill profile <ArrowRight size={16} />
              </Button>

              <Button
                variant="secondary"
                onClick={() =>
                  document
                    .getElementById("how-it-works")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="min-h-12"
              >
                <Target size={16} />
                See how it works
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Check size={14} className="text-teal-300" />
                Evidence over self-reported claims
              </span>

              <span className="flex items-center gap-1.5">
                <Check size={14} className="text-teal-300" />
                Built for early-career talent
              </span>
            </div>

            <div className="mt-12 border-t border-white/[0.08] pt-6">
              <p className="text-sm font-semibold text-slate-300">
                For the next generation of talent
              </p>

              <p className="mt-1 text-xs text-slate-500">
                And the teams ready to discover it.
              </p>
            </div>
          </div>

          <DashboardPreview />
        </section>

        {/* VALUE PROPOSITION */}

        <section className="border-y border-white/[0.07] bg-white/[0.018]">
          <div className="mx-auto grid max-w-7xl gap-7 px-5 py-8 sm:grid-cols-3 sm:px-8 lg:px-12">
            {[
              {
                number: "01",
                title: "Work you can inspect",
                description: "Link real repositories and projects.",
              },
              {
                number: "02",
                title: "Skills with context",
                description: "Understand how skills are supported.",
              },
              {
                number: "03",
                title: "Evidence in one place",
                description: "Give reviewers a clearer signal.",
              },
            ].map((item) => (
              <div key={item.number} className="flex gap-4">
                <span className="font-mono text-xs text-violet-300">
                  {item.number}
                </span>

                <div>
                  <h3 className="text-sm font-semibold">
                    {item.title}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}

        <section
          id="how-it-works"
          className="scroll-mt-24 mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-12 lg:py-28"
        >
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">HOW VERIFHIR WORKS</p>

            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
              A clearer picture of what you can do.
            </h2>

            <p className="mt-5 leading-7 text-slate-400">
              Bring your work together into a profile that students
              can improve and hiring teams can evaluate.
            </p>
          </div>

          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {steps.map((step) => {
              const Icon = step.icon;

              return (
                <article
                  key={step.number}
                  className="rounded-2xl border border-white/[0.09] bg-white/[0.025] p-6 transition hover:-translate-y-1 hover:border-violet-300/25 sm:p-7"
                >
                  <div className="flex items-center justify-between">
                    <div className="grid h-12 w-12 place-items-center rounded-xl border border-violet-300/15 bg-violet-300/[0.08] text-violet-200">
                      <Icon size={21} />
                    </div>

                    <span className="font-mono text-xs text-slate-600">
                      {step.number}
                    </span>
                  </div>

                  <h3 className="mt-7 text-lg font-semibold">
                    {step.title}
                  </h3>

                  <p className="mt-3 min-h-24 text-sm leading-6 text-slate-400">
                    {step.description}
                  </p>

                  <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/[0.05] px-3 py-1.5 text-xs text-slate-300">
                    <CircleCheck size={13} className="text-teal-300" />
                    {step.tag}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* STUDENTS */}

        <section
          id="students"
          className="scroll-mt-24 border-y border-white/[0.07] bg-[#0d0e17]"
        >
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:px-12 lg:py-24">
            <div>
              <p className="eyebrow">
                FOR STUDENTS & GRADUATES
              </p>

              <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
                Your potential deserves more than a bullet point.
              </h2>

              <p className="mt-5 leading-7 text-slate-400">
                No internship yet? Building projects outside class?
                Make your work easier to discover. Turn your
                developing skills into a clear, evidence-backed story.
              </p>

              <ul className="mt-7 space-y-4">
                {studentBenefits.map((benefit) => (
                  <li
                    key={benefit}
                    className="flex items-start gap-3 text-sm text-slate-300"
                  >
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-teal-300/10 text-teal-300">
                      <Check size={12} />
                    </span>

                    {benefit}
                  </li>
                ))}
              </ul>

              <Button onClick={showNotice} className="mt-8">
                Create your profile <ArrowRight size={15} />
              </Button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#121420] p-5 shadow-glow sm:p-7">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">
                    Your evidence, organized
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Example profile overview
                  </p>
                </div>

                <div className="grid h-10 w-10 place-items-center rounded-xl bg-teal-300/10 text-teal-300">
                  <GraduationCap size={19} />
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {evidence.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.title}
                      className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3.5"
                    >
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-400/10 text-violet-300">
                        <Icon size={18} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">
                          {item.title}
                        </p>

                        <p className="mt-1 truncate text-xs text-slate-500">
                          {item.description}
                        </p>
                      </div>

                      <span className="shrink-0 rounded-full bg-white/[0.05] px-2 py-1 text-[10px] text-slate-300">
                        {item.status}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 rounded-xl border border-dashed border-violet-300/20 bg-violet-300/[0.035] p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-violet-200">
                  <Sparkles size={15} />
                  One profile. More context.
                </div>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Example interface only. Actual scores must be
                  calculated using transparent evaluation rules
                  and verified evidence.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* RECRUITERS */}

        <section
          id="recruiters"
          className="scroll-mt-24 mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-12 lg:py-28"
        >
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="eyebrow">
                FOR RECRUITERS & PLACEMENT CELLS
              </p>

              <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
                Hire with a signal, not just a summary.
              </h2>

              <p className="mt-5 leading-7 text-slate-400">
                Give hiring teams a more useful starting point.
                Review candidate skills alongside the work,
                assessments, and projects that support them.
              </p>

              <Button
                variant="secondary"
                onClick={showNotice}
                className="mt-8"
              >
                Explore talent profiles <ArrowRight size={15} />
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {recruiterBenefits.map((benefit) => {
                const Icon = benefit.icon;

                return (
                  <div
                    key={benefit.title}
                    className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5"
                  >
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-300/10 text-violet-200">
                      <Icon size={19} />
                    </div>

                    <h3 className="mt-5 text-sm font-semibold">
                      {benefit.title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {benefit.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CALL TO ACTION */}

        <section
          id="about"
          className="scroll-mt-24 px-5 pb-24 sm:px-8 lg:px-12 lg:pb-28"
        >
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl border border-violet-300/15 bg-gradient-to-br from-violet-500/[0.16] via-[#171426] to-teal-400/[0.07] px-6 py-12 text-center sm:px-12 sm:py-16">
            <div className="pointer-events-none absolute left-1/2 top-0 h-48 w-96 -translate-x-1/2 rounded-full bg-violet-500/15 blur-[90px]" />

            <div className="relative">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.06] text-violet-200">
                <ShieldCheck size={23} />
              </div>

              <h2 className="mx-auto mt-6 max-w-2xl text-3xl font-semibold tracking-tight sm:text-5xl">
                Make your skills impossible to overlook.
              </h2>

              <p className="mx-auto mt-5 max-w-xl leading-7 text-slate-400">
                Build a stronger signal for your next opportunity.
                Start with the work you have already done.
              </p>

              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Button onClick={showNotice}>
                  Get early access <ArrowRight size={15} />
                </Button>

                <Button
                  variant="secondary"
                  onClick={() => {
                    window.location.href = "mailto:hello@verifhir.com";
                  }}
                >
                  Talk to our team <ArrowUpRight size={15} />
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}

      <footer className="border-t border-white/[0.08]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-12">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-violet-500/15 text-violet-300">
              <ShieldCheck size={17} />
            </div>

            <span className="font-bold tracking-tight">
              verifhir<span className="text-violet-400">.</span>
            </span>
          </Link>

          <p className="text-xs text-slate-600">
            Skills, verified. Built for evidence-led hiring.
          </p>

          <div className="flex gap-5 text-xs text-slate-500">
            <a href="/#about" className="hover:text-white">
              About
            </a>

            <a
              href="mailto:hello@verifhir.com"
              className="hover:text-white"
            >
              Contact
            </a>

            <a href="/#about" className="hover:text-white">
              Privacy
            </a>
          </div>
        </div>
      </footer>

      {/* DEMO NOTIFICATION */}

      {notice && (
        <div
          role="status"
          className="fixed bottom-5 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 rounded-xl border border-violet-300/20 bg-[#191a28] px-4 py-3 text-sm text-slate-200 shadow-2xl"
        >
          {notice}
        </div>
      )}
    </div>
  );
}

export default Home;