import { db } from '@/lib/db';
import { requireActiveTenant } from '@/lib/require-active-tenant';
import { translations, getLang } from '@/i18n/translations';

export const dynamic = 'force-dynamic';

export default async function AgentsPage({ searchParams }: { searchParams: Promise<{ lang?: string }> | { lang?: string } }) {
  const { organizationId } = await requireActiveTenant();
  const resolvedParams = await searchParams;
  const lang = getLang(resolvedParams?.lang);
  const t = translations[lang] || translations.en;

  // Every database query is bound to the active server-verified membership.
  // Never return systemPrompt, API keys or information from other organizations.
  const agents = await db.agent.findMany({
    where: { organizationId },
    take: 10,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, name: true, description: true,
      model: true, isActive: true, temperature: true
    }
  });

  return (
    <>
      <section className="hero">
        <span className="badge">{t.agents.badge}</span>
        <h1>{t.agents.title}</h1>
        <p>{t.agents.description}</p>
      </section>
      <section className="grid">
        {agents.map((agent) => (
          <article className="card" key={agent.id}>
            <span className="badge">{agent.model}</span>
            <h2>{agent.name}</h2>
            <p className="muted">{agent.description || ''}</p>
            <div className="kv">
              <div><span>Status</span><strong>{agent.isActive ? 'Active' : 'Inactive'}</strong></div>
              <div><span>Temperature</span><strong>{agent.temperature}</strong></div>
            </div>
          </article>
        ))}
      </section>
      {agents.length === 0 ? <p className="muted">No authorized agents in this organization.</p> : null}
    </>
  );
}
