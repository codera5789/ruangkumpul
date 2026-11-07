/**
 * Verifikasi migration 0006 di Postgres asli (PGlite/WASM).
 * Jalur: stub Supabase → migration 0001-0005 → 0006 → smoke test RLS + RPC.
 */
import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url)).replace(/[\\/]$/, "");
const OWNER = "11111111-1111-1111-1111-111111111111";
const MEMBER = "22222222-2222-2222-2222-222222222222";
const PENDING = "33333333-3333-3333-3333-333333333333";
const STRANGER = "44444444-4444-4444-4444-444444444444";
const EXTRA = "55555555-5555-5555-5555-555555555555";

let failed = 0;
const ok = (msg) => console.log(`  ✓ ${msg}`);
const bad = (msg) => { console.log(`  ✗ ${msg}`); failed++; };

const db = new PGlite({ extensions: { pg_trgm } });

async function run(name, sql) {
  try {
    await db.exec(sql);
    console.log(`▶ ${name} — OK`);
  } catch (e) {
    console.error(`▶ ${name} — GAGAL:\n${e.message}`);
    throw e;
  }
}

async function asUser(role, sub) {
  await db.exec(
    `reset role; set role ${role};` +
    (sub ? ` set request.jwt.claim.sub = '${sub}';` : ` set request.jwt.claim.sub = '';`),
  );
}

async function expectCount(sql, expected, label) {
  const res = await db.query(sql);
  const n = Number(res.rows[0].count);
  if (n === expected) ok(`${label} (got ${n})`);
  else bad(`${label} — got ${n}, want ${expected}`);
}

async function expectBlocked(sql, label) {
  try {
    await db.query(sql);
    bad(`${label} — seharusnya diblok RLS tapi lolos`);
  } catch {
    ok(`${label} (diblok RLS)`);
  }
}

async function expectRpc(sql, expected, label) {
  const res = await db.query(sql);
  const r = res.rows[0].result ?? res.rows[0].register_event;
  if (r === expected) ok(`${label} (got '${r}')`);
  else bad(`${label} — got '${r}', want '${expected}'`);
}

