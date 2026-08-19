import { db } from '@/lib/db';

export default async function AgentsPage() {
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
        name: 'Atendente de Vendas Nexos',
        subtitle: 'GPT-4o Omnichannel',
        model: 'GPT4O',
        temperature: 0.7,
        isActive: true,
        description: 'Qualifica leads, responde dúvidas sobre produtos e efetua pré-agendamento no WhatsApp e Webchat.',
        systemPrompt: 'Você é um assistente de vendas da HelpUS especialista em atendimento rápido e humanizado.',
        organization: { name: 'HelpUS Enterprise' }
      },
      {
        id: 'agent-2',
        name: 'Suporte Técnico Nível 1',
        subtitle: 'DeepSeek-R1 Relação Custo-Benefício',
        model: 'DEEPSEEK_R1',
        temperature: 0.2,
        isActive: true,
        description: 'Resolve dúvidas técnicas com base na documentação da empresa usando busca vetorial RAG.',
        systemPrompt: 'Você é o suporte técnico Nível 1. Consulte o manual antes de responder.',
        organization: { name: 'HelpUS Enterprise' }
      },
      {
        id: 'agent-3',
        name: 'Agente Local Privado',
        subtitle: 'Ollama Llama 3 Local (Full Node)',
        model: 'OLLAMA_LOCAL',
        temperature: 0.5,
        isActive: true,
        description: 'Roda 100% na máquina local do cliente (Full Node em 127.0.0.1:8765) sem enviar dados para a nuvem.',
        systemPrompt: 'Agente privado local para processamento de dados confidenciais.',
        organization: { name: 'HelpUS Enterprise' }
      }
    ];
  }

  return (
    <>
      <section className='hero'>
        <span className='badge'>Gerenciador de Agentes</span>
        <h1>Agentes Autônomos de Inteligência Artificial</h1>
        <p>
          Crie e configure agentes de IA personalizados (GPT-4o, DeepSeek-R1, Ollama Local) treinados com a base de conhecimento da sua empresa e integrados ao WhatsApp Business API e Webchat.
        </p>

        <div className='actions'>
          <button className='button'>
            <span>+ Criar Novo Agente</span>
          </button>
          <a href='/conversations' className='buttonSecondary'>
            <span>Ver Conversas Ativas 💬</span>
          </a>
        </div>
      </section>

      <section className='grid'>
        {agents.map((agent) => (
          <article className='card' key={agent.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span className='badge'>{agent.model}</span>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: agent.isActive ? 'var(--emerald)' : 'var(--text-muted)' }}>
                {agent.isActive ? '● Ativo' : '○ Inativo'}
              </span>
            </div>

            <h2>{agent.name}</h2>
            <p className='muted' style={{ marginBottom: '12px' }}>{agent.description}</p>

            <div className='kv'>
              <div><span>Organização</span><strong>{agent.organization?.name || 'Default'}</strong></div>
              <div><span>Temperatura</span><strong>{agent.temperature}</strong></div>
              <div><span>Prompt Base</span><strong style={{ fontSize: '0.78rem', fontFamily: 'monospace' }}>{agent.systemPrompt.slice(0, 30)}...</strong></div>
            </div>
          </article>
        ))}
      </section>

      <section className='card' style={{ marginTop: 24 }}>
        <h2>Suporte Multi-Modelos (Multi-LLM Engine)</h2>
        <ul className='list'>
          <li><strong>OpenAI GPT-4o / GPT-4o-mini</strong>: Raciocínio avançado e atendimento corporativo.</li>
          <li><strong>DeepSeek-R1 / V3</strong>: Altíssima velocidade de resposta com custo reduzido.</li>
          <li><strong>Ollama / Local LLM</strong>: Execução 100% isolada e privada na máquina do cliente (Full Node).</li>
        </ul>
      </section>
    </>
  );
}
