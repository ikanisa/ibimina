/**
 * Home Page for SACCO+ Client App
 * 
 * This is a placeholder home page that redirects to the welcome page.
 * In a production environment, this would show the main app interface
 * for authenticated users or redirect to onboarding for new users.
 */

import { redirect } from "next/navigation";

export default function HomePage() {
  // For now, redirect to welcome page
  // TODO: Implement proper authentication check and conditional redirect
  redirect("/welcome");
}
