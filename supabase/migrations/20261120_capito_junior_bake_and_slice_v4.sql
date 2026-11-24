alter table public.capito_junior_preview_sessions add column if not exists preview_version integer not null default 3;
CREATE OR REPLACE FUNCTION public.capito_junior_preview_finish_v4(p_id uuid, p_answers jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare s public.capito_junior_preview_sessions; raw_score int=0; perfect_count int=0; hits int; i int; j int; n int; max_raw int=0; normalized int; elapsed numeric;
begin
 select * into s from public.capito_junior_preview_sessions where id=p_id for update;
 if not found or s.preview_version<>4 then raise exception 'Invalid session'; end if;
 n=jsonb_array_length(s.recipes);
 for i in 0..n-1 loop max_raw=max_raw+jsonb_array_length(s.recipes->i)*100+200; end loop;
 if s.finished_at is null then
  elapsed=extract(epoch from clock_timestamp()-s.started_at);
  if elapsed<3 or elapsed>600 then raise exception 'Session expired or too short'; end if;
  if jsonb_typeof(p_answers) is distinct from 'array' or jsonb_array_length(p_answers)>n then raise exception 'Invalid answers'; end if;
  for i in 0..n-1 loop
   hits=0;
   if jsonb_typeof(p_answers->i)='array' then
    for j in 0..jsonb_array_length(s.recipes->i)-1 loop
     if p_answers->i->j=s.recipes->i->j then hits=hits+1; end if;
    end loop;
   end if;
   raw_score=raw_score+hits*100;
   if hits=jsonb_array_length(s.recipes->i) then perfect_count=perfect_count+1;raw_score=raw_score+200;end if;
  end loop;
  if elapsed>300 then raw_score=0;perfect_count=0;end if;
  update public.capito_junior_preview_sessions set score=raw_score,perfect=perfect_count,finished_at=clock_timestamp() where id=p_id;
 else raw_score=s.score;perfect_count=s.perfect;
 end if;
 normalized=round(raw_score::numeric*(case when s.age_group='4-7' then 1500 else 3500 end)/max_raw)::int;
 return jsonb_build_object('score',normalized,'perfect',perfect_count,'alias',s.alias);
end $function$
;
CREATE OR REPLACE FUNCTION public.capito_junior_preview_start_v4(p_age text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare v jsonb; v_recipes jsonb='[]'; recipe jsonb; x int;
begin
 v=public.capito_junior_preview_start_v3(p_age);
 for recipe in select value from jsonb_array_elements(v->'recipes') loop
  if jsonb_array_length(recipe)<6 then
   for x in select id from unnest(array[0,1,2,3,4,5,8,9,10,11]) t(id) where not recipe @> to_jsonb(array[id]) order by random() limit (6-jsonb_array_length(recipe)) loop recipe=recipe||to_jsonb(x); end loop;
  end if;
  v_recipes=v_recipes||jsonb_build_array(recipe);
 end loop;
 update public.capito_junior_preview_sessions s set recipes=v_recipes,preview_version=4 where s.id=(v->>'id')::uuid;
 return v||jsonb_build_object('recipes',v_recipes,'catalog_version',4,'wall_seconds',300);
end $function$
;
revoke all on function public.capito_junior_preview_start_v4(text),public.capito_junior_preview_finish_v4(uuid,jsonb) from public;
grant execute on function public.capito_junior_preview_start_v4(text),public.capito_junior_preview_finish_v4(uuid,jsonb) to anon,authenticated;

