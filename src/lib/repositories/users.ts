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

const toUser = (record: User): User => ({
  id: record.id,
  name: record.name,
  email: record.email,
  role: record.role ?? "customer",
  createdAt: record.createdAt
});

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

  async createUser(user: User, credentials: UserCredentials) {
    if (env.useMockDb) {
      store.users.push({ ...user, ...credentials });
      return user;
    }

    const created = await db.putIfAbsent({
      pk: keys.userPk(user.id),
      sk: keys.userSk,
      entityType: "User",
      ...user,
      ...credentials
    });
    if (!created) {
      throw new AppError("An account already exists for this email", 409, "EMAIL_IN_USE");
    }
    return user;
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
      db.delete(keys.userPk(id), keys.userSk)
    ]);
  }
};
