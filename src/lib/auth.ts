import { createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

const SESSION_COOKIE = "commercecraft_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;
const SCRYPT_KEY_LENGTH = 64;

type SessionPayload = {
  userId: string;
  expiresAt: number;
};

const derivePassword = (password: string, salt: string) =>
  new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, SCRYPT_KEY_LENGTH, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });

const sign = (value: string) =>
  createHmac("sha256", env.sessionSecret).update(value).digest("base64url");

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const passwordHash = (await derivePassword(password, salt)).toString("hex");
  return { passwordHash, passwordSalt: salt };
}

export async function verifyPassword(password: string, hash: string, salt: string) {
  const candidate = await derivePassword(password, salt);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export async function createSession(userId: string) {
  const payload: SessionPayload = {
    userId,
    expiresAt: Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, `${encoded}.${sign(encoded)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION_SECONDS,
    path: "/"
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = Buffer.from(sign(encoded));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SessionPayload;
    if (!payload.userId || payload.expiresAt <= Math.floor(Date.now() / 1000)) return null;
    return payload.userId;
  } catch {
    return null;
  }
}
