import "./globals.css";
import { AuthProvider } from "@/lib/auth";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
