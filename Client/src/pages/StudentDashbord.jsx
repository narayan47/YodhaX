

import { useCallback, useEffect, useMemo, useState } from "react";

import {

  Activity,

  ArrowUpRight,

  BadgeCheck,

  BriefcaseBusiness,

  CheckCircle2,

  ChevronRight,

  CircleAlert,

  Download,

  ExternalLink,

  FileText,

  FolderGit2,

  GraduationCap,

  LayoutDashboard,

  LoaderCircle,

  Plus,

  RefreshCw,

  Save,

  Search,

  ShieldCheck,

  Trash2,

  UserRound,

  X,

} from "lucide-react";

import { FaGithub, FaLinkedin } from "react-icons/fa";

import api from "../api/axios";

import Header from "../Components/Header";

import { useAuth } from "../context/AuthContext";

import StudentSkillAssessment from "../Components/Student/StudentSkillAssessment";

const TABS = [

  { id: "overview", label: "Overview", icon: LayoutDashboard },

  { id: "skills", label: "My Skills", icon: Activity },

  { id: "jobs", label: "Job Matching", icon: BriefcaseBusiness },

  { id: "evidence", label: "Skill Evidence", icon: ShieldCheck },

  { id: "resume", label: "Resume Builder", icon: FileText },

];

const EMPTY_RESUME = {

  fullName: "",

  email: "",

  phone: "",

  location: "",

  linkedinUrl: "",

  githubUrl: "",

  portfolioUrl: "",

  summary: "",

  education: [],

  experience: [],

  projects: [],

  certifications: [],

  achievements: [],

};

const cn = (...classes) => classes.filter(Boolean).join(" ");

