-- Add structured participant and admin triage fields to feedback_items.
alter table public.feedback_items
  add column if not exists r2_ready_area text not null default 'unspecified',
  add column if not exists expected_behavior text,
  add column if not exists actual_behavior text,
  add column if not exists reproduction_steps text,
  add column if not exists admin_status text not null default 'new',
  add column if not exists admin_status_updated_at timestamptz,
  add column if not exists admin_status_updated_by uuid,
  add column if not exists updated_at timestamptz not null default now();

update public.feedback_items
set updated_at = coalesce(updated_at, created_at, now())
where updated_at is null;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'profiles'
  ) and exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'id'
  ) then
    begin
      alter table public.feedback_items
        add constraint feedback_items_admin_status_updated_by_fkey
        foreign key (admin_status_updated_by)
        references public.profiles (id)
        on delete set null;
    exception
      when duplicate_object then
        null;
    end;
  end if;
end
$$;

create or replace function public.set_feedback_items_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_feedback_items_set_updated_at on public.feedback_items;

create trigger trg_feedback_items_set_updated_at
before update on public.feedback_items
for each row
execute function public.set_feedback_items_updated_at();
