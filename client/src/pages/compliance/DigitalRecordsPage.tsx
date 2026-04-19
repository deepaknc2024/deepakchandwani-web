import { useLanguage } from '@/contexts/LanguageContext';
import { Hero, Breadcrumb, InfoBox, DataTable, Badge, ResourceList, Section, PageContainer } from './CompliancePage';

export default function DigitalRecordsPage() {
  const { t } = useLanguage();
  const c = t.compliance;

  return (
    <>
      <Hero title={c.drTitle} subtitle={c.drSubtitle} gradient="from-amber-800 via-amber-600 to-orange-500" />
      <PageContainer>
        <Breadcrumb current={c.drTitle} />

        <InfoBox title={c.drBsaEffective} variant="highlight">
          <p>{c.drBsaDesc}</p>
        </InfoBox>

        <Section title={c.drDocDef}>
          <InfoBox title={c.drDocTitle}>
            <ul className="list-disc pl-5 space-y-1">
              <li>Emails and electronic communications</li>
              <li>Server logs and system logs</li>
              <li>Files on computers, phones, and digital devices</li>
              <li>Text messages and instant messages</li>
              <li>Website content and digital publications</li>
              <li>Location data and GPS records</li>
              <li>Voicemails and voice recordings</li>
            </ul>
          </InfoBox>
        </Section>

        <Section title={c.drSec63}>
          <InfoBox title={c.drSec63Title}>
            <ul className="list-disc pl-5 space-y-1">
              <li>Electronic records deemed a <strong>"document"</strong> and admissible as evidence</li>
              <li>Can serve as <strong>PRIMARY evidence</strong> — no physical copies needed</li>
              <li>Significantly simplifies the admissibility process</li>
            </ul>
          </InfoBox>
        </Section>

        <Section title={c.drAuth}>
          <InfoBox title={c.drAuthTitle} variant="warning">
            <p className="mb-2">A certificate must be signed by:</p>
            <ul className="list-disc pl-5 space-y-1 mb-2">
              <li><strong>1. The person in charge of the device</strong> — custodian of the system</li>
              <li><strong>2. An expert</strong> — qualified digital forensics or IT professional</li>
            </ul>
            <p className="font-medium mb-1">The certificate must include:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>The <strong>hash value</strong> of the electronic record</li>
              <li>The <strong>algorithm used</strong> for hashing</li>
              <li>Hash value verifies integrity (tampering is detectable)</li>
            </ul>
          </InfoBox>
        </Section>

        <Section title={c.drChain}>
          <InfoBox title={c.drChainTitle} variant="danger">
            <ul className="list-disc pl-5 space-y-1">
              <li>Every instance of handling, transferring, or accessing must be <strong>documented</strong></li>
              <li>Without documented chain, evidence may be deemed <strong>inadmissible</strong></li>
              <li>Applies from collection through presentation in court</li>
            </ul>
          </InfoBox>
        </Section>

        <Section title={c.drRetention}>
          <DataTable
            headers={[c.drColRegulation, c.drColPeriod, c.drColRecords]}
            rows={[
              ['CERT-In Directive 2022', <Badge color="blue">180 days (rolling)</Badge>, 'All ICT system logs'],
              ['CERT-In Directive 2022', <Badge color="red">5 years</Badge>, 'VPN subscriber, cloud KYC, crypto records'],
              ['Companies Act 2013', <Badge color="amber">8 years</Badge>, 'Financial records, books of accounts'],
              ['IT Act Section 7', <Badge color="cyan">As per law</Badge>, 'Electronic records fulfilling legal obligations'],
              ['Income Tax Act', <Badge color="amber">6–8 years</Badge>, 'Financial records and returns'],
              ['GST Act', <Badge color="amber">6 years</Badge>, 'GST records and invoices'],
            ]}
          />
        </Section>

        <Section title={c.drResources}>
          <ResourceList items={[
            { href: 'https://www.livelaw.in/top-stories/bharatiya-sakshya-adhiniyam-changes-electronic-evidence-admissibility-explainer-245852', title: 'LiveLaw — BSA 2023 Electronic Evidence Explainer' },
            { href: 'https://www.acmlegal.org/blog/digital-transformation-in-the-indian-legal-framework-bharatiya-sakshya-adhiniyam-2023-bsa/', title: 'ACM Legal — BSA 2023 Digital Transformation' },
            { href: 'https://www.ijllr.com/post/admissibility-of-electronic-record-and-the-dual-certification-regime-under-bsa-2023', title: 'IJLLR — Dual Certification Regime' },
            { href: 'https://taxguru.in/corporate-law/bharatiya-sakshya-bill-2023-admissibility-electronic-digital-records-evidence.html', title: 'Tax Guru — E-Evidence under BSA 2023' },
            { href: 'https://law.asia/electronic-evidence-indian-law/', title: 'Law.Asia — Electronic Evidence in Indian Law' },
          ]} />
        </Section>
      </PageContainer>
    </>
  );
}
