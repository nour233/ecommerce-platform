import { env } from "@/lib/env";
import { db } from "@/lib/db/dynamo";
import { keys } from "@/lib/db/keys";
import { store } from "@/lib/db/mock";
import type { RegistrationVerification } from "@/types";

type RegistrationVerificationRecord = RegistrationVerification & {
  pk: string;
  sk: string;
  entityType: "RegistrationVerification";
};

const toVerification = (
  record: RegistrationVerificationRecord
): RegistrationVerification => ({
  userId: record.userId,
  name: record.name,
  email: record.email,
  passwordHash: record.passwordHash,
  passwordSalt: record.passwordSalt,
  codeHash: record.codeHash,
  attempts: record.attempts,
  createdAt: record.createdAt,
  sentAt: record.sentAt,
  expiresAt: record.expiresAt,
  expiresAtEpoch: record.expiresAtEpoch
});

export const registrationVerificationRepository = {
  async get(userId: string) {
    if (env.useMockDb) {
      return (
        store.registrationVerifications.find(
          (verification) => verification.userId === userId
        ) ?? null
      );
    }

    const record = await db.get<RegistrationVerificationRecord>(
      keys.registrationVerificationPk(userId),
      keys.registrationVerificationSk
    );
    return record ? toVerification(record) : null;
  },

  async save(verification: RegistrationVerification) {
    if (env.useMockDb) {
      const index = store.registrationVerifications.findIndex(
        (candidate) => candidate.userId === verification.userId
      );
      if (index === -1) store.registrationVerifications.push(verification);
      else store.registrationVerifications[index] = verification;
      return verification;
    }

    await db.put({
      pk: keys.registrationVerificationPk(verification.userId),
      sk: keys.registrationVerificationSk,
      entityType: "RegistrationVerification",
      ...verification
    });
    return verification;
  },

  async delete(userId: string) {
    if (env.useMockDb) {
      store.registrationVerifications =
        store.registrationVerifications.filter(
          (verification) => verification.userId !== userId
        );
      return;
    }

    await db.delete(
      keys.registrationVerificationPk(userId),
      keys.registrationVerificationSk
    );
  }
};
