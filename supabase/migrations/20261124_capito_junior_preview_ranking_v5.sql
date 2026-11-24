create or replace function public.capito_junior_preview_leaderboard_v5(p_age text) returns jsonb
language sql stable security definer set search_path=pg_catalog,public as $ranking$
 select coalesce(jsonb_agg(jsonb_build_object('alias',alias,'score',rank_score,'perfect',perfect) order by rank_score desc,finished_at asc),'[]'::jsonb)
 from (
 select s.alias,s.perfect,s.finished_at,
 round(s.score::numeric*(case when s.age_group='4-7' then 1500 else 3500 end)/
 nullif((select sum(jsonb_array_length(recipe)*100+200) from jsonb_array_elements(s.recipes) recipe),0))::int rank_score
 from public.capito_junior_preview_sessions s
 where s.age_group=p_age and s.preview_version=5 and s.score>0
 and s.finished_at>=date_trunc('week',now() at time zone 'Europe/Moscow') at time zone 'Europe/Moscow'
 order by rank_score desc,s.finished_at asc limit 10
 ) ranked;
$ranking$;
revoke all on function public.capito_junior_preview_leaderboard_v5(text) from public;
grant execute on function public.capito_junior_preview_leaderboard_v5(text) to anon,authenticated;