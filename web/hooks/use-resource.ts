"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { ApiError } from "@/lib/api";

export type Resource<T> = {
  data: T | undefined;
  error: ApiError | null;
  /** True while a fetch for the current key is in flight. Old data stays on screen. */
  loading: boolean;
  /** Fetch again. Resolves when that fetch has finished. */
  reload: () => Promise<void>;
  setData: (data: T) => void;
};

export function asApiError(e: unknown): ApiError {
  return e instanceof ApiError ? e : new ApiError("server", "Something went wrong on our side.");
}

type Settled<T> = { token: string; data?: T; error: ApiError | null };

/** Minimal loader for one API call. A change of `key` triggers a refetch. */
export function useResource<T>(load: () => Promise<T>, key: string, enabled = true): Resource<T> {
  const loadRef = useRef(load);
  useLayoutEffect(() => {
    loadRef.current = load;
  });

  const [nonce, setNonce] = useState(0);
  const [settled, setSettled] = useState<Settled<T>>({ token: "", error: null });
  const waiters = useRef<(() => void)[]>([]);
  const token = `${key}#${nonce}`;

  useEffect(() => {
    if (!enabled) return;
    let live = true;
    loadRef.current().then(
      (data) => live && setSettled({ token, data, error: null }),
      (e) => live && setSettled((prev) => ({ token, data: prev.data, error: asApiError(e) })),
    ).finally(() => {
      if (!live) return;
      waiters.current.splice(0).forEach((resolve) => resolve());
    });
    return () => {
      live = false;
    };
  }, [token, enabled]);

  const reload = useCallback(
    () =>
      new Promise<void>((resolve) => {
        waiters.current.push(resolve);
        setNonce((n) => n + 1);
      }),
    [],
  );

  const setData = useCallback((data: T) => setSettled((prev) => ({ ...prev, data, error: null })), []);

  const current = settled.token === token;
  return {
    data: settled.data,
    error: current ? settled.error : null,
    loading: enabled && !current,
    reload,
    setData,
  };
}
