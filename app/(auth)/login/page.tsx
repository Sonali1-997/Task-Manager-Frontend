"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/providers";

const validEmail = (e: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("sonali@sharma.com");
  const [password, setPassword] = useState("sonali123@");
  const [emailBad, setEmailBad] = useState(false);
  const [pwBad, setPwBad] = useState(false);
  const [banner, setBanner] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    const eb = !validEmail(email.trim());
    const pb = !password;
    setEmailBad(eb);
    setPwBad(pb);
    if (eb || pb) return;
    setBusy(true);
    setBanner("");
    try {
      await login(email.trim(), password);
      router.push("/dashboard");
    } catch (err) {
      setBanner(err instanceof Error ? err.message : "Invalid email or password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="brand">
          <div className="logo">T</div>
          <span className="brandname">TaskFlow</span>
        </div>
        <h1>Welcome back</h1>
        <p className="auth-sub">Sign in to your workspace</p>
        {banner && <div className="banner">{banner}</div>}
        <div className={`field${emailBad ? " invalid" : ""}`}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
          <div className="err">Enter a valid email.</div>
        </div>
        <div className={`field${pwBad ? " invalid" : ""}`}>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
          <div className="err">Password is required.</div>
        </div>
        <button className="btn primary block" onClick={submit} disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <p className="auth-switch">
          No account?{" "}
          <Link href="/register">
            <b>Register</b>
          </Link>
        </p>
      </div>
    </div>
  );
}
