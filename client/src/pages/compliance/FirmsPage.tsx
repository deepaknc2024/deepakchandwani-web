import { useState } from 'react';
import { Hero, Breadcrumb, DataTable, InfoBox, Section, PageContainer } from './CompliancePage';

type City = 'delhi' | 'mumbai' | 'chennai' | 'hyderabad';

const CITIES: { key: City; label: string }[] = [
  { key: 'delhi', label: 'Delhi / NCR' },
  { key: 'mumbai', label: 'Mumbai' },
  { key: 'chennai', label: 'Chennai' },
  { key: 'hyderabad', label: 'Hyderabad' },
];

const Ext = ({ href, children }: { href: string; children: string }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 no-underline text-xs">
    {children}
  </a>
);

export default function FirmsPage() {
  const [city, setCity] = useState<City>('delhi');

  return (
    <>
      <Hero title="Legal Firms Directory" subtitle="DPDP / Cyber Law specialists across Delhi, Mumbai, Chennai & Hyderabad" gradient="from-green-800 via-green-600 to-cyan-500" />
      <PageContainer>
        <Breadcrumb current="Legal Firms" />

        {/* City Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {CITIES.map((c) => (
            <button
              key={c.key}
              onClick={() => setCity(c.key)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                city === c.key
                  ? 'bg-cyan-2 text-white border-cyan-2'
                  : 'bg-white text-muted border-bdl hover:border-cyan-2 hover:text-cyan-2'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* DELHI */}
        {city === 'delhi' && (
          <Section title="Delhi / NCR">
            <DataTable
              headers={['Firm', 'Specialty', 'Address', 'Contact', 'Website']}
              rows={[
                [<strong>Pavan Duggal Associates</strong>, 'Foremost cyber law expert, 200+ books, SC advocate', 'D-312, Defence Colony, New Delhi 110024', '+91-11-2433 0250', <Ext href="https://pavanduggal.com">pavanduggal.com</Ext>],
                [<strong>Ikigai Law</strong>, 'Boutique tech-policy, DPDP, AI regulation', 'B-121, Sector 67, Noida 201301', '+91-120-4975 800', <Ext href="https://ikigailaw.com">ikigailaw.com</Ext>],
                [<strong>Khaitan & Co</strong>, 'Tier 1 data protection (Legal 500)', 'Ashoka Estate, 12F, 24 Barakhamba Rd, New Delhi', '+91-11-4151 5454', <Ext href="https://khaitanco.com">khaitanco.com</Ext>],
                [<strong>Trilegal</strong>, 'Data privacy, DPDP, fintech regulation', 'The Oberoi, Dr. Zakir Hussain Marg, New Delhi', '+91-11-4259 9300', <Ext href="https://trilegal.com">trilegal.com</Ext>],
                [<strong>Saikrishna & Associates</strong>, 'IP + tech law, DPDP compliance', 'B-206, Defence Colony, New Delhi 110024', '+91-11-4166 0734', <Ext href="https://saikrishnaassociates.com">saikrishnaassociates.com</Ext>],
                [<strong>Anand and Anand</strong>, 'IP & technology, data protection', 'B-41, Nizamuddin East, New Delhi 110013', '+91-11-2435 7338', <Ext href="https://anandandanand.com">anandandanand.com</Ext>],
                [<strong>Cyril Amarchand Mangaldas</strong>, "India's largest law firm, TMT & cyber law", '4F, Prius Platinum, D-3, Saket, New Delhi', '+91-11-6622 9000', <Ext href="https://cyrilshroff.com">cyrilshroff.com</Ext>],
              ]}
            />
          </Section>
        )}

        {/* MUMBAI */}
        {city === 'mumbai' && (
          <Section title="Mumbai">
            <DataTable
              headers={['Firm', 'Specialty', 'Address', 'Contact', 'Website']}
              rows={[
                [<strong>Dr. Prashant Mali</strong>, 'Ph.D. Cyber Law, 25+ yrs, Bombay HC', 'B-1003, Sarvodaya CHS, Bandra East, 400051', '022-26581818 / +91-9821763157', <Ext href="https://cyberlawconsulting.com">cyberlawconsulting.com</Ext>],
                [<strong>Cyberjure Legal (Puneet Bhasin)</strong>, 'Pioneer in cyber law, govt advisory', '805, Dev Corpora, Thane West 400601', '+91-9223186357', <Ext href="https://cyberjure.com">cyberjure.com</Ext>],
                [<strong>Khaitan & Co</strong>, 'Award-winning data protection (Legal 500 T1)', 'One World Centre, 10F, 841 Senapati Bapat Marg', '+91-22-6636 5000', <Ext href="https://khaitanco.com">khaitanco.com</Ext>],
                [<strong>AMLEGALS</strong>, 'DPDPA implementation, DPO services, 27+ yrs', 'Mumbai (9 offices across India)', '+91-844-844-0606', <Ext href="https://amlegals.com">amlegals.com</Ext>],
                [<strong>Maheshwari & Co</strong>, 'DPDP, HIPAA, breach response, fintech', 'Platina, 11F, BKC, Mumbai 400051', '+91-22-6884 1510', <Ext href="https://maheshwariandco.com">maheshwariandco.com</Ext>],
                [<strong>Tigde Law Firm</strong>, 'Cyber crime litigation, 18+ yrs, 50+ advocates', 'Sadguru Heights, 6F, Thane West 400601', 'Via website', <Ext href="https://tigdelawfirm.com">tigdelawfirm.com</Ext>],
                [<strong>AZB & Partners</strong>, 'Top-tier, dedicated tech/data privacy team', 'AZB House, Peninsula Corp Park, Lower Parel', '+91-22-6639 6880', <Ext href="https://azbpartners.com">azbpartners.com</Ext>],
              ]}
            />
          </Section>
        )}

        {/* CHENNAI */}
        {city === 'chennai' && (
          <Section title="Chennai">
            <DataTable
              headers={['Firm', 'Specialty', 'Address', 'Contact', 'Website']}
              rows={[
                [<strong>Khaitan & Co</strong>, 'DPDP practice, Legal 500 & Chambers ranked', 'Dadha Chambers, 8F, 250 Avvai Shanmugam Salai, Chennai 600014', '+91-44-6919 0100', <Ext href="https://khaitanco.com">khaitanco.com</Ext>],
                [<strong>NetLexia / Rajendra Cybercrime</strong>, 'Cybercrime litigation, IT Act, blockchain', '156, Thambu Chetty St, George Town, Chennai 600001', '+91-9994287060', <Ext href="https://cybercrimeadvocates.com">cybercrimeadvocates.com</Ext>],
                [<strong>Rajendra Law Office LLP</strong>, 'IT company data privacy, DPDP advisory', '#1, F3, St Joseph School Rd, Poonamallee 600056', '+91-7904718119', <Ext href="https://rajendralawoffice.com">rajendralawoffice.com</Ext>],
                [<strong>Aran Law Firm</strong>, 'Cybercrime, IT Act, data breaches, 10+ yrs', 'Greams Road, Thousand Lights, Chennai 600006', '044-48135125', <Ext href="https://aranlaw.in">aranlaw.in</Ext>],
                [<strong>Chennai Law Forum</strong>, '24/7 cyber crime legal help', 'Chennai', '+91-9444014096', <Ext href="https://chennailawforum.com">chennailawforum.com</Ext>],
                [<strong>AskAdvocates</strong>, 'Cyber crime law, banking fraud, IT compliance', 'Chennai', 'Via website', <Ext href="https://askadvocates.com">askadvocates.com</Ext>],
              ]}
            />
          </Section>
        )}

        {/* HYDERABAD */}
        {city === 'hyderabad' && (
          <Section title="Hyderabad">
            <DataTable
              headers={['Firm', 'Specialty', 'Address', 'Contact', 'Website']}
              rows={[
                [<strong>DSCI</strong>, 'DPDP compliance directory, training', 'NASSCOM Campus, Madhapur, Hyderabad', 'Via website', <Ext href="https://dsci.in">dsci.in</Ext>],
                [<strong>Khaitan & Co</strong>, 'DPDP compliance, data protection', 'Hyderabad office', 'Via website', <Ext href="https://khaitanco.com">khaitanco.com</Ext>],
                [<strong>Trilegal</strong>, 'Technology law, data privacy, DPDP', 'Hyderabad office', 'Via website', <Ext href="https://trilegal.com">trilegal.com</Ext>],
                [<strong>DSK Legal</strong>, 'IT & technology law, data protection', 'Hyderabad', 'Via website', <Ext href="https://dsklegal.com">dsklegal.com</Ext>],
                [<strong>Saikrishna & Associates</strong>, 'IP law, data privacy, IT Act', 'Hyderabad office', 'Via website', <Ext href="https://saikrishnaassociates.com">saikrishnaassociates.com</Ext>],
                [<strong>Cyril Amarchand Mangaldas</strong>, "India's largest, TMT practice, DPDP", 'Hyderabad office', 'Via website', <Ext href="https://cyrilshroff.com">cyrilshroff.com</Ext>],
              ]}
            />

            <InfoBox title="Additional Hyderabad Resources">
              <ul className="list-disc pl-5 space-y-1">
                <li><a href="https://lawrato.com/cyber-crime-lawyers/hyderabad" target="_blank" rel="noopener noreferrer" className="text-blue-600 no-underline">LawRato — Cyber Law Lawyers Hyderabad</a></li>
                <li><a href="https://vakilsearch.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 no-underline">Vakilsearch — Data Protection Lawyers</a></li>
                <li><a href="https://legalkart.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 no-underline">LegalKart — Cyber Law Hyderabad</a></li>
              </ul>
            </InfoBox>
          </Section>
        )}

        {/* Quick Pick */}
        <Section title="Quick Pick by Need">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { title: 'Specialist DPDP (Boutique)', desc: 'Pavan Duggal (Delhi), Dr. Prashant Mali (Mumbai), AMLEGALS, Ikigai Law' },
              { title: 'Large Firm, Enterprise-Grade', desc: 'Khaitan & Co (all 4 cities), Trilegal, Cyril Amarchand Mangaldas' },
              { title: 'Cybercrime Litigation', desc: 'Dr. Prashant Mali (Mumbai), NetLexia (Chennai), Pavan Duggal (Delhi)' },
              { title: 'Industry Body / Standards', desc: 'DSCI (Hyderabad) — NASSCOM initiative for data protection' },
            ].map((c) => (
              <div key={c.title} className="bg-white border border-bdl rounded-xl p-4">
                <h3 className="text-sm font-bold mb-1">{c.title}</h3>
                <p className="text-xs text-muted">{c.desc}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* CERT-In Auditors */}
        <Section title="CERT-In Empanelled Security Auditors">
          <p className="text-xs text-muted mb-3">Verify empanelment at <a href="https://www.cert-in.org.in/" target="_blank" rel="noopener noreferrer" className="text-blue-600 no-underline">cert-in.org.in</a></p>
          <DataTable
            headers={['Company', 'Location', 'Website']}
            rows={[
              [<strong>Kratikal Tech</strong>, 'Noida', <Ext href="https://kratikal.com">kratikal.com</Ext>],
              [<strong>Network Intelligence</strong>, 'Mumbai', <Ext href="https://niiconsulting.com">niiconsulting.com</Ext>],
              [<strong>CyberNX Technologies</strong>, 'Pune', <Ext href="https://cybernx.com">cybernx.com</Ext>],
              [<strong>TAC Security</strong>, 'Mohali', <Ext href="https://tacsecurity.com">tacsecurity.com</Ext>],
              [<strong>Entersoft Security</strong>, 'Hyderabad', <Ext href="https://entersoft.co.in">entersoft.co.in</Ext>],
              [<strong>Indusface</strong>, 'Vadodara', <Ext href="https://indusface.com">indusface.com</Ext>],
            ]}
          />
        </Section>

        {/* Compliance Platforms */}
        <Section title="Compliance-as-a-Service Platforms">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { name: 'Scrut Automation', desc: 'SOC 2, ISO 27001, DPDP, GDPR automation. Y Combinator backed.', href: 'https://scrut.io' },
              { name: 'Sprinto', desc: 'Automated compliance for SOC 2, ISO 27001, GDPR. Bangalore.', href: 'https://sprinto.com' },
              { name: 'Tsaaro', desc: 'DPO-as-a-service, DPDP compliance, privacy assessments.', href: 'https://tsaaro.com' },
              { name: 'Leegality', desc: 'Digital consent capture, e-signatures for DPDP.', href: 'https://leegality.com' },
            ].map((p) => (
              <div key={p.name} className="bg-white border border-bdl rounded-xl p-4">
                <h3 className="text-sm font-bold mb-1">{p.name}</h3>
                <p className="text-xs text-muted mb-2">{p.desc}</p>
                <a href={p.href} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-cyan-2 hover:text-cyan no-underline">
                  Visit &rarr;
                </a>
              </div>
            ))}
          </div>
        </Section>
      </PageContainer>
    </>
  );
}
