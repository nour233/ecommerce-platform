import nodemailer, { type Transporter } from "nodemailer";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";

let transporter: Transporter | null = null;

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      })[character] ?? character
  );

function getTransporter() {
  if (transporter) return transporter;

  if (
    !env.smtpHost ||
    !env.smtpUser ||
    !env.smtpPass ||
    !env.mailFrom ||
    env.smtpPort < 1 ||
    env.smtpPort > 65535
  ) {
    throw new AppError(
      "Email delivery is not configured",
      503,
      "EMAIL_NOT_CONFIGURED"
    );
  }

  transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass
    },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
    disableFileAccess: true,
    disableUrlAccess: true
  });

  return transporter;
}

export async function sendRegistrationVerificationEmail({
  to,
  name,
  code
}: {
  to: string;
  name: string;
  code: string;
}) {
  const safeName = escapeHtml(name);

  try {
    await getTransporter().sendMail({
      from: env.mailFrom,
      to,
      subject: "Your CommerceCraft verification code",
      text: `Hello ${name},\n\nYour CommerceCraft verification code is ${code}. It expires in 10 minutes.\n\nIf you did not request this account, you can ignore this email.`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#17211b">
          <h1 style="font-size:24px;margin:0 0 20px">Verify your email</h1>
          <p>Hello ${safeName},</p>
          <p>Use this code to finish creating your CommerceCraft account:</p>
          <p style="font-size:32px;font-weight:700;letter-spacing:8px;margin:28px 0">${code}</p>
          <p>This code expires in 10 minutes.</p>
          <p style="color:#5f6b64;font-size:13px;margin-top:28px">If you did not request this account, you can ignore this email.</p>
        </div>
      `
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Unable to send registration verification email", error);
    throw new AppError(
      "Unable to send the verification email. Please try again.",
      503,
      "EMAIL_UNAVAILABLE"
    );
  }
}

export async function sendPasswordResetEmail({
  to,
  name,
  code
}: {
  to: string;
  name: string;
  code: string;
}) {
  const safeName = escapeHtml(name);

  try {
    await getTransporter().sendMail({
      from: env.mailFrom,
      to,
      subject: "Reset your CommerceCraft password",
      text: `Hello ${name},\n\nYour CommerceCraft password reset code is ${code}. It expires in 10 minutes.\n\nIf you did not request this change, you can ignore this email.`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#18212f">
          <div style="border-bottom:3px solid #ef8354;padding-bottom:18px;margin-bottom:26px">
            <strong style="font-size:20px">CommerceCraft</strong>
          </div>
          <h1 style="font-size:26px;margin:0 0 20px">Reset your password</h1>
          <p>Hello ${safeName},</p>
          <p>Use this code to choose a new password for your account:</p>
          <p style="font-size:34px;font-weight:700;letter-spacing:8px;margin:28px 0;color:#bd6d48">${code}</p>
          <p>This code expires in 10 minutes.</p>
          <p style="color:#5f6b64;font-size:13px;margin-top:28px">If you did not request a password reset, you can safely ignore this email.</p>
        </div>
      `
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Unable to send password reset email", error);
    throw new AppError(
      "Unable to send the password reset email. Please try again.",
      503,
      "EMAIL_UNAVAILABLE"
    );
  }
}
