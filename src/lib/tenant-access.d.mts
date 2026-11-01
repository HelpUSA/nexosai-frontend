import type { PrismaClient } from '@prisma/client';
export interface NodeAccessResult {
  ok: boolean;
  status: number;
  code: string;
  node?: {
    id: string;
    organizationId: string;
    name: string;
    type: string;
    status: string;
    lastSeenAt: Date | null;
  };
}
export function authorizeNodeRead(args: {
  email?: string | null;
  organizationId: string;
  nodeId: string;
  db: PrismaClient;
}): Promise<NodeAccessResult>;
