import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { parseNexosAuthEnv } from './auth-env.mjs';

/** N1-A: Bootstrap is NOT organization authorization; N1-B handles membership/RBAC. */
export function makeAuthOptions(env: NodeJS.ProcessEnv = process.env): NextAuthOptions {
  const config = parseNexosAuthEnv(env);
  return {
    secret: config.secret,
    session: { strategy: 'jwt', maxAge: 3600 },
    providers: [GoogleProvider({ clientId: config.clientId, clientSecret: config.clientSecret })],
    callbacks: {
      async signIn({ user }) {
        return Boolean(user.email && user.email.toLowerCase() === config.bootstrapEmail);
      },
    },
  };
}
