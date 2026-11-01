## Stack: React SPA

Vite, React 19, TypeScript, React Router.

- `src/features/<feature>/` holds `components/`, `hooks/`, `api/`, `types.ts`.
  `src/components/ui/` holds shared primitives.
- Routing in `src/app/router.tsx`. Every route has a lazy chunk, an error
  boundary, and a loading fallback.
- Server state through TanStack Query. Client state through `useState` and
  search params. Zustand only when neither works.
- No data fetching in `useEffect`. The query layer owns it.
- Auth state lives in one provider. A route guard is a component, not a check
  scattered in every page.
- Forms: `react-hook-form` + `zodResolver`. The same schema validates on the
  server when one exists.
- Bundle discipline: no barrel files that pull a whole feature into a chunk.
  Check with `npm run build` before declaring it done.
- Accessibility is not optional: labels bound, focus visible, keyboard reachable.

Verify:

```powershell
npm run lint
npm run build
npm test
```
