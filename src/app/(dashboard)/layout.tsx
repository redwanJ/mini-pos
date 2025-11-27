import { Navigation } from '@/components/Navigation';
import { AuthGuard } from '@/components/AuthGuard';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col pb-16">
        <main className="flex-1">{children}</main>
        <Navigation />
      </div>
    </AuthGuard>
  );
}
