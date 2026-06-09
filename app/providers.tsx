"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { User } from "@/lib/types";
import { authApi } from "@/lib/api";

/* ------------------------------------------------------------------ */
/* Toast                                                               */
/* ------------------------------------------------------------------ */
const ToastCtx = createContext<(msg: string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

/* ------------------------------------------------------------------ */
/* Auth / session (client-side demo session)                          */
/* ------------------------------------------------------------------ */
interface AuthState {
  me: User | null;
  ready: boolean; // hydrated from storage yet?
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  setMe: (u: User) => void;
}

const AuthCtx = createContext<AuthState | null>(null);
export const useAuth = () => {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within <Providers>");
  return ctx;
};

const STORAGE_KEY = "taskflow.session";

export function Providers({ children }: { children: React.ReactNode }) {
  const [me, setMeState] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  // Restore session on first mount. localStorage gives an instant first paint,
  // then /auth/me re-verifies against the backend — the JWT cookie is the real
  // session, so a stale or tampered localStorage can never grant access.
  useEffect(() => {
    let stored: { me: User } | null = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) stored = JSON.parse(raw) as { me: User };
    } catch {
      /* ignore corrupt storage */
    }
    if (stored?.me) setMeState(stored.me);

    if (!stored?.me) {
      setReady(true);
      return;
    }
    // Re-verify the session and refresh the authoritative user from the backend.
    authApi
      .me()
      .then((user) => {
        setMeState(user);
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ me: user }));
      })
      .catch(() => {
        setMeState(null);
        localStorage.removeItem(STORAGE_KEY);
      })
      .finally(() => setReady(true));
  }, []);

  const persist = useCallback((u: User | null) => {
    if (u) localStorage.setItem(STORAGE_KEY, JSON.stringify({ me: u }));
    else localStorage.removeItem(STORAGE_KEY);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      await authApi.login(email, password); // sets the httpOnly JWT cookie
      // Verify the session and read the authoritative user from /auth/me.
      const user = await authApi.me();
      setMeState(user);
      persist(user);
    },
    [persist],
  );

  const register = useCallback(
    // Account creation only — no session is established; the user signs in afterward.
    async (name: string, email: string, password: string) => {
      await authApi.register(name, email, password);
    },
    [],
  );

  const logout = useCallback(() => {
    authApi.logout().catch(() => {/* clear local session regardless */});
    setMeState(null);
    persist(null);
  }, [persist]);

  const setMe = useCallback(
    (u: User) => {
      setMeState(u);
      persist(u);
    },
    [persist],
  );

  /* toast */
  const [toast, setToast] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), 1800);
  }, []);

  return (
    <AuthCtx.Provider value={{ me, ready, login, register, logout, setMe }}>
      <ToastCtx.Provider value={showToast}>
        {children}
        <div className={`toast${toast ? " show" : ""}`}>{toast}</div>
      </ToastCtx.Provider>
    </AuthCtx.Provider>
  );
}
