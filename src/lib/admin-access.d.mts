import type { PrismaClient } from '@prisma/client';

export interface AdminAccessResult {
  ok: boolean;
  status: number;
  code: string;
  user?: {
    id: string;
    email: string;
  };
  organizationId?: string;
  role?: string;
}

export function authorizeAdminAccess(args: {
  email?: string | null;
  organizationId?: string;
  db: PrismaClient;
}): Promise<AdminAccessResult>;

export function authorizeAuditAccess(args: {
  email?: string | null;
  organizationId?: string;
  db: PrismaClient;
}): Promise<AdminAccessResult>;
