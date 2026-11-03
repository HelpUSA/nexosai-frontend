import type { PrismaClient } from '@prisma/client';

export type AgentListAuthorization =
  | { ok: false; status: number; code: string }
  | { ok: true; status: 200; organizationId: string; role: 'VIEWER' | 'OPERATOR' | 'ADMIN' | 'OWNER' };

export declare function authorizeAgentList(args: {
  email?: string | null;
  organizationId?: string | null;
  db: PrismaClient;
}): Promise<AgentListAuthorization>;

export declare const AGENT_PUBLIC_LIST_SELECT: Readonly<{
  id: true;
  name: true;
  description: true;
  model: true;
  isActive: true;
  temperature: true;
}>;

export declare function agentListQuery(organizationId: string): {
  where: { organizationId: string };
  take: 10;
  orderBy: { createdAt: 'desc' };
  select: typeof AGENT_PUBLIC_LIST_SELECT;
};
