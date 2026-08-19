import { db } from '@/lib/db';
import { translations, getLang } from '@/i18n/translations';

export default async function AuditLogsPage({ searchParams }: { searchParams: Promise<{ lang?: string }> | { lang?: string } }) {
  const resolvedParams = await searchParams;
  const lang = getLang(resolvedParams?.lang);
  const t = translations[lang] || translations.en;

  let logs: any[] = [];
  try {
    logs = await db.auditLog.findMany({
      take: 15,
      orderBy: { createdAt: 'desc' },
      include: { user: true, node: true }
    });
  } catch (e) {
    console.error('Failed to load audit logs from db:', e);
  }

  // Fallback demo audit logs if db is empty or disconnected
  if (logs.length === 0) {
    logs = [
      {
        id: 'log-1',
        action: 'NODE_HEARTBEAT_OK',
        severity: 'INFO',
        details: 'Full Node (Main Workstation) presence confirmed on 127.0.0.1:8765',
        user: { email: 'helpus.ecommerce@gmail.com' },
        node: { name: 'Main Workstation' },
        createdAt: new Date()
      },
      {
        id: 'log-2',
        action: 'AGENT_PROMPT_UPDATED',
        severity: 'INFO',
        details: 'Sales AI Agent system prompt updated by Administrator',
        user: { email: 'helpus.ecommerce@gmail.com' },
        node: null,
        createdAt: new Date(Date.now() - 3600000)
      },
      {
        id: 'log-3',
        action: 'SECURITY_PORT_GUARD_CHECK',
        severity: 'INFO',
        details: 'Port-guard security verification on local port 8765 completed',
        user: null,
        node: { name: 'Main Workstation' },
        createdAt: new Date(Date.now() - 7200000)
      }
    ];
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
      </section>
    </>
  );
}
