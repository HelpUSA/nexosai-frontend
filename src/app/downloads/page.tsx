import { translations, getLang } from '@/i18n/translations';

export default async function DownloadsPage({ searchParams }: { searchParams: Promise<{ lang?: string }> | { lang?: string } }) {
  const resolvedParams = await searchParams;
  const lang = getLang(resolvedParams?.lang);
  const t = translations[lang] || translations.en;

  return (
    <>
      <section className='hero'>
        <span className='badge'>{t.downloads.badge}</span>
        <h1>{t.downloads.title}</h1>
        <p>{t.downloads.description}</p>
      </section>

      <section className='gridTwo'>
        <article className='card'>
          <h2>NexosAI Bridge Installer (Full Node)</h2>
          <p className='muted' style={{ marginBottom: 16 }}>
            Windows Executable (.exe) setup to install local AI Bridge gateway on 127.0.0.1:8765.
          </p>
          <a href='/NexosAI_Setup.exe' className='button' download>
            📥 Download NexosAI_Setup.exe
          </a>
        </article>

        <article className='card'>
          <h2>Browser Relay Extension (Light Node)</h2>
          <p className='muted' style={{ marginBottom: 16 }}>
            Chrome / Edge Extension for discovery and chat relaying across ChatGPT, DeepSeek and Gemini.
          </p>
          <button className='buttonSecondary'>
            🧩 Add to Browser Extension
          </button>
        </article>
      </section>
    </>
  );
}
