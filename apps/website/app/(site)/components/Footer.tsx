export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black/30 mt-10">
      <div className="container mx-auto px-4 py-6 text-xs text-white/80 flex flex-col sm:flex-row gap-2 sm:gap-6 justify-between">
        <p>© {new Date().getFullYear()} SACCO+. All rights reserved.</p>
        <nav className="flex gap-3">
          <a href="/legal/terms" className="hover:underline">
            Terms
          </a>
          <a href="/legal/privacy" className="hover:underline">
            Privacy
          </a>
        </nav>
      </div>
    </footer>
  );
}
