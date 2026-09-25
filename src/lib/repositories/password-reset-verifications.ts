import { env } from "@/lib/env";
import { db } from "@/lib/db/dynamo";
import { keys } from "@/lib/db/keys";
import { store } from "@/lib/db/mock";
import type { PasswordResetVerification } from "@/types";

type PasswordResetRecord = PasswordResetVerification & {
  pk: string;
  sk: string;
  entityType: "PasswordResetVerification";
};

const toVerification = (record: PasswordResetRecord): PasswordResetVerification => ({
  userId: record.userId,
  email: record.email,
  codeHash: record.codeHash,
  attempts: record.attempts,
  createdAt: record.createdAt,
  sentAt: record.sentAt,
  expiresAt: record.expiresAt,
  expiresAtEpoch: record.expiresAtEpoch
});

export const passwordResetVerificationRepository = {
  async get(userId: string) {
    if (env.useMockDb) {
      return store.passwordResetVerifications.find((item) => item.userId === userId) ?? null;
    }
    const record = await db.get<PasswordResetRecord>(
      keys.passwordResetPk(userId),
      keys.passwordResetSk
    );
    return record ? toVerification(record) : null;
  },

  async save(verification: PasswordResetVerification) {
    if (env.useMockDb) {
      const index = store.passwordResetVerifications.findIndex(
        (item) => item.userId === verification.userId
      );
      if (index === -1) store.passwordResetVerifications.push(verification);
      else store.passwordResetVerifications[index] = verification;
      return verification;
    }
    await db.put({
      pk: keys.passwordResetPk(verification.userId),
      sk: keys.passwordResetSk,
      entityType: "PasswordResetVerification",
      ...verification
    });
    return verification;
  },

  async delete(userId: string) {
    if (env.useMockDb) {
      store.passwordResetVerifications = store.passwordResetVerifications.filter(
        (item) => item.userId !== userId
      );
      return;
    }
    await db.delete(keys.passwordResetPk(userId), keys.passwordResetSk);
  }
};
