import { useLanguage } from '@/contexts/LanguageContext';
import { Hero, Breadcrumb, InfoBox, DataTable, Badge, ResourceList, Section, PageContainer } from './CompliancePage';

export default function StandardsPage() {
  const { t } = useLanguage();
  const c = t.compliance;

  return (
    <>
      <Hero title={c.stdTitle} subtitle={c.stdSubtitle} gradient="from-cyan-700 via-cyan-500 to-blue-600" />
      <PageContainer>
        <Breadcrumb current={c.stdTitle} />

        <Section title={c.stdCore}>
          <InfoBox title={c.stdIso} variant="highlight">
            <ul className="list-disc pl-5 space-y-1">
              <li>Cornerstone standard for information security management in India</li>
              <li>STQC has offered certification since November 2001</li>
              <li>Accredited by <strong>NABCB</strong> (Quality Council of India)</li>
              <li>Mandatory for government entities and CSPs seeking MeitY empanelment</li>
            </ul>
          </InfoBox>

          <InfoBox title={c.stdCloud}>
            <p className="mb-2">Cloud Service Providers must comply with:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>ISO 27001</strong> — Information Security Management</li>
              <li><strong>ISO 27017</strong> — Cloud Security Controls</li>
              <li><strong>ISO 27018</strong> — PII Protection in Public Cloud</li>
              <li><strong>ISO 20000</strong> — IT Service Management</li>
            </ul>
            <p className="text-xs text-muted mt-2">Audit performed by STQC Directorate</p>
          </InfoBox>

          <InfoBox title={c.stdOther}>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>IS 15150 / IS/ISO 15408</strong> — Common Criteria for IT security evaluation</li>
              <li><strong>CIS Benchmarks</strong> — Configuration security baselines</li>
              <li><strong>OWASP ASVS</strong> — Application Security Verification Standard</li>
            </ul>
          </InfoBox>
        </Section>

        <Section title={c.stdStqc}>
          <InfoBox title={c.stdStqcAbout}>
            <ul className="list-disc pl-5 space-y-1">
              <li>Established 1980 under MeitY</li>
              <li>ISO 27001 certification, IT product testing, website quality certification</li>
              <li>Security audits for government websites before go-live</li>
              <li>Lead Auditor training for ISMS (ISO/IEC 27001)</li>
              <li>NABCB-accredited certification body</li>
            </ul>
          </InfoBox>
        </Section>

        <Section title={c.stdBodies}>
          <p className="text-xs text-muted mb-3">Verify accreditation at <a href="https://nabcb.qci.org.in" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 no-underline">nabcb.qci.org.in</a></p>
          <DataTable
            headers={[c.stdColBody, c.stdColOrigin, c.stdColWebsite]}
            rows={[
              [<strong>STQC</strong>, <Badge color="green">India</Badge>, <a href="https://stqc.gov.in" target="_blank" rel="noopener noreferrer" className="text-blue-600 no-underline">stqc.gov.in</a>],
              [<strong>BSI Group India</strong>, <Badge color="blue">UK</Badge>, <a href="https://bsigroup.com/en-IN" target="_blank" rel="noopener noreferrer" className="text-blue-600 no-underline">bsigroup.com/en-IN</a>],
              [<strong>TUV SUD South Asia</strong>, <Badge color="blue">Germany</Badge>, <a href="https://tuvsud.com/en-in" target="_blank" rel="noopener noreferrer" className="text-blue-600 no-underline">tuvsud.com/en-in</a>],
              [<strong>Bureau Veritas India</strong>, <Badge color="blue">France</Badge>, <a href="https://bureauveritas.co.in" target="_blank" rel="noopener noreferrer" className="text-blue-600 no-underline">bureauveritas.co.in</a>],
              [<strong>DNV India</strong>, <Badge color="blue">Norway</Badge>, <a href="https://dnv.com/in" target="_blank" rel="noopener noreferrer" className="text-blue-600 no-underline">dnv.com/in</a>],
              [<strong>SGS India</strong>, <Badge color="blue">Switzerland</Badge>, <a href="https://sgs.com/en-in" target="_blank" rel="noopener noreferrer" className="text-blue-600 no-underline">sgs.com/en-in</a>],
              [<strong>IRQS</strong>, <Badge color="green">India</Badge>, <a href="https://irqs.co.in" target="_blank" rel="noopener noreferrer" className="text-blue-600 no-underline">irqs.co.in</a>],
              [<strong>URS Certification</strong>, <Badge color="green">India</Badge>, <a href="https://ursindia.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 no-underline">ursindia.com</a>],
            ]}
          />
        </Section>

        <Section title={c.stdResources}>
          <ResourceList items={[
            { href: 'https://www.stqc.gov.in/iso-27001-information-security-management-system-isms-certification', title: 'STQC — ISMS Certification' },
            { href: 'https://www.stqc.gov.in/information-security', title: 'STQC — Information Security' },
            { href: 'https://nabcb.qci.org.in', title: 'NABCB — Accreditation Directory' },
            { href: 'https://www.ibm.com/products/cloud/compliance/meity', title: 'IBM — MeitY Cloud Compliance' },
          ]} />
        </Section>
      </PageContainer>
    </>
  );
}
