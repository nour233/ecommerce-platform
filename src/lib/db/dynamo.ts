import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand
} from "@aws-sdk/lib-dynamodb";
import { env } from "@/lib/env";

if (env.dynamodbEndpoint && !["localhost", "127.0.0.1", "[::1]"].includes(new URL(env.dynamodbEndpoint).hostname)) {
  throw new Error("DYNAMODB_ENDPOINT must point to a local DynamoDB instance. Leave it unset for AWS.");
}

const client = new DynamoDBClient({
  region: env.awsRegion,
  ...(env.dynamodbEndpoint ? {
    endpoint: env.dynamodbEndpoint,
    credentials: { accessKeyId: "local", secretAccessKey: "local" }
  } : {})
});

export const dynamo = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true }
});

export type Entity = Record<string, unknown> & {
  pk: string;
  sk: string;
  entityType: string;
};

export const db = {
  async get<T>(pk: string, sk: string) {
    const result = await dynamo.send(
      new GetCommand({
        TableName: env.tableName,
        Key: { pk, sk }
      })
    );
    return (result.Item as T | undefined) ?? null;
  },
  async put(item: Entity) {
    await dynamo.send(
      new PutCommand({
        TableName: env.tableName,
        Item: item
      })
    );
  },
  async putIfAbsent(item: Entity) {
    try {
      await dynamo.send(
        new PutCommand({
          TableName: env.tableName,
          Item: item,
          ConditionExpression: "attribute_not_exists(pk) AND attribute_not_exists(sk)"
        })
      );
      return true;
    } catch (error) {
      if (error instanceof Error && error.name === "ConditionalCheckFailedException") {
        return false;
      }
      throw error;
    }
  },
  async delete(pk: string, sk: string) {
    await dynamo.send(
      new DeleteCommand({
        TableName: env.tableName,
        Key: { pk, sk }
      })
    );
  },
  async query<T>(pk: string, skPrefix?: string) {
    const result = await dynamo.send(
      new QueryCommand({
        TableName: env.tableName,
        KeyConditionExpression: skPrefix ? "pk = :pk and begins_with(sk, :sk)" : "pk = :pk",
        ExpressionAttributeValues: skPrefix ? { ":pk": pk, ":sk": skPrefix } : { ":pk": pk }
      })
    );
    return (result.Items as T[] | undefined) ?? [];
  },
  async scanByEntityType<T>(entityType: string) {
    const items: T[] = [];
    let exclusiveStartKey: Record<string, unknown> | undefined;

    do {
      const result = await dynamo.send(
        new ScanCommand({
          TableName: env.tableName,
          FilterExpression: "entityType = :entityType",
          ExpressionAttributeValues: { ":entityType": entityType },
          ExclusiveStartKey: exclusiveStartKey
        })
      );
      items.push(...((result.Items as T[] | undefined) ?? []));
      exclusiveStartKey = result.LastEvaluatedKey;
    } while (exclusiveStartKey);

    return items;
  }
};
