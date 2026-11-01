import type { PrismaClient } from '@prisma/client';
export function listTenantAuditLogs(args: {
  organizationId: string;
  db: PrismaClient;
}): Promise<Array<{
  id: string;
  action: string;
  severity: string;
  createdAt: Date;
  details: string | null;
  user: { email: string } | null;
  node: { name: string } | null;
}>>;
