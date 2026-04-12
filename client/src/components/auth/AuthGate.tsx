import { useState, type ReactNode, type FormEvent } from "react";
import { useAuth } from "@/hooks/useAuth";

interface AuthGateProps {
  slug: string;
  title: string;
  children: ReactNode;
}

export function AuthGate({ slug, title, children }: AuthGateProps) {
  const { isAuthenticated, isLoading, error, verify } = useAuth(slug);
  const [password, setPassword] = useState("");

  if (isLoading && !isAuthenticated) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-2/30">
        <div className="text-light text-lg font-dm">Loading...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (password.trim()) verify(password);
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-2/30 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/20 bg-white/10 p-8 shadow-2xl backdrop-blur-2xl">
        <div className="mb-6 text-center">
          <div className="mb-4 text-5xl">&#128274;</div>
          <h1 className="mb-2 font-space text-2xl font-bold text-white">
            {title}
          </h1>
          <p className="text-sm text-slate-300">
            Enter the password to access this content
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            className="w-full rounded-xl border border-slate-400/30 bg-white/10 px-4 py-3 font-dm text-white placeholder-slate-400 backdrop-blur-sm transition-colors focus:border-cyan-2 focus:outline-none focus:ring-1 focus:ring-cyan-2"
          />

          {error && (
            <p className="text-center text-sm font-medium text-red">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading || !password.trim()}
            className="w-full rounded-xl bg-gradient-to-r from-cyan-2 to-indigo py-3 font-dm text-sm font-bold text-white transition-all hover:shadow-lg hover:shadow-cyan-2/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Verifying..." : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
}
