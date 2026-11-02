import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
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
    return (
      <section className='hero'>
        <span className='badge' style={{ background: '#fef2f2', color: '#b91c1c', borderColor: '#fecaca' }}>
          403 Access Denied
        </span>
        <h1>Administrative Authorization Required</h1>
        <p>
          Your account ({session.user.email}) does not hold an ACTIVE administrative role (ADMIN or OWNER) in this organization.
        </p>
      </section>
    );
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
