/**
 * Auth Layout for SACCO+ Client App
 *
 * This layout provides a consistent structure for authentication-related pages
 * including welcome and onboarding flows.
 *
 * Features:
 * - Centered content with max-width constraints
 * - Responsive padding and spacing
 * - Accessible semantic structure
 */

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}
