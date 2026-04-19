import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ComplianceIndex() {
  const { t } = useLanguage();
  const c = t.compliance;

  const TOPICS = [
    { to: '/compliance/dpdp-act', title: c.cardDpdpTitle, desc: c.cardDpdpDesc, badge: c.badgeDataProtection, color: 'bg-blue-50 text-blue-600', badgeColor: 'bg-blue-100 text-blue-700' },
    { to: '/compliance/vapt', title: c.cardVaptTitle, desc: c.cardVaptDesc, badge: c.badgeSecurityTesting, color: 'bg-cyan-50 text-cyan-600', badgeColor: 'bg-cyan-100 text-cyan-700' },
    { to: '/compliance/cert-in', title: c.cardCertInTitle, desc: c.cardCertInDesc, badge: c.badgeMandatory, color: 'bg-red-50 text-red-600', badgeColor: 'bg-red-100 text-red-700' },
    { to: '/compliance/it-act', title: c.cardItActTitle, desc: c.cardItActDesc, badge: c.badgeCyberLaw, color: 'bg-green-50 text-green-600', badgeColor: 'bg-green-100 text-green-700' },
    { to: '/compliance/digital-records', title: c.cardDigRecTitle, desc: c.cardDigRecDesc, badge: c.badgeEvidenceLaw, color: 'bg-amber-50 text-amber-600', badgeColor: 'bg-amber-100 text-amber-700' },
    { to: '/compliance/safe-hosting', title: c.cardHostingTitle, desc: c.cardHostingDesc, badge: c.badgeInfrastructure, color: 'bg-blue-50 text-blue-600', badgeColor: 'bg-blue-100 text-blue-700' },
    { to: '/compliance/standards', title: c.cardStdTitle, desc: c.cardStdDesc, badge: c.badgeStandards, color: 'bg-cyan-50 text-cyan-600', badgeColor: 'bg-cyan-100 text-cyan-700' },
    { to: '/compliance/firms', title: c.cardFirmsTitle, desc: c.cardFirmsDesc, badge: c.badgeDirectory, color: 'bg-green-50 text-green-600', badgeColor: 'bg-green-100 text-green-700' },
  ];

  const STATS = [
    { number: '6 hrs', label: c.statIncident },
    { number: '180 days', label: c.statLogs },
    { number: '\u20B9250 Cr', label: c.statPenalty },
    { number: 'May 2027', label: c.statDeadline },
    { number: '5 years', label: c.statKyc },
  ];

  const GLANCE = [
    { name: c.cardDpdpTitle, req: c.glanceDpdpReq, who: c.glanceDpdpWho, to: '/compliance/dpdp-act' },
    { name: c.cardVaptTitle, req: c.glanceVaptReq, who: c.glanceVaptWho, to: '/compliance/vapt' },
    { name: c.cardCertInTitle, req: c.glanceCertReq, who: c.glanceCertWho, to: '/compliance/cert-in' },
    { name: c.cardItActTitle, req: c.glanceItReq, who: c.glanceItWho, to: '/compliance/it-act' },
    { name: c.cardDigRecTitle, req: c.glanceDigReq, who: c.glanceDigWho, to: '/compliance/digital-records' },
    { name: c.cardHostingTitle, req: c.glanceHostReq, who: c.glanceHostWho, to: '/compliance/safe-hosting' },
    { name: c.cardStdTitle, req: c.glanceStdReq, who: c.glanceStdWho, to: '/compliance/standards' },
  ];

  return (
    <>
      <section className="bg-gradient-to-br from-slate-800 via-blue-600 to-cyan-500 text-white py-14 px-6 text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3 font-space">{c.heroTitle}</h1>
        <p className="text-base md:text-lg opacity-90 max-w-2xl mx-auto font-dm">{c.heroSubtitle}</p>
      </section>

      <div className="mx-auto max-w-[1200px] px-6 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-10">
          {STATS.map((s) => (
            <div key={s.label} className="bg-white border border-bdl rounded-xl p-4 text-center">
              <div className="text-2xl font-extrabold text-blue-600">{s.number}</div>
              <div className="text-xs text-muted mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <h2 className="text-xl font-bold text-ink mb-4 font-space">{c.complianceAreas}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-10">
          {TOPICS.map((tp) => (
            <Link key={tp.to} to={tp.to} className="group bg-white border border-bdl rounded-xl p-5 no-underline text-ink hover:shadow-lg hover:-translate-y-0.5 transition-all">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 text-lg ${tp.color}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <h3 className="text-sm font-bold mb-1">{tp.title}</h3>
              <p className="text-xs text-muted mb-3 leading-relaxed">{tp.desc}</p>
              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${tp.badgeColor}`}>{tp.badge}</span>
            </Link>
          ))}
        </div>

        <h2 className="text-xl font-bold text-ink mb-4 font-space">{c.complianceGlance}</h2>
        <div className="overflow-x-auto rounded-xl border border-bdl mb-8">
          <table className="w-full text-sm">
            <thead className="bg-light">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-muted border-b-2 border-bdl">{c.colCompliance}</th>
                <th className="text-left px-4 py-3 font-semibold text-muted border-b-2 border-bdl">{c.colKeyReq}</th>
                <th className="text-left px-4 py-3 font-semibold text-muted border-b-2 border-bdl">{c.colApplicable}</th>
                <th className="text-left px-4 py-3 font-semibold text-muted border-b-2 border-bdl"></th>
              </tr>
            </thead>
            <tbody>
              {GLANCE.map((r) => (
                <tr key={r.name} className="border-b border-bdl hover:bg-light/50">
                  <td className="px-4 py-3 font-semibold">{r.name}</td>
                  <td className="px-4 py-3 text-muted">{r.req}</td>
                  <td className="px-4 py-3 text-muted">{r.who}</td>
                  <td className="px-4 py-3">
                    <Link to={r.to} className="text-xs font-bold text-cyan-2 hover:text-cyan no-underline">{c.viewLink} &rarr;</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <footer className="border-t border-bdl py-6 text-center text-xs text-muted">
        &copy; 2026 {c.heroTitle}. {c.footerDisclaimer}
      </footer>
    </>
  );
}
