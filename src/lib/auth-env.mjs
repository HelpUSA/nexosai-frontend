const UNSAFE = /^(?:demo[-_]|example|change[-_ ]?me$|placeholder|test[-_]?secret|your[-_]?secret)/i;
export function parseNexosAuthEnv(env) {
  const legacy = env.NEXTAUTH_SECRET?.trim();
  const modern = env.AUTH_SECRET?.trim();
  if (legacy && modern && legacy !== modern) throw new Error('NEXOS_AUTH_SECRET_CONFLICT');
  const secret = modern || legacy;
  if (!secret || secret.length < 32 || UNSAFE.test(secret)) throw new Error('NEXOS_AUTH_SECRET_REQUIRED');
  const clientId = env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret || /demo|example|placeholder/i.test(clientId) || /demo|example|placeholder/i.test(clientSecret)) {
    throw new Error('NEXOS_GOOGLE_OAUTH_CREDENTIALS_REQUIRED');
  }
  const bootstrapEmail = env.NEXOSAI_BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  if (!bootstrapEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(bootstrapEmail)) {
    throw new Error('NEXOS_BOOTSTRAP_EMAIL_REQUIRED');
  }
  return Object.freeze({ secret, clientId, clientSecret, bootstrapEmail });
}
