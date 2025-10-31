import Link from "next/link";

export function Hero() {
  return (
    <div className="glass p-8 rounded-3xl mt-6">
      <h1 className="text-2xl md:text-4xl font-extrabold">
        SACCO+ — Standalone intermediation for ibimina & Umurenge SACCOs
      </h1>
      <p className="mt-3 text-white/90">
        USSD deposits go directly to the SACCO&apos;s MoMo merchant account. SACCO+ digitizes
        ibimina, standardizes references, and supplies clean allocation reports—without integrating
        to SACCO cores.
      </p>
      <div className="mt-5 flex gap-3">
        <Link href="/members" className="bg-white/15 hover:bg-white/25 px-4 py-2 rounded-lg">
          For Members
        </Link>
        <Link href="/saccos" className="bg-white/15 hover:bg-white/25 px-4 py-2 rounded-lg">
          For SACCOs
        </Link>
        <Link
          href="/pilot-nyamagabe"
          className="bg-white/15 hover:bg-white/25 px-4 py-2 rounded-lg"
        >
          Nyamagabe Pilot
        </Link>
      </div>
    </div>
  );
}
