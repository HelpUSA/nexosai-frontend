import type { PrismaClient } from '@prisma/client';

export function normalizeVerifiedEmail(value: unknown): string | null;
export function allowProvisionedGoogleSignIn(
  claims: { user: unknown; account: unknown; profile: unknown },
  db: Pick<PrismaClient, 'user' | 'organizationMembership'>
): Promise<boolean>;
