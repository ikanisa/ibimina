import type { Metadata } from "next";

/*
 * Original authentication layout retained for later reactivation.
 */

export const metadata: Metadata = {
  title: "Ibimina Staff — Sign in (disabled)",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
