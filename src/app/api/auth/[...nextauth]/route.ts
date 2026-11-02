import NextAuth from 'next-auth';
import { makeAuthOptions } from '@/lib/auth-options';

// Configure NextAuth only while processing a real request. During static build
// inspection, Next.js must not need OAuth credentials or a signing secret.
// Missing/invalid runtime settings still fail closed with 503 (no login success).
type AuthHandler = (request: Request, context: unknown) => Promise<Response>;
async function handleAuth(request: Request, context: unknown): Promise<Response> {
  let runtimeHandler: AuthHandler;
  try {
    runtimeHandler = NextAuth(makeAuthOptions()) as AuthHandler;
  } catch {
    return Response.json(
      { error: 'AUTHENTICATION_UNAVAILABLE' },
      { status: 503, headers: { 'cache-control': 'no-store' } }
    );
  }
  return runtimeHandler(request, context);
}
export { handleAuth as GET, handleAuth as POST };
