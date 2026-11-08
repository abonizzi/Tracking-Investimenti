-- Mio Portafoglio — schema Supabase (importi in centesimi, bigint)
create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null, currency char(3) not null default 'EUR',
  balance bigint not null default 0, revision int not null default 1,
  updated_at timestamptz not null default now());
create table public.investments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  category text not null check (category in ('azioni','etf','obbligazioni','cripto','altro')),
  invested bigint not null check (invested >= 0), value bigint not null check (value >= 0),
  currency char(3) not null default 'EUR', start_date date, notes text, quantity numeric,
  revision int not null default 1, updated_at timestamptz not null default now());
create table public.movements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  kind text not null check (kind in ('versamento','vendita','dividendo','cedola','commissione','entrata','uscita','trasferimento')),
  investment_id uuid references public.investments on delete cascade,
  account_id uuid references public.accounts on delete set null,
  amount bigint not null, realized_profit bigint, occurred_on date not null default current_date,
  created_at timestamptz not null default now());
create table public.snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  day date not null, total bigint not null, investments bigint not null,
  liquidity bigint not null, pension bigint not null, unique (user_id, day));
create index on public.investments (user_id);
create index on public.movements (user_id, occurred_on desc);
create index on public.snapshots (user_id, day);
do $$ declare t text; begin
  foreach t in array array['accounts','investments','movements','snapshots'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "own_rows" on public.%I for all using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop; end $$;

-- Fondi pensione, PAC, obiettivi, cambi
create table public.pensions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null, invested bigint not null check (invested >= 0), value bigint not null check (value >= 0),
  currency char(3) not null default 'EUR', start_date date, notes text,
  revision int not null default 1, updated_at timestamptz not null default now());
create table public.pacs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null, investment_id uuid not null references public.investments on delete cascade,
  amount bigint not null check (amount > 0), every_months int not null default 1 check (every_months >= 1),
  next_due date not null, active boolean not null default true,
  revision int not null default 1, updated_at timestamptz not null default now());
create table public.pac_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  pac_id uuid not null references public.pacs on delete cascade,
  due_date date not null, amount bigint not null, paid_on date not null default current_date,
  unique (pac_id, due_date)); -- impedisce rate duplicate
create table public.settings (
  user_id uuid primary key default auth.uid() references auth.users on delete cascade,
  goal bigint not null default 0, rates jsonb not null default '{}'::jsonb, updated_at timestamptz not null default now());
do $$ declare t text; begin
  foreach t in array array['pensions','pacs','pac_payments','settings'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "own_rows" on public.%I for all using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop; end $$;

-- Sincronizzazione a documento con revisione (usata dall'app): un record per utente.
create table public.user_state (
  user_id uuid primary key default auth.uid() references auth.users on delete cascade,
  data jsonb not null, revision int not null default 1 check (revision >= 1),
  updated_at timestamptz not null default now());
alter table public.user_state enable row level security;
create policy "own_rows" on public.user_state for all using (user_id = auth.uid()) with check (user_id = auth.uid());
