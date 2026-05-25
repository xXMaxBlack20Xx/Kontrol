import { CosmosClient } from "@azure/cosmos";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

type LocalSettings = {
  Values?: Record<string, string>;
};

const loadLocalSettings = (): void => {
  const localSettingsPath = resolve(process.cwd(), "local.settings.json");

  if (!existsSync(localSettingsPath)) {
    return;
  }

  const localSettings = JSON.parse(readFileSync(localSettingsPath, "utf8")) as LocalSettings;

  for (const [key, value] of Object.entries(localSettings.Values ?? {})) {
    process.env[key] ??= value;
  }
};

const requiredEnv = (name: string): string => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

const main = async (): Promise<void> => {
  loadLocalSettings();

  const client = new CosmosClient({
    endpoint: requiredEnv("AZURE_COSMOS_ENDPOINT"),
    key: requiredEnv("AZURE_COSMOS_KEY"),
  });

  const databaseId = requiredEnv("AZURE_COSMOS_DATABASE_ID");
  const { database } = await client.databases.createIfNotExists({ id: databaseId });

  await database.containers.createIfNotExists({
    id: "authUsers",
    partitionKey: { paths: ["/emailHash"] },
  });

  await database.containers.createIfNotExists({
    id: "users",
    partitionKey: { paths: ["/userId"] },
  });

  await database.containers.createIfNotExists({
    id: "refreshTokens",
    partitionKey: { paths: ["/userId"] },
  });

  await database.containers.createIfNotExists({
    id: "habits",
    partitionKey: { paths: ["/userId"] },
  });

  await database.containers.createIfNotExists({
    id: "habitCompletions",
    partitionKey: { paths: ["/userId"] },
  });

  await database.containers.createIfNotExists({
    id: "reminders",
    partitionKey: { paths: ["/userId"] },
  });

  await database.containers.createIfNotExists({
    id: "devices",
    partitionKey: { paths: ["/userId"] },
  });

  await database.containers.createIfNotExists({
    id: "photos",
    partitionKey: { paths: ["/userId"] },
  });

  console.log(`Cosmos DB ready: ${databaseId}`);
  console.log(
    "Containers ready: authUsers (/emailHash), users (/userId), refreshTokens (/userId), habits (/userId), habitCompletions (/userId), reminders (/userId), devices (/userId), photos (/userId)",
  );
};

main().catch((error) => {
  console.error("Failed to ensure Cosmos DB resources", error);
  process.exitCode = 1;
});
