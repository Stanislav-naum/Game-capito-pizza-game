-- Junior v2 catalog: 0 tomato, 1 mozzarella, 2 basil, 3 mushroom,
-- 4 oregano, 5 pepperoni, 6 cream sauce, 7 tomato sauce.
-- New RPC keeps already-open v1 clients compatible with their sessions.
create function public.capito_junior_preview_start_v2(p_age text) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_id uuid; v_alias text; v_recipes jsonb='[]'; v_round jsonb; i int; t int; n int; topping_count int; first_sauce int=floor(random()*2)::int;
begin
 if p_age not in ('4-7','8-12') or p_age is null then raise exception 'Invalid age group'; end if;
 n=case when p_age='4-7' then 3 else 5 end;
 topping_count=case when p_age='4-7' then 2 else 4 end;
 for i in 1..n loop
  v_round=jsonb_build_array(6+((first_sauce+i-1)%2));
  for t in select x from generate_series(0,5) as ingredients(x) order by random() limit topping_count loop
   v_round=v_round||to_jsonb(t);
  end loop;
  v_recipes=v_recipes||jsonb_build_array(v_round);
 end loop;
 v_alias='Шеф '||(array['Базилик','Томат','Сыр','Орегано','Пепперони','Шампиньон'])[1+floor(random()*6)::int]||' '||lpad(floor(random()*10000)::text,4,'0');
 insert into public.capito_junior_preview_sessions(age_group,alias,recipes) values(p_age,v_alias,v_recipes) returning id into v_id;
 return jsonb_build_object('id',v_id,'alias',v_alias,'recipes',v_recipes,'catalog_version',2,'seconds',case when p_age='4-7' then 90 else 75 end);
end $$;
revoke all on function public.capito_junior_preview_start_v2(text) from public;
grant execute on function public.capito_junior_preview_start_v2(text) to anon,authenticated;
