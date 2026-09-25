-- Correct the academic hierarchy: stage → semester.
-- Run once in Supabase SQL Editor after confirming your stage names match these names.
update public.semesters as sem
set stage_id = st.id
from public.stages as st
where
  (sem.name in ('الفصل الأول', 'الفصل الثاني') and st.name = 'المرحلة الأولى')
  or (sem.name in ('الفصل الثالث', 'الفصل الرابع') and st.name = 'المرحلة الثانية')
  or (sem.name in ('الفصل الخامس', 'الفصل السادس') and st.name = 'المرحلة الثالثة')
  or (sem.name in ('الفصل السابع', 'الفصل الثامن') and st.name = 'المرحلة الرابعة');

update public.semesters
set sort_order = case name
  when 'الفصل الأول' then 1
  when 'الفصل الثاني' then 2
  when 'الفصل الثالث' then 3
  when 'الفصل الرابع' then 4
  when 'الفصل الخامس' then 5
  when 'الفصل السادس' then 6
  when 'الفصل السابع' then 7
  when 'الفصل الثامن' then 8
  else sort_order
end;
