import { createHash } from "node:crypto";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { db } from "@/lib/db/dynamo";
import { keys } from "@/lib/db/keys";
import { store } from "@/lib/db/mock";
import type { User, UserRole } from "@/types";

export type UserCredentials = {
  passwordHash: string;
  passwordSalt: string;
};

type UserRecord = User & UserCredentials & { pk: string; sk: string; entityType: "User" };
type EmailLookupRecord = {
  pk: string;
  sk: string;
  entityType: "EmailLookup";
  userId: string;
  email: string;
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const legacyUserIdForEmail = (email: string) =>
  createHash("sha256").update(normalizeEmail(email)).digest("hex");

const toUser = (record: User): User => ({
  id: record.id,
  name: record.name,
  email: record.email,
  role: record.role ?? "customer",
  createdAt: record.createdAt
});

async function resolveUserIdByEmail(email: string) {
  const normalizedEmail = normalizeEmail(email);
  if (env.useMockDb) {
    return store.users.find((user) => user.email === normalizedEmail)?.id ?? null;
  }

  const lookup = await db.get<EmailLookupRecord>(
    keys.emailLookupPk(normalizedEmail),
    keys.emailLookupSk
  );
  if (lookup) return lookup.userId;

  // Existing accounts predate email lookup records, so keep a verified fallback.
  const legacyId = legacyUserIdForEmail(normalizedEmail);
  const legacy = await db.get<UserRecord>(keys.userPk(legacyId), keys.userSk);
  return legacy?.email === normalizedEmail ? legacyId : null;
}

export const userRepository = {
  async getUser(id: string) {
    if (env.useMockDb) {
      const user = store.users.find((candidate) => candidate.id === id);
      return user ? toUser(user) : null;
    }
    const record = await db.get<UserRecord>(keys.userPk(id), keys.userSk);
    if (!record) return null;
    return toUser(record);
  },

  async getUserWithCredentials(id: string): Promise<(User & UserCredentials) | null> {
    if (env.useMockDb) {
      const user = store.users.find((candidate) => candidate.id === id);
      if (!user?.passwordHash || !user.passwordSalt) return null;
      return { ...toUser(user), passwordHash: user.passwordHash, passwordSalt: user.passwordSalt };
    }
    const record = await db.get<UserRecord>(keys.userPk(id), keys.userSk);
    if (!record) return null;
    return { ...toUser(record), passwordHash: record.passwordHash, passwordSalt: record.passwordSalt };
  },

  async getUserByEmail(email: string) {
    const userId = await resolveUserIdByEmail(email);
    return userId ? this.getUser(userId) : null;
  },

  async getUserWithCredentialsByEmail(email: string) {
    const userId = await resolveUserIdByEmail(email);
    return userId ? this.getUserWithCredentials(userId) : null;
  },

  async createUser(user: User, credentials: UserCredentials) {
    const normalizedEmail = normalizeEmail(user.email);
    if (env.useMockDb) {
      if (store.users.some((candidate) => candidate.email === normalizedEmail)) {
        throw new AppError("An account already exists for this email", 409, "EMAIL_IN_USE");
      }
      const normalizedUser = { ...user, email: normalizedEmail };
      store.users.push({ ...normalizedUser, ...credentials });
      return normalizedUser;
    }

    const created = await db.putIfAbsent({
      pk: keys.userPk(user.id),
      sk: keys.userSk,
      entityType: "User",
      ...user,
      email: normalizedEmail,
      ...credentials
    });
    if (!created) {
      throw new AppError("An account already exists for this email", 409, "EMAIL_IN_USE");
    }

    const mapped = await db.putIfAbsent({
      pk: keys.emailLookupPk(normalizedEmail),
      sk: keys.emailLookupSk,
      entityType: "EmailLookup",
      userId: user.id,
      email: normalizedEmail
    });
    if (!mapped) {
      await db.delete(keys.userPk(user.id), keys.userSk);
      throw new AppError("An account already exists for this email", 409, "EMAIL_IN_USE");
    }
    return { ...user, email: normalizedEmail };
  },

  async updateProfile(id: string, name: string, email: string) {
    const normalizedEmail = normalizeEmail(email);
    if (env.useMockDb) {
      const user = store.users.find((candidate) => candidate.id === id);
      if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");
      const conflict = store.users.some(
        (candidate) => candidate.id !== id && candidate.email === normalizedEmail
      );
      if (conflict) throw new AppError("An account already exists for this email", 409, "EMAIL_IN_USE");
      user.name = name.trim();
      user.email = normalizedEmail;
      return toUser(user);
    }

    const record = await db.get<UserRecord>(keys.userPk(id), keys.userSk);
    if (!record) throw new AppError("User not found", 404, "USER_NOT_FOUND");

    if (record.email !== normalizedEmail) {
      const owner = await resolveUserIdByEmail(normalizedEmail);
      if (owner && owner !== id) {
        throw new AppError("An account already exists for this email", 409, "EMAIL_IN_USE");
      }
      if (!owner) {
        const mapped = await db.putIfAbsent({
          pk: keys.emailLookupPk(normalizedEmail),
          sk: keys.emailLookupSk,
          entityType: "EmailLookup",
          userId: id,
          email: normalizedEmail
        });
        if (!mapped) throw new AppError("An account already exists for this email", 409, "EMAIL_IN_USE");
      }
    }

    const updated = { ...record, name: name.trim(), email: normalizedEmail };
    await db.put(updated);
    if (record.email !== normalizedEmail) {
      await db.delete(keys.emailLookupPk(record.email), keys.emailLookupSk);
    }
    return toUser(updated);
  },

  async updateCredentials(id: string, credentials: UserCredentials) {
    if (env.useMockDb) {
      const user = store.users.find((candidate) => candidate.id === id);
      if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");
      user.passwordHash = credentials.passwordHash;
      user.passwordSalt = credentials.passwordSalt;
      return;
    }
    const record = await db.get<UserRecord>(keys.userPk(id), keys.userSk);
    if (!record) throw new AppError("User not found", 404, "USER_NOT_FOUND");
    await db.put({ ...record, ...credentials });
  },

  async listUsers() {
    const users = env.useMockDb
      ? store.users.map(toUser)
      : (await db.scanByEntityType<UserRecord>("User")).map(toUser);
    return users.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async updateRole(id: string, role: UserRole) {
    if (env.useMockDb) {
      const user = store.users.find((candidate) => candidate.id === id);
      if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");
      user.role = role;
      return toUser(user);
    }

    const record = await db.get<UserRecord>(keys.userPk(id), keys.userSk);
    if (!record) throw new AppError("User not found", 404, "USER_NOT_FOUND");
    const updated = { ...record, role };
    await db.put(updated);
    return toUser(updated);
  },

  async deleteUser(id: string) {
    if (env.useMockDb) {
      const exists = store.users.some((candidate) => candidate.id === id);
      if (!exists) throw new AppError("User not found", 404, "USER_NOT_FOUND");
      store.users = store.users.filter((candidate) => candidate.id !== id);
      store.cart = store.cart.filter((item) => item.userId !== id);
      store.wishlist = store.wishlist.filter((item) => item.userId !== id);
      return;
    }
    const record = await db.get<UserRecord>(keys.userPk(id), keys.userSk);
    if (!record) throw new AppError("User not found", 404, "USER_NOT_FOUND");
    const cart = await db.query<{ pk: string; sk: string }>(keys.userPk(id), "CART#");
    const wishlist = await db.query<{ pk: string; sk: string }>(keys.userPk(id), "WISHLIST#");
    await Promise.all([
      ...cart.map((item) => db.delete(item.pk, item.sk)),
      ...wishlist.map((item) => db.delete(item.pk, item.sk)),
      db.delete(keys.emailLookupPk(record.email), keys.emailLookupSk),
      db.delete(keys.userPk(id), keys.userSk)
    ]);
  }
};
