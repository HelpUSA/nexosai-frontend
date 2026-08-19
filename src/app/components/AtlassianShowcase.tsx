'use client';

import { useState } from 'react';

interface TabItem {
  id: string;
  badge: string;
  title: string;
  description: string;
  bullets: string[];
  imageBg: string;
  tagline: string;
}

export function AtlassianShowcase({ lang = 'en' }: { lang?: string }) {
  const [activeTab, setActiveTab] = useState<string>('orquestracao');

  const tabs: TabItem[] = [
    {
      id: 'orquestracao',
      badge: lang === 'pt' ? 'ORQUESTRAÇÃO DE AGENTES' : lang === 'es' ? 'ORQUESTACIÓN DE AGENTES' : 'AGENT ORCHESTRATION',
      title: lang === 'pt' ? 'Conecte GPT-4o, DeepSeek-R1 e Ollama em uma única malha de inteligência' : lang === 'es' ? 'Conecte GPT-4o, DeepSeek-R1 y Ollama en una sola malla de inteligencia' : 'Connect GPT-4o, DeepSeek-R1, and Local LLMs in a single intelligence mesh',
      description: lang === 'pt' ? 'O NexosAI Cloud decide dinamicamente qual modelo de IA executar com base no tipo da tarefa, reduzindo custos operacionais e acelerando o tempo de resposta.' : lang === 'es' ? 'NexosAI Cloud decide dinámicamente qué modelo de IA ejecutar según el tipo de tarea, reduciendo costos y acelerando el tiempo de respuesta.' : 'NexosAI Cloud dynamically selects the optimal AI model based on task requirements, optimizing operating costs and accelerating response times.',
      bullets: [
        lang === 'pt' ? 'Atendimento no WhatsApp e Webchat 24 horas por dia' : '24/7 Automated WhatsApp & Webchat Customer Support',
        lang === 'pt' ? 'Roteamento dinâmico de prompts e contexto corporativo' : 'Dynamic prompt routing & enterprise context memory',
        lang === 'pt' ? 'Busca vetorial RAG em manuais e PDFs da empresa' : 'RAG Vector Search across company PDFs & knowledge bases'
      ],
      imageBg: 'linear-gradient(135deg, #0052cc 0%, #0747a6 50%, #172b4d 100%)',
      tagline: 'Multi-LLM Dynamic Routing Engine'
    },
    {
      id: 'privacidade',
      badge: lang === 'pt' ? 'EXECUÇÃO LOCAL & PRIVACIDADE' : lang === 'es' ? 'EJECUCIÓN LOCAL Y PRIVACIDAD' : 'LOCAL PRIVACY & EXECUTION',
      title: lang === 'pt' ? 'Processamento 100% isolado na máquina do cliente com AI Bridge local' : lang === 'es' ? 'Procesamiento 100% aislado en la máquina del cliente con AI Bridge local' : '100% isolated local execution on customer hardware with AI Bridge',
      description: lang === 'pt' ? 'Garanta a conformidade com a LGPD e GDPR mantendo os dados confidenciais na rede interna do cliente. A AI Bridge roda em 127.0.0.1:8765 sob controle total.' : lang === 'es' ? 'Garantice el cumplimiento con LGPD y GDPR manteniendo los datos confidenciales en la red interna del cliente.' : 'Guarantee GDPR & LGPD compliance by keeping sensitive data on-premises. The AI Bridge runs locally on 127.0.0.1:8765.',
      bullets: [
        lang === 'pt' ? 'Suporte a Ollama / Llama 3 local sem envio de dados à nuvem' : 'Native Ollama / Llama 3 local model support',
        lang === 'pt' ? 'Controle de segurança em arquivos, Git e Terminal' : 'Port-guard & safe local file/Git/terminal automation',
        lang === 'pt' ? 'Auditoria imutável de todas as ações executadas' : 'Immutable audit trail of all local actions'
      ],
      imageBg: 'linear-gradient(135deg, #059669 0%, #047857 50%, #064e3b 100%)',
      tagline: 'On-Device AI Bridge Gateway (127.0.0.1:8765)'
    },
    {
      id: 'relays',
      badge: lang === 'pt' ? 'RELAYS MULTICANAVAIS' : lang === 'es' ? 'RELAYS MULTICANAL' : 'OMNICHANNEL RELAYS',
      title: lang === 'pt' ? 'Transforme abas de navegadores em relés de comunicação seguros' : lang === 'es' ? 'Transforme pestañas del navegador en relés de comunicación seguros' : 'Turn browser tabs into secure communication relay endpoints',
      description: lang === 'pt' ? 'Com a extensão Light Node para Chrome e Edge, a nuvem descobre chats ativos e entrega mensagens em tempo real sem expor portas públicas.' : lang === 'es' ? 'Con la extensión Light Node para Chrome y Edge, la nube descubre chats activos y entrega mensajes en tiempo real.' : 'With the Light Node browser extension, the cloud discovers active chats and routes messages in real-time.',
      bullets: [
        lang === 'pt' ? 'Roteamento seguro por papel (Role Leases) sem split-brain' : 'Role-leased routing preventing operational split-brain',
        lang === 'pt' ? 'Fila Inbox/Outbox para entrega confiável de mensagens' : 'Reliable Inbox/Outbox queue infrastructure',
        lang === 'pt' ? 'Instalação rápida com 1 clique para Chrome e Edge' : '1-click extension setup for Chrome & Edge'
      ],
      imageBg: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 50%, #1e1b4b 100%)',
      tagline: 'Browser Light Node Extension Mesh'
    }
  ];

  const currentTab = tabs.find(t => t.id === activeTab) || tabs[0];

  return (
    <div style={{ margin: '36px 0' }}>
      
      {/* Atlassian-Style Tab Buttons */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '2px solid var(--border-light)', paddingBottom: '12px', marginBottom: '24px', overflowX: 'auto' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: activeTab === tab.id ? '#eff6ff' : 'transparent',
              border: activeTab === tab.id ? '1px solid #bfdbfe' : '1px solid transparent',
              color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
              padding: '10px 18px',
              borderRadius: '12px',
              fontWeight: activeTab === tab.id ? '800' : '600',
              fontSize: '0.88rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>{tab.badge}</span>
          </button>
        ))}
      </div>

      {/* Interactive Content Card (Atlassian Style Feature Showcase) */}
      <div style={{
        background: '#ffffff',
        border: '1px solid var(--border-light)',
        borderRadius: '24px',
        padding: '36px',
        boxShadow: 'var(--shadow-lg)',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '36px',
        alignItems: 'center'
      }}>
        
        {/* Left Side: Content */}
        <div>
          <span className='hero-pill-badge'>{currentTab.badge}</span>
          <h3 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-dark)', lineHeight: '1.3', marginBottom: '14px' }}>
            {currentTab.title}
          </h3>
          <p style={{ fontSize: '0.98rem', color: 'var(--text-body)', lineHeight: '1.65', marginBottom: '24px' }}>
            {currentTab.description}
          </p>

          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
            {currentTab.bullets.map((bullet, idx) => (
              <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: 'var(--text-dark)', fontWeight: '600' }}>
                <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#ecfdf5', color: 'var(--emerald)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '800' }}>✓</span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>

          <div style={{ display: 'flex', gap: '12px' }}>
            <a href={`/agents?lang=${lang}`} className='button'>
              <span>Explore Features 🚀</span>
            </a>
            <a href={`/downloads?lang=${lang}`} className='buttonSecondary'>
              <span>Get Setup.exe 📥</span>
            </a>
          </div>
        </div>

        {/* Right Side: Atlassian Gradient Interactive Preview Frame */}
        <div style={{
          background: currentTab.imageBg,
          borderRadius: '20px',
          padding: '32px',
          color: '#ffffff',
          minHeight: '340px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: 'var(--shadow-md)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.8, marginBottom: '8px' }}>
              {currentTab.tagline}
            </div>
            <h4 style={{ fontSize: '1.5rem', fontWeight: '800', lineHeight: '1.3' }}>
              NexosAI Enterprise Architecture
            </h4>
          </div>

          {/* Code/Flow Mockup Frame */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '14px',
            padding: '16px',
            fontFamily: 'monospace',
            fontSize: '0.82rem',
            color: '#67e8f9'
          }}>
            <div>[NexosAI Mesh Router] Active</div>
            <div style={{ color: '#86efac', marginTop: '4px' }}>&gt; Node Status: 100% ONLINE (127.0.0.1:8765)</div>
            <div style={{ color: '#fde68a', marginTop: '4px' }}>&gt; Model Engine: GPT-4o / DeepSeek-R1 / Ollama</div>
            <div style={{ color: '#ffffff', marginTop: '4px', opacity: 0.8 }}>&gt; Encryption: TLS 1.3 + Signed Role Leases</div>
          </div>
        </div>

      </div>

    </div>
  );
}
