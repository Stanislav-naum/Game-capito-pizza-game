-- Twelve-ingredient Junior catalog; existing sessions and adult game are untouched.
create function public.capito_junior_preview_start_v3(p_age text) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_id uuid; v_alias text; v_recipes jsonb='[]'; v_round jsonb; i int; t int; n int; topping_count int; first_sauce int=floor(random()*2)::int;
begin
 if p_age not in ('4-7','8-12') or p_age is null then raise exception 'Invalid age group'; end if;
 n=case when p_age='4-7' then 3 else 5 end;
 topping_count=case when p_age='4-7' then 3 else 5 end;
 for i in 1..n loop
  v_round=jsonb_build_array(6+((first_sauce+i-1)%2));
  for t in select x from unnest(array[0,1,2,3,4,5,8,9,10,11]) as ingredients(x) order by random() limit topping_count loop
   v_round=v_round||to_jsonb(t);
  end loop;
  v_recipes=v_recipes||jsonb_build_array(v_round);
 end loop;
 v_alias='Шеф '||(array['Базилик','Томат','Сыр','Орегано','Пепперони','Шампиньон'])[1+floor(random()*6)::int]||' '||lpad(floor(random()*10000)::text,4,'0');
 insert into public.capito_junior_preview_sessions(age_group,alias,recipes) values(p_age,v_alias,v_recipes) returning id into v_id;
 return jsonb_build_object('id',v_id,'alias',v_alias,'recipes',v_recipes,'catalog_version',3,'seconds',case when p_age='4-7' then 90 else 75 end);
end $$;

-- Keep comparable maximum scores across catalog versions: 1500 / 3500.
-- Original raw scores stay stored so already-open clients remain compatible.
create function public.capito_junior_preview_finish_v3(p_id uuid,p_answers jsonb) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
declare v jsonb; s public.capito_junior_preview_sessions; max_raw int; max_rank int; normalized int;
begin
 v=public.capito_junior_preview_finish(p_id,p_answers);
 select * into s from public.capito_junior_preview_sessions where id=p_id;
 if not found then raise exception 'Session not found'; end if;
 max_raw=jsonb_array_length(s.recipes)*(jsonb_array_length(s.recipes->0)*100+200);
 max_rank=case when s.age_group='4-7' then 1500 else 3500 end;
 normalized=round((v->>'score')::numeric*max_rank/nullif(max_raw,0))::int;
 return jsonb_set(v,'{score}',to_jsonb(normalized));
end $$;

create function public.capito_junior_preview_leaderboard_v3(p_age text) returns jsonb
language sql stable security definer set search_path=pg_catalog,public as $$
 select coalesce(jsonb_agg(jsonb_build_object('alias',alias,'score',rank_score,'perfect',perfect)),'[]'::jsonb)
 from (
  select alias,perfect,
   round(score::numeric*(case when age_group='4-7' then 1500 else 3500 end)/
    nullif(jsonb_array_length(recipes)*(jsonb_array_length(recipes->0)*100+200),0))::int as rank_score,
   finished_at
  from public.capito_junior_preview_sessions
  where age_group=p_age and finished_at>=date_trunc('week',now() at time zone 'Europe/Moscow') at time zone 'Europe/Moscow' and score>0
  order by rank_score desc,finished_at asc limit 10
 ) ranked;
$$;
revoke all on function public.capito_junior_preview_start_v3(text),public.capito_junior_preview_finish_v3(uuid,jsonb),public.capito_junior_preview_leaderboard_v3(text) from public;
grant execute on function public.capito_junior_preview_start_v3(text),public.capito_junior_preview_finish_v3(uuid,jsonb),public.capito_junior_preview_leaderboard_v3(text) to anon,authenticated;
