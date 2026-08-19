import { translations, getLang } from '@/i18n/translations';

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ lang?: string }> | { lang?: string } }) {
  const resolvedParams = await searchParams;
  const lang = getLang(resolvedParams?.lang);
  const t = translations[lang] || translations.en;

  const stats = [
    { label: t.dashboard.stats.nodesModel.label, value: t.dashboard.stats.nodesModel.value, note: t.dashboard.stats.nodesModel.note },
    { label: t.dashboard.stats.relayCloud.label, value: t.dashboard.stats.relayCloud.value, note: t.dashboard.stats.relayCloud.note },
    { label: t.dashboard.stats.localExec.label, value: t.dashboard.stats.localExec.value, note: t.dashboard.stats.localExec.note },
    { label: t.dashboard.stats.activeAgents.label, value: t.dashboard.stats.activeAgents.value, note: t.dashboard.stats.activeAgents.note },
  ];

  return (
    <>
      <section className='hero'>
        <span className='badge'>{t.dashboard.badge}</span>
        <h1>{t.dashboard.title}</h1>
        <p>{t.dashboard.description}</p>
      </section>

      <section className='grid'>
        {stats.map((item) => (
          <article className='card' key={item.label}>
            <div className='stat'>{item.value}</div>
            <h3>{item.label}</h3>
            <p className='muted'>{item.note}</p>
          </article>
        ))}
      </section>

      <section className='gridTwo' style={{ marginTop: 18 }}>
        <article className='card'>
          <h2>{t.dashboard.cloudRespTitle}</h2>
          <ul className='list'>
            {t.dashboard.cloudRespList.map((item, idx) => (
              <li key={idx}>✓ {item}</li>
            ))}
          </ul>
        </article>
        <article className='card'>
          <h2>{t.dashboard.localRespTitle}</h2>
          <ul className='list'>
            {t.dashboard.localRespList.map((item, idx) => (
              <li key={idx}>✓ {item}</li>
            ))}
          </ul>
        </article>
      </section>
    </>
  );
}
