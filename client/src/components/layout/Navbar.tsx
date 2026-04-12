import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useScrollShadow } from "@/hooks/useScrollShadow";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const scrolled = useScrollShadow();
  const location = useLocation();

  const isLanding = location.pathname === "/";

  function closeMenu() {
    setMenuOpen(false);
    setToolsOpen(false);
  }

  return (
    <header
      className={`fixed top-0 w-full z-300 bg-white border-b border-bdl transition-shadow duration-250 ${
        scrolled ? "shadow-[0_4px_20px_rgba(0,0,0,0.08)]" : ""
      }`}
    >
      <div className="mx-auto flex items-center justify-between px-10 max-w-[1280px] h-[58px]">
        {/* Brand */}
        <Link
          to="/"
          className="font-syne text-[1.35rem] font-extrabold text-ink no-underline tracking-[-1px] hover:text-ink"
          onClick={closeMenu}
        >
          D<span className="text-cyan-2">C</span>
        </Link>

        {/* Desktop + mobile menu */}
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
            <a
              href="#"
              className="text-muted text-[0.83rem] font-medium no-underline tracking-[0.2px] hover:text-cyan-2 transition-colors"
              onClick={closeMenu}
            >
              Home
            </a>
          ) : (
            <Link
              to="/"
              className="text-muted text-[0.83rem] font-medium no-underline tracking-[0.2px] hover:text-cyan-2 transition-colors"
              onClick={closeMenu}
            >
              Home
            </Link>
          )}

          {isLanding ? (
            <>
              <a
                href="#about"
                className="text-muted text-[0.83rem] font-medium no-underline tracking-[0.2px] hover:text-cyan-2 transition-colors"
                onClick={closeMenu}
              >
                About
              </a>
              <a
                href="#services"
                className="text-muted text-[0.83rem] font-medium no-underline tracking-[0.2px] hover:text-cyan-2 transition-colors"
                onClick={closeMenu}
              >
                Services
              </a>
              <a
                href="#ai-video"
                className="text-muted text-[0.83rem] font-medium no-underline tracking-[0.2px] hover:text-cyan-2 transition-colors"
                onClick={closeMenu}
              >
                AI in Action
              </a>
            </>
          ) : (
            <>
              <Link
                to="/#about"
                className="text-muted text-[0.83rem] font-medium no-underline tracking-[0.2px] hover:text-cyan-2 transition-colors"
                onClick={closeMenu}
              >
                About
              </Link>
              <Link
                to="/#services"
                className="text-muted text-[0.83rem] font-medium no-underline tracking-[0.2px] hover:text-cyan-2 transition-colors"
                onClick={closeMenu}
              >
                Services
              </Link>
              <Link
                to="/#ai-video"
                className="text-muted text-[0.83rem] font-medium no-underline tracking-[0.2px] hover:text-cyan-2 transition-colors"
                onClick={closeMenu}
              >
                AI in Action
              </Link>
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
              Tools <span className="text-[0.7em]">{"\u25BE"}</span>
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
              {/* Invisible bridge for hover gap */}
              <div className="hidden md:block absolute -top-2 left-0 right-0 h-3" />
              <Link
                to="/transcript"
                className="block py-2 px-5 whitespace-nowrap text-[0.82rem] text-muted font-medium no-underline hover:bg-light-2 hover:text-cyan-2 transition-colors"
                onClick={closeMenu}
              >
                Transcript Tool
              </Link>
              <Link
                to="/bse-meeting"
                className="block py-2 px-5 whitespace-nowrap text-[0.82rem] text-muted font-medium no-underline hover:bg-light-2 hover:text-cyan-2 transition-colors"
                onClick={closeMenu}
              >
                BSE Meeting
              </Link>
            </div>
          </div>

          {isLanding ? (
            <a
              href="#contact"
              className="text-muted text-[0.83rem] font-medium no-underline tracking-[0.2px] hover:text-cyan-2 transition-colors"
              onClick={closeMenu}
            >
              Contact
            </a>
          ) : (
            <Link
              to="/#contact"
              className="text-muted text-[0.83rem] font-medium no-underline tracking-[0.2px] hover:text-cyan-2 transition-colors"
              onClick={closeMenu}
            >
              Contact
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {/* CTA */}
          <a
            href="#contact"
            className="py-2 px-5 bg-cyan-2 text-white rounded-[10px] font-bold text-[0.82rem] no-underline transition-all hover:bg-cyan hover:shadow-[0_4px_16px_rgba(6,182,212,0.35)] whitespace-nowrap"
          >
            Let&rsquo;s Talk &rarr;
          </a>

          {/* Hamburger */}
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
