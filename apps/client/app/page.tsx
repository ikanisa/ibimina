/**
 * Root Page for SACCO+ Client App
 *
 * Redirects to the home dashboard for authenticated users.
 * In a production environment, this would check authentication status
 * and redirect to onboarding for new users.
 */

import { redirect } from "next/navigation";

export default function RootPage() {
  // Redirect to home dashboard
  // TODO: Implement proper authentication check
  // - If authenticated: redirect to /home
  // - If not authenticated: redirect to /welcome
  redirect("/home");
}
