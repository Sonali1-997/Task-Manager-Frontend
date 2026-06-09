"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, useToast } from "@/app/providers";

const validEmail = (e: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const toast = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [bad, setBad] = useState({ name: false, email: false, pw: false, confirm: false });
  const [banner, setBanner] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    const next = {
      name: !name.trim(),
      email: !validEmail(email.trim()),
      pw: pw.length < 6,
      confirm: pw !== confirm || !confirm,
    };
    setBad(next);
    if (Object.values(next).some(Boolean)) return;
    setBusy(true);
    setBanner("");
    try {
      await register(name.trim(), email.trim(), pw);
      toast("Account created — please sign in");
      router.push("/login");
    } catch (err) {
      setBanner(err instanceof Error ? err.message : "Could not create account.");
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
        <h1>Create account</h1>
        <p className="auth-sub">Join your team&apos;s workspace</p>
        {banner && <div className="banner">{banner}</div>}
        <div className={`field${bad.name ? " invalid" : ""}`}>
          <label>Full name</label>
          <input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="err">Name is required.</div>
        </div>
        <div className={`field${bad.email ? " invalid" : ""}`}>
          <label>Email</label>
          <input
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className="err">Enter a valid email.</div>
        </div>
        <div className="two">
          <div className={`field${bad.pw ? " invalid" : ""}`}>
            <label>Password</label>
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
            <div className="err">Min 6 characters.</div>
          </div>
          <div className={`field${bad.confirm ? " invalid" : ""}`}>
            <label>Confirm</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
            <div className="err">Passwords must match.</div>
          </div>
        </div>
        <button className="btn primary block" onClick={submit} disabled={busy}>
          {busy ? "Creating…" : "Create account"}
        </button>
        <p className="auth-switch">
          Already have an account?{" "}
          <Link href="/login">
            <b>Sign in</b>
          </Link>
        </p>
      </div>
    </div>
  );
}
