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
  } catch (e) {
    if (e.code === "42501") {
      ok(`${label} (diblok RLS)`);
    } else {
      bad(`${label} — error tak terduga [${e.code ?? "?"}]: ${String(e.message).split("\n")[0]}`);
    }
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
  await run("0007_audit_fixes (FILE UJI)", readFileSync(`${ROOT}/supabase/migrations/0007_audit_fixes.sql`, "utf8"));
  await run("0008_accepted_answer (FILE UJI)", readFileSync(`${ROOT}/supabase/migrations/0008_accepted_answer.sql`, "utf8"));
  await run("0009_marketplace (FILE UJI)", readFileSync(`${ROOT}/supabase/migrations/0009_marketplace.sql`, "utf8"));

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
  // Regresi 0007: policy community_members sebelumnya rekursif (error 42P17).
  await expectCount("select count(*) as count from community_members", 4, "TEST5c anggota approved membaca daftar anggota");

  await asUser("authenticated", PENDING);
  await expectCount("select count(*) as count from communities where slug = 'privat-aja'", 1, "TEST6 anggota pending melihat komunitas");
  await expectCount("select count(*) as count from posts where slug = 'post-privat'", 0, "TEST6b anggota pending TIDAK membaca post");
  await expectCount("select count(*) as count from community_members", 4, "TEST6c anggota pending melihat daftar anggota");

  // Trigger notifikasi tetap boleh memanggil create_notification setelah
  // EXECUTE-nya dicabut dari client (0007).
  await asUser("authenticated", MEMBER);
  await db.query(
    `insert into comments (post_id, author_id, content)
     select id, '${MEMBER}', 'tes notifikasi' from posts where slug = 'post-publik'`,
  );
  await asUser("postgres");
  await expectCount(
    "select count(*) as count from notifications where user_id = '" + OWNER + "' and type = 'comment'",
    1,
    "TEST6d trigger komentar membuat notifikasi",
  );

  await asUser("authenticated", STRANGER);
  await expectCount("select count(*) as count from communities where slug = 'privat-aja'", 0, "TEST7 orang luar tidak melihat komunitas privat");
  await expectCount("select count(*) as count from posts where slug = 'post-privat'", 0, "TEST7b orang luar tidak membaca post privat");
  await expectCount("select count(*) as count from community_members", 1, "TEST7c orang luar hanya melihat anggota komunitas publik");

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
  await expectBlocked(
    `insert into community_members (community_id, user_id, role, status)
     values ('${PUBLIC_ID}', '${EXTRA}', 'owner', 'approved')`,
    "TEST10b insert role owner ke komunitas publik",
  );

  // Regresi 0007: moderator tidak boleh mengubah/mengeluarkan baris owner.
  await asUser("postgres");
  await db.query(
    `insert into community_members (community_id, user_id, role, status)
     values ('${PRIVATE_ID}', '${EXTRA}', 'moderator', 'approved')`,
  );
  await asUser("authenticated", EXTRA);
  await expectBlocked(
    `update community_members set status = 'banned'
     where community_id = '${PRIVATE_ID}' and user_id = '${OWNER}'`,
    "TEST15a moderator mengubah baris owner",
  );
  await expectBlocked(
    `delete from community_members
     where community_id = '${PRIVATE_ID}' and user_id = '${OWNER}'`,
    "TEST15b moderator mengeluarkan owner",
  );

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
  const { rows: eventRows } = await db.query("select id from events where slug = 'event-test'");
  const EVENT_ID = eventRows[0].id;

  // Regresi 0007: kuota tidak boleh dilewati lewat insert langsung (bukan RPC).
  await asUser("authenticated", PENDING);
  await expectBlocked(
    `insert into event_registrations (event_id, user_id) values ('${EVENT_ID}', '${PENDING}')`,
    "TEST11f insert langsung melewati kuota event",
  );

  await asUser("anon");
  // anon sengaja di-revoke execute (hardening) — memanggil RPC harus ditolak.
  await expectBlocked(
    "select register_event((select id from events where slug = 'event-test'))",
    "TEST12 anon memanggil register_event",
  );

  console.log("\nTEST NEWSLETTER & SIGNUP (0007):");
  await asUser("anon");
  await expectRpc("select subscribe_newsletter('Baru+Tag@Example.com', 'footer') as result", "ok", "TEST13a subscribe pertama");
  await expectRpc("select subscribe_newsletter('baru+tag@example.com', 'footer') as result", "ok", "TEST13b subscribe ulang");
  await asUser("postgres");
  await expectCount("select count(*) as count from newsletter_subscribers where lower(email) = 'baru+tag@example.com'", 1, "TEST13c satu baris aktif");

  // Email plus-addressed dulu menggagalkan CHECK username dan membatalkan signup.
  await db.exec(`insert into auth.users (id, email) values ('77777777-7777-7777-7777-777777777777', 'plus+tag@example.com')`);
  const { rows: profileRows } = await db.query("select username from profiles where id = '77777777-7777-7777-7777-777777777777'");
  const generatedUsername = profileRows[0]?.username ?? "";
  if (/^[a-z0-9_.-]{3,32}$/.test(generatedUsername)) {
    ok(`TEST14 username plus-address valid (${generatedUsername})`);
  } else {
    bad(`TEST14 username plus-address tidak valid (${generatedUsername})`);
  }

  console.log("\nTEST RATE LIMIT (0007):");
  // Orang lain tidak boleh menghabiskan kuota bucket milik korban.
  await asUser("authenticated", STRANGER);
  for (let i = 0; i < 3; i++) {
    await expectRpc(
      `select check_rate_limit('comment:${MEMBER}', 1, 60) as result`,
      true,
      `TEST16a${i + 1} bucket korban diabaikan`,
    );
  }
  await asUser("authenticated", MEMBER);
  await expectRpc(
    `select check_rate_limit('comment:${MEMBER}', 1, 60) as result`,
    true,
    "TEST16b kuota korban masih utuh",
  );
  await expectRpc(
    `select check_rate_limit('comment:${MEMBER}', 1, 60) as result`,
    false,
    "TEST16c kuota sendiri tetap berlaku",
  );

  console.log("\nTEST ACCEPTED ANSWER (0008):");
  await db.exec("reset role;");
  const qRes = await db.query(`
    insert into posts (community_id, author_id, title, slug, content, post_type, status)
    select id, '${OWNER}', 'Pertanyaan Test?', 'pertanyaan-test', 'Bagaimana ini?', 'question', 'published'
    from communities where slug = 'publik-aja'
    returning id;
  `);
  const questionId = qRes.rows[0].id;

  const cRes = await db.query(`
    insert into comments (post_id, author_id, content, status)
    values ('${questionId}', '${MEMBER}', 'Ini solusinya.', 'published')
    returning id;
  `);
  const commentId = cRes.rows[0].id;

  // Stranger mencoba menandai solusi -> harus ditolak
  await asUser("authenticated", STRANGER);
  try {
    await db.query(`select set_accepted_answer('${questionId}', '${commentId}')`);
    bad("TEST17a stranger menandai solusi seharusnya diblok");
  } catch {
    ok("TEST17a stranger menandai solusi ditolak");
  }

  // Owner menandai solusi -> sukses
  await asUser("authenticated", OWNER);
  const setRes = await db.query(`select set_accepted_answer('${questionId}', '${commentId}') as result`);
  if (setRes.rows[0].result === true) {
    ok("TEST17b owner berhasil menandai solusi");
  } else {
    bad("TEST17b owner gagal menandai solusi");
  }

  // Toggle off solusi -> sukses
  const unsetRes = await db.query(`select set_accepted_answer('${questionId}', '${commentId}') as result`);
  if (unsetRes.rows[0].result === false) {
    ok("TEST17c owner berhasil mencabut status solusi");
  } else {
    bad("TEST17c owner gagal mencabut status solusi");
  }

  console.log("\nTEST MARKETPLACE RLS & TRIGGERS (0009):");
  await db.exec("reset role;");
  const catRes = await db.query(`select id from marketplace_categories where slug = 'template-kode'`);
  const catId = catRes.rows[0].id;

  const prodPubRes = await db.query(`
    insert into marketplace_products (seller_id, category_id, title, slug, summary, description, product_type, price_idr, status)
    values ('${OWNER}', '${catId}', 'Starter Kit SaaS', 'starter-kit-saas', 'Ringkas', 'Deskripsi lengkap starter kit SaaS.', 'template', 150000, 'published')
    returning id;
  `);
  const prodPubId = prodPubRes.rows[0].id;

  await db.query(`
    insert into marketplace_products (seller_id, category_id, title, slug, summary, description, product_type, price_idr, status)
    values ('${OWNER}', '${catId}', 'Draft Produk', 'draft-produk', 'Ringkas draft', 'Deskripsi lengkap draft produk.', 'ui_kit', 0, 'draft')
  `);

  await asUser("anon", null);
  await expectCount(`select count(*) from marketplace_products`, 1, "TEST18a anon hanya lihat produk published");

  await asUser("authenticated", STRANGER);
  await expectBlocked(
    `insert into marketplace_products (seller_id, title, slug, summary, description)
     values ('${OWNER}', 'Spoof Produk', 'spoof-produk', 'Ringkas', 'Deskripsi produk spoof.')`,
    "TEST18b stranger tidak boleh insert produk atas nama owner",
  );

  await expectBlocked(
    `insert into product_inquiries (product_id, buyer_id, seller_id, buyer_name, buyer_contact, message, status)
     values ('${prodPubId}', '${MEMBER}', '${OWNER}', 'Spoof', 'spoof@example.com', 'Pesan spoof buyer id.', 'new')`,
    "TEST18c stranger tidak boleh spoof buyer_id pada inquiry",
  );

  await asUser("authenticated", OWNER);
  await expectBlocked(
    `insert into product_inquiries (product_id, buyer_id, seller_id, buyer_name, buyer_contact, message, status)
     values ('${prodPubId}', '${OWNER}', '${OWNER}', 'Owner', 'owner@example.com', 'Mengirim inquiry ke produk sendiri.', 'new')`,
    "TEST18d seller tidak boleh mengirim inquiry ke produk sendiri",
  );

  await asUser("authenticated", MEMBER);
  await db.query(`
    insert into product_inquiries (product_id, buyer_id, seller_id, buyer_name, buyer_contact, message)
    values ('${prodPubId}', '${MEMBER}', '${OWNER}', 'Budi', 'budi@example.com', 'Halo, apakah template ini mendukung Next.js 16?')
  `);
  await expectCount(
    `select inquiry_count as count from marketplace_products where id = '${prodPubId}'`,
    1,
    "TEST18e trigger inquiry_count bertambah setelah inquiry valid",
  );

  await asUser("authenticated", STRANGER);
  await expectCount(
    `select count(*) from product_inquiries where product_id = '${prodPubId}'`,
    0,
    "TEST18f stranger tidak boleh membaca inquiry orang lain",
  );

  await asUser("authenticated", OWNER);
  await expectCount(
    `select count(*) from product_inquiries where product_id = '${prodPubId}'`,
    1,
    "TEST18g seller dapat membaca inquiry produk miliknya",
  );

  console.log(`\n${failed === 0 ? "★★★ SEMUA TEST LULUS — migration 0001–0009 aman dijalankan ★★★" : `✗✗✗ ${failed} TEST GAGAL`}`);
  process.exitCode = failed === 0 ? 0 : 1;
} catch (e) {
  console.error("Harness error:", e.message);
  process.exitCode = 1;
} finally {
  await db.close();
}
