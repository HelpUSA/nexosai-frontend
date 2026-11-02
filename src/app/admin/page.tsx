import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { makeAuthOptions } from '@/lib/auth-options';
import { translations, getLang } from '@/i18n/translations';

export const dynamic = 'force-dynamic';

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }> | { lang?: string };
}) {
  let session = null;
  try {
    session = await getServerSession(makeAuthOptions());
  } catch {
    session = null;
  }

  if (!session?.user?.email) {
    redirect('/login');
  }

  const resolvedParams = await searchParams;
  const lang = getLang(resolvedParams?.lang);
  const t = translations[lang] || translations.en;

  return (
    <>
      <section className='hero'>
        <span className='badge'>{t.admin.badge}</span>
        <h1>{t.admin.title}</h1>
        <p>{t.admin.description}</p>
      </section>

      <section className='gridTwo'>
        <article className='card'>
          <h2>Organization Permissions & Roles</h2>
          <div className='kv'>
            <div>
              <span>Authenticated Admin</span>
              <strong>{session.user.email}</strong>
            </div>
            <div>
              <span>Default Role</span>
              <strong>VIEWER</strong>
            </div>
            <div>
              <span>OAuth Provider</span>
              <strong>Google Auth (Verified)</strong>
            </div>
          </div>
        </article>

        <article className='card'>
          <h2>API Credentials & Keys</h2>
          <div className='kv'>
            <div>
              <span>OpenAI API</span>
              <strong>Configured (GPT-4o)</strong>
            </div>
            <div>
              <span>DeepSeek API</span>
              <strong>Configured (R1 / V3)</strong>
            </div>
            <div>
              <span>Local Ollama Bridge</span>
              <strong>127.0.0.1:8765</strong>
            </div>
          </div>
        </article>
      </section>
    </>
  );
}
