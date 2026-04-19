import { useLanguage } from '@/contexts/LanguageContext';
import { Hero, Breadcrumb, StatStrip, InfoBox, DataTable, ResourceList, Section, PageContainer } from './CompliancePage';

export default function CertInPage() {
  const { t } = useLanguage();
  const c = t.compliance;

  return (
    <>
      <Hero title={c.certTitle} subtitle={c.certSubtitle} gradient="from-red-900 via-red-600 to-orange-500" />
      <PageContainer>
        <Breadcrumb current={c.certTitle} />

        <InfoBox title={c.certMandatory} variant="danger">
          <p>{c.certMandatoryDesc}</p>
        </InfoBox>

        <StatStrip items={[
          { number: '6 hrs', label: c.statIncident },
          { number: '180 days', label: c.statLogs },
          { number: '5 years', label: c.statKyc },
          { number: 'NTP', label: c.certNtp },
        ]} />

        <Section title={c.certKeyReqs}>
          <InfoBox title={c.certIncident}>
            <p className="mb-2">{c.certIncidentDesc}</p>
            <p className="font-medium mb-1">{c.certIncidentTypes}</p>
            <ul className="list-disc pl-5 space-y-0.5">
              <li>Unauthorised access to IT systems</li>
              <li>Malware attacks (ransomware, trojans, worms)</li>
              <li>Data breaches and data leaks</li>
              <li>DDoS attacks</li>
              <li>Identity theft and spoofing</li>
              <li>Phishing attacks</li>
              <li>Website defacement and web jacking</li>
              <li>Attacks on critical infrastructure and IoT</li>
            </ul>
          </InfoBox>

          <InfoBox title={c.certLogs}>
            <ul className="list-disc pl-5 space-y-1">
              <li>{c.certLog1}</li>
              <li>{c.certLog2}</li>
              <li>{c.certLog3}</li>
            </ul>
          </InfoBox>

          <InfoBox title={c.certNtp}>
            <ul className="list-disc pl-5 space-y-1">
              <li>{c.certNtp1}</li>
              <li>{c.certNtp2}</li>
            </ul>
          </InfoBox>

          <InfoBox title={c.certVpn}>
            <ul className="list-disc pl-5 space-y-1">
              <li>{c.certVpn1}</li>
              <li>{c.certVpn2}</li>
            </ul>
          </InfoBox>

          <InfoBox title={c.certCloud}>
            <ul className="list-disc pl-5 space-y-1">
              <li>{c.certCloud1}</li>
              <li>{c.certCloud2}</li>
            </ul>
          </InfoBox>

          <InfoBox title={c.certCrypto}>
            <ul className="list-disc pl-5 space-y-1">
              <li>{c.certCrypto1}</li>
              <li>{c.certCrypto2}</li>
            </ul>
          </InfoBox>
        </Section>

        <Section title={c.certWhoTitle}>
          <DataTable
            headers={[c.certColEntity, c.certColObligations]}
            rows={[
              ['Service Providers', '6-hour reporting, 180-day logs, NTP sync'],
              ['Intermediaries', '6-hour reporting, 180-day logs, NTP sync'],
              ['Data Centres', 'All above + 5-year KYC retention'],
              ['VPN Providers', 'All above + 5-year subscriber data'],
              ['Cloud Service Providers', 'All above + 5-year customer KYC'],
              ['Crypto / Virtual Asset Providers', 'All above + 5-year transaction records'],
              ['Government Organisations', 'All applicable requirements'],
              ['Body Corporates', '6-hour reporting, 180-day logs, NTP sync'],
            ]}
          />
        </Section>

        <Section title={c.certResources}>
          <ResourceList items={[
            { href: 'https://www.cert-in.org.in/PDF/CERT-In_Directions_70B_28.04.2022.pdf', title: 'CERT-In Directions — Official PDF' },
            { href: 'https://www.upguard.com/blog/indias-6-hour-data-breach-reporting-rule', title: "UpGuard — India's 6-Hour Rule" },
            { href: 'https://www.internetsociety.org/resources/doc/2022/internet-impact-brief-india-cert-in-cybersecurity-directions-2022/', title: 'Internet Society — Impact Analysis' },
            { href: 'https://www.sisainfosec.com/blogs/cert-in-directive-a-step-to-strengthen-indias-cybersecurity-posture/', title: 'SISA — CERT-In Analysis' },
            { href: 'https://mailarmor.ai/cert-in-compliance-guide', title: 'MailArmor — Compliance Guide' },
          ]} />
        </Section>
      </PageContainer>
    </>
  );
}
