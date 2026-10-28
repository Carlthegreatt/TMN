import { createHmac, timingSafeEqual } from "node:crypto";

// Stateless session: "<userId>.<expiresMs>.<hmac>". Any instance can verify it, which a
// per-instance /tmp database cannot do. Set SESSION_SECRET in production; the fallback only
// keeps a fresh MVP deploy working and is public in this repo.
const secret = () => process.env.SESSION_SECRET ?? "tmn-mvp-default-secret-change-me";
const mac = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");

export const sign = (userId: number, expires: number) => {
  const payload = `${userId}.${expires}`;
  return `${payload}.${mac(payload)}`;
};

export function verify(token: string): number | null {
  const [id, exp, sig] = token.split(".");
  if (!id || !exp || !sig) return null;
  const want = Buffer.from(mac(`${id}.${exp}`)), got = Buffer.from(sig);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  return Number(exp) > Date.now() ? Number(id) : null;
}
