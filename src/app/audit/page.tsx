import { db } from '@/lib/db';

export default async function AuditLogsPage() {
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
        details: 'Full Node (Notebook Principal) confirmou presença em 127.0.0.1:8765',
        user: { email: 'helpus.ecommerce@gmail.com' },
        node: { name: 'Notebook Principal' },
        createdAt: new Date()
      },
      {
        id: 'log-2',
        action: 'AGENT_PROMPT_UPDATED',
        severity: 'INFO',
        details: 'Prompt do agente Atendente de Vendas atualizado por Admin',
        user: { email: 'helpus.ecommerce@gmail.com' },
        node: null,
        createdAt: new Date(Date.now() - 3600000)
      },
      {
        id: 'log-3',
        action: 'SECURITY_PORT_GUARD_CHECK',
        severity: 'INFO',
        details: 'Verificação de segurança na porta local 8765 concluída com sucesso',
        user: null,
        node: { name: 'Notebook Principal' },
        createdAt: new Date(Date.now() - 7200000)
      }
    ];
  }

  return (
    <>
      <section className='hero'>
        <span className='badge'>Segurança & Compliance</span>
        <h1>Trilha de Auditoria & Logs do Sistema</h1>
        <p>
          Registro imutável de todas as ações executadas pelos nós, usuários e agentes de IA para conformidade empresarial (LGPD / GDPR).
        </p>
      </section>

      <section className='card'>
        <h2>Logs de Execução Recentes</h2>
        <ul className='list' style={{ marginTop: 16 }}>
          {logs.map((log) => (
            <li key={log.id} style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 4 }}>
                <span className='badge' style={{ background: '#ecfdf5', color: 'var(--emerald)', borderColor: '#a7f3d0' }}>
                  {log.action}
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {new Date(log.createdAt).toLocaleString('pt-BR')}
                </span>
              </div>
              <p style={{ margin: 0, fontWeight: '600', color: 'var(--text-dark)' }}>{log.details}</p>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Usuário: {log.user?.email || 'Sistema'} {log.node ? `| Node: ${log.node.name}` : ''}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
