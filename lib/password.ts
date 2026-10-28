import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function hashPassword(pw: string) {
  const salt = randomBytes(16);
  return `${salt.toString("hex")}:${scryptSync(pw, salt, 64).toString("hex")}`;
}

export function verifyPassword(pw: string, stored: string) {
  const [salt, hash] = stored.split(":");
  const a = Buffer.from(hash, "hex");
  return timingSafeEqual(a, scryptSync(pw, Buffer.from(salt, "hex"), 64));
}
