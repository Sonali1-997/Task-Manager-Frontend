"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers";

export default function Home() {
  const router = useRouter();
  const { me, ready } = useAuth();

  useEffect(() => {
    if (!ready) return;
    router.replace(me ? "/dashboard" : "/login");
  }, [me, ready, router]);

  return <div className="loading">Loading…</div>;
}
