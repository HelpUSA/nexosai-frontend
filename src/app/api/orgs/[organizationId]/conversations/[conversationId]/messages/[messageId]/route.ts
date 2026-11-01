import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { makeAuthOptions } from '@/lib/auth-options';
import { authorizeScopedRead } from '@/lib/tenant-resource-access.mjs';
import { db } from '@/lib/db';

// Draft read-only endpoint: always authorize the server-side organization and parent chain.
export const dynamic='force-dynamic';
export async function GET(_request:Request,context:{params:Promise<{organizationId: string; conversationId: string; messageId: string}>}) {
 try {
  const session=await getServerSession(makeAuthOptions());
  if(!session?.user?.email)return NextResponse.json({error:'UNAUTHENTICATED'},{status:401,headers:{'cache-control':'no-store'}});
  const params=await context.params;
  const access=await authorizeScopedRead({
   email:session.user.email,
   organizationId:params.organizationId,
   resourceId:params.messageId,
   conversationId:params.conversationId,
   kind:'message',db
  });
  if(!access.ok)return NextResponse.json({error:access.code},{status:access.status,headers:{'cache-control':'no-store'}});
  return NextResponse.json({message:access.resource},{status:200,headers:{'cache-control':'private, no-store'}});
 }catch{
  return NextResponse.json({error:'AUTHENTICATION_UNAVAILABLE'},{status:503,headers:{'cache-control':'no-store'}});
 }
}
