import { db } from '@/lib/db';
import { translations, getLang } from '@/i18n/translations';

export default async function AgentsPage({ searchParams }: { searchParams: Promise<{ lang?: string }> | { lang?: string } }) {
  const resolvedParams = await searchParams;
  const lang = getLang(resolvedParams?.lang);
  const t = translations[lang] || translations.en;

  // Fetch agents or fallback demo items
  let agents: any[] = [];
  try {
    agents = await db.agent.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { organization: true }
    });
  } catch (e) {
    console.error('Failed to load agents from db:', e);
  }

  // Fallback demo agents if db is empty or disconnected
  if (agents.length === 0) {
    agents = [
      {
        id: 'agent-1',
        name: lang === 'en' ? 'Sales Agent Nexos' : lang === 'es' ? 'Agente de Ventas Nexos' : 'Atendente de Vendas Nexos',
        model: 'GPT4O',
        temperature: 0.7,
        isActive: true,
        description: lang === 'en' ? 'Qualifies leads, answers product questions, and schedules meetings via WhatsApp and Webchat.' : 'Qualifica leads e efetua pré-agendamento no WhatsApp e Webchat.',
        systemPrompt: 'HelpUS AI Sales Assistant',
        organization: { name: 'HelpUS Enterprise' }
      },
      {
        id: 'agent-2',
        name: lang === 'en' ? 'Technical Support Tier 1' : 'Suporte Técnico Nível 1',
        model: 'DEEPSEEK_R1',
        temperature: 0.2,
        isActive: true,
        description: lang === 'en' ? 'Resolves technical issues using documentation and RAG vector search.' : 'Resolve dúvidas técnicas com base no manual usando busca vetorial RAG.',
        systemPrompt: 'HelpUS AI Technical Support',
        organization: { name: 'HelpUS Enterprise' }
      },
      {
        id: 'agent-3',
        name: lang === 'en' ? 'Private Local Agent' : 'Agente Local Privado',
        model: 'OLLAMA_LOCAL',
        temperature: 0.5,
        isActive: true,
        description: lang === 'en' ? 'Runs 100% on local machine (Full Node 127.0.0.1:8765) with complete privacy.' : 'Roda 100% na máquina local (Full Node 127.0.0.1:8765) com total privacidade.',
        systemPrompt: 'HelpUS Local Confidential Agent',
        organization: { name: 'HelpUS Enterprise' }
      }
    ];
  }

  return (
    <>
      <section className='hero'>
        <span className='badge'>{t.agents.badge}</span>
        <h1>{t.agents.title}</h1>
        <p>{t.agents.description}</p>

        <div className='actions'>
          <button className='button'>
            <span>+ {t.agents.newAgentBtn}</span>
          </button>
          <a href={`/conversations?lang=${lang}`} className='buttonSecondary'>
            <span>{t.nav.conversations} 💬</span>
          </a>
        </div>
      </section>

      <section className='grid'>
        {agents.map((agent) => (
          <article className='card' key={agent.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span className='badge'>{agent.model}</span>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: agent.isActive ? 'var(--emerald)' : 'var(--text-muted)' }}>
                {agent.isActive ? '● Active' : '○ Inactive'}
              </span>
            </div>

            <h2>{agent.name}</h2>
            <p className='muted' style={{ marginBottom: '12px' }}>{agent.description}</p>

            <div className='kv'>
              <div><span>Organization</span><strong>{agent.organization?.name || 'Default'}</strong></div>
              <div><span>Temperature</span><strong>{agent.temperature}</strong></div>
              <div><span>System Prompt</span><strong style={{ fontSize: '0.78rem', fontFamily: 'monospace' }}>{agent.systemPrompt.slice(0, 30)}...</strong></div>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
