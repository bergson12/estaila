import "server-only";
import { prisma } from "./db";

export type AuditAction =
  | "user.changePlan"
  | "user.adjustCredits"
  | "user.setSuspended"
  | "user.setRole"
  | "user.refund"
  | "user.resetCredits"
  | "settings.update"
  | "billing.refund"
  | "billing.cancelSub";

export async function audit(
  actorId: string,
  action: AuditAction,
  targetId: string | null,
  metadata?: Record<string, unknown>
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorId,
      action,
      targetId,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });
}
