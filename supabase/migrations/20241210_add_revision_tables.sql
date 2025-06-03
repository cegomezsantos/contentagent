-- Add missing columns to cursos table
alter table public.cursos add column if not exists codigo text;
alter table public.cursos add column if not exists cuenta text check (cuenta in ('ejecutiva', 'pregrado', 'Harson', 'escuela'));

-- Create revision_silabus table to track reviewed syllabus
create table if not exists public.revision_silabus (
    id uuid default gen_random_uuid() primary key,
    curso_id uuid references public.cursos(id) on delete cascade,
    fecha_revision timestamp with time zone default timezone('utc'::text, now()) not null,
    estado text not null check (estado in ('aprobado', 'desaprobado')),
    informe_revision text not null,
    revisor text,
    observaciones text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for revision_silabus
alter table public.revision_silabus enable row level security;

-- Create policies for revision_silabus
create policy "Enable read access for all users" on public.revision_silabus
    for select using (true);

create policy "Enable insert access for all users" on public.revision_silabus
    for insert with check (true);

create policy "Enable update access for all users" on public.revision_silabus
    for update using (true);

create policy "Enable delete access for all users" on public.revision_silabus
    for delete using (true);

-- Create indexes for better performance
create index if not exists idx_revision_silabus_curso_id on public.revision_silabus(curso_id);
create index if not exists idx_revision_silabus_estado on public.revision_silabus(estado);
create index if not exists idx_revision_silabus_fecha on public.revision_silabus(fecha_revision);

-- Create function to update updated_at automatically
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

-- Create trigger for automatic updated_at
drop trigger if exists update_revision_silabus_updated_at on public.revision_silabus;
create trigger update_revision_silabus_updated_at
    before update on public.revision_silabus
    for each row execute function update_updated_at_column(); 