## Stack: Next.js

App Router, TypeScript, Server Components by default.

- `app/` holds routes. A route folder owns `page.tsx`, `layout.tsx`, `loading.tsx`,
  `error.tsx`, and `not-found.tsx`. Missing states are bugs.
- Server Components fetch directly. `"use client"` only for interactivity,
  browser APIs, or hooks. Push it down to the leaf.
- Mutations are Server Actions in `actions.ts`, each one validating with `zod`
  and authorizing session + role + tenant before touching data.
- Never import a server module into a client component. Keep `server-only` at the
  top of anything that touches secrets or the database.
- Route Handlers under `app/api/**/route.ts` only for webhooks, third parties, and
  public APIs. Everything internal is a Server Action.
- Data access lives in `lib/db` and `features/<feature>/queries.ts`. Components
  never build SQL.
- Caching is explicit: `revalidatePath` or `revalidateTag` after a mutation.
  Never rely on a stale cache and call it a bug.
- Environment: `NEXT_PUBLIC_*` is public by definition. Secrets stay server-side.
- Images through `next/image`, fonts through `next/font`. No external font CDN.

Verify:

```powershell
npm run lint
npm run build
npm test
```
