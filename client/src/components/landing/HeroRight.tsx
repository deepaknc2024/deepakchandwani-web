import LiveDashboard from "@/components/dashboard/LiveDashboard";

export default function HeroRight() {
  return (
    <div className="bg-light border-l border-black/10 flex items-start justify-center p-10 max-xl:p-8 max-lg:p-6 max-lg:border-l-0 max-lg:border-t max-lg:border-black/10 overflow-y-auto">
      <div className="w-full max-w-[700px] max-lg:max-w-full">
        <LiveDashboard />
      </div>
    </div>
  );
}
