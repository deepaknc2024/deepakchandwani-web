import { useState, useEffect, useCallback } from "react";

interface UseAuthReturn {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  verify: (password: string) => Promise<void>;
}

export function useAuth(slug: string): UseAuthReturn {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const storageKey = `auth_token_${slug}`;

  useEffect(() => {
    const token = sessionStorage.getItem(storageKey);
    if (token) {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, [storageKey]);

  const verify = useCallback(
    async (password: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug, password }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || "Invalid password");
        }
        const data = await res.json();
        sessionStorage.setItem(storageKey, data.token || "authenticated");
        setIsAuthenticated(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Verification failed");
      } finally {
        setIsLoading(false);
      }
    },
    [slug, storageKey],
  );

  return { isAuthenticated, isLoading, error, verify };
}
