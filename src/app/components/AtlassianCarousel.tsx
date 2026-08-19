'use client';

import { useState, useEffect } from 'react';

interface CaseStudy {
  id: string;
  badge: string;
  title: string;
  quote: string;
  metrics: { value: string; label: string }[];
  category: string;
}

export function AtlassianCarousel({ lang = 'en' }: { lang?: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const cases: CaseStudy[] = [
    {
      id: 'ecommerce',
      badge: 'HELPUS E-COMMERCE & SALES',
      title: lang === 'pt' ? 'Atendimento Automático de Vendas 24/7' : lang === 'es' ? 'Atención Automática de Ventas 24/7' : '24/7 Automated Sales & Qualification',
      quote: lang === 'pt'
        ? '“O agente NexosAI GPT-4o responde dúvidas de clientes no WhatsApp em menos de 3 segundos e realiza a qualificação de leads automaticamente.”'
        : '“The NexosAI GPT-4o agent responds to customer WhatsApp inquiries in under 3 seconds and qualifies leads automatically.”',
      metrics: [
        { value: '3x', label: 'Lead Conversion Rate' },
        { value: '< 3s', label: 'Response Time' },
        { value: '24/7', label: 'Availability' }
      ],
      category: 'Sales Automation'
    },
    {
      id: 'usmle',
      badge: 'USMLE PREP MEDICAL QBANK',
      title: lang === 'pt' ? 'Tutor Médico Virtual RAG com DeepSeek-R1' : lang === 'es' ? 'Tutor Médico Virtual RAG con DeepSeek-R1' : 'Virtual Medical Tutor RAG with DeepSeek-R1',
      quote: lang === 'pt'
        ? '“Busca vetorial RAG sobre +3.000 questões clínicas comentadas com respostas explicativas personalizadas para cada estudante de medicina.”'
        : '“RAG vector search across 3,000+ medical clinical questions with personalized step-by-step guidance for medical students.”',
      metrics: [
        { value: '+3.000', label: 'Medical QBank Questions' },
        { value: '99.4%', label: 'Accuracy Rate' },
        { value: '70%', label: 'Cost Reduction' }
      ],
      category: 'Medical Education RAG'
    },
    {
      id: 'mobility',
      badge: 'VIP EXECUTIVE DRIVER',
      title: lang === 'pt' ? 'Despacho de Transporte Executivo & Agendamento' : lang === 'es' ? 'Despacho de Transporte Ejecutivo' : 'VIP Executive Driver Dispatch & Scheduling',
      quote: lang === 'pt'
        ? '“Agendamento automatizado de transporte VIP corporativo com confirmação instantânea e telemetria de voos em tempo real.”'
        : '“Automated corporate VIP transportation scheduling with instant flight tracking and dispatch confirmation.”',
      metrics: [
        { value: '100%', label: 'On-Time Dispatch' },
        { value: 'Instant', label: 'Booking Speed' },
        { value: 'VIP', label: 'Service Level' }
      ],
      category: 'Corporate Mobility'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % cases.length);
    }, 6500);
    return () => clearInterval(timer);
  }, [cases.length]);

  const currentCase = cases[currentIndex];

  return (
    <div style={{ margin: '36px 0' }}>
      
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span className='badge'>Enterprise Use Cases</span>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-dark)' }}>
            {lang === 'pt' ? 'Casos de Sucesso em Produção' : lang === 'es' ? 'Casos de Éxito en Producción' : 'Proven Enterprise Use Cases'}
          </h2>
        </div>

        {/* Carousel Navigation Arrows */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {cases.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              style={{
                width: currentIndex === idx ? '28px' : '10px',
                height: '10px',
                borderRadius: '10px',
                background: currentIndex === idx ? 'var(--primary)' : 'var(--border-hover)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.25s ease'
              }}
            />
          ))}
        </div>
      </div>

      {/* Carousel Showcase Card */}
      <div style={{
        background: '#ffffff',
        border: '1px solid var(--border-light)',
        borderRadius: '24px',
        padding: '36px',
        boxShadow: 'var(--shadow-md)',
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '32px',
        alignItems: 'center'
      }}>
        <div>
          <span className='hero-pill-badge'>{currentCase.badge}</span>
          <h3 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '14px' }}>
            {currentCase.title}
          </h3>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-body)', fontStyle: 'italic', lineHeight: '1.65', marginBottom: '24px' }}>
            {currentCase.quote}
          </p>
        </div>

        {/* Key Performance Metrics Strip */}
        <div style={{ background: '#f8fafc', border: '1px solid var(--border-light)', padding: '24px', borderRadius: '18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {currentCase.metrics.map((m, idx) => (
            <div key={idx} style={{ borderBottom: idx < currentCase.metrics.length - 1 ? '1px solid var(--border-light)' : 'none', paddingBottom: idx < currentCase.metrics.length - 1 ? '12px' : '0' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--primary)' }}>{m.value}</div>
              <div style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
