import type { Language } from './translations';
export const demoLabels: Record<Language, { title: string; detail: string; unknown: string }> = {
  pt: { title: 'MODO DEMONSTRAÇÃO — DADOS SINTÉTICOS', detail: 'Status, conversas, agentes e métricas exibidos não são telemetria ao vivo.', unknown: 'UNKNOWN — Sem telemetria verificada' },
  en: { title: 'DEMONSTRATION MODE — SYNTHETIC DATA', detail: 'Displayed status, conversations, agents and metrics are not live telemetry.', unknown: 'UNKNOWN — No verified telemetry' },
  es: { title: 'MODO DEMOSTRACIÓN — DATOS SINTÉTICOS', detail: 'Los estados, conversaciones, agentes y métricas no son telemetría en vivo.', unknown: 'UNKNOWN — Sin telemetría verificada' }
};
