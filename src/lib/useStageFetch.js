import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Run an async LLM fetch once when a stage mounts, with loading/error state
 * and a retry function for the user-facing retry button.
 * Pass skip=true when the data already exists in reducer state.
 */
export function useStageFetch(asyncFn, { skip = false } = {}) {
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState(null);
  const startedRef = useRef(false);
  const fnRef = useRef(asyncFn);
  fnRef.current = asyncFn;

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await fnRef.current();
    } catch (err) {
      console.error(err);
      setError(err?.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (skip || startedRef.current) return;
    startedRef.current = true;
    run();
  }, [skip, run]);

  return { loading, error, retry: run };
}
