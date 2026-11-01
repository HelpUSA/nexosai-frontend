import { db } from '@/lib/db';
import { requireActiveTenant } from '@/lib/require-active-tenant';
import { listTenantAuditLogs } from '@/lib/audit-access.mjs';
import { translations, getLang } from '@/i18n/translations';

export const dynamic = 'force-dynamic';

export default async function AuditLogsPage({ searchParams }: { searchParams: Promise<{ lang?: string }> | { lang?: string } }) {
  const { organizationId } = await requireActiveTenant(['ADMIN','OWNER']);
  const resolvedParams = await searchParams;
  const lang = getLang(resolvedParams?.lang);
  const t = translations[lang] || translations.en;

  // Exclude global/unscoped records. Never show another tenant's audit trail.
  const logs = await listTenantAuditLogs({organizationId,db});

  return (
    <>
      <section className="hero">
        <span className="badge">{t.audit.badge}</span>
        <h1>{t.audit.title}</h1>
        <p>{t.audit.description}</p>
      </section>
      <section className="card">
        <h2>Organization Audit Logs</h2>
        {logs.length === 0 ? <p className="muted">No records for this organization.</p> : null}
        <ul className="list" style={{marginTop:16}}>
          {logs.map(log=>(
            <li key={log.id} style={{flexDirection:'column',alignItems:'flex-start'}}>
              <div style={{display:'flex',justifyContent:'space-between',width:'100%'}}>
                <span className="badge">{log.action}</span>
                <span>{new Date(log.createdAt).toLocaleString(lang==='pt'?'pt-BR':lang==='es'?'es-ES':'en-US')}</span>
              </div>
              <p>{log.details||''}</p>
              <span>User: {log.user?.email||'System'}{log.node ? ` | Node: ${log.node.name}` : ''}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
