import {
  createHash,
  createHmac,
  randomInt,
  timingSafeEqual
} from "node:crypto";
import { createSession, hashPassword, verifyPassword } from "@/lib/auth";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { sendRegistrationVerificationEmail } from "@/lib/mail";
import { registrationVerificationRepository } from "@/lib/repositories/registration-verifications";
import { userRepository } from "@/lib/repositories/users";
import type { User } from "@/types";

const VERIFICATION_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_VERIFICATION_ATTEMPTS = 5;

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const userIdForEmail = (email: string) =>
  createHash("sha256").update(normalizeEmail(email)).digest("hex");
const verificationCodeHash = (userId: string, code: string) =>
  createHmac("sha256", env.sessionSecret)
    .update(`${userId}:${code}`)
    .digest("hex");
const generateVerificationCode = () =>
  randomInt(100_000, 1_000_000).toString();
const isExpired = (expiresAt: string) => {
  const timestamp = Date.parse(expiresAt);
  return !Number.isFinite(timestamp) || timestamp <= Date.now();
};
const codesMatch = (expectedHash: string, receivedHash: string) => {
  const expected = Buffer.from(expectedHash, "hex");
  const received = Buffer.from(receivedHash, "hex");
  return (
    expected.length === received.length &&
    timingSafeEqual(expected, received)
  );
};

function enforceResendCooldown(sentAt: string) {
  const timestamp = Date.parse(sentAt);
  const remainingMs = RESEND_COOLDOWN_MS - (Date.now() - timestamp);
  if (Number.isFinite(timestamp) && remainingMs > 0) {
    throw new AppError(
      `Please wait ${Math.ceil(remainingMs / 1000)} seconds before requesting another code`,
      429,
      "VERIFICATION_RATE_LIMITED"
    );
  }
}

async function restoreVerification(
  previous: Awaited<ReturnType<typeof registrationVerificationRepository.get>>,
  userId: string
) {
  try {
    if (previous) await registrationVerificationRepository.save(previous);
    else await registrationVerificationRepository.delete(userId);
  } catch (error) {
    console.error("Unable to restore registration verification state", error);
  }
}

export const authService = {
  async requestRegistration(name: string, email: string, password: string) {
    const normalizedEmail = normalizeEmail(email);
    const id = userIdForEmail(normalizedEmail);
    if (await userRepository.getUser(id)) {
      throw new AppError("An account already exists for this email", 409, "EMAIL_IN_USE");
    }

    const previous = await registrationVerificationRepository.get(id);
    if (previous && !isExpired(previous.expiresAt)) {
      enforceResendCooldown(previous.sentAt);
    }

    const code = generateVerificationCode();
    const credentials = await hashPassword(password);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + VERIFICATION_TTL_MS);
    const verification = {
      userId: id,
      name: name.trim(),
      email: normalizedEmail,
      ...credentials,
      codeHash: verificationCodeHash(id, code),
      attempts: 0,
      createdAt: previous?.createdAt ?? now.toISOString(),
      sentAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      expiresAtEpoch: Math.floor(expiresAt.getTime() / 1000)
    };

    await registrationVerificationRepository.save(verification);
    try {
      await sendRegistrationVerificationEmail({
        to: normalizedEmail,
        name: verification.name,
        code
      });
    } catch (error) {
      await restoreVerification(previous, id);
      throw error;
    }

    return {
      email: normalizedEmail,
      expiresAt: verification.expiresAt
    };
  },

  async resendRegistrationCode(email: string) {
    const normalizedEmail = normalizeEmail(email);
    const id = userIdForEmail(normalizedEmail);
    if (await userRepository.getUser(id)) {
      throw new AppError("An account already exists for this email", 409, "EMAIL_IN_USE");
    }

    const previous = await registrationVerificationRepository.get(id);
    if (!previous) {
      throw new AppError(
        "Start the registration again to request a code",
        400,
        "VERIFICATION_NOT_FOUND"
      );
    }
    if (isExpired(previous.expiresAt)) {
      await registrationVerificationRepository.delete(id);
      throw new AppError(
        "The verification code has expired. Start the registration again.",
        410,
        "VERIFICATION_EXPIRED"
      );
    }
    enforceResendCooldown(previous.sentAt);

    const code = generateVerificationCode();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + VERIFICATION_TTL_MS);
    const verification = {
      ...previous,
      codeHash: verificationCodeHash(id, code),
      attempts: 0,
      sentAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      expiresAtEpoch: Math.floor(expiresAt.getTime() / 1000)
    };

    await registrationVerificationRepository.save(verification);
    try {
      await sendRegistrationVerificationEmail({
        to: verification.email,
        name: verification.name,
        code
      });
    } catch (error) {
      await restoreVerification(previous, id);
      throw error;
    }

    return {
      email: normalizedEmail,
      expiresAt: verification.expiresAt
    };
  },

  async verifyRegistration(email: string, code: string) {
    const normalizedEmail = normalizeEmail(email);
    const id = userIdForEmail(normalizedEmail);
    if (await userRepository.getUser(id)) {
      throw new AppError("An account already exists for this email", 409, "EMAIL_IN_USE");
    }

    const verification = await registrationVerificationRepository.get(id);
    if (!verification) {
      throw new AppError(
        "No pending registration was found",
        400,
        "VERIFICATION_NOT_FOUND"
      );
    }
    if (isExpired(verification.expiresAt)) {
      await registrationVerificationRepository.delete(id);
      throw new AppError(
        "The verification code has expired. Start the registration again.",
        410,
        "VERIFICATION_EXPIRED"
      );
    }

    const receivedHash = verificationCodeHash(id, code);
    if (!codesMatch(verification.codeHash, receivedHash)) {
      const attempts = verification.attempts + 1;
      if (attempts >= MAX_VERIFICATION_ATTEMPTS) {
        await registrationVerificationRepository.delete(id);
        throw new AppError(
          "Too many incorrect attempts. Start the registration again.",
          429,
          "VERIFICATION_ATTEMPTS_EXCEEDED"
        );
      }

      await registrationVerificationRepository.save({
        ...verification,
        attempts
      });
      const remaining = MAX_VERIFICATION_ATTEMPTS - attempts;
      throw new AppError(
        `Incorrect verification code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
        400,
        "INVALID_VERIFICATION_CODE"
      );
    }

    const user: User = {
      id,
      name: verification.name,
      email: normalizedEmail,
      role: "customer",
      createdAt: new Date().toISOString()
    };
    await userRepository.createUser(user, {
      passwordHash: verification.passwordHash,
      passwordSalt: verification.passwordSalt
    });
    await registrationVerificationRepository.delete(id);
    await createSession(user.id);
    return user;
  },

  async login(email: string, password: string) {
    const user = await userRepository.getUserWithCredentials(userIdForEmail(email));
    const valid = user
      ? await verifyPassword(password, user.passwordHash, user.passwordSalt)
      : false;
    if (!user || !valid) {
      throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }
    await createSession(user.id);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    };
  }
};