export default function StudentDashboard() {

  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState("overview");

  const [studentProfile, setStudentProfile] = useState(null);

  const [resume, setResume] = useState(EMPTY_RESUME);

  const [loading, setLoading] = useState(true);

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");

  const [skillInput, setSkillInput] = useState("");

  const [savingSkills, setSavingSkills] = useState(false);

  const [githubInput, setGithubInput] = useState("");

  const [verifyingGithub, setVerifyingGithub] = useState(false);

  const [jobs, setJobs] = useState([]);

  const [jobsLoading, setJobsLoading] = useState(false);

  const [jobsError, setJobsError] = useState("");

  const [jobQuery, setJobQuery] = useState("");

  const [jobPage, setJobPage] = useState(1);

  const [savingResume, setSavingResume] = useState(false);

  const [uploadingResume, setUploadingResume] = useState(false);

  const [extractedText, setExtractedText] = useState("");

  const skills = studentProfile?.skills || [];

  // ATS resume only: normalize skills from the student profile without
  // changing the existing skills logic used by the rest of the dashboard.
  const resumeSkillsSource =
    studentProfile?.skills ??
    studentProfile?.studentSkills ??
    studentProfile?.skillProfile?.skills ??
    [];

  const resumeSkills = Array.isArray(resumeSkillsSource)
    ? resumeSkillsSource
        .map((skill) => {
          if (typeof skill === "string") {
            return { name: skill.trim() };
          }

          if (!skill || typeof skill !== "object") return null;

          return {
            ...skill,
            name: String(
              skill.name ??
                skill.skillName ??
                skill.skill ??
                skill.technology ??
                ""
            ).trim(),
          };
        })
        .filter((skill) => skill?.name)
    : [];

  const loadProfiles = useCallback(async () => {

    setLoading(true);

    setError("");

    try {

      const [studentResponse, resumeResponse] = await Promise.all([

        api.get("/student/profile"),

        api.get("/resume/profile"),

      ]);

      const student = studentResponse.data.profile || null;

      const savedResume = resumeResponse.data.profile || {};

      setStudentProfile(student);

      setGithubInput(student?.githubUsername || "");

      setResume({

        ...EMPTY_RESUME,

        ...savedResume,

      });

    } catch (err) {

      setError(

        err.response?.data?.message ||

          "Unable to load your dashboard. Check your session and backend."

      );

    } finally {

      setLoading(false);

    }

  }, []);

  useEffect(() => {

    loadProfiles();

  }, [loadProfiles]);

  const averageSkillScore = useMemo(() => {

    if (!skills.length) return 0;

    return Math.round(

      skills.reduce(

        (total, skill) => total + (Number(skill.score) || 0),

        0

      ) / skills.length

    );

  }, [skills]);

  const profileCompletion = useMemo(() => {

    const checks = [

      Boolean(user?.name),

      Boolean(user?.email),

      skills.length > 0,

      Boolean(studentProfile?.githubVerifiedAt),

      Boolean(resume.fullName),

      Boolean(resume.summary),

      (resume.projects || []).length > 0,

      Boolean(resume.linkedinUrl),

    ];

    return Math.round(

      (checks.filter(Boolean).length / checks.length) * 100

    );

  }, [user, skills, studentProfile, resume]);

  function showMessage(text, type = "success") {

    setMessage(text);

    setError(type === "error" ? text : "");

  }

  // ---------------- Skills ----------------

  async function saveSkills(nextSkills) {

    setSavingSkills(true);

    setMessage("");

    setError("");

    try {

      const response = await api.put("/student/skills", {

        skills: nextSkills,

      });

      if (response.data.profile) {

        setStudentProfile(response.data.profile);

      } else {

        await loadProfiles();

      }

      showMessage("Your skills have been saved.");

    } catch (err) {

      showMessage(

        err.response?.data?.message || "Unable to save skills.",

        "error"

      );

    } finally {

      setSavingSkills(false);

    }

  }

  async function addSkill(event) {

    event.preventDefault();

    const name = skillInput.trim();

    if (!name) return;

    if (

      skills.some(

        (skill) => skill.name.toLowerCase() === name.toLowerCase()

      )

    ) {

      showMessage("This skill already exists.", "error");

      return;

    }

    if (skills.length >= 20) {

      showMessage("You can add up to 20 skills.", "error");

      return;

    }

    await saveSkills([...skills.map((skill) => skill.name), name]);

    setSkillInput("");

  }

  async function removeSkill(skillName) {

    await saveSkills(

      skills

        .filter((skill) => skill.name !== skillName)

        .map((skill) => skill.name)

    );

  }

  // ---------------- GitHub ----------------

  async function verifyGithub(event) {

    event.preventDefault();

    if (!githubInput.trim()) {

      showMessage("Enter a GitHub username or profile URL.", "error");

      return;

    }

    if (!skills.length) {

      showMessage("Add your skills before verifying GitHub.", "error");

      setActiveTab("skills");

      return;

    }

    setVerifyingGithub(true);

    setMessage("");

    setError("");

    try {

      const { data } = await api.post("/student/github/verify", {

        username: githubInput.trim(),

      });

      if (data.profile) {

        setStudentProfile(data.profile);

      } else {

        await loadProfiles();

      }

      showMessage("GitHub verification completed.");

    } catch (err) {

      showMessage(

        err.response?.data?.message || "GitHub verification failed.",

        "error"

      );

    } finally {

      setVerifyingGithub(false);

    }

  }

  // ---------------- Job Matching ----------------

  
  // ---------------- Job Matching ----------------

  const normalizeSkill = (value = "") =>
    String(value)
      .toLowerCase()
      .replace(/\.js\b/g, "js")
      .replace(/[^a-z0-9+#.]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const getJobMatch = (job, studentSkills) => {
    const userSkills = studentSkills
      .map((skill) => ({
        name: typeof skill === "string" ? skill : skill.name,
        score:
          typeof skill === "string"
            ? 0
            : Number(skill.score) || 0,
        evidenceCount:
          typeof skill === "string"
            ? 0
            : Number(skill.evidenceCount) || 0,
      }))
      .filter((skill) => skill.name);

    const requiredSkills = [
      ...(Array.isArray(job.requiredSkills)
        ? job.requiredSkills
        : []),
      ...(Array.isArray(job.tags) ? job.tags : []),
    ]
      .map((skill) =>
        typeof skill === "string"
          ? skill
          : skill?.name || ""
      )
      .filter(Boolean);

    const uniqueRequired = [
      ...new Map(
        requiredSkills.map((skill) => [
          normalizeSkill(skill),
          skill,
        ])
      ).values(),
    ];

    const searchableText = normalizeSkill(
      [
        job.title,
        job.description,
        job.company,
        ...(job.tags || []),
        ...(job.requiredSkills || []),
      ]
        .map((item) =>
          typeof item === "string" ? item : item?.name || ""
        )
        .join(" ")
    );

    // Match the student's skills against explicit job requirements
    // first. If no requirements exist, use the job's text and tags.
    const matchedSkills = userSkills
      .filter((skill) => {
        const normalized = normalizeSkill(skill.name);

        if (uniqueRequired.length > 0) {
          return uniqueRequired.some(
            (required) =>
              normalizeSkill(required) === normalized
          );
        }

        return (
          normalized.length > 0 &&
          searchableText.includes(normalized)
        );
      })
      .map((skill) => skill.name);

    const matchedSet = new Set(
      matchedSkills.map(normalizeSkill)
    );

    const missingSkills = uniqueRequired.filter(
      (skill) => !matchedSet.has(normalizeSkill(skill))
    );

    let matchScore = 0;

    if (uniqueRequired.length > 0) {
      // Score the job against its explicit requirements.
      matchScore = Math.round(
        ((uniqueRequired.length - missingSkills.length) /
          uniqueRequired.length) *
          100
      );
    } else if (userSkills.length > 0) {
      // When requirements are absent, use skill coverage in the
      // available job text instead.
      matchScore = Math.round(
        (matchedSkills.length / userSkills.length) * 100
      );
    }

    // Skill evidence is supporting context, not a replacement
    // for the actual skill match.
    const evidenceStrength =
      matchedSkills.length === 0
        ? 0
        : Math.round(
            (userSkills
              .filter((skill) =>
                matchedSet.has(normalizeSkill(skill.name))
              )
              .reduce(
                (sum, skill) =>
                  sum +
                  (skill.evidenceCount > 0 ? 1 : 0),
                0
              ) /
              matchedSkills.length) *
              100
          );

    return {
      matchScore,
      matchedSkills,
      missingSkills,
      evidenceStrength,
      explanation:
        matchedSkills.length > 0
          ? `Your profile matches ${matchedSkills.length} skill(s) for this job.`
          : "No matching skills were detected in the available job information.",
    };
  };

  const loadJobs = useCallback(
    async (page = 1) => {
      setJobsLoading(true);
      setJobsError("");

      try {
        // Fetch recent jobs from the backend.
        const { data } = await api.get("/jobs/recent", {
          params: { limit: 100 },
        });

        const receivedJobs = Array.isArray(data.jobs)
          ? data.jobs
          : Array.isArray(data.data)
            ? data.data
            : [];

        // The student profile is loaded from /student/profile.
        // Recalculate matches using the current student's skills.
        const studentSkills = studentProfile?.skills || [];

        const rankedJobs = receivedJobs
          .filter((job) => job && job.active !== false)
          .map((job) => ({
            job,
            match: getJobMatch(job, studentSkills),
          }))
          .sort(
            (a, b) =>
              b.match.matchScore - a.match.matchScore ||
              new Date(b.job.postedAt || 0).getTime() -
                new Date(a.job.postedAt || 0).getTime()
          );

        setJobs(rankedJobs);
        setJobPage(page);
      } catch (err) {
        console.error("Failed to load matching jobs:", err);

        setJobsError(
          err.response?.data?.message ||
            "Unable to fetch recent jobs. Please try again."
        );
      } finally {
        setJobsLoading(false);
      }
    },
    [studentProfile?.skills]
  );

  useEffect(() => {
    if (
      activeTab === "jobs" &&
      studentProfile &&
      jobs.length === 0 &&
      !jobsLoading &&
      !jobsError
    ) {
      loadJobs(1);
    }
  }, [
    activeTab,
    studentProfile,
    jobs.length,
    jobsLoading,
    jobsError,
    loadJobs,
  ]);

  const filteredJobs = useMemo(() => {
    const query = jobQuery.toLowerCase().trim();

    if (!query) return jobs;

    return jobs.filter(({ job, match }) =>
      [
        job.title,
        job.company,
        job.location,
        job.description,
        ...(job.tags || []),
        ...(job.requiredSkills || []),
        ...(match.matchedSkills || []),
      ]
        .map((item) =>
          typeof item === "string" ? item : item?.name || ""
        )
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [jobs, jobQuery]);

  // Client-side pagination for the fetched and ranked jobs.
  const JOBS_PER_PAGE = 10;
  const totalJobPages = Math.ceil(
    filteredJobs.length / JOBS_PER_PAGE
  );
  const safeJobPage = Math.min(
    jobPage,
    Math.max(1, totalJobPages)
  );

  const paginatedJobs = filteredJobs.slice(
    (safeJobPage - 1) * JOBS_PER_PAGE,
    safeJobPage * JOBS_PER_PAGE
  );
  // ---------------- Resume ----------------

  function updateResume(field, value) {

    setResume((current) => ({

      ...current,

      [field]: value,

    }));

  }

  function updateListItem(field, index, key, value) {

    setResume((current) => ({

      ...current,

      [field]: current[field].map((item, itemIndex) =>

        itemIndex === index ? { ...item, [key]: value } : item

      ),

    }));

  }

  function addListItem(field, item) {

    setResume((current) => ({

      ...current,

      [field]: [...(current[field] || []), item],

    }));

  }

  function removeListItem(field, index) {

    setResume((current) => ({

      ...current,

      [field]: current[field].filter(

        (_, itemIndex) => itemIndex !== index

      ),

    }));

  }

  async function saveResume() {

    setSavingResume(true);

    setMessage("");

    setError("");

    try {

    const email = (resume.email || user?.email || "").trim();

if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  showMessage(
    "Please enter a valid email in Personal details before saving.",
    "error"
  );
  return;
}

const { data } = await api.put("/resume/profile", {
  ...resume,
  email,
});

      setResume({

        ...EMPTY_RESUME,

        ...data.profile,

      });

      showMessage("Resume saved successfully.");

    } catch (err) {

      showMessage(

        err.response?.data?.message || "Unable to save resume.",

        "error"

      );

    } finally {

      setSavingResume(false);

    }

  }

  async function uploadResume(event) {

    const file = event.target.files?.[0];

    if (!file) return;
    const allowedExtensions = /\.(pdf|docx)$/i;

    if (!allowedExtensions.test(file.name)) {

      showMessage("Upload a PDF or DOCX file.", "error");

      event.target.value = "";

      return;

    }

    if (file.size > 5 * 1024 * 1024) {

      showMessage("Resume must be 5 MB or smaller.", "error");

      event.target.value = "";

      return;

    }

    const formData = new FormData();

    formData.append("resume", file);

    setUploadingResume(true);

    setMessage("");

    setError("");

    try {

      const { data } = await api.post("/resume/upload", formData);

      setExtractedText(data.extractedText || "");

      showMessage(

        "Resume imported. Review the extracted text and enter the details below."

      );

    } catch (err) {

      showMessage(

        err.response?.data?.message || "Unable to import this resume.",

        "error"

      );

    } finally {

      setUploadingResume(false);

      event.target.value = "";

    }

  }

  function printResume() {

    window.print();

  }

  if (loading) {

    return (

      <div className="flex min-h-screen items-center justify-center bg-[#09090f] text-slate-300">

        <LoaderCircle className="mr-3 animate-spin" />

        Loading your verifhire dashboard...

      </div>

    );

  }

  return (

    <main className="min-h-screen bg-[#09090f] text-white">

      <Header/>

      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">

        {/* Dashboard heading */}

        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">

          <div>

            <div className="mb-2 flex items-center gap-2 text-sm text-violet-300">

              <ShieldCheck size={17} />

              verifhire Student Workspace

            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">

              Welcome back, {user?.name || "Student"}

            </h1>

            <p className="mt-2 text-sm text-slate-400">

              Prove your skills, find relevant jobs, and build your career.

            </p>

          </div>

          <button

            onClick={loadProfiles}

            className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm hover:bg-white/5"

          >

            <RefreshCw size={16} />

            Refresh profile

          </button>

        </header>

        {/* Global messages */}

        {(message || error) && (

          <div

            className={cn(

              "mb-6 flex items-start gap-3 rounded-xl border p-4 text-sm",

              error

                ? "border-red-500/20 bg-red-500/10 text-red-300"

                : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"

            )}

          >

            {error ? (

              <CircleAlert size={18} className="shrink-0" />

            ) : (

              <CheckCircle2 size={18} className="shrink-0" />

            )}

            <span className="flex-1">{message || error}</span>

            <button

              onClick={() => {

                setMessage("");

                setError("");

              }}

              aria-label="Dismiss message"

            >

              <X size={16} />

            </button>

          </div>

        )}

        {/* Dashboard navigation */}

        <nav className="mb-8 flex gap-2 overflow-x-auto border-b border-white/10 pb-3">

          {TABS.map(({ id, label, icon: Icon }) => (

            <button

              key={id}

              onClick={() => {

                setActiveTab(id);

                setMessage("");

                setError("");

              }}

              className={cn(

                "flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm transition",

                activeTab === id

                  ? "bg-violet-600 text-white"

                  : "text-slate-400 hover:bg-white/5 hover:text-white"

              )}

            >

              <Icon size={17} />

              {label}

            </button>

          ))}

        </nav>

        {/* OVERVIEW */}

        {activeTab === "overview" && (

          <div className="space-y-6">

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

              <StatCard

                icon={UserRound}

                label="Profile completion"

                value={`${profileCompletion}%`}

                hint="Complete your career profile"

              />

              <StatCard

                icon={ShieldCheck}

                label="Skills listed"

                value={skills.length}

                hint="Manage your technical skills"

              />

              <StatCard

                icon={BadgeCheck}

                label="Average skill score"

                value={`${averageSkillScore}/100`}

                hint="Based on saved skill scores"

              />

              <StatCard

                icon={FolderGit2}

                label="Public repositories"

                value={studentProfile?.githubSummary?.publicRepos ?? 0}

                hint="From your GitHub verification"

              />

            </div>

            <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">

              <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

                <div className="flex items-center justify-between gap-3">

                  <div>

                    <h2 className="text-xl font-semibold">

                      Your career readiness

                    </h2>

                    <p className="mt-1 text-sm text-slate-400">

                      Complete these steps to strengthen your profile.

                    </p>

                  </div>

                  <GraduationCap

                    className="text-violet-300"

                    size={28}

                  />

                </div>

                <div className="mt-6 space-y-5">

                  <ChecklistItem

                    done={skills.length > 0}

                    title="Add your technical skills"

                    description="List the technologies you actually know."

                    onClick={() => setActiveTab("skills")}

                  />

                  <ChecklistItem

                    done={Boolean(studentProfile?.githubVerifiedAt)}

                    title="Verify GitHub evidence"

                    description="Connect your public work to your skills."

                    onClick={() => setActiveTab("evidence")}

                  />

                  <ChecklistItem

                    done={Boolean(resume.fullName && resume.summary)}

                    title="Complete your resume"

                    description="Prepare a structured, ATS-friendly resume."

                    onClick={() => setActiveTab("resume")}

                  />

                  <ChecklistItem

                    done={Boolean(resume.linkedinUrl)}

                    title="Add your LinkedIn profile"

                    description="Save your professional profile URL."

                    onClick={() => setActiveTab("evidence")}

                  />

                  <ChecklistItem

                    done={jobs.length > 0}

                    title="Explore matching jobs"

                    description="Discover opportunities aligned with your skills."

                    onClick={() => setActiveTab("jobs")}

                  />

                </div>

              </section>

              <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

                <h2 className="text-xl font-semibold">Quick actions</h2>

                <p className="mt-1 text-sm text-slate-400">

                  Continue improving your profile.

                </p>

                <div className="mt-5 space-y-3">

                  <QuickAction

                    icon={Activity}

                    title="Manage skills"

                    description="Add or remove technologies"

                    onClick={() => setActiveTab("skills")}

                  />

                  <QuickAction

                    icon={BriefcaseBusiness}

                    title="Find matching jobs"

                    description="View ranked job recommendations"

                    onClick={() => setActiveTab("jobs")}

                  />

                  <QuickAction

                    icon={FileText}

                    title="Build your resume"

                    description="Edit, save, and export your resume"

                    onClick={() => setActiveTab("resume")}

                  />

                </div>

              </section>

            </div>

            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

              <div className="mb-5 flex items-center justify-between">

                <div>

                  <h2 className="text-xl font-semibold">Your skills</h2>

                  <p className="mt-1 text-sm text-slate-400">

                    Saved skill scores and evidence counts.

                  </p>

                </div>

                <button

                  onClick={() => setActiveTab("skills")}

                  className="text-sm text-violet-300"

                >

                  Manage skills <ChevronRight className="inline" size={15} />

                </button>

              </div>

              {skills.length ? (

                <div className="grid gap-4 md:grid-cols-2">

                  {skills.slice(0, 8).map((skill) => (

                    <SkillBar key={skill.name} skill={skill} />

                  ))}

                </div>

              ) : (

                <EmptyState

                  title="No skills added yet"

                  description="Add your technical skills to start building your profile."

                  action="Add skills"

                  onClick={() => setActiveTab("skills")}

                />

              )}

            </section>

          </div>

        )}

        {/* SKILLS */}

        {activeTab === "skills" && (

          <div className="space-y-6">

            <SectionHeading

              title="My technical skills"

              description="List your skills and use GitHub evidence to evaluate your profile."

            />

            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

              <form

                onSubmit={addSkill}

                className="flex flex-col gap-3 sm:flex-row"

              >

                <input

                  value={skillInput}

                  onChange={(event) => setSkillInput(event.target.value)}

                  placeholder="Example: Node.js, React, MongoDB"

                  maxLength={60}

                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none focus:border-violet-500"

                />

                <button

                  disabled={savingSkills || !skillInput.trim()}

                  className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 font-medium disabled:opacity-40"

                >

                  {savingSkills ? (

                    <LoaderCircle className="animate-spin" size={17} />

                  ) : (

                    <Plus size={17} />

                  )}

                  Add skill

                </button>

              </form>

              <p className="mt-3 text-xs text-slate-500">

                You can save up to 20 skills. Scores are not proof by

                themselves; review the evidence attached to each skill.

              </p>

            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

              <h2 className="mb-5 text-lg font-semibold">

                Saved skills ({skills.length})

              </h2>

              {skills.length ? (

                <div className="space-y-5">

                  {skills.map((skill) => (

                    <div

                      key={skill.name}

                      className="flex items-start gap-4"

                    >

                      <div className="min-w-0 flex-1">

                        <SkillBar skill={skill} />

                        <p className="mt-2 text-xs text-slate-500">

                          {skill.evidenceCount || 0} evidence item(s)

                        </p>

                      </div>

                      <button

                        onClick={() => removeSkill(skill.name)}

                        disabled={savingSkills}

                        aria-label={`Remove ${skill.name}`}

                        className="rounded-lg p-2 text-slate-500 hover:bg-red-500/10 hover:text-red-300"

                      >

                        <Trash2 size={17} />

                      </button>

                    </div>

                  ))}

                </div>

              ) : (

                <EmptyState

                  title="Start with your real skills"

                  description="Add a technology you have used in a project or assessment."

                />

              )}

            </section>

          </div>

        )}

        {/* SKILL ASSESSMENT */}

        {activeTab === "assessment" && (
          <div className="space-y-6">
            <SectionHeading
              title="Skill assessment"
              description="Take a server-evaluated assessment and update your skill score with test evidence."
            />
            <StudentSkillAssessment
              skills={studentProfile?.skills || []}
              onCompleted={(updatedProfile) => {
                if (updatedProfile) setStudentProfile(updatedProfile);
                else loadProfiles();
              }}
            />
          </div>
        )}

        {/* JOB MATCHING */}

        {activeTab === "jobs" && (

          <div className="space-y-6">

            <SectionHeading

              title="Job matching"

              description="Discover listings ranked against your current skill profile."

              action={

                <button

                  onClick={() => loadJobs(jobPage)}

                  disabled={jobsLoading}

                  className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm hover:bg-white/5"

                >

                  <RefreshCw size={16} />

                  Refresh jobs

                </button>

              }

            />

            <div className="relative">

              <Search

                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"

                size={18}

              />

              <input

                value={jobQuery}

                onChange={(event) => setJobQuery(event.target.value)}

                placeholder="Search jobs, companies, locations or tags"

                className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-3 pl-11 pr-4 outline-none focus:border-violet-500"

              />

            </div>

            {jobsLoading && (

              <div className="flex items-center gap-3 py-8 text-slate-400">

                <LoaderCircle className="animate-spin" />

                Fetching jobs and calculating matches...

              </div>

            )}

            {jobsError && (

              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-300">

                {jobsError}

                <button

                  onClick={() => loadJobs(jobPage)}

                  className="ml-3 underline"

                >

                  Retry

                </button>

              </div>

            )}

            {!jobsLoading && !jobsError && !filteredJobs.length && (

              <EmptyState

                title="No matching jobs found"

                description={

                  !jobs.length

                    ? "Check the backend job API and add skills to your profile."

                    : "Try another search term."

                }

                action="Refresh jobs"

                onClick={() => loadJobs(jobPage)}

              />

            )}

            <div className="grid gap-5 xl:grid-cols-2">

              {filteredJobs.map(({ job, match }) => (

                <article

                  key={job.externalId || job.applyUrl}

                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"

                >

                  <div className="flex items-start justify-between gap-3">

                    <div>

                      <h3 className="text-lg font-semibold">{job.title}</h3>

                      <p className="mt-1 text-sm text-slate-400">

                        {job.company}

                      </p>

                    </div>

                    <div className="shrink-0 text-right">

                      <span className="text-2xl font-bold text-emerald-400">

                        {match.matchScore}%

                      </span>

                      <p className="text-xs text-slate-500">Skill alignment</p>

                    </div>

                  </div>

                  <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-400">

                    <span>{job.location}</span>

                    {job.remote && <span>Remote</span>}

                    <span>{job.source}</span>

                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">

                    <div

                      className="h-full rounded-full bg-emerald-400"

                      style={{

                        width: `${Math.min(100, Math.max(0, match.matchScore))}%`,

                      }}

                    />

                  </div>

                  <p className="mt-4 text-sm font-medium">Matching skills</p>

                  <div className="mt-2 flex flex-wrap gap-2">

                    {(match.matchedSkills || []).length ? (

                      match.matchedSkills.map((skill) => (

                        <Tag key={skill} color="green">{skill}</Tag>

                      ))

                    ) : (

                      <span className="text-sm text-slate-500">

                        No matching skills detected

                      </span>

                    )}

                  </div>

                  <p className="mt-4 text-sm font-medium">Skills to develop</p>

                  <div className="mt-2 flex flex-wrap gap-2">

                    {(match.missingSkills || []).length ? (

                      match.missingSkills.map((skill) => (

                        <Tag key={skill} color="amber">{skill}</Tag>

                      ))

                    ) : (

                      <span className="text-sm text-slate-400">

                        No missing skills detected from analyzed terms

                      </span>

                    )}

                  </div>

                  <p className="mt-4 text-xs leading-5 text-slate-400">

                    {match.explanation ||

                      "Estimated alignment based on detected job skills."}

                    {" "}This is not a hiring probability.

                  </p>

                  <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">

                    <span className="text-xs text-slate-500">

                      External listing

                    </span>

                    {job.applyUrl && (

                      <a

                        href={job.applyUrl}

                        target="_blank"

                        rel="noopener noreferrer"

                        className="flex items-center gap-2 text-sm text-violet-300 hover:text-violet-200"

                      >

                        View job <ExternalLink size={15} />

                      </a>

                    )}

                  </div>

                </article>

              ))}

            </div>

            <div className="flex justify-end">

              <button

                disabled={jobsLoading || jobPage >= 100}

                onClick={() => loadJobs(jobPage + 1)}

                className="rounded-xl border border-white/10 px-5 py-3 disabled:opacity-40"

              >

                Next page

              </button>

            </div>

          </div>

        )}

        {/* SKILL EVIDENCE */}

        {activeTab === "evidence" && (

          <div className="space-y-6">

            <SectionHeading

              title="Skill evidence"

              description="Connect your GitHub work and manage your professional profile information."

            />

            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

              <div className="flex items-center gap-3">

                <FaGithub size={27} />

                <div>

                  <h2 className="font-semibold">GitHub verification</h2>

                  <p className="text-sm text-slate-400">

                    Analyze accessible public repositories for evidence.

                  </p>

                </div>

              </div>

              <form

                onSubmit={verifyGithub}

                className="mt-5 flex flex-col gap-3 sm:flex-row"

              >

                <input

                  value={githubInput}

                  onChange={(event) => setGithubInput(event.target.value)}

                  placeholder="GitHub username or profile URL"

                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none focus:border-violet-500"

                />

                <button

                  disabled={verifyingGithub || !githubInput.trim() || !skills.length}

                  className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 disabled:opacity-40"

                >

                  {verifyingGithub ? (

                    <LoaderCircle className="animate-spin" size={17} />

                  ) : (

                    <RefreshCw size={17} />

                  )}

                  Verify GitHub

                </button>

              </form>

              {!skills.length && (

                <p className="mt-3 text-sm text-amber-300">

                  Add at least one skill before verifying GitHub.

                </p>

              )}

              {studentProfile?.githubVerifiedAt && (

                <p className="mt-4 flex items-center gap-2 text-sm text-emerald-300">

                  <BadgeCheck size={17} />

                  GitHub verification completed

                </p>

              )}

              <div className="mt-6 grid gap-3 sm:grid-cols-3">

                <StatCard

                  label="Public repositories"

                  value={studentProfile?.githubSummary?.publicRepos ?? 0}

                  icon={FolderGit2}

                />

                <StatCard

                  label="Repository stars"

                  value={studentProfile?.githubSummary?.totalStars ?? 0}

                  icon={Activity}

                />

                <StatCard

                  label="Overall evidence score"

                  value={`${studentProfile?.githubSummary?.overallEvidenceScore ?? 0}/100`}

                  icon={ShieldCheck}

                />

              </div>

              {studentProfile?.githubUrl && (

                <a

                  href={studentProfile.githubUrl}

                  target="_blank"

                  rel="noopener noreferrer"

                  className="mt-5 inline-flex items-center gap-2 text-sm text-violet-300"

                >

                  View GitHub profile <ArrowUpRight size={15} />

                </a>

              )}

            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

              <div className="flex items-center gap-3">

                <FaLinkedin size={27} />

                <div>

                  <h2 className="font-semibold">LinkedIn profile</h2>

                  <p className="text-sm text-slate-400">

                    Save profile information for your resume.

                  </p>

                </div>

              </div>

              <div className="mt-5 space-y-4">

                <Field

                  label="LinkedIn profile URL"

                  value={resume.linkedinUrl}

                  onChange={(value) => updateResume("linkedinUrl", value)}

                  placeholder="https\://www.linkedin.com/in/your-profile"

                />

                <Field

                  label="LinkedIn notes"

                  value={resume.linkedinNotes || ""}

                  onChange={(value) => updateResume("linkedinNotes", value)}

                  multiline

                  placeholder="Add reviewed information from your profile, experience or certifications."

                />

                <button

                  onClick={saveResume}

                  disabled={savingResume}

                  className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 hover:bg-white/5 disabled:opacity-40"

                >

                  <Save size={16} />

                  Save LinkedIn details

                </button>

                <p className="text-xs leading-5 text-slate-500">

                  Saving a URL or notes does not verify the claims. Automatic

                  LinkedIn data import requires approved API access and permissions.

                </p>

              </div>

            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

              <h2 className="text-lg font-semibold">Evidence by skill</h2>

              <div className="mt-5 space-y-5">

                {skills.map((skill) => (

                  <div key={skill.name}>

                    <SkillBar skill={skill} />

                    <p className="mt-2 text-xs text-slate-500">

                      {skill.evidenceCount || 0} evidence item(s)

                    </p>

                    {(skill.evidence || []).map((item, index) => {

                      const label =

                        typeof item === "string"

                          ? item

                          : item.description || item.url || "Evidence recorded";

                      return (

                        <p

                          key={index}

                          className="mt-1 break-words text-xs text-slate-400"

                        >

                          {label}

                        </p>

                      );

                    })}

                  </div>

                ))}

                {!skills.length && (

                  <p className="text-sm text-slate-400">

                    Add skills to start building your evidence profile.

                  </p>

                )}

              </div>

              {(studentProfile?.githubSummary?.repositories || []).length > 0 && (

                <div className="mt-6 border-t border-white/10 pt-5">

                  <h3 className="mb-3 font-medium">Analyzed repositories</h3>

                  <div className="space-y-3">

                    {studentProfile.githubSummary.repositories.map(

                      (repo, index) => (

                        <div

                          key={repo.url || repo.name || index}

                          className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] p-3"

                        >

                          <div className="min-w-0">

                            <p className="truncate text-sm font-medium">

                              {repo.name || "Repository"}

                            </p>

                            <p className="text-xs text-slate-500">

                              {repo.language || "Language not specified"}

                            </p>

                          </div>

                          {repo.url && (

                            <a

                              href={repo.url}

                              target="_blank"

                              rel="noopener noreferrer"

                              className="shrink-0 text-violet-300"

                              aria-label={`Open ${repo.name}`}

                            >

                              <ExternalLink size={16} />

                            </a>

                          )}

                        </div>

                      )

                    )}

                  </div>

                </div>

              )}

            </section>

          </div>

        )}

        {/* RESUME BUILDER */}

        {activeTab === "resume" && (

          <div className="space-y-6">

            <SectionHeading

              title="ATS resume builder"

              description="Import a resume, review the extracted text, edit structured details, and export a clean resume."

              action={

                <div className="flex flex-wrap gap-2">

                  <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm hover:bg-white/5">

                    <FileText size={16} />

                    {uploadingResume ? "Importing..." : "Import PDF/DOCX"}

                    <input

                      type="file"

                      accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"

                      onChange={uploadResume}

                      disabled={uploadingResume}

                      className="hidden"

                    />

                  </label>

                  <button

                    onClick={saveResume}

                    disabled={savingResume}

                    className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm disabled:opacity-40"

                  >

                    <Save size={16} />

                    Save

                  </button>

                  <button

                    onClick={printResume}

                    className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm"

                  >

                    <Download size={16} />

                    Export PDF

                  </button>

                </div>

              }

            />

            {extractedText && (

              <details className="rounded-xl border border-white/10 p-4">

                <summary className="cursor-pointer text-sm font-medium">

                  Review extracted resume text

                </summary>

                <textarea

                  value={extractedText}

                  readOnly

                  rows={8}

                  className="mt-4 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-slate-300"

                />

                <p className="mt-2 text-xs text-slate-500">

                  The parser extracts text; it does not automatically map every

                  detail to the structured fields below.

                </p>

              </details>

            )}

            <div className="grid gap-6 2xl:grid-cols-2">

              <div className="space-y-5 print:hidden">

                <EditorCard title="Personal details">

                  <div className="grid gap-3 sm:grid-cols-2">

                    <Field label="Full name" value={resume.fullName} onChange={(v) => updateResume("fullName", v)} />

                    <Field label="Email" value={resume.email} onChange={(v) => updateResume("email", v)} />

                    <Field label="Phone" value={resume.phone} onChange={(v) => updateResume("phone", v)} />

                    <Field label="Location" value={resume.location} onChange={(v) => updateResume("location", v)} />

                    <Field label="LinkedIn URL" value={resume.linkedinUrl} onChange={(v) => updateResume("linkedinUrl", v)} />

                    <Field label="GitHub URL" value={resume.githubUrl} onChange={(v) => updateResume("githubUrl", v)} />

                    <Field label="Portfolio URL" value={resume.portfolioUrl} onChange={(v) => updateResume("portfolioUrl", v)} />

                  </div>

                  <Field

                    label="Professional summary"

                    value={resume.summary}

                    onChange={(v) => updateResume("summary", v)}

                    multiline

                  />

                </EditorCard>

                {/* ATS-only addition: show the skills already gathered in the student profile. */}
                <EditorCard title="Skills from your profile">
                  <p className="mb-3 text-xs text-slate-500">
                    These skills come from your saved student profile and are included in the resume preview and exported PDF. To change them, use the My Skills section.
                  </p>

                  {resumeSkills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {resumeSkills.map((skill, index) => {
                        const scoreValue = skill.score;
                        const hasScore =
                          scoreValue !== null &&
                          scoreValue !== undefined &&
                          scoreValue !== "" &&
                          Number.isFinite(Number(scoreValue));

                        return (
                          <span
                            key={skill._id || skill.name || index}
                            className="rounded-lg border border-violet-400/20 bg-violet-500/10 px-3 py-2 text-sm"
                          >
                            {skill.name}
                            {hasScore ? ` (${Math.round(Number(scoreValue))}%)` : ""}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-amber-400">
                      No skills were returned by the student profile API. Check the response from GET /student/profile.
                    </p>
                  )}
                </EditorCard>

                <EditorCard

                  title="Education"

                  action={

                    <AddButton

                      onClick={() =>

                        addListItem("education", {

                          degree: "",

                          institution: "",

                          startYear: "",

                          endYear: "",

                          grade: "",

                        })

                      }

                    />

                  }

                >

                  {(resume.education || []).map((item, index) => (

                    <RepeatableItem

                      key={index}

                      onRemove={() => removeListItem("education", index)}

                    >

                      <Field label="Degree" value={item.degree || ""} onChange={(v) => updateListItem("education", index, "degree", v)} />

                      <Field label="Institution" value={item.institution || ""} onChange={(v) => updateListItem("education", index, "institution", v)} />

                      <div className="grid grid-cols-2 gap-3">

                        <Field label="Start year" value={item.startYear || ""} onChange={(v) => updateListItem("education", index, "startYear", v)} />

                        <Field label="End year" value={item.endYear || ""} onChange={(v) => updateListItem("education", index, "endYear", v)} />

                      </div>

                      <Field label="Grade" value={item.grade || ""} onChange={(v) => updateListItem("education", index, "grade", v)} />

                    </RepeatableItem>

                  ))}

                </EditorCard>

                <EditorCard

                  title="Experience"

                  action={

                    <AddButton

                      onClick={() =>

                        addListItem("experience", {

                          role: "",

                          company: "",

                          startDate: "",

                          endDate: "",

                          description: "",

                        })

                      }

                    />

                  }

                >

                  {(resume.experience || []).map((item, index) => (

                    <RepeatableItem

                      key={index}

                      onRemove={() => removeListItem("experience", index)}

                    >

                      <Field label="Role" value={item.role || ""} onChange={(v) => updateListItem("experience", index, "role", v)} />

                      <Field label="Company" value={item.company || ""} onChange={(v) => updateListItem("experience", index, "company", v)} />

                      <div className="grid grid-cols-2 gap-3">

                        <Field label="Start date" value={item.startDate || ""} onChange={(v) => updateListItem("experience", index, "startDate", v)} />

                        <Field label="End date" value={item.endDate || ""} onChange={(v) => updateListItem("experience", index, "endDate", v)} />

                      </div>

                      <Field label="Responsibilities and achievements" value={item.description || ""} onChange={(v) => updateListItem("experience", index, "description", v)} multiline />

                    </RepeatableItem>

                  ))}

                </EditorCard>

                <EditorCard

                  title="Projects"

                  action={

                    <AddButton

                      onClick={() =>

                        addListItem("projects", {

                          name: "",

                          description: "",

                          technologies: [],

                          url: "",

                        })

                      }

                    />

                  }

                >

                  {(resume.projects || []).map((item, index) => (

                    <RepeatableItem

                      key={index}

                      onRemove={() => removeListItem("projects", index)}

                    >

                      <Field label="Project name" value={item.name || ""} onChange={(v) => updateListItem("projects", index, "name", v)} />

                      <Field label="Problem solved and contribution" value={item.description || ""} onChange={(v) => updateListItem("projects", index, "description", v)} multiline />

                      <Field

                        label="Technologies (comma-separated)"

                        value={(item.technologies || []).join(", ")}

                        onChange={(v) =>

                          updateListItem(

                            "projects",

                            index,

                            "technologies",

                            v.split(",").map((x) => x.trim()).filter(Boolean)

                          )

                        }

                      />

                      <Field label="Project URL" value={item.url || ""} onChange={(v) => updateListItem("projects", index, "url", v)} />

                    </RepeatableItem>

                  ))}

                </EditorCard>

                <EditorCard title="Certifications and achievements">

                  <Field

                    label="Certifications (one per line)"

                    value={(resume.certifications || []).join("\n")}

                    onChange={(v) => updateResume("certifications", v.split("\n").filter(Boolean))}

                    multiline

                  />

                  <Field

                    label="Achievements (one per line)"

                    value={(resume.achievements || []).join("\n")}

                    onChange={(v) => updateResume("achievements", v.split("\n").filter(Boolean))}

                    multiline

                  />

                </EditorCard>

              </div>

              <div className="min-w-0">

                <p className="mb-3 text-sm text-slate-400 print:hidden">

                  ATS-friendly resume preview

                </p>

                <article className="resume-paper mx-auto min-h-[900px] max-w-[800px] bg-white p-8 text-[13px] leading-relaxed text-black shadow-xl sm:p-10 print:min-h-0 print:max-w-none print:p-0 print:shadow-none">

                  <header className="border-b border-black pb-4">

                    <h1 className="text-3xl font-bold">

                      {resume.fullName || "Your Full Name"}

                    </h1>

                    <p className="mt-2 break-words">

                      {[resume.phone, resume.location]

                        .filter(Boolean)

                        .join(" | ")}

                    </p>

                    <p className="mt-1 break-words">

                      {[resume.linkedinUrl, resume.githubUrl, resume.portfolioUrl]

                        .filter(Boolean)

                        .join(" | ")}

                    </p>

                  </header>

                  <ResumeSection title="Professional Summary">

                    {resume.summary}

                  </ResumeSection>

                  {resumeSkills.length > 0 && (
                    <ResumeSection title="Technical Skills">
                      {resumeSkills.map((skill) => skill.name).join(", ")}
                    </ResumeSection>
                  )}

                  <ResumeSection title="Education">

                    {(resume.education || []).map((item, index) => (

                      <div key={index} className="mb-3">

                        <strong>{item.degree}</strong>

                        {item.institution && ` — ${item.institution}`}

                        <p>

                          {[item.startYear, item.endYear].filter(Boolean).join(" – ")}

                          {item.grade && ` | ${item.grade}`}

                        </p>

                      </div>

                    ))}

                  </ResumeSection>

                  <ResumeSection title="Experience">

                    {(resume.experience || []).map((item, index) => (

                      <div key={index} className="mb-3">

                        <strong>{item.role}</strong>

                        {item.company && ` — ${item.company}`}

                        <p>{[item.startDate, item.endDate].filter(Boolean).join(" – ")}</p>

                        <p className="whitespace-pre-line">{item.description}</p>

                      </div>

                    ))}

                  </ResumeSection>

                  <ResumeSection title="Projects">

                    {(resume.projects || []).map((item, index) => (

                      <div key={index} className="mb-3">

                        <strong>{item.name}</strong>

                        {item.url && <p className="break-words">{item.url}</p>}

                        <p className="whitespace-pre-line">{item.description}</p>

                        {(item.technologies || []).length > 0 && (

                          <p>

                            <strong>Technologies:</strong>{" "}

                            {item.technologies.join(", ")}

                          </p>

                        )}

                      </div>

                    ))}

                  </ResumeSection>

                  <ResumeSection title="Certifications">

                    {(resume.certifications || []).map((item, index) => (

                      <p key={index}>{item}</p>

                    ))}

                  </ResumeSection>

                  <ResumeSection title="Achievements">

                    {(resume.achievements || []).map((item, index) => (

                      <p key={index}>{item}</p>

                    ))}

                  </ResumeSection>

                </article>

              </div>

            </div>

          </div>

        )}

      </div>

      <style>{`

        @media print {

          @page {

            size: A4;

            margin: 16mm;

          }

          body {

            background: white !important;

          }

          body * {

            visibility: hidden;

          }

          .resume-paper,

          .resume-paper * {

            visibility: visible;

          }

          .resume-paper {

            position: absolute;

            left: 0;

            top: 0;

            width: 100%;

            color: black !important;

            background: white !important;

          }

        }

      `}</style>

    </main>

  );

}

// ---------------- Reusable UI components ----------------

function StatCard({ icon: Icon, label, value, hint }) {

  return (

    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">

      <div className="flex items-center justify-between">

        <span className="text-sm text-slate-400">{label}</span>

        <Icon className="text-violet-300" size={20} />

      </div>

      <p className="mt-4 text-3xl font-bold">{value}</p>

      {hint && <p className="mt-2 text-xs text-slate-500">{hint}</p>}

    </div>

  );

}

function SectionHeading({ title, description, action }) {

  return (

    <div className="flex flex-wrap items-center justify-between gap-4">

      <div>

        <h2 className="text-2xl font-bold">{title}</h2>

        <p className="mt-1 text-sm text-slate-400">{description}</p>

      </div>

      {action}

    </div>

  );

}


function SkillBar({ skill }) {
  // Prefer the saved overall score; fall back to the assessment
  // or GitHub score if the overall score is not available.
  const scoreFields = [
    skill.score,
    skill.assessmentScore,
    skill.githubScore,
    skill.githubEvidenceScore,
    skill.evidenceScore,
  ];

  const rawScore = scoreFields.find(
    (value) =>
      value !== null &&
      value !== undefined &&
      value !== "" &&
      Number.isFinite(Number(value))
  );

  const score =
    rawScore === undefined
      ? null
      : Math.round(Math.max(0, Math.min(100, Number(rawScore))));

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="truncate text-sm font-medium text-white">
          {skill.name}
        </span>

        <span className="shrink-0 text-sm font-semibold text-slate-300">
          {score === null ? "Not assessed" : `${score}%`}
        </span>
      </div>

      <div
        className="h-2 w-full overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-label={`${skill.name} skill score`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={score ?? 0}
      >
        <div
          className="h-full rounded-full bg-violet-500 transition-all duration-500"
          style={{ width: `${score ?? 0}%` }}
        />
      </div>
    </div>
  );
}


function ChecklistItem({ done, title, description, onClick }) {

  return (

    <button

      onClick={onClick}

      className="flex w-full items-start gap-3 rounded-xl text-left transition hover:bg-white/[0.03]"

    >

      {done ? (

        <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-400" size={20} />

      ) : (

        <CircleAlert className="mt-0.5 shrink-0 text-slate-500" size={20} />

      )}

      <span className="min-w-0 flex-1">

        <span className="block font-medium">{title}</span>

        <span className="mt-1 block text-sm text-slate-400">

          {description}

        </span>

      </span>

      <ChevronRight className="mt-1 shrink-0 text-slate-500" size={17} />

    </button>

  );

}

function QuickAction({ icon: Icon, title, description, onClick }) {

  return (

    <button

      onClick={onClick}

      className="flex w-full items-center gap-3 rounded-xl border border-white/10 p-4 text-left transition hover:border-violet-500/30 hover:bg-white/[0.03]"

    >

      <div className="rounded-lg bg-violet-500/10 p-2 text-violet-300">

        <Icon size={19} />

      </div>

      <div className="min-w-0 flex-1">

        <p className="font-medium">{title}</p>

        <p className="mt-1 text-xs text-slate-400">{description}</p>

      </div>

      <ChevronRight className="text-slate-500" size={17} />

    </button>

  );

}

function EmptyState({ title, description, action, onClick }) {

  return (

    <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">

      <FolderGit2 className="mx-auto mb-3 text-slate-500" size={30} />

      <h3 className="font-semibold">{title}</h3>

      <p className="mx-auto mt-2 max-w-lg text-sm text-slate-400">

        {description}

      </p>

      {action && onClick && (

        <button

          onClick={onClick}

          className="mt-4 rounded-xl bg-violet-600 px-4 py-2 text-sm"

        >

          {action}

        </button>

      )}

    </div>

  );

}

function Tag({ children, color = "green" }) {

  return (

    <span

      className={cn(

        "rounded-full px-3 py-1 text-xs",

        color === "green"

          ? "bg-emerald-500/10 text-emerald-300"

          : "bg-amber-500/10 text-amber-300"

      )}

    >

      {children}

    </span>

  );

}

function Field({

  label,

  value,

  onChange,

  placeholder = "",

  multiline = false,

}) {

  const className =

    "w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-violet-500";

  return (

    <label className="mb-3 block text-sm">

      <span className="mb-1 block text-slate-400">{label}</span>

      {multiline ? (

        <textarea

          value={value ?? ""}

          onChange={(event) => onChange(event.target.value)}

          placeholder={placeholder}

          rows={3}

          className={className}

        />

      ) : (

        <input

          value={value ?? ""}

          onChange={(event) => onChange(event.target.value)}

          placeholder={placeholder}

          className={className}

        />

      )}

    </label>

  );

}

function EditorCard({ title, action, children }) {

  return (

    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">

      <div className="mb-4 flex items-center justify-between gap-3">

        <h3 className="font-semibold">{title}</h3>

        {action}

      </div>

      {children}

    </section>

  );

}

function AddButton({ onClick }) {

  return (

    <button

      onClick={onClick}

      type="button"

      className="flex items-center gap-1 text-sm text-violet-300 hover:text-violet-200"

    >

      <Plus size={16} />

      Add

    </button>

  );

}

function RepeatableItem({ children, onRemove }) {

  return (

    <div className="mb-4 rounded-xl border border-white/10 p-3">

      {children}

      <button

        type="button"

        onClick={onRemove}

        className="flex items-center gap-1 text-xs text-red-300 hover:text-red-200"

      >

        <Trash2 size={14} />

        Remove

      </button>

    </div>

  );

}

function ResumeSection({ title, children }) {

  const hasContent = Array.isArray(children)

    ? children.some(Boolean)

    : Boolean(children);

  if (!hasContent) return null;

  return (

    <section className="mt-5">

      <h2 className="mb-2 border-b border-gray-300 pb-1 text-sm font-bold uppercase tracking-wide">

        {title}

      </h2>

      {children}

    </section>

  );

}
