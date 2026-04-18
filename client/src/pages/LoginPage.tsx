import { useState, useEffect, useRef, type FormEvent } from 'react';
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
          prompt: (callback?: (notification: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => void) => void;
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
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAuthenticated) navigate(redirectTo, { replace: true });
  }, [isAuthenticated, navigate, redirectTo]);

  // Load Google Identity Services and render the official button
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
              setGoogleLoading(true);
              setError('');
              const result = await loginWithGoogle(response.credential);
              if (!result.ok) setError(result.error || 'Google sign-in failed');
              setGoogleLoading(false);
            },
            ux_mode: 'popup',
          });

          // Render the official Google Sign-In button
          if (googleBtnRef.current) {
            window.google?.accounts.id.renderButton(googleBtnRef.current, {
              type: 'standard',
              theme: 'outline',
              size: 'large',
              width: googleBtnRef.current.offsetWidth,
              text: 'signin_with',
              shape: 'rectangular',
              logo_alignment: 'center',
            });
          }
          setGoogleReady(true);
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

          {/* Official Google Sign-In button rendered by GSI */}
          <div className="w-full relative">
            <div
              ref={googleBtnRef}
              className="w-full flex items-center justify-center min-h-[44px]"
            />
            {!googleReady && (
              <div className="w-full flex items-center justify-center gap-3 rounded-xl border border-bdl bg-white px-4 py-2.5 text-sm font-medium text-muted absolute inset-0">
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Loading Google Sign-In...
              </div>
            )}
            {googleLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl">
                <span className="text-sm text-muted">{t.login.pleaseWait}</span>
              </div>
            )}
          </div>

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
