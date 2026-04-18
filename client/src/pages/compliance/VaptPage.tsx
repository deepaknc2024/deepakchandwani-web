import { Hero, Breadcrumb, DataTable, Badge, InfoBox, ResourceList, Section, PageContainer } from './CompliancePage';

export default function VaptPage() {
  return (
    <>
      <Hero title="VAPT Requirements" subtitle="Vulnerability Assessment & Penetration Testing mandates across Indian regulatory frameworks" gradient="from-cyan-700 via-blue-600 to-slate-800" />
      <PageContainer>
        <Breadcrumb current="VAPT Requirements" />

        <Section title="Regulatory VAPT Mandates">
          <p className="text-sm text-muted mb-4">No single unified VAPT law in India — multiple sector regulators impose requirements.</p>
          <DataTable
            headers={['Regulator', 'Requirement', 'Frequency', 'Applies To']}
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

        <Section title="SEBI CSCRF Timeline">
          <InfoBox title="SEBI Cybersecurity & Cyber Resilience Framework (Aug 2024)" variant="highlight">
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Report submission:</strong> Within 1 month of testing</li>
              <li><strong>Vulnerability remediation:</strong> Within 3 months of report</li>
              <li><strong>Revalidation:</strong> Within 5 months of original testing</li>
              <li><strong>Critical patching:</strong> Within 24 hours (effective April 1, 2025)</li>
            </ul>
          </InfoBox>
        </Section>

        <Section title="RBI IT Governance Requirements">
          <InfoBox title="RBI Master Direction on IT Governance (2023)">
            <ul className="list-disc pl-5 space-y-1">
              <li>VAPT throughout lifecycle: pre-implementation, post-implementation, after major changes</li>
              <li>VA every <strong>6 months</strong> for critical systems</li>
              <li>PT at least <strong>annually</strong></li>
              <li>Non-critical: risk-based schedule with documented justification</li>
            </ul>
          </InfoBox>
        </Section>

        <Section title="Testing Standards">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {['OWASP Top 10 / ASVS', 'SANS Methodology', 'CIS Benchmarks', 'CERT-In Empanelled Auditors'].map((s) => (
              <div key={s} className="bg-white border border-bdl rounded-xl p-4">
                <h3 className="text-sm font-bold">{s}</h3>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Resources & References">
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
