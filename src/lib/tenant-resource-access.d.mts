import type { PrismaClient } from '@prisma/client';
export interface ScopedReadResult {
 ok:boolean;
 status:number;
 code:string;
 resource?: Record<string,unknown>;
}
export function authorizeScopedRead(args:{
 email?:string|null; organizationId:string; resourceId:string;
 conversationId?:string; kind:'agent'|'conversation'|'message'; db:PrismaClient;
}):Promise<ScopedReadResult>;
