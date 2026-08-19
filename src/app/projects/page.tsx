import { translations, getLang } from '@/i18n/translations';

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ lang?: string }> | { lang?: string } }) {
  const resolvedParams = await searchParams;
  const lang = getLang(resolvedParams?.lang);
  const t = translations[lang] || translations.en;

  const projects = [
    { name: 'HelpUS E-commerce AI', agentsCount: 3, nodesCount: 2, status: 'Active' },
    { name: 'USMLE Prep QBank Support', agentsCount: 2, nodesCount: 1, status: 'Active' },
    { name: 'VIP Executive Driver Dispatch', agentsCount: 1, nodesCount: 1, status: 'Active' },
  ];

  return (
    <>
      <section className='hero'>
        <span className='badge'>{t.projects.badge}</span>
        <h1>{t.projects.title}</h1>
        <p>{t.projects.description}</p>
      </section>

      <section className='grid'>
        {projects.map((proj) => (
          <article className='card' key={proj.name}>
            <span className='badge'>{proj.status}</span>
            <h2>{proj.name}</h2>
            <div className='kv'>
              <div><span>AI Agents</span><strong>{proj.agentsCount}</strong></div>
              <div><span>Nodes</span><strong>{proj.nodesCount}</strong></div>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
