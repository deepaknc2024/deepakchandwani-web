import { useLanguage } from '@/contexts/LanguageContext';
import { Hero, Breadcrumb, DataTable, Badge, InfoBox, ResourceList, Section, PageContainer } from './CompliancePage';

export default function ItActPage() {
  const { t } = useLanguage();
  const c = t.compliance;

  return (
    <>
      <Hero title={c.itTitle} subtitle={c.itSubtitle} gradient="from-green-800 via-green-600 to-cyan-500" />
      <PageContainer>
        <Breadcrumb current={c.itTitle} />

        <Section title={c.itKeySections}>
          <DataTable
            headers={[c.itColSection, c.itColSubject, c.itColDetails]}
            rows={[
              [<Badge color="blue">Sec 4</Badge>, <strong>Legal Recognition of E-Records</strong>, 'Electronic records are legally equivalent to paper documents'],
              [<Badge color="blue">Sec 5</Badge>, <strong>Legal Recognition of E-Signatures</strong>, 'E-signatures have same legal standing as handwritten'],
              [<Badge color="blue">Sec 6</Badge>, <strong>E-Governance</strong>, 'Mandates use of electronic records by government agencies'],
              [<Badge color="blue">Sec 7</Badge>, <strong>Retention of E-Records</strong>, 'Authorises electronic retention to fulfil legal requirements'],
              [<Badge color="cyan">Sec 3A</Badge>, <strong>Electronic Signatures (2008)</strong>, 'Technology-neutral: Aadhaar eSign, OTP-based signing'],
              [<Badge color="red">Sec 43A</Badge>, <strong>Corporate Data Protection Liability</strong>, 'Liable for compensation if reasonable security practices fail'],
              [<Badge color="cyan">Sec 70B</Badge>, <strong>CERT-In</strong>, 'National agency for cybersecurity incident response'],
              [<Badge color="green">Sec 79</Badge>, <strong>Intermediary Liability</strong>, 'Safe harbour for intermediaries with due diligence'],
            ]}
          />
        </Section>

        <Section title={c.itCybercrime}>
          <DataTable
            headers={[c.itColSection, c.itColOffence, c.itColPenalty]}
            rows={[
              [<Badge color="red">Sec 66C</Badge>, 'Identity theft (fraudulent use of e-signatures/passwords)', 'Up to 3 years + \u20B91 lakh fine'],
              [<Badge color="red">Sec 66D</Badge>, 'Cheating by impersonation using computer resources', 'Up to 3 years + \u20B91 lakh fine'],
              [<Badge color="red">Sec 66E</Badge>, 'Privacy violation (capturing/publishing private images)', 'Up to 3 years + \u20B92 lakh fine'],
              [<Badge color="red">Sec 66F</Badge>, 'Cyber terrorism', <strong>Life imprisonment</strong>],
              [<Badge color="amber">Sec 69</Badge>, 'Power to intercept/monitor/decrypt', 'Government directed interception'],
            ]}
          />
        </Section>

        <Section title={c.itAmendments}>
          <InfoBox title="2008 Amendment">
            <ul className="list-disc pl-5 space-y-1">
              <li>Added Section 43A (corporate data liability)</li>
              <li>Added Sections 66A-F (new cybercrimes)</li>
              <li>Added Section 3A (technology-neutral e-signatures)</li>
              <li>Strengthened intermediary provisions</li>
            </ul>
          </InfoBox>
          <InfoBox title="2011 Rules">
            <ul className="list-disc pl-5 space-y-1">
              <li>IT (Reasonable Security Practices) Rules under Section 43A</li>
              <li>Defined sensitive personal data categories</li>
              <li>Referenced ISO 27001 as security standard</li>
            </ul>
          </InfoBox>
          <InfoBox title="2023 Amendment (Jan Vishwas Act)">
            <ul className="list-disc pl-5 space-y-1">
              <li>Section 66A (offensive messages) was omitted</li>
              <li>Decriminalised several minor offences</li>
            </ul>
          </InfoBox>
        </Section>

        <Section title={c.itResources}>
          <ResourceList items={[
            { href: 'https://www.indiacode.nic.in/bitstream/123456789/13116/1/it_act_2000_updated.pdf', title: 'India Code — IT Act 2000 Full Text (PDF)' },
            { href: 'https://cleartax.in/s/it-act-2000', title: 'ClearTax — IT Act 2000 Overview' },
            { href: 'https://indiankanoon.org/doc/1965344/', title: 'Indian Kanoon — IT Act 2000' },
            { href: 'https://thelaw.institute/privacy-and-data-protection/information-technology-act-2000-india-cyber-law/', title: 'TheLaw.Institute — IT Act Analysis' },
          ]} />
        </Section>
      </PageContainer>
    </>
  );
}
