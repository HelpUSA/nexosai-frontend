import { translations, getLang } from '@/i18n/translations';
import ArchitectureFlow from './components/ArchitectureFlow';
import { AtlassianShowcase } from './components/AtlassianShowcase';
import { AtlassianCarousel } from './components/AtlassianCarousel';

export default async function HomePage({ searchParams }: { searchParams: Promise<{ lang?: string }> | { lang?: string } }) {
  const resolvedParams = await searchParams;
  const lang = getLang(resolvedParams?.lang);
  const t = translations[lang] || translations.en;

  return (
    <>
      {/* Atlassian-Inspired Hero Showcase Banner with HelpUS Logo */}
      <section className='hero-showcase'>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
          <img
            src='/helpus_logo.png'
            alt='HelpUS Logo'
            style={{ height: '52px', width: 'auto', objectFit: 'contain' }}
          />
          <span className='hero-pill-badge'>
            ✨ SECURE AI AGENT ORCHESTRATION PLATFORM
          </span>
        </div>

        <h1 className='hero-gradient-title'>
          {lang === 'pt' ? (
            <>Impossível sozinho. Possível com a <span>Malha de IA NexosAI</span></>
          ) : lang === 'es' ? (
            <>Imposible solo. Posible con la <span>Malla de IA NexosAI</span></>
          ) : (
            <>Impossible alone. Possible with <span>NexosAI Cloud Mesh</span></>
          )}
        </h1>

        <p className='hero-lead-text'>
          {lang === 'pt'
            ? 'O NexosAI Cloud orquestra agentes de inteligência artificial, nós de execução local com privacidade total, busca vetorial RAG e relés de atendimento corporativo sob rigorosos controles de segurança.'
            : lang === 'es'
            ? 'NexosAI Cloud orquesta agentes de inteligencia artificial, nodos de ejecución local con privacidad total, búsqueda vectorial RAG y relés de atención corporativa.'
            : 'NexosAI Cloud orchestrates autonomous AI agents, private local execution nodes, RAG vector knowledge bases, and multi-channel relays under unified enterprise security.'}
        </p>

        {/* Action CTAs */}
        <div className='actions' style={{ gap: '14px' }}>
          <a href={`/agents?lang=${lang}`} className='button' style={{ padding: '14px 28px', fontSize: '1rem' }}>
            <span>Explore AI Agents 🤖</span>
          </a>
          <a href={`/downloads?lang=${lang}`} className='buttonSecondary' style={{ padding: '14px 24px', fontSize: '0.95rem' }}>
            <span>Download AI Bridge Setup.exe 📥</span>
          </a>
          <a href='#showcase-tabs' className='buttonSecondary' style={{ padding: '14px 24px', fontSize: '0.95rem' }}>
            <span>View Architecture Features ⚡</span>
          </a>
        </div>

        {/* Atlassian-Style Metrics Counter Strip */}
        <div className='metrics-strip'>
          <div className='metric-box'>
            <div className='metric-number'>100%</div>
            <div className='metric-label'>Local Privacy (Ollama)</div>
          </div>
          <div className='metric-box'>
            <div className='metric-number'>&lt; 250ms</div>
            <div className='metric-label'>Relay Latency</div>
          </div>
          <div className='metric-box'>
            <div className='metric-number'>Multi-LLM</div>
            <div className='metric-label'>GPT-4o, DeepSeek & Ollama</div>
          </div>
          <div className='metric-box'>
            <div className='metric-number'>24 / 7</div>
            <div className='metric-label'>Autonomous Execution</div>
          </div>
        </div>
      </section>

      {/* Atlassian Interactive Tab Showcase */}
      <section id='showcase-tabs'>
        <AtlassianShowcase lang={lang} />
      </section>

      {/* Live Interactive Architecture Flow Diagram */}
      <section id='mesh-architecture' style={{ marginBottom: '36px' }}>
        <ArchitectureFlow />
      </section>

      {/* Enterprise Use Case Carousel (Atlassian Style) */}
      <section>
        <AtlassianCarousel lang={lang} />
      </section>

      {/* Multi-LLM & Mesh Capability Cards Grid */}
      <section style={{ margin: '36px 0' }}>
        <div style={{ marginBottom: '24px' }}>
          <span className='badge'>Capacidades do Sistema</span>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-dark)' }}>
            {lang === 'pt' ? 'Recursos e Motores de Inteligência' : lang === 'es' ? 'Recursos y Motores de Inteligencia' : 'Engine & Mesh Capabilities'}
          </h2>
        </div>

        <div className='grid'>
          {/* Card 1: GPT-4o */}
          <article className='feature-card'>
            <div>
              <div className='feature-icon-box'>🧠</div>
              <span className='badge'>OpenAI GPT-4o</span>
              <h3>Raciocínio Avançado & Vendas</h3>
              <p className='muted'>
                {lang === 'pt'
                  ? 'Qualificação automática de leads, suporte humanizado e decisões complexas com altíssima taxa de conversão.'
                  : 'Qualifies leads, handles complex reasoning, and boosts conversion rates across webchat and WhatsApp.'}
              </p>
            </div>
            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-light)', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '700' }}>
              ✓ Webchat & WhatsApp API
            </div>
          </article>

          {/* Card 2: DeepSeek-R1 */}
          <article className='feature-card'>
            <div>
              <div className='feature-icon-box'>⚡</div>
              <span className='badge'>DeepSeek-R1 / V3</span>
              <h3>Velocidade & Custo Reduzido</h3>
              <p className='muted'>
                {lang === 'pt'
                  ? 'Modelos otimizados para busca vetorial RAG em manuais corporativos com respostas ultra velozes.'
                  : 'Optimized model for technical documentation, fast RAG vector queries, and low operational cost.'}
              </p>
            </div>
            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-light)', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '700' }}>
              ✓ RAG Vector Knowledge Base
            </div>
          </article>

          {/* Card 3: Ollama Local */}
          <article className='feature-card'>
            <div>
              <div className='feature-icon-box'>🔒</div>
              <span className='badge'>Ollama Local (Full Node)</span>
              <h3>Privacidade Total On-Device</h3>
              <p className='muted'>
                {lang === 'pt'
                  ? 'Execução 100% isolada na máquina do cliente (AI Bridge em 127.0.0.1:8765) sem envio de dados externos.'
                  : 'Runs 100% locally on the customer workstation (127.0.0.1:8765) with complete data privacy.'}
              </p>
            </div>
            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-light)', fontSize: '0.8rem', color: 'var(--emerald)', fontWeight: '700' }}>
              ✓ 100% Private Local Execution
            </div>
          </article>

          {/* Card 4: Light Node Relay */}
          <article className='feature-card'>
            <div>
              <div className='feature-icon-box'>🧩</div>
              <span className='badge'>Light Node</span>
              <h3>Extensão para Navegador</h3>
              <p className='muted'>
                {lang === 'pt'
                  ? 'Transforma abas ativas do navegador em relés seguros de comunicação entre chats.'
                  : 'Turns browser tabs into secure message relay endpoints for ChatGPT, DeepSeek, and Gemini.'}
              </p>
            </div>
            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-light)', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '700' }}>
              ✓ Chrome & Edge Relay Extension
            </div>
          </article>

          {/* Card 5: Full Node AI Bridge */}
          <article className='feature-card'>
            <div>
              <div className='feature-icon-box'>🖥️</div>
              <span className='badge'>Full Node</span>
              <h3>Ponte Local AI Bridge</h3>
              <p className='muted'>
                {lang === 'pt'
                  ? 'Gateway local com Port-Guard para automações com arquivos, Git, terminal e bancos de dados.'
                  : 'Local gateway on port 8765 for safe execution on local files, Git, terminal, and databases.'}
              </p>
            </div>
            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-light)', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '700' }}>
              ✓ Control Center & Port-Guard
            </div>
          </article>

          {/* Card 6: Audit Trail & Compliance */}
          <article className='feature-card'>
            <div>
              <div className='feature-icon-box'>🛡️</div>
              <span className='badge'>Trilha de Auditoria</span>
              <h3>Segurança & LGPD / GDPR</h3>
              <p className='muted'>
                {lang === 'pt'
                  ? 'Registro imutável de todas as ações dos agentes e nós para transparência e compliance total.'
                  : 'Immutable audit logs recording every action performed by nodes and AI agents.'}
              </p>
            </div>
            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-light)', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '700' }}>
              ✓ Immutable Compliance Audit Log
            </div>
          </article>
        </div>
      </section>

      {/* Atlassian-Style Setup CTA Banner with HelpUS Branding */}
      <section className='card' style={{ background: 'linear-gradient(135deg, #0052cc 0%, #0747a6 50%, #172b4d 100%)', border: 'none', color: '#ffffff', padding: '44px', borderRadius: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <img src='/helpus_logo.png' alt='HelpUS Logo' style={{ height: '64px', width: 'auto', background: '#ffffff', padding: '6px', borderRadius: '14px' }} />
            <div>
              <h3 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#ffffff', marginBottom: '4px' }}>
                {lang === 'pt' ? 'Pronto para orquestrar seus agentes de IA?' : lang === 'es' ? '¿Listo para orquestar sus agentes de IA?' : 'Ready to orchestrate your AI Agent Mesh?'}
              </h3>
              <p style={{ fontSize: '1rem', color: 'rgba(255, 255, 255, 0.85)', margin: 0 }}>
                {lang === 'pt' ? 'Baixe o instalador da AI Bridge local ou acesse o dashboard do NexosAI Cloud.' : 'Download the local AI Bridge setup executable or access the full NexosAI Cloud dashboard.'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <a href={`/downloads?lang=${lang}`} className='button' style={{ background: '#ffffff', color: '#0052cc', padding: '14px 24px', fontWeight: '800' }}>
              <span>Setup AI Bridge 📥</span>
            </a>
            <a href={`/dashboard?lang=${lang}`} className='buttonSecondary' style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.3)', padding: '14px 24px', fontWeight: '700' }}>
              <span>Open Dashboard ⚡</span>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
