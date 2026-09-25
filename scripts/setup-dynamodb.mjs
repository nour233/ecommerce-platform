import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import process from "node:process";
import {
  CreateTableCommand,
  DescribeTimeToLiveCommand,
  DescribeTableCommand,
  DynamoDBClient,
  UpdateTimeToLiveCommand,
  waitUntilTableExists
} from "@aws-sdk/client-dynamodb";
import {
  BatchWriteCommand,
  DynamoDBDocumentClient
} from "@aws-sdk/lib-dynamodb";

const envFile = process.env.ENV_FILE ?? ".env.local";
if (existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

const region = process.env.AWS_REGION ?? "us-east-1";
const tableName = process.env.DYNAMODB_TABLE_NAME ?? "CommerceCraft";
const catalogPath = new URL("../src/lib/data/catalog.json", import.meta.url);
const catalog = JSON.parse(await readFile(catalogPath, "utf8"));

const endpoint = process.env.DYNAMODB_ENDPOINT || undefined;
if (endpoint && !["localhost", "127.0.0.1", "[::1]"].includes(new URL(endpoint).hostname)) {
  throw new Error("DYNAMODB_ENDPOINT must be local. Leave it unset for AWS.");
}
const client = new DynamoDBClient({
  region,
  ...(endpoint ? {
    endpoint,
    credentials: { accessKeyId: "local", secretAccessKey: "local" }
  } : {})
});
const documentClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true }
});

async function ensureTable() {
  try {
    await client.send(new DescribeTableCommand({ TableName: tableName }));
    console.log(`Table ${tableName} already exists.`);
  } catch (error) {
    if (error?.name !== "ResourceNotFoundException") throw error;

    console.log(`Creating ${tableName} in ${region}...`);
    await client.send(
      new CreateTableCommand({
        TableName: tableName,
        BillingMode: "PAY_PER_REQUEST",
        AttributeDefinitions: [
          { AttributeName: "pk", AttributeType: "S" },
          { AttributeName: "sk", AttributeType: "S" }
        ],
        KeySchema: [
          { AttributeName: "pk", KeyType: "HASH" },
          { AttributeName: "sk", KeyType: "RANGE" }
        ]
      })
    );

    await waitUntilTableExists(
      { client, maxWaitTime: 120 },
      { TableName: tableName }
    );
    console.log(`Table ${tableName} is active.`);
  }
}

async function ensureTimeToLive() {
  if (endpoint) {
    console.log("Skipping TTL configuration for DynamoDB Local.");
    return;
  }

  const result = await client.send(
    new DescribeTimeToLiveCommand({ TableName: tableName })
  );
  const description = result.TimeToLiveDescription;
  const status = description?.TimeToLiveStatus;

  if (
    (status === "ENABLED" || status === "ENABLING") &&
    description?.AttributeName === "expiresAtEpoch"
  ) {
    console.log("TTL is already configured.");
    return;
  }
  if (status !== "DISABLED") {
    throw new Error(
      `TTL cannot be configured while its status is ${status ?? "unknown"}.`
    );
  }

  await client.send(
    new UpdateTimeToLiveCommand({
      TableName: tableName,
      TimeToLiveSpecification: {
        Enabled: true,
        AttributeName: "expiresAtEpoch"
      }
    })
  );
  console.log("TTL enabled for expiresAtEpoch.");
}

async function writeAll(items) {
  let pending = items.map((Item) => ({ PutRequest: { Item } }));

  for (let attempt = 1; pending.length > 0 && attempt <= 6; attempt += 1) {
    const result = await documentClient.send(
      new BatchWriteCommand({
        RequestItems: { [tableName]: pending }
      })
    );
    pending = result.UnprocessedItems?.[tableName] ?? [];
    if (pending.length > 0) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 250));
    }
  }

  if (pending.length > 0) {
    throw new Error(`DynamoDB did not process ${pending.length} catalog records.`);
  }
}

async function seedCatalog() {
  const productRecords = catalog.products.map((product) => ({
    pk: "PRODUCTS",
    sk: `PRODUCT#${product.id}`,
    entityType: "Product",
    ...product
  }));
  const categoryRecords = catalog.categories.map((category) => ({
    pk: "CATEGORIES",
    sk: `CATEGORY#${category.id}`,
    entityType: "Category",
    ...category
  }));

  await writeAll([...productRecords, ...categoryRecords]);
  console.log(
    `Seeded ${productRecords.length} products and ${categoryRecords.length} categories.`
  );
}

try {
  await ensureTable();
  await ensureTimeToLive();
  await seedCatalog();
  console.log("DynamoDB setup complete.");
} catch (error) {
  console.error("DynamoDB setup failed.");
  if (error?.name === "CredentialsProviderError") {
    console.error("No AWS credentials were found. Run `aws configure` and try again.");
  } else {
    console.error(error);
  }
  process.exitCode = 1;
}
