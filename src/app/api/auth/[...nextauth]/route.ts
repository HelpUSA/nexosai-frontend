import NextAuth from 'next-auth';
import { makeAuthOptions } from '@/lib/auth-options';

// Deliberately strict: misconfigured environment fails closed. Never use demo secrets.
const handler = NextAuth(makeAuthOptions());
export { handler as GET, handler as POST };
