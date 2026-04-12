import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useScrollShadow } from "@/hooks/useScrollShadow";
import { useAuthContext } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSelector from "./LanguageSelector";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const scrolled = useScrollShadow();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthContext();
  const { t } = useLanguage();
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isLanding = location.pathname === "/";

  function closeMenu() {
    setMenuOpen(false);
    setToolsOpen(false);
    setUserMenuOpen(false);
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = async () => {
    closeMenu();
    await logout();
  };

  const userInitial = user?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U";

  const linkClass = "text-muted text-[0.83rem] font-medium no-underline tracking-[0.2px] hover:text-cyan-2 transition-colors";

  return (
    <header
      className={`fixed top-0 w-full z-300 bg-white border-b border-bdl transition-shadow duration-250 ${
        scrolled ? "shadow-[0_4px_20px_rgba(0,0,0,0.08)]" : ""
      }`}
    >
      <div className="mx-auto flex items-center justify-between px-10 max-w-[1280px] h-[58px]">
        <Link
          to="/"
          className="font-syne text-[1.35rem] font-extrabold text-ink no-underline tracking-[-1px] hover:text-ink"
          onClick={closeMenu}
        >
          D<span className="text-cyan-2">C</span>
        </Link>

        <nav
          className={`
            flex gap-8 items-center
            max-md:fixed max-md:top-[58px] max-md:left-0 max-md:right-0
            max-md:bg-white max-md:px-8 max-md:py-6 max-md:flex-col max-md:gap-5
            max-md:border-b max-md:border-bdl max-md:z-299
            ${menuOpen ? "max-md:flex" : "max-md:hidden"}
          `}
        >
          {isLanding ? (
            <a href="#" className={linkClass} onClick={closeMenu}>{t.nav.home}</a>
          ) : (
            <Link to="/" className={linkClass} onClick={closeMenu}>{t.nav.home}</Link>
          )}

          {isLanding ? (
            <>
              <a href="#about" className={linkClass} onClick={closeMenu}>{t.nav.about}</a>
              <a href="#expertise" className={linkClass} onClick={closeMenu}>{t.nav.expertise}</a>
              <a href="#ai-video" className={linkClass} onClick={closeMenu}>{t.nav.aiInAction}</a>
            </>
          ) : (
            <>
              <Link to="/#about" className={linkClass} onClick={closeMenu}>{t.nav.about}</Link>
              <Link to="/#expertise" className={linkClass} onClick={closeMenu}>{t.nav.expertise}</Link>
              <Link to="/#ai-video" className={linkClass} onClick={closeMenu}>{t.nav.aiInAction}</Link>
            </>
          )}

          {/* Tools dropdown */}
          <div
            className="relative group"
            onMouseEnter={() => setToolsOpen(true)}
            onMouseLeave={() => setToolsOpen(false)}
          >
            <button
              className="text-muted text-[0.83rem] font-medium tracking-[0.2px] hover:text-cyan-2 transition-colors bg-transparent border-none cursor-pointer font-sans"
              onClick={() => setToolsOpen(!toolsOpen)}
              type="button"
            >
              {t.nav.tools} <span className="text-[0.7em]">{"\u25BE"}</span>
            </button>
            <div
              className={`
                md:absolute md:top-full md:left-0
                bg-white md:border md:border-bdl md:rounded-[10px]
                md:py-2 md:min-w-[180px] md:shadow-[0_8px_32px_rgba(0,0,0,0.12)]
                md:z-310 md:pt-3
                max-md:mt-1 max-md:pl-3
                ${toolsOpen ? "block" : "hidden"}
                md:group-hover:block
              `}
            >
              <div className="hidden md:block absolute -top-2 left-0 right-0 h-3" />
              <Link
                to="/transcript"
                className="block py-2 px-5 whitespace-nowrap text-[0.82rem] text-muted font-medium no-underline hover:bg-light-2 hover:text-cyan-2 transition-colors"
                onClick={closeMenu}
              >
                {t.nav.transcriptTool}
              </Link>
              <Link
                to="/bse-meeting"
                className="block py-2 px-5 whitespace-nowrap text-[0.82rem] text-muted font-medium no-underline hover:bg-light-2 hover:text-cyan-2 transition-colors"
                onClick={closeMenu}
              >
                {t.nav.bseMeeting}
              </Link>
            </div>
          </div>

          {isLanding ? (
            <a href="#contact" className={linkClass} onClick={closeMenu}>{t.nav.contact}</a>
          ) : (
            <Link to="/#contact" className={linkClass} onClick={closeMenu}>{t.nav.contact}</Link>
          )}

          {/* Mobile-only auth links */}
          {!isAuthenticated && (
            <Link
              to="/login"
              className="md:hidden text-cyan-2 text-[0.83rem] font-semibold no-underline tracking-[0.2px]"
              onClick={closeMenu}
            >
              {t.nav.signInSignUp}
            </Link>
          )}
          {isAuthenticated && (
            <button
              className="md:hidden text-muted text-[0.83rem] font-medium bg-transparent border-none cursor-pointer"
              onClick={handleLogout}
            >
              {t.nav.signOut}
            </button>
          )}

          {/* Mobile language selector */}
          <div className="md:hidden">
            <LanguageSelector />
          </div>
        </nav>

        <div className="flex items-center gap-3">
          {/* Desktop language selector */}
          <div className="hidden md:block">
            <LanguageSelector />
          </div>

          {/* Auth button — desktop */}
          {isAuthenticated ? (
            <div className="relative hidden md:block" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 bg-transparent border-none cursor-pointer"
                type="button"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-2 text-white text-xs font-bold">
                  {userInitial}
                </span>
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-bdl bg-white py-2 shadow-[0_8px_32px_rgba(0,0,0,0.12)] z-310">
                  <div className="px-4 py-2 border-b border-bdl">
                    <p className="text-xs font-semibold text-ink truncate">
                      {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email}
                    </p>
                    <p className="text-[0.7rem] text-muted truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-muted hover:bg-light-2 hover:text-ink bg-transparent border-none cursor-pointer transition-colors"
                  >
                    {t.nav.signOut}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="hidden md:inline-block py-2 px-5 bg-cyan-2 text-white rounded-[10px] font-bold text-[0.82rem] no-underline transition-all hover:bg-cyan hover:shadow-[0_4px_16px_rgba(6,182,212,0.35)] whitespace-nowrap"
            >
              {t.nav.signIn}
            </Link>
          )}

          {isLanding && isAuthenticated && (
            <a
              href="#contact"
              className="py-2 px-5 bg-cyan-2 text-white rounded-[10px] font-bold text-[0.82rem] no-underline transition-all hover:bg-cyan hover:shadow-[0_4px_16px_rgba(6,182,212,0.35)] whitespace-nowrap"
            >
              {t.nav.connect} &rarr;
            </a>
          )}

          <button
            className="hidden max-md:block bg-transparent border-none text-ink text-[1.4rem] cursor-pointer px-1 py-0.5"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            type="button"
          >
            {menuOpen ? "\u2715" : "\u2630"}
          </button>
        </div>
      </div>
    </header>
  );
}
