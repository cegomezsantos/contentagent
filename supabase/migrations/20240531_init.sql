-- Create the storage bucket for files
insert into storage.buckets (id, name, public) 
values ('archivos', 'archivos', true);

-- Create the table for courses
create table public.cursos (
    id uuid default gen_random_uuid() primary key,
    nombre_curso text not null,
    version text not null,
    fecha_entrega date not null,
    archivo_url text not null,
    archivo_nombre text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.cursos enable row level security;

-- Create policies
create policy "Enable read access for all users" on public.cursos
    for select using (true);

create policy "Enable insert access for all users" on public.cursos
    for insert with check (true);

create policy "Enable delete access for all users" on public.cursos
    for delete using (true);

-- Storage policies
create policy "Give users access to own folder" on storage.objects
    for all using (bucket_id = 'archivos');

create policy "Allow public read access" on storage.objects
    for select using (bucket_id = 'archivos'); 