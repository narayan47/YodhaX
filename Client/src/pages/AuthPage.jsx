
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaGithub } from "react-icons/fa";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  Eye,
  EyeOff,
  GraduationCap,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
  Users,
} from "lucide-react";

import api from "../api/axios";
import "../styles/auth.css";

const roles = [
  {
    value: "student",
    label: "Student",
    description: "Build your verified skill profile",
    icon: GraduationCap,
  },
  {
    value: "recruiter",
    label: "Recruiter",
    description: "Discover evidence-backed talent",
    icon: Users,
  },
  {
    value: "placementcell",
    label: "Placement cell",
    description: "Support and manage student profiles",
    icon: ShieldCheck,
  },
];

function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Open the correct tab based on the current URL.
  const [mode, setMode] = useState(
    location.pathname === "/login" ? "login" : "signup"
  );

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
  });

  const [notice, setNotice] = useState({
    type: "",
    message: "",
  });

  const [verificationEmail, setVerificationEmail] = useState("");

  const isSignup = mode === "signup";

  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const showMessage = (type, message) => {
    setNotice({ type, message });
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setNotice({ type: "", message: "" });
    setVerificationEmail("");
    setShowPassword(false);

    navigate(nextMode === "login" ? "/login" : "/signup", {
      replace: true,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setNotice({ type: "", message: "" });

    const email = form.email.trim().toLowerCase();

    if (isSignup && form.name.trim().length < 2) {
      showMessage("error", "Please enter your full name.");
      return;
    }

    if (!email) {
      showMessage("error", "Please enter your email address.");
      return;
    }

    if (form.password.length < 8) {
      showMessage(
        "error",
        "Password must contain at least 8 characters."
      );
      return;
    }

    setLoading(true);

    try {
      if (isSignup) {
        const response = await api.post("/auth/signup", {
          name: form.name.trim(),
          email,
          password: form.password,
          role: form.role,
        });

        setVerificationEmail(email);

        showMessage(
          "success",
          response.data.message ||
            "Account created. Check your email to verify your account."
        );
      } else {
        const response = await api.post("/auth/login", {
          email,
          password: form.password,
        });

        const role = response.data.user?.role;

        showMessage("success", "Login successful.");

        // The backend sets the JWT in an HttpOnly cookie.
        // Never store the JWT in localStorage.
        if (role === "student") {
          navigate("/student/dashboard", { replace: true });
        } else if (role === "recruiter") {
          navigate("/recruiter/dashboard", { replace: true });
        } else if (role === "placementcell") {
          navigate("/placement/dashboard", { replace: true });
        } else {
          showMessage(
            "error",
            "Your account role is not recognized."
          );
        }
      }
    } catch (error) {
      const data = error.response?.data;

      if (data?.code === "EMAIL_UNVERIFIED") {
        setVerificationEmail(email);

        showMessage(
          "error",
          "Verify your email before logging in. You can resend the verification link below."
        );
      } else {
        showMessage(
          "error",
          data?.message || "Something went wrong. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    if (!verificationEmail || resending) return;

    setResending(true);

    try {
      const response = await api.post("/auth/resend-verification", {
        email: verificationEmail,
      });

      showMessage(
        "success",
        response.data.message ||
          "If your account needs verification, an email will be sent."
      );
    } catch (error) {
      showMessage(
        "error",
        error.response?.data?.message ||
          "Unable to resend the verification email. Please try again."
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-glow auth-glow-one" />
      <div className="auth-glow auth-glow-two" />

      {/* Header */}
      <header className="auth-header">
        <Link to="/" className="auth-brand">
          <span className="auth-brand-icon">
            <ShieldCheck size={22} />
          </span>

          <span>
            verifhir<span className="auth-brand-dot">.</span>
          </span>
        </Link>

        <Link to="/" className="auth-back-link">
          <ArrowLeft size={15} />
          Back to home
        </Link>
      </header>

      {/* Main content */}
      <section className="auth-layout">
        {/* Left section */}
        <div className="auth-intro">
          <div className="auth-eyebrow">
            <Sparkles size={14} />
            YOUR SKILLS. YOUR PROOF.
          </div>

          <h1>
            Your next opportunity starts with{" "}
            <span>what you can prove.</span>
          </h1>

          <p className="auth-intro-text">
            Build your evidence-backed skill profile, showcase
            your projects, and help the right people discover
            what you can do.
          </p>

          <div className="auth-benefits">
            {[
              "Connect your real GitHub work",
              "Showcase evaluated projects",
              "Share skills backed by evidence",
            ].map((item) => (
              <div key={item} className="auth-benefit">
                <span>
                  <Check size={14} />
                </span>
                {item}
              </div>
            ))}
          </div>

          {/* GitHub proof card */}
          <div className="auth-proof-card">
            <div className="auth-proof-icon">
              <FaGithub size={23} />
            </div>

            <div className="auth-proof-content">
              <p className="auth-proof-title">
                Your work tells your story.
              </p>

              <p className="auth-proof-description">
                Repositories. Projects. Assessments. Real evidence.
              </p>
            </div>

            <BadgeCheck
              className="auth-proof-badge"
              size={22}
            />
          </div>
        </div>

        {/* Right section: authentication card */}
        <div className="auth-card">
          <div className="auth-card-heading">
            <div className="auth-card-symbol">
              {isSignup ? (
                <User size={21} />
              ) : (
                <LockKeyhole size={21} />
              )}
            </div>

            <h2>
              {isSignup ? "Create your account" : "Welcome back"}
            </h2>

            <p>
              {isSignup
                ? "Start building your verified skill profile."
                : "Log in to continue to your Verifhir account."}
            </p>
          </div>

          {/* Signup / login tabs */}
          <div className="auth-tabs">
            <button
              type="button"
              className={isSignup ? "active" : ""}
              onClick={() => switchMode("signup")}
              aria-pressed={isSignup}
            >
              Create account
            </button>

            <button
              type="button"
              className={!isSignup ? "active" : ""}
              onClick={() => switchMode("login")}
              aria-pressed={!isSignup}
            >
              Log in
            </button>
          </div>

          {/* API feedback */}
          {notice.message && (
            <div
              role="status"
              aria-live="polite"
              className={`auth-alert ${
                notice.type === "success"
                  ? "auth-alert-success"
                  : "auth-alert-error"
              }`}
            >
              {notice.message}
            </div>
          )}

          {/* Email verification */}
          {verificationEmail && (
            <div className="auth-verification-box">
              <Mail size={19} />

              <div>
                <p className="auth-verification-title">
                  Check your inbox
                </p>

                <p className="auth-verification-text">
                  Verification instructions were requested for{" "}
                  <strong>{verificationEmail}</strong>.
                </p>

                <button
                  type="button"
                  onClick={resendVerification}
                  disabled={resending}
                  className="auth-text-button"
                >
                  {resending
                    ? "Sending..."
                    : "Resend verification email"}
                </button>
              </div>
            </div>
          )}

          {/* Authentication form */}
          <form className="auth-form" onSubmit={handleSubmit}>
            {isSignup && (
              <div className="auth-field">
                <label htmlFor="name">Full name</label>

                <div className="auth-input-wrap">
                  <User size={17} />

                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={form.name}
                    onChange={updateField}
                    minLength={2}
                    maxLength={80}
                    autoComplete="name"
                    required
                  />
                </div>
              </div>
            )}

            <div className="auth-field">
              <label htmlFor="email">Email address</label>

              <div className="auth-input-wrap">
                <Mail size={17} />

                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={updateField}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <div className="auth-label-row">
                <label htmlFor="password">Password</label>

                {isSignup && (
                  <span className="auth-field-hint">
                    At least 8 characters
                  </span>
                )}
              </div>

              <div className="auth-input-wrap">
                <LockKeyhole size={17} />

                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={
                    isSignup
                      ? "Create a strong password"
                      : "Enter your password"
                  }
                  value={form.password}
                  onChange={updateField}
                  minLength={8}
                  maxLength={72}
                  autoComplete={
                    isSignup
                      ? "new-password"
                      : "current-password"
                  }
                  required
                />

                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() =>
                    setShowPassword((previous) => !previous)
                  }
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>
            </div>

            {/* Account role selection */}
            {isSignup && (
              <div className="auth-field">
                <label htmlFor="role">
                  I am joining as a
                </label>

                <div className="auth-role-grid">
                  {roles.map((role) => {
                    const Icon = role.icon;
                    const selected = form.role === role.value;

                    return (
                      <button
                        type="button"
                        key={role.value}
                        onClick={() =>
                          setForm((previous) => ({
                            ...previous,
                            role: role.value,
                          }))
                        }
                        className={`auth-role-option ${
                          selected ? "selected" : ""
                        }`}
                        aria-pressed={selected}
                      >
                        <Icon size={19} />

                        <span className="auth-role-name">
                          {role.label}
                        </span>

                        <span className="auth-role-description">
                          {role.description}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {form.role !== "student" && (
                  <p className="auth-field-hint">
                    Access to recruiter or placement-cell features
                    may require administrator approval.
                  </p>
                )}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <LoaderCircle
                    className="auth-spinner"
                    size={18}
                  />
                  Please wait...
                </>
              ) : (
                <>
                  {isSignup
                    ? "Create my account"
                    : "Log in to Verifhir"}
                  <ArrowRight size={17} />
                </>
              )}
            </button>

            <p className="auth-terms">
              By continuing, you agree to use Verifhir responsibly
              and provide accurate account information.
            </p>
          </form>

          {/* Security footer */}
          <div className="auth-card-footer">
            <ShieldCheck size={15} />

            <span>
              Your password is securely hashed. Authentication
              uses an HttpOnly cookie.
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="auth-footer">
        <span>© {new Date().getFullYear()} Verifhir</span>
        <span>Skills, verified.</span>
      </footer>
    </main>
  );
}

export default AuthPage;
