import Cryptr from "cryptr";

// Fall back to a default key for local development and build-time static evaluation
const key =
  process.env.ENCRYPTION_KEY ||
  "kryptonite-default-local-encryption-key-do-not-use-in-prod";
const cryptr = new Cryptr(key);

export const encrypt = (text: string) => cryptr.encrypt(text);
export const decrypt = (text: string) => cryptr.decrypt(text);
