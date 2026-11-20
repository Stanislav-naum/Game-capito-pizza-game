
create table public.capito_junior_preview_sessions (
 id uuid primary key default gen_random_uuid(),
 age_group text not null check(age_group in ('4-7','8-12')),
 alias text not null,
 recipes jsonb not null,
 started_at timestamptz not null default clock_timestamp(),
 finished_at timestamptz,
 score integer,
 perfect integer,
 check(score is null or score between 0 and 6000)
);
alter table public.capito_junior_preview_sessions enable row level security;
revoke all on public.capito_junior_preview_sessions from anon,authenticated;
create index capito_junior_preview_rank on public.capito_junior_preview_sessions(age_group,score desc) where finished_at is not null;

create function public.capito_junior_preview_start(p_age text) returns jsonb
language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_id uuid; v_alias text; v_recipes jsonb='[]'; v_round jsonb; i int; j int; n int;
begin
 if p_age not in ('4-7','8-12') or p_age is null then raise exception 'Invalid age group'; end if;
 n=case when p_age='4-7' then 3 else 5 end;
 for i in 1..n loop
 v_round='[]';
 for j in 1..(case when p_age='4-7' then 3 else 5 end) loop
 v_round=v_round || to_jsonb(floor(random()*6)::int);
 end loop;
 v_recipes=v_recipes || jsonb_build_array(v_round);
 end loop;
 v_alias='Шеф ' || (array['Базилик','Томат','Сыр','Оливка','Пепперони','Шампиньон'])[1+floor(random()*6)::int] || ' ' || lpad(floor(random()*10000)::text,4,'0');
 insert into public.capito_junior_preview_sessions(age_group,alias,recipes) values(p_age,v_alias,v_recipes) returning id into v_id;
 return jsonb_build_object('id',v_id,'alias',v_alias,'recipes',v_recipes,'seconds',case when p_age='4-7' then 90 else 75 end);
end $$;
create function public.capito_junior_preview_finish(p_id uuid,p_answers jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, public as $$
declare s public.capito_junior_preview_sessions; v_score int=0; v_perfect int=0; i int; j int; hits int; elapsed numeric; v_n int; badge text;
begin
 select * into s from public.capito_junior_preview_sessions where id=p_id for update;
 if not found then raise exception 'Session not found'; end if;
 if s.finished_at is not null then
 return jsonb_build_object('score',s.score,'perfect',s.perfect,'alias',s.alias);
 end if;
 elapsed=extract(epoch from clock_timestamp()-s.started_at);
 if elapsed < 3 or elapsed > 600 then raise exception 'Session expired or too short'; end if;
 if jsonb_typeof(p_answers) <> 'array' or jsonb_array_length(p_answers)>5 then raise exception 'Invalid answers'; end if;
 v_n=jsonb_array_length(s.recipes);
 for i in 0..v_n-1 loop
 hits=0;
 if jsonb_typeof(p_answers->i)='array' then
 for j in 0..jsonb_array_length(s.recipes->i)-1 loop
 if p_answers->i->j=s.recipes->i->j then hits=hits+1; end if;
 end loop;
 end if;
 v_score=v_score+hits*100;
 if hits=jsonb_array_length(s.recipes->i) then v_perfect=v_perfect+1; v_score=v_score+200; end if;
 end loop;
 -- No caller-supplied score, age, nickname or timing is trusted.
 if elapsed > (case when s.age_group='4-7' then 100 else 85 end) then v_score=0; v_perfect=0; end if;
 update public.capito_junior_preview_sessions set score=v_score,perfect=v_perfect,finished_at=clock_timestamp() where id=p_id;
 return jsonb_build_object('score',v_score,'perfect',v_perfect,'alias',s.alias);
end $$;
create function public.capito_junior_preview_leaderboard(p_age text) returns jsonb
language sql stable security definer set search_path=pg_catalog,public as $$
 select coalesce(jsonb_agg(jsonb_build_object('alias',alias,'score',score,'perfect',perfect)),'[]'::jsonb)
 from (select alias,score,perfect from public.capito_junior_preview_sessions
 where age_group=p_age and finished_at>=date_trunc('week',now() at time zone 'Europe/Moscow') at time zone 'Europe/Moscow' and score>0
 order by score desc,finished_at asc limit 10) r;
$$;
revoke all on function public.capito_junior_preview_start(text),public.capito_junior_preview_finish(uuid,jsonb),public.capito_junior_preview_leaderboard(text) from public;
grant execute on function public.capito_junior_preview_start(text),public.capito_junior_preview_finish(uuid,jsonb),public.capito_junior_preview_leaderboard(text) to anon,authenticated;
