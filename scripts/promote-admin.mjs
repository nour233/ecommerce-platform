import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import process from "node:process";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error("Usage: npm run admin:promote -- user@example.com");
  process.exit(1);
}

const endpoint = process.env.DYNAMODB_ENDPOINT || undefined;
const client = DynamoDBDocumentClient.from(new DynamoDBClient({
  region: process.env.AWS_REGION ?? "us-east-1",
  ...(endpoint ? {
    endpoint,
    credentials: { accessKeyId: "local", secretAccessKey: "local" }
  } : {})
}));
const id = createHash("sha256").update(email).digest("hex");
const key = { pk: `USER#${id}`, sk: "PROFILE" };
const tableName = process.env.DYNAMODB_TABLE_NAME ?? "CommerceCraft";
const result = await client.send(new GetCommand({ TableName: tableName, Key: key }));

if (!result.Item || result.Item.entityType !== "User") {
  console.error(`No registered user was found for ${email}.`);
  process.exit(1);
}

await client.send(new PutCommand({
  TableName: tableName,
  Item: { ...result.Item, role: "admin" }
}));
console.log(`${email} is now an administrator.`);
