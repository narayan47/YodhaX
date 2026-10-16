
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  LoaderCircle,
  MailCheck,
  ShieldAlert,
} from "lucide-react";

import api from "../api/axios";

function VerifyEmail() {
  const [searchParams] = useSearchParams();

  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    let active = true;

    async function verify() {
      const token = searchParams.get("token");

      if (!token) {
        setStatus("error");
        setMessage("The verification token is missing.");
        return;
      }

      try {
        const response = await api.post("/auth/verify-email", {
          token,
        });

        if (!active) return;

        setStatus("success");
        setMessage(response.data.message);
      } catch (error) {
        if (!active) return;

        setStatus("error");
        setMessage(
          error.response?.data?.message ||
            "Unable to verify your email. Please request a new link."
        );
      }
    }

    verify();

    return () => {
      active = false;
    };
  }, [searchParams]);

  return (
    <main className="auth-page auth-verify-page">
      <div className="auth-glow auth-glow-one" />

      <header className="auth-header">
        <Link to="/" className="auth-brand">
          <span className="auth-brand-icon">
            <BadgeCheck size={22} />
          </span>

          <span>
            verifhir<span className="auth-brand-dot">.</span>
          </span>
        </Link>
      </header>

      <section className="auth-verify-card">
        <div
          className={`auth-verify-icon ${
            status === "error" ? "auth-verify-error" : ""
          }`}
        >
          {status === "loading" ? (
            <LoaderCircle className="auth-spinner" size={30} />
          ) : status === "success" ? (
            <MailCheck size={30} />
          ) : (
            <ShieldAlert size={30} />
          )}
        </div>

        <h1>
          {status === "loading"
            ? "Verifying your email"
            : status === "success"
              ? "Email verified!"
              : "Verification unsuccessful"}
        </h1>

        <p>{message}</p>

        {status === "success" ? (
          <Link to="/login" className="auth-submit auth-link-submit">
            Continue to login <ArrowRight size={17} />
          </Link>
        ) : status === "error" ? (
          <Link to="/login" className="auth-submit auth-link-submit">
            Return to login <ArrowRight size={17} />
          </Link>
        ) : null}

        <Link to="/" className="auth-back-link auth-verify-home">
          Back to Verifhir
        </Link>
      </section>
    </main>
  );
}

export default VerifyEmail;
