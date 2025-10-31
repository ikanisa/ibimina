export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="glass p-6 md:p-8 my-6">
      <h2 className="text-xl md:text-2xl font-semibold mb-3">{title}</h2>
      <div className="text-white/95 leading-relaxed">{children}</div>
    </section>
  );
}
