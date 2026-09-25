create policy "staff manages stages" on public.stages for all using(public.is_staff()) with check(public.is_staff());
create policy "staff manages semesters" on public.semesters for all using(public.is_staff()) with check(public.is_staff());
create policy "staff manages subjects" on public.subjects for all using(public.is_staff()) with check(public.is_staff());
create policy "staff manages years" on public.academic_years for all using(public.is_staff()) with check(public.is_staff());
create policy "staff manages batches" on public.batches for all using(public.is_staff()) with check(public.is_staff());
