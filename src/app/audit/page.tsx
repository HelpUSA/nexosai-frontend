import { getServerSession } from 'next-auth/next';
import { redirect, forbidden } from 'next/navigation';
import { makeAuthOptions } from '@/lib/auth-options';
import { authorizeAuditAccess } from '@/lib/admin-access.mjs';
import { db } from '@/lib/db';
import { translations, getLang } from '@/i18n/translations';

export const dynamic = 'force-dynamic';

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string; organizationId?: string }> | { lang?: string; organizationId?: string };
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
  const targetOrgId = resolvedParams?.organizationId;

  if (!targetOrgId) {
    forbidden();
  }

  const authz = await authorizeAuditAccess({
    email: session.user.email,
    organizationId: targetOrgId,
    db,
  });

  if (!authz.ok) {
    forbidden();
  }

  let logs: any[] = [];
  try {
    // Select safe metadata only: exclude raw log.details and personal user information to prevent data leakage.
    logs = await db.auditLog.findMany({
      where: { organizationId: targetOrgId },
      take: 15,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        action: true,
        severity: true,
        createdAt: true,
        organizationId: true,
        node: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });
  } catch (e) {
    logs = [];
  }

  return (
    <>
      <section className='hero'>
        <span className='badge'>{t.audit.badge}</span>
        <h1>{t.audit.title}</h1>
        <p>Audit trail for organization: <strong>{targetOrgId}</strong></p>
      </section>

      <section className='card'>
        <h2>Operational Events &amp; Audit Trail</h2>
        {logs.length === 0 ? (
          <p style={{ marginTop: 16, color: 'var(--text-muted)' }}>
            No execution logs recorded for this organization.
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
                <div style={{ fontSize: '0.85rem', color: 'var(--text-dark)', marginTop: 4 }}>
                  Severity: <strong>{log.severity}</strong> {log.node ? `| Resource Node: ${log.node.name}` : ''}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
