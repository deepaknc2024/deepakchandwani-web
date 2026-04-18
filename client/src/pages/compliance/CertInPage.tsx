import { Hero, Breadcrumb, StatStrip, InfoBox, DataTable, ResourceList, Section, PageContainer } from './CompliancePage';

export default function CertInPage() {
  return (
    <>
      <Hero title="CERT-In Directives" subtitle="April 2022 mandatory cybersecurity directions for all organisations in India" gradient="from-red-900 via-red-600 to-orange-500" />
      <PageContainer>
        <Breadcrumb current="CERT-In Directives" />

        <InfoBox title="Mandatory Compliance" variant="danger">
          <p>These directions (No. 20(3)/2022-CERT-In, dated April 28, 2022) are <strong>mandatory</strong> for all service providers, intermediaries, data centres, body corporates, and government organisations. Non-compliance attracts penalties under the IT Act.</p>
        </InfoBox>

        <StatStrip items={[
          { number: '6 hrs', label: 'Incident Reporting' },
          { number: '180 days', label: 'Log Retention' },
          { number: '5 years', label: 'KYC Retention' },
          { number: 'NTP', label: 'Clock Sync Required' },
        ]} />

        <Section title="Key Requirements">
          <InfoBox title="1. Incident Reporting — 6-Hour Rule">
            <p className="mb-2">ALL cyber incidents must be reported to CERT-In within <strong>6 hours of discovery</strong>.</p>
            <p className="font-medium mb-1">Reportable incidents include:</p>
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

          <InfoBox title="2. Log Retention — 180 Days">
            <ul className="list-disc pl-5 space-y-1">
              <li>All ICT system logs maintained securely for <strong>180 days (rolling)</strong></li>
              <li>Logs must be stored <strong>within Indian jurisdiction</strong></li>
              <li>Must be provided to CERT-In on demand</li>
            </ul>
          </InfoBox>

          <InfoBox title="3. Time Synchronisation">
            <ul className="list-disc pl-5 space-y-1">
              <li>Sync ICT clocks to <strong>NTP servers of NIC or NPL</strong></li>
              <li>Or to NTP servers traceable to these sources</li>
            </ul>
          </InfoBox>

          <InfoBox title="4. VPN Provider Requirements">
            <ul className="list-disc pl-5 space-y-1">
              <li>Maintain subscriber records for <strong>5 years</strong> (even after cancellation)</li>
              <li>Records: customer names, period of hire, IPs allotted, email, address, contacts, purpose</li>
            </ul>
          </InfoBox>

          <InfoBox title="5. Cloud & Data Centre Provider Requirements">
            <ul className="list-disc pl-5 space-y-1">
              <li>Maintain customer <strong>KYC records for 5 years</strong></li>
              <li>Records: validated names, addresses, contacts, IPs, ownership patterns</li>
            </ul>
          </InfoBox>

          <InfoBox title="6. Virtual Asset / Crypto Requirements">
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>KYC + transaction records for 5 years</strong></li>
              <li>Transactions must be reconstructible: party IDs, IPs, timestamps, public keys, amounts</li>
            </ul>
          </InfoBox>
        </Section>

        <Section title="Who Must Comply?">
          <DataTable
            headers={['Entity Type', 'Key Obligations']}
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

        <Section title="Resources & References">
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
