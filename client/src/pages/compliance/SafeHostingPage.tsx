import { useLanguage } from '@/contexts/LanguageContext';
import { Hero, Breadcrumb, InfoBox, ResourceList, Section, PageContainer } from './CompliancePage';

export default function SafeHostingPage() {
  const { t } = useLanguage();
  const c = t.compliance;

  return (
    <>
      <Hero title={c.shTitle} subtitle={c.shSubtitle} />
      <PageContainer>
        <Breadcrumb current={c.shTitle} />

        <Section title={c.shChecklist}>
          <InfoBox title={c.shPreAudit} variant="danger">
            <ul className="list-disc pl-5 space-y-1">
              <li>ALL websites, web apps, portals, and mobile apps must be audited <strong>BEFORE production</strong></li>
              <li>Clearance certificate required from: <strong>NIC, STQC, or CERT-In empanelled lab</strong></li>
            </ul>
          </InfoBox>

          <InfoBox title={c.shInfra}>
            <ul className="list-disc pl-5 space-y-1">
              <li>Web infrastructure <strong>MUST be hosted within India</strong></li>
              <li>High availability configuration required</li>
              <li>Data centre + business continuity + disaster recovery mandatory</li>
              <li>Annual DR drills required</li>
              <li>Physical security controls must be in place</li>
            </ul>
          </InfoBox>

          <InfoBox title={c.shSsl}>
            <ul className="list-disc pl-5 space-y-1">
              <li>HTTP disabled; <strong>HTTPS enforced with HSTS</strong></li>
              <li>Minimum <strong>2048-bit SHA-256</strong> SSL certificates</li>
              <li>Disable: SSLv2, SSLv3, 3DES, RC4, TLS 1.0, TLS 1.1</li>
              <li>Certificate expiry tracking and timely renewal</li>
            </ul>
          </InfoBox>

          <InfoBox title={c.shWaf}>
            <ul className="list-disc pl-5 space-y-1">
              <li>WAF must be deployed, configured, and hardened</li>
              <li>Regular rule updates for emerging threats</li>
            </ul>
          </InfoBox>

          <InfoBox title={c.shDb}>
            <ul className="list-disc pl-5 space-y-1">
              <li>Encryption for <strong>data at rest and in transit</strong></li>
              <li>Hashing and salting for password storage</li>
              <li>Secure credentials and RBAC</li>
              <li>Audit trail logging</li>
              <li>Regular off-site backups</li>
            </ul>
          </InfoBox>

          <InfoBox title={c.shLogs}>
            <ul className="list-disc pl-5 space-y-1">
              <li>Infrastructure logs for rolling <strong>180 days</strong></li>
              <li>Tamper-proof and securely stored</li>
              <li>Available for CERT-In on demand</li>
            </ul>
          </InfoBox>

          <InfoBox title={c.shNetwork}>
            <ul className="list-disc pl-5 space-y-1">
              <li>Network segmentation and firewall configuration</li>
              <li>Identity and access management (IAM)</li>
              <li>Cloud security controls</li>
              <li>Regular VAPT with corrective actions</li>
            </ul>
          </InfoBox>
        </Section>

        <Section title={c.shFrameworks}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { name: 'GIGW', desc: 'Guidelines for Indian Government Websites and Apps' },
              { name: 'GISPI', desc: 'Information Security Practices for Government Entities' },
              { name: 'CISO Best Practices', desc: 'CISOs Top Best Practices by MeitY' },
            ].map((f) => (
              <div key={f.name} className="bg-white border border-bdl rounded-xl p-4">
                <h3 className="text-sm font-bold mb-1">{f.name}</h3>
                <p className="text-xs text-muted">{f.desc}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title={c.shResources}>
          <ResourceList items={[
            { href: 'https://guidelines.india.gov.in/security-guidelines-and-attributes/', title: 'GIGW — Security Guidelines' },
            { href: 'https://www.cert-in.org.in/PDF/guidelinesgovtentities.pdf', title: 'CERT-In — GISPI Full Document (PDF)' },
            { href: 'https://www.meity.gov.in/guidelines-information-security-practices-government-entities-safe-trusted-internet', title: 'MeitY — GISPI Page' },
            { href: 'https://www.meity.gov.in/cisos-top-best-practices-guidelines', title: 'MeitY — CISO Best Practices' },
            { href: 'https://www.csk.gov.in/security-best-practices.html', title: 'Cyber Swachhta Kendra — Best Practices' },
            { href: 'https://cyberpeace.org/resources/blogs/guidelines-on-information-security-practices', title: 'CyberPeace — GISPI Analysis' },
          ]} />
        </Section>
      </PageContainer>
    </>
  );
}
