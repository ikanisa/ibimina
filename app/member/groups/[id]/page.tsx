import { notFound } from "next/navigation";
import { getMemberGroupSummary } from "@/lib/member/data";

interface GroupDetailPageProps {
  params: { id: string };
}

export default async function GroupDetailPage({ params }: GroupDetailPageProps) {
  const { id } = params;
  const { group, sacco } = await getMemberGroupSummary(id);

  if (!group) {
    notFound();
  }

  return (
    <div className="space-y-6 text-neutral-0">
      <header className="space-y-2">
        <p className="text-sm text-white/70">{sacco ? sacco.name : "SACCO"}</p>
        <h1 className="text-3xl font-semibold">{group.name}</h1>
        <p className="text-sm text-white/70">Group code: {group.code}</p>
      </header>
      <section className="rounded-3xl border border-white/15 bg-white/8 p-6">
        <h2 className="text-2xl font-semibold">Summary</h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-white/70">Status</dt>
            <dd className="text-lg font-semibold capitalize">{group.status.toLowerCase()}</dd>
          </div>
          <div>
            <dt className="text-white/70">Created</dt>
            <dd className="text-lg font-semibold">
              {group.created_at ? new Date(group.created_at).toLocaleDateString() : "—"}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-white/70">SACCO</dt>
            <dd className="text-lg font-semibold">{sacco ? `${sacco.name} · ${sacco.district}` : "—"}</dd>
          </div>
        </dl>
      </section>
      <section className="rounded-3xl border border-white/15 bg-white/8 p-6">
        <h2 className="text-2xl font-semibold">Members</h2>
        <p className="mt-2 text-sm text-white/70">
          Member details are available after staff approves your membership request.
        </p>
      </section>
    </div>
  );
}
