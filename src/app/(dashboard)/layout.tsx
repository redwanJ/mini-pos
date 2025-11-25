import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';
import { Navigation } from '@/components/Navigation';

async function getSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');

  if (!sessionCookie?.value) {
    return null;
  }

  try {
    const { userId, businessId } = JSON.parse(sessionCookie.value);
    if (!userId || !businessId) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return null;
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      return null;
    }

    return { user, business };
  } catch {
    return null;
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/');
  }

  return (
    <div className="min-h-screen flex flex-col pb-16">
      <main className="flex-1">{children}</main>
      <Navigation />
    </div>
  );
}
