
import { useState } from "react";
import api from "../api/axios";

export default function PlacementStudentAdd({ onCreated }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const { data } = await api.post("/placement/students", {
        name,
        email,
      });

      setMessage(data.message || "Student added.");
      setName("");
      setEmail("");

      if (onCreated) {
        await onCreated(data.student);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to add student."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-white/10 bg-[#11111b] p-5"
    >
      <h3 className="text-lg font-semibold text-white">
        Add student
      </h3>

      {error && (
        <p className="text-sm text-red-300">{error}</p>
      )}

      {message && (
        <p className="text-sm text-emerald-300">{message}</p>
      )}

      <label className="block text-sm text-slate-300">
        Student name
        <input
          required
          maxLength={100}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-2 w-full rounded-xl border border-white/10 bg-[#09090f] p-3 text-white"
          placeholder="Enter full name"
        />
      </label>

      <label className="block text-sm text-slate-300">
        Student email
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-2 w-full rounded-xl border border-white/10 bg-[#09090f] p-3 text-white"
          placeholder="student@example.com"
        />
      </label>

      <button
        disabled={busy}
        className="w-full rounded-xl bg-violet-500 p-3 font-semibold text-white disabled:opacity-50"
      >
        {busy ? "Adding student..." : "Add student"}
      </button>
    </form>
  );
}
