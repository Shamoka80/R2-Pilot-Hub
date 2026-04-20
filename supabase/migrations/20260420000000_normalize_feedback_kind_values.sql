-- Normalize historical feedback kind values and enforce the new allowed set.

begin;

update public.feedback_items
set kind = case
  when kind = 'note' then 'finding'
  when kind = 'comment' then 'suggestion'
  else kind
end
where kind in ('note', 'comment');

-- Drop legacy CHECK constraints that validate feedback_items.kind.
do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'feedback_items'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%kind%'
  loop
    execute format('alter table public.feedback_items drop constraint %I', constraint_name);
  end loop;
end $$;

alter table public.feedback_items
  add constraint feedback_items_kind_allowed_check
  check (kind in ('issue', 'finding', 'suggestion', 'request'));

commit;
