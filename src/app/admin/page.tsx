import { getServerSession } from 'next-auth/next';
import { redirect, forbidden } from 'next/navigation';
import { makeAuthOptions } from '@/lib/auth-options';
import { authorizeAdminAccess } from '@/lib/admin-access.mjs';
import { db } from '@/lib/db';
import { translations, getLang } from '@/i18n/translations';

export const dynamic = 'force-dynamic';

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string; organizationId?: string }> | { lang?: string; organizationId?: string };
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

  const authz = await authorizeAdminAccess({
    email: session.user.email,
    organizationId: resolvedParams?.organizationId,
    db,
  });

  if (!authz.ok) {
    forbidden();
  }

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
              <span>Organization</span>
              <strong>{authz.organizationId}</strong>
            </div>
            <div>
              <span>Active Role</span>
              <strong>{authz.role}</strong>
            </div>
            <div>
              <span>OAuth Provider</span>
              <strong>Google OAuth — NOT VERIFIED (B3 pending)</strong>
            </div>
          </div>
        </article>

        <article className='card'>
          <h2>Integration Configuration (Unverified)</h2>
          <p role='status'>NOT VERIFIED — actual provider credentials and service availability have not been checked.</p>
          <div className='kv'>
            <div>
              <span>OpenAI API</span>
              <strong>NOT VERIFIED</strong>
            </div>
            <div>
              <span>DeepSeek API</span>
              <strong>NOT VERIFIED</strong>
            </div>
            <div>
              <span>Local Ollama Bridge</span>
              <strong>NOT VERIFIED</strong>
            </div>
          </div>
        </article>
      </section>
    </>
  );
}