try {
  await run("Stub Supabase (auth/storage/roles)", readFileSync(`${ROOT}/tests/sql-supabase-stub.sql`, "utf8"));

  for (const f of ["0001_initial_schema", "0002_article_comments", "0003_platform_features", "0004_new_modules", "0005_seed_tools"]) {
    await run(f, readFileSync(`${ROOT}/supabase/migrations/${f}.sql`, "utf8"));
  }

  await run("0006_fix_private_community_and_event_quota (FILE UJI)", readFileSync(`${ROOT}/supabase/migrations/0006_fix_private_community_and_event_quota.sql`, "utf8"));

  // ---------- Data uji (superuser, bypass RLS) ----------
  await db.exec(`
    insert into auth.users (id, email) values
      ('${OWNER}', 'owner@test.dev'), ('${MEMBER}', 'member@test.dev'),
      ('${PENDING}', 'pending@test.dev'), ('${STRANGER}', 'stranger@test.dev'),
      ('${EXTRA}', 'extra@test.dev');

    with c as (
      insert into communities (owner_id, name, slug, description, visibility, status)
      values ('${OWNER}', 'Privat Aja', 'privat-aja', 'Komunitas privat untuk test', 'private', 'active')
      returning id
    )
    insert into community_members (community_id, user_id, role, status)
    select c.id, x.uid::uuid, 'member', x.st::community_member_status from c,
      (values ('${MEMBER}', 'approved'), ('${PENDING}', 'pending')) as x(uid, st);

    with c as (
      insert into communities (owner_id, name, slug, description, visibility, status)
      values ('${OWNER}', 'Publik Aja', 'publik-aja', 'Komunitas publik untuk test', 'public', 'active')
      returning id
    )
    insert into community_members (community_id, user_id, role, status)
    select c.id, '${OWNER}', 'owner', 'approved' from c;

    insert into posts (community_id, author_id, title, slug, content, status)
    select c.id, '${OWNER}', 'Post Publik', 'post-publik', 'Konten publik', 'published'
    from communities c where c.slug = 'publik-aja';

    insert into posts (community_id, author_id, title, slug, content, status)
    select c.id, '${MEMBER}', 'Post Privat', 'post-privat', 'Konten privat', 'published'
    from communities c where c.slug = 'privat-aja';

    insert into comments (post_id, author_id, content)
    select p.id, '${MEMBER}', 'Komentar di post privat' from posts p where p.slug = 'post-privat';

    insert into events (organizer_id, title, slug, description, format, starts_at, max_participants, status)
    values ('${OWNER}', 'Event Test', 'event-test', 'Deskripsi event test minimal 20 karakter', 'online', now() + interval '7 days', 2, 'published');
  `);
  console.log("▶ Data uji — OK\n");

  console.log("TEST VISIBILITAS (RLS):");
  await asUser("anon");
  await expectCount("select count(*) as count from posts where slug = 'post-privat'", 0, "TEST1 anon tidak membaca post privat");
  await expectCount("select count(*) as count from comments c join posts p on p.id = c.post_id where p.slug = 'post-privat'", 0, "TEST2 anon tidak membaca komentar privat");
  await expectCount("select count(*) as count from posts where slug = 'post-publik'", 1, "TEST3 anon tetap membaca post publik");
  await expectCount("select count(*) as count from communities where slug = 'privat-aja'", 0, "TEST4 anon tidak melihat komunitas privat");

  await asUser("authenticated", MEMBER);
  await expectCount("select count(*) as count from posts where slug = 'post-privat'", 1, "TEST5 anggota approved membaca post privat");
  await expectCount("select count(*) as count from comments", 1, "TEST5b anggota approved membaca komentar privat");

  await asUser("authenticated", PENDING);
  await expectCount("select count(*) as count from communities where slug = 'privat-aja'", 1, "TEST6 anggota pending melihat komunitas");
  await expectCount("select count(*) as count from posts where slug = 'post-privat'", 0, "TEST6b anggota pending TIDAK membaca post");

  await asUser("authenticated", STRANGER);
  await expectCount("select count(*) as count from communities where slug = 'privat-aja'", 0, "TEST7 orang luar tidak melihat komunitas privat");
  await expectCount("select count(*) as count from posts where slug = 'post-privat'", 0, "TEST7b orang luar tidak membaca post privat");

  console.log("\nTEST INSERT JOIN (RLS):");
  // UUID komunitas diambil sebagai superuser: orang luar tak bisa SELECT komunitas
  // privat, jadi insert harus pakai UUID literal agar WITH CHECK terevaluasi.
  await asUser("postgres");
  const { rows: cidRows } = await db.query("select id from communities where slug = 'privat-aja'");
  const PRIVATE_ID = cidRows[0].id;
  const { rows: pidRows } = await db.query("select id from communities where slug = 'publik-aja'");
  const PUBLIC_ID = pidRows[0].id;
  await asUser("authenticated", STRANGER);
  await expectBlocked(
    `insert into community_members (community_id, user_id, role, status)
     values ('${PRIVATE_ID}', '${STRANGER}', 'member', 'approved')`,
    "TEST8 insert approved ke komunitas privat",
  );
  await db.query(
    `insert into community_members (community_id, user_id, role, status)
     values ('${PRIVATE_ID}', '${STRANGER}', 'member', 'pending')`,
  );
  ok("TEST9 insert pending ke komunitas privat lolos");
  await db.query(
    `insert into community_members (community_id, user_id, role, status)
     values ('${PUBLIC_ID}', '${STRANGER}', 'member', 'approved')`,
  );
  ok("TEST10 insert approved ke komunitas publik lolos");

  console.log("\nTEST RPC register_event:");
  await asUser("authenticated", MEMBER);
  await expectRpc("select register_event((select id from events where slug = 'event-test')) as result", "ok", "TEST11a daftar pertama → ok");
  await expectRpc("select register_event((select id from events where slug = 'event-test')) as result", "already", "TEST11b daftar ulang → already");
  await asUser("authenticated", STRANGER);
  await expectRpc("select register_event((select id from events where slug = 'event-test')) as result", "ok", "TEST11c kuota ke-2 → ok");
  await asUser("authenticated", EXTRA);
  await expectRpc("select register_event((select id from events where slug = 'event-test')) as result", "full", "TEST11d kuota ke-3 → full");
  await asUser("postgres");
  await expectCount("select count(*) as count from events where slug = 'event-test' and participant_count = 2", 1, "TEST11e participant_count tersinkron trigger");

  await asUser("anon");
  // anon sengaja di-revoke execute (hardening) — memanggil RPC harus ditolak.
  await expectBlocked(
    "select register_event((select id from events where slug = 'event-test'))",
    "TEST12 anon memanggil register_event",
  );

  console.log(`\n${failed === 0 ? "★★★ SEMUA TEST LULUS — migration 0006 aman dijalankan ★★★" : `✗✗✗ ${failed} TEST GAGAL`}`);
  process.exitCode = failed === 0 ? 0 : 1;
} catch (e) {
  console.error("Harness error:", e.message);
  process.exitCode = 1;
} finally {
  await db.close();
}
