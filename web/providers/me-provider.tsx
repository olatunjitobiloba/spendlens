"use client";

import { createContext, useContext } from "react";

import { api } from "@/lib/api";
import type { Me } from "@/types/api";
import { useResource, type Resource } from "@/hooks/use-resource";

const MeContext = createContext<Resource<Me> | null>(null);

/** Plan and Pro status, shared by every screen in the module. */
export function MeProvider({ children }: { children: React.ReactNode }) {
  const me = useResource(() => api.me(), "me");
  return <MeContext.Provider value={me}>{children}</MeContext.Provider>;
}

export function useMe() {
  const ctx = useContext(MeContext);
  if (!ctx) throw new Error("useMe must be used inside MeProvider");
  return ctx;
}

export function useIsPro() {
  return useMe().data?.plan === "pro";
}
