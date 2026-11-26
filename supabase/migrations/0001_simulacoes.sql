-- Simulações de balanço salvas por usuário.
-- Rode no SQL Editor do Supabase ou com `supabase db push`.

create table if not exists public.simulacoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome text not null check (char_length(nome) between 1 and 120),
  entradas jsonb not null,
  versao_motor text not null default '2.2',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists simulacoes_user_id_idx
  on public.simulacoes (user_id, atualizado_em desc);

-- Cada usuário enxerga e altera somente as próprias simulações.
alter table public.simulacoes enable row level security;

create policy "simulacoes: ler as proprias"
  on public.simulacoes for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "simulacoes: criar as proprias"
  on public.simulacoes for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "simulacoes: alterar as proprias"
  on public.simulacoes for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "simulacoes: excluir as proprias"
  on public.simulacoes for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Mantém atualizado_em em dia a cada alteração.
create or replace function public.simulacoes_tocar_atualizado_em()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

drop trigger if exists simulacoes_atualizado_em on public.simulacoes;
create trigger simulacoes_atualizado_em
  before update on public.simulacoes
  for each row execute function public.simulacoes_tocar_atualizado_em();
