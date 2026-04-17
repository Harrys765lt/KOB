import { Sidebar } from "@/components/sidebar";

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-canvas flex min-h-screen items-stretch">
      <Sidebar />
      <main className="min-h-screen flex-1 p-4 pb-20 lg:p-7 lg:pb-7">{children}</main>
    </div>
  );
}
