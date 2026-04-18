import { Link, Outlet, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/compliance', label: 'Overview' },
  { to: '/compliance/dpdp-act', label: 'DPDP Act' },
  { to: '/compliance/vapt', label: 'VAPT' },
  { to: '/compliance/cert-in', label: 'CERT-In' },
  { to: '/compliance/it-act', label: 'IT Act' },
  { to: '/compliance/digital-records', label: 'Digital Records' },
  { to: '/compliance/safe-hosting', label: 'Safe Hosting' },
  { to: '/compliance/standards', label: 'Standards' },
  { to: '/compliance/firms', label: 'Legal Firms' },
];

export default function ComplianceLayout() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-light pt-[58px]">
      {/* Sub-nav bar */}
      <div className="sticky top-[58px] z-50 bg-white/85 backdrop-blur-md border-b border-bdl">
        <div className="mx-auto max-w-[1280px] px-6 overflow-x-auto">
          <div className="flex items-center gap-1 h-11 min-w-max">
            <Link
              to="/compliance"
              className="flex items-center gap-1.5 mr-3 text-ink font-bold text-sm no-underline shrink-0"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Compliance
            </Link>
            {NAV_ITEMS.map(({ to, label }) => {
              const active = pathname === to || (to !== '/compliance' && pathname.startsWith(to));
              return (
                <Link
                  key={to}
                  to={to}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold no-underline transition-colors ${
                    active
                      ? 'bg-cyan-2/10 text-cyan-2'
                      : 'text-muted hover:bg-light-2 hover:text-ink'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <Outlet />
    </div>
  );
}
