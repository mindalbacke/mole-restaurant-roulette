create table if not exists restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null check (
    name = trim(name)
    and char_length(name) between 1 and 16
  ),
  category text not null check (
    category in ('한식', '중식', '일식', '양식', '분식', '동남아', '햄버거', '기타')
  ),
  created_at timestamptz not null default now()
);

create unique index if not exists restaurants_name_category_unique
  on restaurants (lower(trim(name)), category);
