import { GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { dynamo } from "@/lib/db/dynamo";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";
import type { Campaign } from "@/lib/campaign-schema";

const globalStore = globalThis as unknown as { commerceCraftCampaigns?: Map<string, Campaign> };
const memory = globalStore.commerceCraftCampaigns ??= new Map<string, Campaign>();
const key = (id: string) => ({ pk: "CAMPAIGNS", sk: `CAMPAIGN#${id}` });
const conflict = () => new AppError("This campaign changed. Reload it before continuing.", 409, "CAMPAIGN_CONFLICT");
function toCampaign(record: Record<string, unknown>): Campaign {
  const campaign = { ...record };
  delete campaign.pk;
  delete campaign.sk;
  delete campaign.entityType;
  return campaign as Campaign;
}

export const campaignRepository = {
  async list(): Promise<Campaign[]> {
    if (env.useMockDb) return [...memory.values()];
    const items: Campaign[] = [];
    let cursor: Record<string, unknown> | undefined;
    do {
      const result = await dynamo.send(new QueryCommand({ TableName: env.tableName, KeyConditionExpression: "pk = :pk", ExpressionAttributeValues: { ":pk": "CAMPAIGNS" }, ExclusiveStartKey: cursor, ConsistentRead: true }));
      for (const item of result.Items ?? []) {
        items.push(toCampaign(item));
      }
      cursor = result.LastEvaluatedKey;
    } while (cursor);
    return items;
  },
  async get(id: string): Promise<Campaign | null> {
    if (env.useMockDb) return memory.get(id) ?? null;
    const result = await dynamo.send(new GetCommand({ TableName: env.tableName, Key: key(id), ConsistentRead: true }));
    if (!result.Item) return null;
    return toCampaign(result.Item);
  },
  async save(campaign: Campaign, expectedVersion?: number) {
    if (env.useMockDb) {
      const old = memory.get(campaign.id);
      if (expectedVersion === undefined ? Boolean(old) : old?.version !== expectedVersion) throw conflict();
      memory.set(campaign.id, campaign);
      return campaign;
    }
    try {
      await dynamo.send(new PutCommand({
        TableName: env.tableName, Item: { ...key(campaign.id), entityType: "Campaign", ...campaign },
        ConditionExpression: expectedVersion === undefined ? "attribute_not_exists(pk)" : "#version = :version",
        ...(expectedVersion === undefined ? {} : { ExpressionAttributeNames: { "#version": "version" }, ExpressionAttributeValues: { ":version": expectedVersion } })
      }));
    } catch (error) {
      if (error instanceof Error && error.name === "ConditionalCheckFailedException") throw conflict();
      throw error;
    }
    return campaign;
  }
};
