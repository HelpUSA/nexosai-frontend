import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { makeAuthOptions } from '@/lib/auth-options';
import { db } from '@/lib/db';
import { translations, getLang } from '@/i18n/translations';

export const dynamic = 'force-dynamic';

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }> | { lang?: string };
}) {
  let session = null;
  try {
    session = await getServerSession(makeAuthOptions());
  } catch {
    session = null;
  }

  if (!session?.user?.email) {
    redirect('/login');
  }

  const resolvedParams = await searchParams;
  const lang = getLang(resolvedParams?.lang);
  const t = translations[lang] || translations.en;

  let logs: any[] = [];
  try {
    // Find active organization membership for the authenticated user
    const user = await db.user.findUnique({
      where: { email: session.user.email.toLowerCase() },
      select: {
        id: true,
        memberships: {
          where: { status: 'ACTIVE' },
          select: { organizationId: true, role: true },
        },
      },
    });

    const activeOrgId = user?.memberships?.[0]?.organizationId;
    if (activeOrgId) {
      logs = await db.auditLog.findMany({
        where: { organizationId: activeOrgId },
        take: 15,
        orderBy: { createdAt: 'desc' },
        include: { user: true, node: true },
      });
    }
  } catch (e) {
    // Log failure server-side, fail-closed to empty logs
    logs = [];
  }

  return (
    <>
      <section className='hero'>
        <span className='badge'>{t.audit.badge}</span>
        <h1>{t.audit.title}</h1>
        <p>{t.audit.description}</p>
      </section>

      <section className='card'>
        <h2>Recent Execution Logs</h2>
        {logs.length === 0 ? (
          <p style={{ marginTop: 16, color: 'var(--text-muted)' }}>
            No execution logs found for the active organization.
          </p>
        ) : (
          <ul className='list' style={{ marginTop: 16 }}>
            {logs.map((log) => (
              <li key={log.id} style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 4 }}>
                  <span className='badge' style={{ background: '#ecfdf5', color: 'var(--emerald)', borderColor: '#a7f3d0' }}>
                    {log.action}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {new Date(log.createdAt).toLocaleString(lang === 'pt' ? 'pt-BR' : lang === 'es' ? 'es-ES' : 'en-US')}
                  </span>
                </div>
                <p style={{ margin: 0, fontWeight: '600', color: 'var(--text-dark)' }}>{log.details}</p>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  User: {log.user?.email || 'System'} {log.node ? `| Node: ${log.node.name}` : ''}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
