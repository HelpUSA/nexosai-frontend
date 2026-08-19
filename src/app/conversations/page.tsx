import { translations, getLang } from '@/i18n/translations';

export default async function ConversationsPage({ searchParams }: { searchParams: Promise<{ lang?: string }> | { lang?: string } }) {
  const resolvedParams = await searchParams;
  const lang = getLang(resolvedParams?.lang);
  const t = translations[lang] || translations.en;

  const conversations = [
    { title: 'manager ai_bridge', role: 'manager', node: 'Notebook principal', status: 'lease-active' },
    { title: 'watcher5', role: 'ops', node: 'Notebook principal', status: 'observed' },
    { title: 'watcher6', role: 'executor', node: 'Notebook principal', status: 'active' },
    { title: 'future relay chat', role: 'standby', node: 'Browser relay node', status: 'planned' },
  ];

  return (
    <>
      <section className='hero'>
        <span className='badge'>{t.conversations.badge}</span>
        <h1>{t.conversations.title}</h1>
        <p>{t.conversations.description}</p>
      </section>

      <section className='grid'>
        {conversations.map((chat) => (
          <article className='card' key={chat.title}>
            <span className='badge'>{chat.role}</span>
            <h2>{chat.title}</h2>
            <div className='kv'>
              <div><span>Node</span><strong>{chat.node}</strong></div>
              <div><span>Status</span><strong>{chat.status}</strong></div>
            </div>
          </article>
        ))}
      </section>

      <section className='card' style={{ marginTop: 18 }}>
        <h2>{t.conversations.relayFlowTitle}</h2>
        <code className='code'>{t.conversations.relayFlowDesc}</code>
      </section>
    </>
  );
}
