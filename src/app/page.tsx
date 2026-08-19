import { translations, getLang } from '@/i18n/translations';

export default async function HomePage({ searchParams }: { searchParams: Promise<{ lang?: string }> | { lang?: string } }) {
  const resolvedParams = await searchParams;
  const lang = getLang(resolvedParams?.lang);
  const t = translations[lang] || translations.en;

  return (
    <section className='hero'>
      <span className='badge'>{t.dashboard.badge}</span>
      <h1>{t.dashboard.title}</h1>
      <p>{t.dashboard.description}</p>
      <div className='actions'>
        <a className='button' href={`/dashboard?lang=${lang}`}>
          {t.nav.dashboard} ⚡
        </a>
        <a className='buttonSecondary' href={`/downloads?lang=${lang}`}>
          {t.nav.downloads} 📥
        </a>
      </div>
    </section>
  );
}
