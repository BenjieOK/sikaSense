-- SikaSense database schema
-- Run this in Supabase → SQL Editor → New query

-- Batches (sourcing batches, called "products" in the table for continuity
-- with earlier drafts, but represent a single sourcing batch of one item)
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null default auth.uid(),
  name text not null,
  source text not null check (source in ('Ghana', 'Abroad')),
  wholesaler_cost numeric not null default 0,
  shipping_fees numeric not null default 0,
  packaging_cost numeric not null default 0,
  other_costs numeric not null default 0,
  total_units integer not null check (total_units > 0),
  target_price numeric not null check (target_price > 0),
  created_at timestamptz not null default now()
);

-- Individual sale events logged against a batch
create table if not exists sale_events (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade not null,
  user_id uuid references auth.users(id) not null default auth.uid(),
  units integer not null check (units > 0),
  price_per_unit numeric not null check (price_per_unit >= 0),
  created_at timestamptz not null default now()
);

alter table products enable row level security;
alter table sale_events enable row level security;

create policy "Users manage their own batches"
  on products for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage their own sale events"
  on sale_events for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_products_user on products(user_id);
create index if not exists idx_sale_events_product on sale_events(product_id);
create index if not exists idx_sale_events_user on sale_events(user_id);


