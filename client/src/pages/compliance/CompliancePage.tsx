import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ReactNode } from 'react';

/* ── Shared building blocks for all compliance sub-pages ── */

export function Hero({ title, subtitle, gradient = 'from-slate-800 via-blue-600 to-cyan-500' }: {
  title: string; subtitle: string; gradient?: string;
}) {
  return (
    <section className={`bg-gradient-to-br ${gradient} text-white py-10 px-6 text-center`}>
      <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2 font-space">{title}</h1>
      <p className="text-sm md:text-base opacity-90 max-w-xl mx-auto font-dm">{subtitle}</p>
    </section>
  );
}

export function Breadcrumb({ current }: { current: string }) {
  const { t } = useLanguage();
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted mb-6">
      <Link to="/compliance" className="text-muted hover:text-cyan-2 no-underline">{t.compliance.brand}</Link>
      <span>/</span>
      <span className="text-ink font-medium">{current}</span>
    </div>
  );
}

export function StatStrip({ items }: { items: { number: string; label: string }[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
      {items.map((s) => (
        <div key={s.label} className="bg-white border border-bdl rounded-xl p-4 text-center">
          <div className="text-xl font-extrabold text-blue-600">{s.number}</div>
          <div className="text-[11px] text-muted mt-0.5">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

export function InfoBox({ title, children, variant = 'default' }: {
  title: string; children: ReactNode; variant?: 'default' | 'highlight' | 'warning' | 'danger';
}) {
  const border = {
    default: 'border-bdl',
    highlight: 'border-l-4 border-l-blue-500 border-bdl bg-gradient-to-r from-blue-50 to-white',
    warning: 'border-l-4 border-l-amber-500 border-bdl bg-amber-50/50',
    danger: 'border-l-4 border-l-red-500 border-bdl bg-red-50/50',
  }[variant];

  return (
    <div className={`bg-white border rounded-xl p-5 mb-4 ${border}`}>
      <h3 className="text-sm font-bold text-ink mb-2">{title}</h3>
      <div className="text-sm text-muted leading-relaxed">{children}</div>
    </div>
  );
}

export function DataTable({ headers, rows }: {
  headers: string[];
  rows: (string | ReactNode)[][];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-bdl mb-6">
      <table className="w-full text-sm">
        <thead className="bg-light">
          <tr>
            {headers.map((h) => (
              <th key={h} className="text-left px-4 py-2.5 font-semibold text-muted border-b-2 border-bdl whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-bdl hover:bg-light/50 last:border-b-0">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2.5 align-top">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Badge({ children, color = 'blue' }: { children: ReactNode; color?: 'blue' | 'red' | 'green' | 'amber' | 'cyan' }) {
  const cls = {
    blue: 'bg-blue-100 text-blue-700',
    red: 'bg-red-100 text-red-700',
    green: 'bg-green-100 text-green-700',
    amber: 'bg-amber-100 text-amber-700',
    cyan: 'bg-cyan-100 text-cyan-700',
  }[color];
  return <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${cls}`}>{children}</span>;
}

export function ResourceList({ items }: { items: { href: string; title: string; desc?: string }[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.href} className="flex items-start gap-2 py-2 border-b border-bdl last:border-b-0">
          <svg className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
          <div>
            <a href={item.href} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:text-blue-800 no-underline">
              {item.title}
            </a>
            {item.desc && <span className="text-xs text-muted ml-1">— {item.desc}</span>}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-ink mb-3 pb-2 border-b-2 border-blue-100 font-space">{title}</h2>
      {children}
    </section>
  );
}

export function PageContainer({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  return (
    <div className="mx-auto max-w-[900px] px-6 py-8">
      {children}
      <footer className="border-t border-bdl pt-6 mt-8 text-center text-xs text-muted">
        &copy; 2026 {t.compliance.heroTitle}. {t.compliance.footerDisclaimer}
      </footer>
    </div>
  );
}
