import { useLanguage } from '@/contexts/LanguageContext';
import { Hero, Breadcrumb, StatStrip, InfoBox, DataTable, Badge, ResourceList, Section, PageContainer } from './CompliancePage';

export default function DpdpActPage() {
  const { t } = useLanguage();
  const c = t.compliance;

  return (
    <>
      <Hero title={c.dpdpTitle} subtitle={c.dpdpSubtitle} />
      <PageContainer>
        <Breadcrumb current={c.dpdpTitle} />

        <StatStrip items={[
          { number: 'Aug 2023', label: c.dpdpStatPublished },
          { number: 'Nov 2025', label: c.dpdpStatRules },
          { number: 'May 2027', label: c.dpdpStatDeadline },
          { number: '\u20B9250 Cr', label: c.dpdpStatPenalty },
        ]} />

        <Section title={c.dpdpOverview}>
          <InfoBox title={c.dpdpWhatIs} variant="highlight">
            <p>{c.dpdpWhatIsDesc}</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>{c.dpdpScope1}</li>
              <li>{c.dpdpScope2}</li>
              <li>{c.dpdpScope3}</li>
              <li><strong>{c.dpdpScope4}</strong></li>
            </ul>
          </InfoBox>
        </Section>

        <Section title={c.dpdpObligations}>
          <InfoBox title={c.dpdpConsent}>
            <ul className="list-disc pl-5 space-y-1">
              <li>{c.dpdpConsent1}</li>
              <li>{c.dpdpConsent2}</li>
              <li>{c.dpdpConsent3}</li>
            </ul>
          </InfoBox>
          <InfoBox title={c.dpdpSecurity}>
            <ul className="list-disc pl-5 space-y-1">
              <li>{c.dpdpSecurity1}</li>
              <li><strong>{c.dpdpSecurity2}</strong></li>
              <li>{c.dpdpSecurity3}</li>
            </ul>
          </InfoBox>
          <InfoBox title={c.dpdpBreach}>
            <ul className="list-disc pl-5 space-y-1">
              <li>{c.dpdpBreach1}</li>
              <li><strong>{c.dpdpBreach2}</strong></li>
            </ul>
          </InfoBox>
          <InfoBox title={c.dpdpErasure}>
            <ul className="list-disc pl-5 space-y-1">
              <li>{c.dpdpErasure1}</li>
            </ul>
          </InfoBox>
          <InfoBox title={c.dpdpChildren}>
            <ul className="list-disc pl-5 space-y-1">
              <li>{c.dpdpChildren1}</li>
              <li><strong>{c.dpdpChildren2}</strong></li>
              <li><strong>{c.dpdpChildren3}</strong></li>
            </ul>
          </InfoBox>
        </Section>

        <Section title={c.dpdpSdf}>
          <InfoBox title={c.dpdpSdfTitle} variant="warning">
            <ul className="list-disc pl-5 space-y-1">
              <li>{c.dpdpSdf1}</li>
              <li>{c.dpdpSdf2}</li>
              <li>{c.dpdpSdf3}</li>
              <li>{c.dpdpSdf4}</li>
            </ul>
          </InfoBox>
        </Section>

        <Section title={c.dpdpCrossBorder}>
          <InfoBox title={c.dpdpBlacklist}>
            <ul className="list-disc pl-5 space-y-1">
              <li>{c.dpdpCross1}</li>
              <li>{c.dpdpCross2}</li>
              <li>{c.dpdpCross3}</li>
            </ul>
          </InfoBox>
        </Section>

        <Section title={c.dpdpPenalties}>
          <DataTable
            headers={[c.dpdpPenCol1, c.dpdpPenCol2]}
            rows={[
              [c.dpdpPen1, <Badge color="red">{'\u20B9'}250 Crore</Badge>],
              [c.dpdpPen2, <Badge color="red">{'\u20B9'}200 Crore</Badge>],
              [c.dpdpPen3, <Badge color="red">{'\u20B9'}200 Crore</Badge>],
              [c.dpdpPen4, <Badge color="amber">{'\u20B9'}10,000</Badge>],
            ]}
          />
        </Section>

        <Section title={c.dpdpResources}>
          <ResourceList items={[
            { href: 'https://www.ey.com/en_in/insights/cybersecurity/decoding-the-digital-personal-data-protection-act-2023', title: 'EY India — DPDP Act Compliance Guide' },
            { href: 'https://www.dpdpact2023.com/chapter-2', title: 'DPDP Act 2023 — Chapter 2: Obligations' },
            { href: 'https://www.india-briefing.com/news/dpdp-rules-2025-india-data-protection-law-compliance-40769.html/', title: 'India Briefing — DPDP Rules 2025' },
            { href: 'https://complinity.com/blog/compliance/compliances-and-penalties-under-the-digital-personal-data-protection-dpdp-act-2023/', title: 'Complinity — Penalties Under DPDP Act' },
            { href: 'https://www.mondaq.com/india/data-protection/1764976/', title: 'Mondaq — Cross-Border Transfer Rules' },
            { href: 'https://static.pib.gov.in/WriteReadData/specificdocs/documents/2025/nov/doc20251117695301.pdf', title: 'PIB — DPDP Rules 2025 Official (PDF)' },
          ]} />
        </Section>
      </PageContainer>
    </>
  );
}
