import { Slide } from "../Slide";

const actions = [
  { num: "01", action: "More workshops (15-20 min) to explain full concept to Deepak", owner: "Team", timeline: "Ongoing" },
  { num: "02", action: "Set up document repository (Nextcloud or shared bucket)", owner: "Deepak / Raman", timeline: "~1 week" },
  { num: "03", action: "Share initial set of documents with Deepak", owner: "Raman", timeline: "~1 week" },
  { num: "04", action: "Work with Akash on automation", owner: "Deepak", timeline: "TBD" },
  { num: "05", action: "Formalize Deepak on the technology advisory board", owner: "Madam", timeline: "2-3 weeks" },
  { num: "06", action: "Website content \u2014 Who, When, Where, Why pages", owner: "Raman / Team", timeline: "Pre-launch" },
  { num: "07", action: "Integrate AI agents, multi-lingual, voice chatbot features", owner: "Deepak / Raman", timeline: "Ongoing" },
  { num: "08", action: "Schedule regular half-hour calls for site reviews", owner: "All", timeline: "Immediate" },
  { num: "09", action: "Soft launch after website is tested and ready", owner: "All", timeline: "TBD" },
];

export function ActionSlide({ isActive }: { isActive?: boolean }) {
  return (
    <Slide
      slideNumber="Slide 10 of 12"
      title="Action Items & Next Steps"
      subtitle="Commitments from this meeting"
      isActive={isActive}
    >
      <div className="overflow-hidden rounded-2xl border border-white/50 bg-white/[0.88] shadow-lg backdrop-blur-[20px]">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {["#", "Action Item", "Owner", "Timeline"].map((h) => (
                <th
                  key={h}
                  className="border-b-2 border-light-3 px-5 py-4 text-left text-xs font-bold uppercase tracking-widest text-cyan-2"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(8,145,178,0.06), rgba(79,70,229,0.05))",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {actions.map((a) => (
              <tr
                key={a.num}
                className="action-row border-b border-light-2 transition-colors last:border-b-0 hover:bg-cyan-2/[0.06]"
              >
                <td className="w-[45px] px-5 py-3.5 text-center font-space text-base font-bold text-cyan-2">
                  {a.num}
                </td>
                <td className="px-5 py-3.5 text-base font-semibold text-ink">
                  {a.action}
                </td>
                <td className="px-5 py-3.5 text-base font-semibold text-ink">
                  {a.owner}
                </td>
                <td className="px-5 py-3.5 text-base font-semibold text-ink">
                  {a.timeline}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Slide>
  );
}
