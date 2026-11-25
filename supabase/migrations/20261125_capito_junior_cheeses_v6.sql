create or replace function public.capito_junior_preview_start_v6(p_age text) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $recipe$
declare v jsonb; v_recipes jsonb; riddles jsonb; chosen jsonb; i int; c int;
catalog jsonb='[{"title":"Томатное облако","clue":"На красной дорожке томатного соуса отдыхает нежная страчателла. Всего два ингредиента.","items":[7,13]},{"title":"Страчателла","clue":"Томатный соус, белая страчателла и зелёный базилик. Узнай три цвета вкусной Италии!","items":[7,13,2]},{"title":"Пармезановая полянка","clue":"На сливочном соусе растут грибы. Рядом моцарелла, а сверху золотистые лепестки пармезана.","items":[6,1,3,12]},{"title":"Четыре сырных друга","clue":"Моцарелла, дорблю, пармезан и страчателла встретились на сливочном соусе.","items":[6,1,10,12,13]},{"title":"Большая сырная компания","clue":"На сливочном соусе собрались моцарелла, дорблю, пармезан и страчателла. Укрась их базиликом.","items":[6,1,10,12,13,2]}]';
begin
v=public.capito_junior_preview_start_v5(p_age);v_recipes=v->'recipes';riddles=v->'riddles';
for i in 0..jsonb_array_length(v_recipes)-1 loop
 c=jsonb_array_length(v_recipes->i);chosen=null;
 if random()<0.55 then select value into chosen from jsonb_array_elements(catalog) where jsonb_array_length(value->'items')=c order by random() limit 1;end if;
 if chosen is not null then
 v_recipes=jsonb_set(v_recipes,array[i::text],chosen->'items');
 riddles=jsonb_set(riddles,array[i::text],jsonb_build_object('title',chosen->>'title','clue',chosen->>'clue'));
 end if;
end loop;
update public.capito_junior_preview_sessions set recipes=v_recipes where id=(v->>'id')::uuid;
return v||jsonb_build_object('recipes',v_recipes,'riddles',riddles,'catalog_version',6);
end $recipe$;
revoke all on function public.capito_junior_preview_start_v6(text) from public;
grant execute on function public.capito_junior_preview_start_v6(text) to anon,authenticated;
