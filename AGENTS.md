<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Aturan Proyek & Prinsip DRY RuangKumpul

- Terapkan prinsip **DRY (*Rule of Three*)** untuk logika yang berulang: sebelum menulis utilitas baru, periksa dan gunakan helper resmi di `src/lib/` (`utils.ts`, `form.ts`, `auth.ts`, `rate-limit.ts`, `datetime.ts`, `visitor.ts`, `supabase/`) serta primitif di `src/components/ui/`.
- Gunakan `ActionState`, `isUuid()`, `zodFieldErrors()`, `parsePageParam()` dari `@/lib/form`, `uniqueSlug()`, `safeNext()`, `toJsonLd()`, `postgrestIlikePattern()` dari `@/lib/utils`, serta `withFailSoft()` dari `@/lib/supabase/query` untuk query server agar `unstable_rethrow` tidak pernah terlewat.
- Hindari *premature abstraction*: biarkan kueri domain per modul (`services.ts`), skema bisnis (`schemas.ts`), dan masing-masing web tool client-side (`src/modules/tools/components/tools/`) tetap eksplisit dan terisolasi.
- Ikuti pedoman visual & copy Bahasa Indonesia di `DESIGN.md` serta alur fitur di `CONTRIBUTING.md`.

