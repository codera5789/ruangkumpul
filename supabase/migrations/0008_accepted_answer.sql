-- ============================================================================
-- RuangKumpul — Migration 0008 (Accepted Answer untuk Postingan Pertanyaan)
-- Menambahkan penanda solusi terpilih (accepted_comment_id) pada tabel posts
-- dan fungsi RPC set_accepted_answer yang terproteksi hak akses pembuat atau staff.
-- ============================================================================

-- 1. Tambah kolom accepted_comment_id pada tabel posts
alter table public.posts
  add column if not exists accepted_comment_id uuid references public.comments(id) on delete set null;

create index if not exists posts_accepted_comment_idx on public.posts (accepted_comment_id)
  where accepted_comment_id is not null;

-- 2. RPC untuk mengatur atau mencabut status solusi terpilih
create or replace function public.set_accepted_answer(
  p_post_id uuid,
  p_comment_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_id uuid := auth.uid();
  v_author_id uuid;
  v_community_id uuid;
  v_post_type public.post_type;
  v_current_accepted uuid;
  v_comment_post_id uuid;
  v_comment_status varchar(20);
  v_is_staff boolean := false;
begin
  if v_caller_id is null then
    raise exception 'Wajib login untuk menentukan solusi.';
  end if;

  -- Ambil informasi post
  select author_id, community_id, post_type, accepted_comment_id
  into v_author_id, v_community_id, v_post_type, v_current_accepted
  from public.posts
  where id = p_post_id and status = 'published';

  if v_author_id is null then
    raise exception 'Postingan tidak ditemukan atau tidak aktif.';
  end if;

  if v_post_type <> 'question' then
    raise exception 'Hanya postingan bertipe pertanyaan yang dapat memiliki solusi.';
  end if;

  -- Cek hak akses: hanya pemilik pertanyaan atau staff komunitas / admin
  if v_caller_id <> v_author_id then
    if v_community_id is not null then
      v_is_staff := public.is_community_staff(v_community_id);
    end if;
    if not v_is_staff and not public.is_moderator() and not public.is_admin() then
      raise exception 'Hanya pembuat pertanyaan atau moderator yang dapat menentukan solusi.';
    end if;
  end if;

  -- Jika p_comment_id null atau sama dengan yang sedang terpilih, cabut status solusi (toggle off)
  if p_comment_id is null or v_current_accepted = p_comment_id then
    update public.posts
    set accepted_comment_id = null,
        updated_at = now()
    where id = p_post_id;
    return false;
  end if;

  -- Validasi komentar yang akan dijadikan solusi
  select post_id, status
  into v_comment_post_id, v_comment_status
  from public.comments
  where id = p_comment_id;

  if v_comment_post_id is null or v_comment_post_id <> p_post_id or v_comment_status <> 'published' then
    raise exception 'Komentar tidak valid untuk postingan ini.';
  end if;

  -- Set komentar sebagai solusi
  update public.posts
  set accepted_comment_id = p_comment_id,
      updated_at = now()
  where id = p_post_id;

  return true;
end;
$$;

revoke all on function public.set_accepted_answer(uuid, uuid) from public, anon;
grant execute on function public.set_accepted_answer(uuid, uuid) to authenticated;
