import { afterEach, describe, expect, it, vi } from "vitest";
import { consumePublicAiAttempt } from "@/lib/services/public-ai-quota";
import { dynamo } from "@/lib/db/dynamo";
import { env } from "@/lib/env";

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });
const request = new Request("https://example.com/api/storefront/chat");

describe("public AI quota", () => {
  it("allows ten combined attempts and blocks the eleventh until the next Casablanca day", async () => {
    const day = new Date("2030-01-01T12:00:00Z");
    await Promise.all(Array.from({ length: 10 }, () => consumePublicAiAttempt(request, day)));
    await expect(consumePublicAiAttempt(new Request("https://example.com/api/storefront/ai-setup"), day))
      .rejects.toMatchObject({ statusCode: 429, code: "PUBLIC_AI_QUOTA_EXCEEDED" });
    await expect(consumePublicAiAttempt(request, new Date("2030-01-02T12:00:00Z"))).resolves.toBeUndefined();
  });

  it("rejects in-memory quotas in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    await expect(consumePublicAiAttempt(request)).rejects.toMatchObject({ statusCode: 503 });
  });

  it("uses a conditional atomic database increment and fails closed", async () => {
    const previous = env.useMockDb;
    Object.assign(env, { useMockDb: false });
    try {
      const send = vi.spyOn(dynamo, "send").mockResolvedValue({} as never);
      await consumePublicAiAttempt(request);
      const command = send.mock.calls[0][0] as { input: Record<string, unknown> };
      expect(command.input.ConditionExpression).toBe("attribute_not_exists(attempts) OR attempts < :limit");
      expect(command.input.ExpressionAttributeValues).toMatchObject({ ":limit": 10, ":one": 1 });
      send.mockRejectedValueOnce(Object.assign(new Error(), { name: "ConditionalCheckFailedException" }) as never);
      await expect(consumePublicAiAttempt(request)).rejects.toMatchObject({ statusCode: 429 });
      send.mockRejectedValueOnce(new Error("database offline") as never);
      await expect(consumePublicAiAttempt(request)).rejects.toMatchObject({ statusCode: 503 });
    } finally { Object.assign(env, { useMockDb: previous }); }
  });
});
