import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "zast_admin";
const WEEK = 7 * 24 * 60 * 60;

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("Chybí env proměnná SESSION_SECRET");
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

export function makeToken(): string {
  const exp = Date.now() + WEEK * 1000;
  return `${exp}.${sign(String(exp))}`;
}

export function isValidToken(token: string): boolean {
  const [exp, sig] = token.split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const expected = sign(exp);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function isAdmin(req: Request): boolean {
  const cookies = req.headers.get("cookie") ?? "";
  const match = cookies.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  return match ? isValidToken(decodeURIComponent(match[1])) : false;
}

export function sessionCookie(token: string | null): string {
  const value = token ? encodeURIComponent(token) : "";
  const maxAge = token ? WEEK : 0;
  return `${COOKIE_NAME}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
}

/** Porovnání hesla bez úniku délky přes timing. */
export function passwordMatches(given: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) throw new Error("Chybí env proměnná ADMIN_PASSWORD");
  const a = createHmac("sha256", secret()).update(given).digest();
  const b = createHmac("sha256", secret()).update(expected).digest();
  return timingSafeEqual(a, b);
}
