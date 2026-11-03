import { getServerSession } from 'next-auth/next';
import { redirect, forbidden } from 'next/navigation';
import { makeAuthOptions } from '@/lib/auth-options';
import { db } from '@/lib/db';
import { authorizeAgentList, agentListQuery } from '@/lib/agent-list-access.mjs';
import { translations, getLang } from '@/i18n/translations';

export const dynamic = 'force-dynamic';

// Explicit organizationId is verified against the active membership on each request.
// Unauthenticated users are redirected; unauthorized requests return real 403.
export default async function AgentsPage({
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
  if (!session?.user?.email) redirect('/login');

  const params = await searchParams;
  const lang = getLang(params?.lang);
  const t = translations[lang] || translations.en;
  const authz = await authorizeAgentList({
    email: session.user.email,
    organizationId: params?.organizationId,
    db,
  });
  if (!authz.ok) forbidden();

  // SQL is scoped server-side and projections omit systemPrompt, keys, and organization details.
  // A storage failure must fail closed; never show anonymous demo agents as live data.
  const agents = await db.agent.findMany(agentListQuery(authz.organizationId));

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
