import { useLanguage } from '@/contexts/LanguageContext';
import { Hero, Breadcrumb, DataTable, Badge, InfoBox, ResourceList, Section, PageContainer } from './CompliancePage';

export default function VaptPage() {
  const { t } = useLanguage();
  const c = t.compliance;

  return (
    <>
      <Hero title={c.vaptTitle} subtitle={c.vaptSubtitle} gradient="from-cyan-700 via-blue-600 to-slate-800" />
      <PageContainer>
        <Breadcrumb current={c.vaptTitle} />

        <Section title={c.vaptMandates}>
          <p className="text-sm text-muted mb-4">{c.vaptMandatesDesc}</p>
          <DataTable
            headers={[c.vaptColRegulator, c.vaptColReq, c.vaptColFreq, c.vaptColApplies]}
            rows={[
              [<strong>CERT-In</strong>, 'VAPT for critical systems; empanelled auditors for govt', <Badge color="blue">Annually</Badge>, 'Government, critical infra'],
              [<strong>RBI</strong>, 'Vulnerability Assessment for critical systems', <Badge color="red">Every 6 months</Badge>, 'Banks, NBFCs, fintech'],
              [<strong>RBI</strong>, 'Penetration Testing for critical systems', <Badge color="blue">Annually</Badge>, 'Banks, NBFCs, fintech'],
              [<strong>SEBI (CSCRF)</strong>, 'Regular VAPT; report within 1 month; remediate within 3', <Badge color="blue">Regular</Badge>, 'Exchanges, brokers, MFs'],
              [<strong>SEBI</strong>, 'Critical vulnerability patching', <Badge color="red">24 hours</Badge>, 'All SEBI entities (Apr 2025)'],
              [<strong>DPDP Act</strong>, 'Reasonable security safeguards including VAPT', <Badge color="amber">As needed</Badge>, 'All orgs processing data'],
            ]}
          />
        </Section>

        <Section title={c.vaptSebiTimeline}>
          <InfoBox title={c.vaptSebiTitle} variant="highlight">
            <ul className="list-disc pl-5 space-y-1">
              <li>{c.vaptSebi1}</li>
              <li>{c.vaptSebi2}</li>
              <li>{c.vaptSebi3}</li>
              <li>{c.vaptSebi4}</li>
            </ul>
          </InfoBox>
        </Section>

        <Section title={c.vaptRbi}>
          <InfoBox title={c.vaptRbiTitle}>
            <ul className="list-disc pl-5 space-y-1">
              <li>{c.vaptRbi1}</li>
              <li>{c.vaptRbi2}</li>
              <li>{c.vaptRbi3}</li>
              <li>{c.vaptRbi4}</li>
            </ul>
          </InfoBox>
        </Section>

        <Section title={c.vaptStandards}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {['OWASP Top 10 / ASVS', 'SANS Methodology', 'CIS Benchmarks', 'CERT-In Empanelled Auditors'].map((s) => (
              <div key={s} className="bg-white border border-bdl rounded-xl p-4">
                <h3 className="text-sm font-bold">{s}</h3>
              </div>
            ))}
          </div>
        </Section>

        <Section title={c.vaptResources}>
          <ResourceList items={[
            { href: 'https://www.indusface.com/blog/decoding-sebis-cscrf/', title: 'Indusface — SEBI CSCRF Decoding' },
            { href: 'https://radiant.in/vulnerability-assessment-penetration-testing-vapt-india-2025-updates-radiant-article/', title: 'Radiant — VAPT India 2025 Updates' },
            { href: 'https://www.cybernx.com/vapt-requirements-in-the-rbi-it-governance-risk-guidelines/', title: 'CyberNX — RBI VAPT Requirements' },
            { href: 'https://www.getastra.com/blog/compliance/rbi-cybersecurity-compliance-checklist/', title: 'Astra — RBI Cybersecurity Checklist' },
            { href: 'https://kratikal.com/blog/navigating-sebi-2024-updated-cybersecurity-framework-key-revisions/', title: 'Kratikal — SEBI 2024 Revisions' },
          ]} />
        </Section>
      </PageContainer>
    </>
  );
}
