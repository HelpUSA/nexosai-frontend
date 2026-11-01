import { requireActiveTenant } from '@/lib/require-active-tenant';

export const dynamic = 'force-dynamic';
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  await requireActiveTenant();
  return <>{children}</>;
}
