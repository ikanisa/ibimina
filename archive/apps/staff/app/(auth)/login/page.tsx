import Link from "next/link";

export const metadata = {
  title: "Sign in | Ibimina Staff",
  description: "Authenticate to access SACCO+ operations.",
};

export default function LoginPage() {
  return (
    <div className="space-y-6" aria-labelledby="login-heading">
      <header className="space-y-2 text-center">
        <h1 id="login-heading" className="text-2xl font-semibold text-slate-900">
          Welcome back
        </h1>
        <p className="text-sm text-slate-600">
          Sign in with your SACCO+ staff credentials to continue monitoring ibimina activity.
        </p>
      </header>
      <form className="space-y-4" aria-label="Staff sign-in form">
        <label className="block text-left text-sm font-medium text-slate-700">
          Email
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-base focus:border-atlas-blue focus:outline-none focus:ring-2 focus:ring-atlas-blue"
          />
        </label>
        <label className="block text-left text-sm font-medium text-slate-700">
          Password
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            required
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-base focus:border-atlas-blue focus:outline-none focus:ring-2 focus:ring-atlas-blue"
          />
        </label>
        <button
          type="submit"
          className="w-full rounded-full bg-atlas-blue px-6 py-3 text-sm font-semibold text-white transition hover:bg-atlas-blue/90 focus:outline-none focus:ring-2 focus:ring-atlas-blue focus:ring-offset-2"
        >
          Sign in
        </button>
      </form>
      <footer className="text-center text-xs text-slate-500">
        Need access? <Link href="mailto:support@ibimina.rw" className="font-semibold text-atlas-blue">Contact platform operations</Link>.
      </footer>
    </div>
  );
}
