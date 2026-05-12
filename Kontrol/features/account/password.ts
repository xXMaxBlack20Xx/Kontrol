import * as Crypto from 'expo-crypto';

const HASH_PREFIX = 'sha256';

// Passwords are salted and hashed before local storage through Expo Crypto,
// which uses native crypto APIs in the Expo runtime instead of Web Crypto.
function bytesToHex(bytes: Uint8Array | ArrayBuffer): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);

  return Array.from(view)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function createSalt(byteLength = 16): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(byteLength);

  return bytesToHex(bytes);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await createSalt();
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${password}`,
  );

  return `${HASH_PREFIX}:${salt}:${digest}`;
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  const [prefix, salt, expectedHash] = passwordHash.split(':');

  if (prefix !== HASH_PREFIX || !salt || !expectedHash) {
    return false;
  }

  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${password}`,
  );

  return digest === expectedHash;
}
