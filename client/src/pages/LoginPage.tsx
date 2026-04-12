import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          renderButton: (el: HTMLElement, config: Record<string, unknown>) => void;
        };
      };
    };
  }
}

export default function LoginPage() {
  const { login, signup, loginWithGoogle, isAuthenticated } = useAuthContext();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate(redirectTo, { replace: true });
  }, [isAuthenticated, navigate, redirectTo]);

  useEffect(() => {
    let script: HTMLScriptElement | null = null;

    fetch('/api/auth/config')
      .then((r) => r.json())
      .then((data) => {
        if (!data.ok || !data.googleClientId) return;

        script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.onload = () => {
          window.google?.accounts.id.initialize({
            client_id: data.googleClientId,
            callback: async (response: { credential: string }) => {
              setLoading(true);
              setError('');
              const result = await loginWithGoogle(response.credential);
              if (!result.ok) setError(result.error || 'Google sign-in failed');
              setLoading(false);
            },
          });
          const el = document.getElementById('google-signin-btn');
          if (el) {
            window.google?.accounts.id.renderButton(el, {
              theme: 'outline',
              size: 'large',
              width: '100%',
              text: 'continue_with',
              shape: 'pill',
            });
          }
        };
        document.head.appendChild(script);
      })
      .catch(() => {});

    return () => { script?.remove(); };
  }, [loginWithGoogle]);

  const suggestPassword = async () => {
    try {
      const res = await fetch('/api/auth/suggest-password');
      const data = await res.json();
      if (data.ok) {
        setPassword(data.password);
        setShowPassword(true);
      }
    } catch { /* ignore */ }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = mode === 'login'
      ? await login(email, password)
      : await signup(email, password, firstName, lastName);

    if (!result.ok) setError(result.error || 'Something went wrong');
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-cyan-2/5 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-bdl bg-white p-8 shadow-[0_8px_40px_rgba(0,0,0,0.06)]">
          <div className="mb-6 text-center">
            <Link to="/" className="inline-block font-syne text-3xl font-extrabold text-ink no-underline mb-2">
              D<span className="text-cyan-2">C</span>
            </Link>
            <h1 className="font-space text-xl font-bold text-ink">
              {mode === 'login' ? t.login.welcomeBack : t.login.createAccount}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {mode === 'login' ? t.login.signInDesc : t.login.signUpDesc}
            </p>
          </div>

          <div id="google-signin-btn" className="flex justify-center mb-4" />

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-bdl" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-muted">{t.login.orContinueEmail}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {mode === 'signup' && (
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder={t.login.firstName}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-1/2 rounded-xl border border-bdl bg-light px-4 py-2.5 text-sm text-ink placeholder-muted/60 focus:border-cyan-2 focus:outline-none focus:ring-1 focus:ring-cyan-2 transition-colors"
                />
                <input
                  type="text"
                  placeholder={t.login.lastName}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-1/2 rounded-xl border border-bdl bg-light px-4 py-2.5 text-sm text-ink placeholder-muted/60 focus:border-cyan-2 focus:outline-none focus:ring-1 focus:ring-cyan-2 transition-colors"
                />
              </div>
            )}

            <input
              type="email"
              placeholder={t.login.email}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full rounded-xl border border-bdl bg-light px-4 py-2.5 text-sm text-ink placeholder-muted/60 focus:border-cyan-2 focus:outline-none focus:ring-1 focus:ring-cyan-2 transition-colors"
            />

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder={t.login.password}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="w-full rounded-xl border border-bdl bg-light px-4 py-2.5 pr-20 text-sm text-ink placeholder-muted/60 focus:border-cyan-2 focus:outline-none focus:ring-1 focus:ring-cyan-2 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-ink bg-transparent border-none cursor-pointer"
              >
                {showPassword ? t.login.hide : t.login.show}
              </button>
            </div>

            {mode === 'signup' && (
              <button
                type="button"
                onClick={suggestPassword}
                className="self-start text-xs text-cyan-2 hover:text-cyan font-medium bg-transparent border-none cursor-pointer px-1"
              >
                {t.login.suggestPassword}
              </button>
            )}

            {error && (
              <p className="text-sm text-red font-medium text-center bg-red/5 rounded-lg py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-cyan-2 py-2.5 text-sm font-bold text-white transition-all hover:bg-cyan hover:shadow-[0_4px_16px_rgba(6,182,212,0.35)] disabled:opacity-50 disabled:cursor-not-allowed mt-1"
            >
              {loading ? t.login.pleaseWait : mode === 'login' ? t.login.signInBtn : t.login.createAccountBtn}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-muted">
            {mode === 'login' ? t.login.noAccount + ' ' : t.login.haveAccount + ' '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
              className="text-cyan-2 font-semibold hover:text-cyan bg-transparent border-none cursor-pointer"
            >
              {mode === 'login' ? t.login.signUp : t.login.signInBtn}
            </button>
          </p>
        </div>

        <p className="mt-4 text-center text-xs text-muted">
          <Link to="/" className="text-muted hover:text-cyan-2 no-underline">
            &larr; {t.login.backHome}
          </Link>
        </p>
      </div>
    </div>
  );
}
