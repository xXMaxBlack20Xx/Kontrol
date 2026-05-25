import { Container, CosmosClient, Database } from "@azure/cosmos";

const requiredEnv = (name: string): string => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

let client: CosmosClient | undefined;
let db: Database | undefined;

const getClient = (): CosmosClient => {
  if (!client) {
    client = new CosmosClient({
      endpoint: requiredEnv("AZURE_COSMOS_ENDPOINT"),
      key: requiredEnv("AZURE_COSMOS_KEY"),
    });
  }

  return client;
};

export const database = (): Database => {
  if (!db) {
    db = getClient().database(requiredEnv("AZURE_COSMOS_DATABASE_ID"));
  }

  return db;
};

export const authUsersContainer = (): Container => database().container("authUsers");
export const usersContainer = (): Container => database().container("users");
export const refreshTokensContainer = (): Container => database().container("refreshTokens");
export const habitsContainer = (): Container => database().container("habits");
export const habitCompletionsContainer = (): Container => database().container("habitCompletions");
export const remindersContainer = (): Container => database().container("reminders");
export const devicesContainer = (): Container => database().container("devices");
export const photosContainer = (): Container => database().container("photos");

const isItemNotFound = (error: unknown): boolean => {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeCosmosError = error as { body?: { message?: string }; code?: number; statusCode?: number; substatus?: number };
  const isMissingResource = maybeCosmosError.substatus === 1003 || maybeCosmosError.body?.message?.includes("Owner resource does not exist");

  if (isMissingResource) {
    return false;
  }

  return maybeCosmosError.code === 404 || maybeCosmosError.statusCode === 404;
};

export const readItem = async <T>(container: Container, id: string, partitionKey: string): Promise<T | null> => {
  try {
    const response = await container.item(id, partitionKey).read();
    return (response.resource as T | undefined) ?? null;
  } catch (error) {
    if (isItemNotFound(error)) {
      return null;
    }

    throw error;
  }
};

export const queryItems = async <T>(
  container: Container,
  query: string,
  parameters: { name: string; value: string | number | boolean | null }[],
  partitionKey: string,
): Promise<T[]> => {
  const response = await container.items
    .query(
      {
        query,
        parameters,
      },
      { partitionKey },
    )
    .fetchAll();

  return response.resources as T[];
};
