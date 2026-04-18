import { Link } from 'react-router-dom';

const TOPICS = [
  {
    to: '/compliance/dpdp-act',
    title: 'DPDP Act 2023',
    desc: "India's first comprehensive data protection law. Consent, data fiduciary obligations, cross-border transfers, and penalties up to \u20B9250 crore.",
    badge: 'Data Protection',
    color: 'bg-blue-50 text-blue-600',
    badgeColor: 'bg-blue-100 text-blue-700',
  },
  {
    to: '/compliance/vapt',
    title: 'VAPT Requirements',
    desc: 'Vulnerability Assessment & Penetration Testing mandates from CERT-In, RBI, SEBI, and the DPDP Act.',
    badge: 'Security Testing',
    color: 'bg-cyan-50 text-cyan-600',
    badgeColor: 'bg-cyan-100 text-cyan-700',
  },
  {
    to: '/compliance/cert-in',
    title: 'CERT-In Directives',
    desc: 'April 2022 mandatory cybersecurity directions: 6-hour incident reporting, 180-day log retention, NTP sync.',
    badge: 'Mandatory',
    color: 'bg-red-50 text-red-600',
    badgeColor: 'bg-red-100 text-red-700',
  },
  {
    to: '/compliance/it-act',
    title: 'IT Act 2000',
    desc: "India's primary cyber law providing legal recognition to electronic records, digital signatures, and cybercrimes.",
    badge: 'Cyber Law',
    color: 'bg-green-50 text-green-600',
    badgeColor: 'bg-green-100 text-green-700',
  },
  {
    to: '/compliance/digital-records',
    title: 'Digital Records',
    desc: 'Bharatiya Sakshya Adhiniyam 2023 provisions on electronic evidence, dual certification, and admissibility.',
    badge: 'Evidence Law',
    color: 'bg-amber-50 text-amber-600',
    badgeColor: 'bg-amber-100 text-amber-700',
  },
  {
    to: '/compliance/safe-hosting',
    title: 'Safe Hosting',
    desc: 'MeitY & CERT-In guidelines for hosting infrastructure within India: pre-audit, HTTPS, WAF, DB encryption.',
    badge: 'Infrastructure',
    color: 'bg-blue-50 text-blue-600',
    badgeColor: 'bg-blue-100 text-blue-700',
  },
  {
    to: '/compliance/standards',
    title: 'Standards & Certifications',
    desc: 'ISO/IEC 27001, STQC certification, MeitY cloud empanelment, and NABCB-accredited bodies.',
    badge: 'Standards',
    color: 'bg-cyan-50 text-cyan-600',
    badgeColor: 'bg-cyan-100 text-cyan-700',
  },
  {
    to: '/compliance/firms',
    title: 'Legal Firms Directory',
    desc: 'DPDP/cyber law specialists, CERT-In empanelled auditors, and compliance consultants across Delhi, Mumbai, Chennai & Hyderabad.',
    badge: 'Directory',
    color: 'bg-green-50 text-green-600',
    badgeColor: 'bg-green-100 text-green-700',
  },
];

const STATS = [
  { number: '6 hrs', label: 'CERT-In Incident Reporting' },
  { number: '180 days', label: 'ICT Log Retention' },
  { number: '\u20B9250 Cr', label: 'Max DPDP Penalty' },
  { number: 'May 2027', label: 'DPDP Compliance Deadline' },
  { number: '5 years', label: 'VPN / Cloud KYC Retention' },
];

export default function ComplianceIndex() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-800 via-blue-600 to-cyan-500 text-white py-14 px-6 text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3 font-space">
          Indian Digital Compliance Guide
        </h1>
        <p className="text-base md:text-lg opacity-90 max-w-2xl mx-auto font-dm">
          VAPT, DPDP Act, CERT-In directives, IT Act, digital records, safe hosting, and standards adopted by the Indian Government.
        </p>
      </section>

      <div className="mx-auto max-w-[1200px] px-6 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-10">
          {STATS.map((s) => (
            <div key={s.label} className="bg-white border border-bdl rounded-xl p-4 text-center">
              <div className="text-2xl font-extrabold text-blue-600">{s.number}</div>
              <div className="text-xs text-muted mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Topic Cards */}
        <h2 className="text-xl font-bold text-ink mb-4 font-space">Compliance Areas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-10">
          {TOPICS.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              className="group bg-white border border-bdl rounded-xl p-5 no-underline text-ink hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 text-lg ${t.color}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <h3 className="text-sm font-bold mb-1">{t.title}</h3>
              <p className="text-xs text-muted mb-3 leading-relaxed">{t.desc}</p>
              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${t.badgeColor}`}>
                {t.badge}
              </span>
            </Link>
          ))}
        </div>

        {/* Overview Table */}
        <h2 className="text-xl font-bold text-ink mb-4 font-space">Compliance at a Glance</h2>
        <div className="overflow-x-auto rounded-xl border border-bdl mb-8">
          <table className="w-full text-sm">
            <thead className="bg-light">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-muted border-b-2 border-bdl">Compliance</th>
                <th className="text-left px-4 py-3 font-semibold text-muted border-b-2 border-bdl">Key Requirement</th>
                <th className="text-left px-4 py-3 font-semibold text-muted border-b-2 border-bdl">Applicable To</th>
                <th className="text-left px-4 py-3 font-semibold text-muted border-b-2 border-bdl"></th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'DPDP Act 2023', req: 'Consent, privacy notice, breach notification, DPO', who: 'All orgs processing personal data', to: '/compliance/dpdp-act' },
                { name: 'VAPT', req: 'Periodic vulnerability assessment & penetration testing', who: 'Banks, listed entities, govt bodies', to: '/compliance/vapt' },
                { name: 'CERT-In', req: '6-hour incident reporting, 180-day logs, NTP sync', who: 'All orgs with ICT in India', to: '/compliance/cert-in' },
                { name: 'IT Act 2000', req: 'E-records legality, data protection liability', who: 'All digital entities', to: '/compliance/it-act' },
                { name: 'Digital Records', req: 'E-evidence admissibility, dual certification', who: 'All entities with e-records', to: '/compliance/digital-records' },
                { name: 'Safe Hosting', req: 'Pre-audit, host in India, HTTPS, WAF', who: 'Govt websites, public apps', to: '/compliance/safe-hosting' },
                { name: 'Standards', req: 'ISO 27001 ISMS, cloud empanelment', who: 'Govt, CSPs, regulated industries', to: '/compliance/standards' },
              ].map((r) => (
                <tr key={r.name} className="border-b border-bdl hover:bg-light/50">
                  <td className="px-4 py-3 font-semibold">{r.name}</td>
                  <td className="px-4 py-3 text-muted">{r.req}</td>
                  <td className="px-4 py-3 text-muted">{r.who}</td>
                  <td className="px-4 py-3">
                    <Link to={r.to} className="text-xs font-bold text-cyan-2 hover:text-cyan no-underline">
                      View &rarr;
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <footer className="border-t border-bdl py-6 text-center text-xs text-muted">
        &copy; 2026 Indian Digital Compliance Guide. For informational purposes only &mdash; not legal advice.
      </footer>
    </>
  );
}
