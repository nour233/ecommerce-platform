import { createHmac } from "node:crypto";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { dynamo } from "@/lib/db/dynamo";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";

const LIMIT = 10;
const localCounters = new Map<string, number>();

// Both public AI features share the same daily quota. Never trust a browser cookie
// for this counter: clearing cookies must not grant another ten paid requests.
export async function consumePublicAiAttempt(request: Request, now = new Date()) {
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Casablanca", year: "numeric", month: "2-digit", day: "2-digit"
  }).format(now);
  // Vercel supplies this header itself. Other production hosts fail closed into
  // a shared bucket until a trusted proxy identity is configured.
  const address = process.env.VERCEL === "1"
    ? request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() || "unknown"
    : "unknown";
  const identity = createHmac("sha256", env.sessionSecret).update(address).digest("hex");
  const pk = `PUBLIC_AI_QUOTA#${day}`;
  const sk = identity;
  const exhausted = () => new AppError(
    "Vous avez atteint les 10 tentatives quotidiennes pour le chatbot et le styling. Réessayez demain.",
    429, "PUBLIC_AI_QUOTA_EXCEEDED"
  );

  if (env.useMockDb) {
    if (process.env.NODE_ENV === "production") {
      throw new AppError("Le quota IA nécessite une base persistante en production.", 503, "PUBLIC_AI_QUOTA_UNAVAILABLE");
    }
    for (const key of localCounters.keys()) if (!key.startsWith(`${pk}:`)) localCounters.delete(key);
    const key = `${pk}:${sk}`;
    const count = localCounters.get(key) ?? 0;
    if (count >= LIMIT) throw exhausted();
    localCounters.set(key, count + 1);
    return;
  }

  try {
    await dynamo.send(new UpdateCommand({
      TableName: env.tableName,
      Key: { pk, sk },
      UpdateExpression: "SET entityType = :type, expiresAtEpoch = :expiry ADD attempts :one",
      ConditionExpression: "attribute_not_exists(attempts) OR attempts < :limit",
      ExpressionAttributeValues: {
        ":type": "PublicAiQuota", ":expiry": Math.floor(now.getTime() / 1000) + 172800,
        ":one": 1, ":limit": LIMIT
      }
    }));
  } catch (error) {
    if (error instanceof Error && error.name === "ConditionalCheckFailedException") throw exhausted();
    // Do not make a paid provider call when the quota cannot be checked.
    throw new AppError("Le service IA est temporairement indisponible. Réessayez plus tard.", 503, "PUBLIC_AI_QUOTA_UNAVAILABLE");
  }
}
