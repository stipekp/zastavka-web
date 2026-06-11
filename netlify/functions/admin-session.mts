import type { Config } from "@netlify/functions";
import { json, err, readJson } from "../lib/http";
import { isAdmin, makeToken, passwordMatches, sessionCookie } from "../lib/auth";

export default async (req: Request): Promise<Response> => {
  if (req.method === "GET") {
    return json({ authed: isAdmin(req) });
  }

  if (req.method === "POST") {
    const body = await readJson<{ password?: string }>(req);
    if (!body?.password || !passwordMatches(body.password)) {
      return err("Nesprávné heslo.", 401);
    }
    return json({ authed: true }, 200, { "Set-Cookie": sessionCookie(makeToken()) });
  }

  if (req.method === "DELETE") {
    return json({ authed: false }, 200, { "Set-Cookie": sessionCookie(null) });
  }

  return err("Method not allowed", 405);
};

export const config: Config = { path: "/api/admin/session" };
