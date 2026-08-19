import { translations, getLang } from '@/i18n/translations';

export default async function NodesPage({ searchParams }: { searchParams: Promise<{ lang?: string }> | { lang?: string } }) {
  const resolvedParams = await searchParams;
  const lang = getLang(resolvedParams?.lang);
  const t = translations[lang] || translations.en;

  const nodes = [
    {
      name: 'Notebook Principal',
      type: 'Full Node',
      status: 'online-ready',
      detail: 'Extensão + AI Bridge local + Control Center + gateway 8765',
    },
    {
      name: 'Browser Relay Node',
      type: 'Light Node',
      status: 'active',
      detail: 'Extensão apenas para relay de mensagens e presença no navegador',
    },
    {
      name: 'PC Backup Workstation',
      type: 'Full Node',
      status: 'standby',
      detail: 'Instalação recuperável para continuidade operacional',
    },
  ];

  return (
    <>
      <section className='hero'>
        <span className='badge'>{t.nodes.badge}</span>
        <h1>{t.nodes.title}</h1>
        <p>{t.nodes.description}</p>
      </section>

      <section className='grid'>
        {nodes.map((node) => (
          <article className='card' key={node.name}>
            <span className='badge'>{node.type}</span>
            <h2>{node.name}</h2>
            <div className='kv'>
              <div><span>Status</span><strong>{node.status}</strong></div>
              <div><span>Capability</span><strong>{node.type}</strong></div>
            </div>
            <p className='muted'>{node.detail}</p>
          </article>
        ))}
      </section>

      <section className='card' style={{ marginTop: 18 }}>
        <h2>{t.nodes.contractTitle}</h2>
        <ul className='list'>
          {t.nodes.contractList.map((item, idx) => (
            <li key={idx}>✓ {item}</li>
          ))}
        </ul>
      </section>
    </>
  );
}
