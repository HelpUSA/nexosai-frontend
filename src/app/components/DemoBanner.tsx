import type { Language } from '@/i18n/translations';
import { demoLabels } from '@/i18n/demo';

export function DemoBanner({ lang = 'en' }: { lang?: Language }) {
  const labels = demoLabels[lang];
  return (
    <aside role='status' aria-label='DEMO' style={{ padding: '12px 18px', marginBottom: 20, borderRadius: 12, border: '2px solid #a16207', background: '#422006', color: '#fef3c7' }}>
      <strong>DEMO / LAB — {labels.title}</strong>
      <p style={{ marginTop: 4 }}>{labels.detail} {labels.unknown}</p>
    </aside>
  );
}
