import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { parseNexosAuthEnv } from './auth-env.mjs';
import { allowProvisionedGoogleSignIn } from './google-admission.mjs';
import { db } from './db';

/** N1-A: Bootstrap is NOT organization authorization; N1-B handles membership/RBAC. */
export function makeAuthOptions(env: NodeJS.ProcessEnv = process.env): NextAuthOptions {
  const config = parseNexosAuthEnv(env);
  return {
    secret: config.secret,
    session: { strategy: 'jwt', maxAge: 3600 },
    providers: [GoogleProvider({ clientId: config.clientId, clientSecret: config.clientSecret })],
    callbacks: {
      async signIn({ user, account, profile }) {
        // Provisioned membership is authoritative; a matching email alone is not permission.
        // The bootstrap email must also be provisioned by a separately approved admin process.
        return allowProvisionedGoogleSignIn({user,account,profile},db);
      },
    },
  };
}
