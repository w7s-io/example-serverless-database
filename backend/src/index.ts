import type { D1Database } from "@cloudflare/workers-types";
import { desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { notes } from "./schema";

type Env = {
  DB: D1Database;
  W7S_REPOSITORY?: string;
  W7S_ENVIRONMENT?: string;
};

const json = (body: unknown, init: ResponseInit = {}) => {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "no-store");

  return new Response(JSON.stringify(body, null, 2), {
    ...init,
    headers
  });
};

const parseNoteBody = async (request: Request) => {
  const url = new URL(request.url);
  const fromQuery = url.searchParams.get("body")?.trim();
  if (fromQuery) return fromQuery;

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return null;

  const body = await request.json<{ body?: unknown }>().catch(() => null);
  return typeof body?.body === "string" ? body.body.trim() : null;
};

const listNotes = async (env: Env) => {
  const db = drizzle(env.DB);
  return db.select().from(notes).orderBy(desc(notes.createdAt)).limit(20);
};

const createNote = async (request: Request, env: Env) => {
  const body = await parseNoteBody(request);

  if (!body) {
    return json(
      {
        status: "error",
        error: "Pass a note body in JSON or ?body=..."
      },
      { status: 400 }
    );
  }

  const db = drizzle(env.DB);
  const created = await db
    .insert(notes)
    .values({
      body,
      createdAt: new Date().toISOString()
    })
    .returning();

  return json(
    {
      service: "example-serverless-database",
      status: "created",
      note: created[0]
    },
    { status: 201 }
  );
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/" || url.pathname === "/api/health") {
      return json({
        status: "ok",
        service: "example-serverless-database",
        repository: env.W7S_REPOSITORY,
        environment: env.W7S_ENVIRONMENT,
        database: "D1",
        endpoints: {
          listNotes: "/api/notes",
          createNote: "POST /api/notes"
        }
      });
    }

    if (url.pathname === "/api/notes" && request.method === "GET") {
      return json({
        service: "example-serverless-database",
        status: "ok",
        notes: await listNotes(env)
      });
    }

    if (url.pathname === "/api/notes" && request.method === "POST") {
      return createNote(request, env);
    }

    return json(
      {
        status: "error",
        error: "Not found"
      },
      { status: 404 }
    );
  }
};
