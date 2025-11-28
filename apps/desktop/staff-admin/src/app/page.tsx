import { DesktopLayout } from "@/components";

export function HomePage() {
  return (
    <DesktopLayout>
      <div className="p-4">
        <h1 className="text-2xl font-bold">Welcome to SACCO+ Staff Admin</h1>
        <p className="mt-2 text-gray-600">Desktop application for staff administration</p>
      </div>
    </DesktopLayout>
  );
}
