import { Hero, Breadcrumb, StatStrip, InfoBox, DataTable, Badge, ResourceList, Section, PageContainer } from './CompliancePage';

export default function DpdpActPage() {
  return (
    <>
      <Hero title="DPDP Act 2023" subtitle="Digital Personal Data Protection Act — India's first comprehensive data protection law" />
      <PageContainer>
        <Breadcrumb current="DPDP Act 2023" />

        <StatStrip items={[
          { number: 'Aug 2023', label: 'Act Published' },
          { number: 'Nov 2025', label: 'Rules Notified' },
          { number: 'May 2027', label: 'Compliance Deadline' },
          { number: '\u20B9250 Cr', label: 'Maximum Penalty' },
        ]} />

        <Section title="Overview">
          <InfoBox title="What is the DPDP Act?" variant="highlight">
            <p>The Digital Personal Data Protection Act, 2023 is India's first comprehensive data protection legislation, establishing a framework for the processing of digital personal data.</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Applies to processing of digital personal data within India (collected online or offline-then-digitised)</li>
              <li>Extraterritorial: covers processing outside India if goods/services are offered to individuals in India</li>
              <li>DPDP Rules 2025 notified on November 13, 2025</li>
              <li>Substantive compliance: <strong>May 13, 2027</strong> (18 months from notification)</li>
            </ul>
          </InfoBox>
        </Section>

        <Section title="Key Obligations for Data Fiduciaries">
          <InfoBox title="1. Consent & Privacy Notice">
            <ul className="list-disc pl-5 space-y-1">
              <li>Obtain free, specific, informed, and unambiguous consent before processing</li>
              <li>Provide clear, plain-language privacy notices</li>
              <li>Consent can be withdrawn at any time</li>
            </ul>
          </InfoBox>
          <InfoBox title="2. Security Safeguards">
            <ul className="list-disc pl-5 space-y-1">
              <li>Implement <strong>reasonable security safeguards</strong> to prevent data breaches</li>
              <li>Failure carries penalties up to <strong>{'\u20B9'}250 crore</strong></li>
              <li>Includes regular security assessments including VAPT</li>
            </ul>
          </InfoBox>
          <InfoBox title="3. Breach Notification">
            <ul className="list-disc pl-5 space-y-1">
              <li>Notify the <strong>Data Protection Board</strong> AND affected individuals</li>
              <li>Failure to notify: penalty up to <strong>{'\u20B9'}200 crore</strong></li>
            </ul>
          </InfoBox>
          <InfoBox title="4. Data Erasure">
            <ul className="list-disc pl-5 space-y-1">
              <li>Erase personal data when consent is withdrawn or purpose is no longer served</li>
            </ul>
          </InfoBox>
          <InfoBox title="5. Children's Data">
            <ul className="list-disc pl-5 space-y-1">
              <li>Verifiable parental/guardian consent required</li>
              <li>Behavioural monitoring and targeted advertising to children is <strong>banned</strong></li>
              <li>Penalty up to <strong>{'\u20B9'}200 crore</strong></li>
            </ul>
          </InfoBox>
        </Section>

        <Section title="Significant Data Fiduciaries (SDFs)">
          <InfoBox title="Additional Obligations" variant="warning">
            <ul className="list-disc pl-5 space-y-1">
              <li>Appoint a <strong>Data Protection Officer (DPO)</strong> based in India</li>
              <li>Appoint an independent data auditor</li>
              <li>Conduct periodic <strong>Data Protection Impact Assessments</strong></li>
              <li>Certain data categories must NOT be transferred outside India</li>
            </ul>
          </InfoBox>
        </Section>

        <Section title="Cross-Border Data Transfers">
          <InfoBox title="Blacklist Approach">
            <ul className="list-disc pl-5 space-y-1">
              <li>Data can flow to any country <strong>unless</strong> the Central Government specifically restricts it</li>
              <li>No blanket data localisation requirement (unlike earlier drafts)</li>
              <li>SDFs face localisation for notified data categories</li>
            </ul>
          </InfoBox>
        </Section>

        <Section title="Penalty Schedule">
          <DataTable
            headers={['Violation', 'Maximum Penalty']}
            rows={[
              ['Failure to maintain reasonable security safeguards', <Badge color="red">{'\u20B9'}250 Crore</Badge>],
              ['Failure to notify breach to Board and individuals', <Badge color="red">{'\u20B9'}200 Crore</Badge>],
              ['Breach of obligations relating to children', <Badge color="red">{'\u20B9'}200 Crore</Badge>],
              ['Breach of duty by Data Principal (false complaints)', <Badge color="amber">{'\u20B9'}10,000</Badge>],
            ]}
          />
        </Section>

        <Section title="Official Resources & References">
          <ResourceList items={[
            { href: 'https://www.ey.com/en_in/insights/cybersecurity/decoding-the-digital-personal-data-protection-act-2023', title: 'EY India — DPDP Act Compliance Guide', desc: 'Comprehensive decoding' },
            { href: 'https://www.dpdpact2023.com/chapter-2', title: 'DPDP Act 2023 — Chapter 2: Obligations', desc: 'Full text' },
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
