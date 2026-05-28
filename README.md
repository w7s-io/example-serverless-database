# W7S Serverless Database Example

This repository shows a W7S JavaScript/TypeScript native backend using the W7S serverless database path: a D1 SQL binding with Drizzle ORM.

The app exposes a tiny notes API:

- `GET /api/health` checks the backend and binding shape.
- `GET /api/notes` lists the latest notes from D1.
- `POST /api/notes` creates a note with Drizzle.

## Files

- `w7s.json` declares the `DB` D1 binding and points W7S at the `migrations/` directory.
- `migrations/0001_create_notes.sql` creates the `notes` table.
- `migrations/0002_seed_notes.sql` inserts one starter row.
- `backend/src/schema.ts` defines the Drizzle schema.
- `backend/src/index.ts` uses `drizzle(env.DB)` from `drizzle-orm/d1`.
- `.github/workflows/deploy.yml` builds, deploys, and smoke-tests the database.

## W7S manifest

```json
{
  "bindings": {
    "d1": [
      {
        "binding": "DB",
        "migrations": "migrations"
      }
    ]
  }
}
```

W7S creates one database for the repository and environment, applies sorted SQL migrations, and exposes the binding to the backend as `env.DB`.

## Backend shape

```ts
import { drizzle } from "drizzle-orm/d1";
import { notes } from "./schema";

const db = drizzle(env.DB);
const rows = await db.select().from(notes);
```

## Local commands

```sh
npm install
npm run check
npm run db:generate
```

`npm run db:generate` uses Drizzle Kit to generate SQL from `backend/src/schema.ts`. The checked-in migrations are plain SQL so W7S can apply them during deploy.

## Deploy

Push to GitHub. The workflow runs `npm run check` and deploys with:

```yaml
- uses: w7s-io/w7s-cloud@v1
  with:
    token: ${{ github.token }}
```

The deployed app is served at:

```text
https://w7s-io.w7s.cloud/example-serverless-database/
```
