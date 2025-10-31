export function FeatureCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass p-5 rounded-2xl">
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <div className="text-sm text-white/90">{children}</div>
    </div>
  );
}
