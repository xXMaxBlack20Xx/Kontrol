const requiredEnv = (name: string): string => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

const getStorageConfig = async () => {
  const { BlobServiceClient, StorageSharedKeyCredential } = await import("@azure/storage-blob");
  const accountName = requiredEnv("AZURE_STORAGE_ACCOUNT_NAME");
  const accountKey = requiredEnv("AZURE_STORAGE_ACCOUNT_KEY");
  const containerName = requiredEnv("AZURE_STORAGE_CONTAINER_USER_PHOTOS");
  const credential = new StorageSharedKeyCredential(accountName, accountKey);
  const blobServiceClient = new BlobServiceClient(`https://${accountName}.blob.core.windows.net`, credential);

  return {
    accountName,
    containerName,
    credential,
    containerClient: blobServiceClient.getContainerClient(containerName),
  };
};

const createSasUrl = async (blobPath: string, permissionText: string, expiresAt: Date): Promise<string> => {
  const { BlobSASPermissions, generateBlobSASQueryParameters, SASProtocol } = await import("@azure/storage-blob");
  const { containerName, credential, containerClient } = await getStorageConfig();
  const sas = generateBlobSASQueryParameters(
    {
      containerName,
      blobName: blobPath,
      permissions: BlobSASPermissions.parse(permissionText),
      startsOn: new Date(Date.now() - 60_000),
      expiresOn: expiresAt,
      protocol: SASProtocol.Https,
    },
    credential,
  ).toString();

  return `${containerClient.getBlockBlobClient(blobPath).url}?${sas}`;
};

export const generatePhotoUploadUrl = async (blobPath: string): Promise<{ uploadUrl: string; expiresAt: string }> => {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  return {
    uploadUrl: await createSasUrl(blobPath, "cw", expiresAt),
    expiresAt: expiresAt.toISOString(),
  };
};

export const generatePhotoReadUrl = async (blobPath: string): Promise<{ readUrl: string; expiresAt: string }> => {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  return {
    readUrl: await createSasUrl(blobPath, "r", expiresAt),
    expiresAt: expiresAt.toISOString(),
  };
};

export const deletePhotoBlobIfConfigured = async (blobPath: string): Promise<void> => {
  const { containerClient } = await getStorageConfig();
  await containerClient.deleteBlob(blobPath, { deleteSnapshots: "include" });
};

export const assertSafeUserBlobPath = (userId: string, blobPath: string): void => {
  if (!blobPath.startsWith(`${userId}/`) || blobPath.includes("..")) {
    throw new Error("Invalid blob path for user");
  }
};
