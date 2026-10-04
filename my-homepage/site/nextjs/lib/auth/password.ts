import "server-only";

import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;

const KEY_LENGTH = 64;

/** 저장용 해시를 만든다. 형식은 "salt:hash" (둘 다 hex). */
export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, KEY_LENGTH);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;

  const expected = Buffer.from(hashHex, "hex");
  if (expected.length !== KEY_LENGTH) return false;
  const actual = await scryptAsync(password, Buffer.from(saltHex, "hex"), KEY_LENGTH);
  return timingSafeEqual(actual, expected);
}
