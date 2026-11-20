create or replace function public.capito_junior_preview_start_v5(p_age text) returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare v jsonb; catalog jsonb=$catalog$[{"title":"Сливочное облачко","clue":"Белое, нежное облачко укрыло тесто. Никакой начинки — только сливочный соус.","items":[6]},{"title":"Томатная полянка","clue":"Красная дорожка из томатного соуса, а сверху — ароматные крошки орегано.","items":[7,4]},{"title":"Сырное облако","clue":"Сливочный соус и белые островки моцареллы. Всего два нежных ингредиента.","items":[6,1]},{"title":"Маргарита","clue":"Угадай три цвета Италии: красный томатный соус, белая моцарелла и зелёный базилик.","items":[7,1,2]},{"title":"Грибная","clue":"Грибочки спрятались под белым облаком. Им нужны сливочный соус и моцарелла.","items":[6,1,3]},{"title":"Пепперони","clue":"Красные кружочки колбаски дружат с моцареллой. Под ними — томатный соус.","items":[7,1,5]},{"title":"Лесная","clue":"На сливочной полянке растут грибы. Добавь моцареллу и посыпь орегано.","items":[6,1,3,4]},{"title":"Мортаделла","clue":"Розовые ленты мортаделлы, белая моцарелла, сливочный соус и зелёный базилик в центре.","items":[6,1,9,2]},{"title":"Сырный секрет","clue":"Два сыра: моцарелла и дорблю. Для них нужны сливочный соус и щепотка орегано.","items":[6,1,10,4]},{"title":"Пастрами-приключение","clue":"Пастрами отправилась в поход с маринованными огурцами. Возьми моцареллу, томатный соус и орегано.","items":[7,1,11,8,4]},{"title":"Сырный сад","clue":"На сливочном соусе растут томаты и базилик. Рядом — два сыра: моцарелла и дорблю.","items":[6,1,10,0,2]},{"title":"Капитошка","clue":"Томатный соус и моцарелла зовут в гости пепперони, грибы, томат и базилик.","items":[7,1,5,3,0,2]},{"title":"Большой шеф","clue":"Сливочный соус, моцарелла и дорблю — нежная команда. Добавь мортаделлу, грибы и орегано.","items":[6,1,9,10,3,4]}]$catalog$; v_recipes jsonb='[]'; riddles jsonb='[]'; chosen jsonb; counts int[]; c int;
begin
 v=public.capito_junior_preview_start_v3(p_age);
 counts=case when p_age='4-7' then array[1+floor(random()*2)::int,3,4+floor(random()*2)::int] else array[2,3,4,5,6] end;
 foreach c in array counts loop
  select value into chosen from jsonb_array_elements(catalog) where jsonb_array_length(value->'items')=c order by random() limit 1;
  v_recipes=v_recipes||jsonb_build_array(chosen->'items');
  riddles=riddles||jsonb_build_array(jsonb_build_object('title',chosen->>'title','clue',chosen->>'clue'));
 end loop;
 update public.capito_junior_preview_sessions s set recipes=v_recipes,preview_version=5 where s.id=(v->>'id')::uuid;
 return v||jsonb_build_object('recipes',v_recipes,'riddles',riddles,'catalog_version',5,'wall_seconds',300);
end $$;
create or replace function public.capito_junior_preview_finish_v5(p_id uuid,p_answers jsonb) returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare s public.capito_junior_preview_sessions; raw_score int=0; perfect_count int=0; hits int; extras int; i int; n int; max_raw int=0; normalized int; elapsed numeric; answer jsonb;
begin
 select * into s from public.capito_junior_preview_sessions where id=p_id for update;
 if not found or s.preview_version<>5 then raise exception 'Invalid session'; end if;
 n=jsonb_array_length(s.recipes);
 for i in 0..n-1 loop max_raw=max_raw+jsonb_array_length(s.recipes->i)*100+200; end loop;
 if s.finished_at is null then
  elapsed=extract(epoch from clock_timestamp()-s.started_at);
  if elapsed<3 or elapsed>600 then raise exception 'Session expired or too short'; end if;
  if jsonb_typeof(p_answers) is distinct from 'array' or jsonb_array_length(p_answers)>n then raise exception 'Invalid answers'; end if;
  for i in 0..n-1 loop
   hits=0;extras=0;answer=p_answers->i;
   if jsonb_typeof(answer)='array' then
    if jsonb_array_length(answer)>6 then raise exception 'Too many ingredients'; end if;
    select count(*) into hits from (select distinct value from jsonb_array_elements(answer)) a where s.recipes->i @> jsonb_build_array(a.value);
    select count(*) into extras from (select distinct value from jsonb_array_elements(answer)) a where not (s.recipes->i @> jsonb_build_array(a.value));
    if hits=jsonb_array_length(s.recipes->i) and extras=0 and jsonb_array_length(answer)=hits then perfect_count=perfect_count+1;raw_score=raw_score+200;end if;
   end if;
   raw_score=raw_score+greatest(0,hits*100-extras*100);
  end loop;
  if elapsed>300 then raw_score=0;perfect_count=0;end if;
  update public.capito_junior_preview_sessions set score=raw_score,perfect=perfect_count,finished_at=clock_timestamp() where id=p_id;
 else raw_score=s.score;perfect_count=s.perfect;
 end if;
 normalized=round(raw_score::numeric*(case when s.age_group='4-7' then 1500 else 3500 end)/max_raw)::int;
 return jsonb_build_object('score',normalized,'perfect',perfect_count,'alias',s.alias);
end $$;
revoke all on function public.capito_junior_preview_start_v5(text),public.capito_junior_preview_finish_v5(uuid,jsonb) from public;
grant execute on function public.capito_junior_preview_start_v5(text),public.capito_junior_preview_finish_v5(uuid,jsonb) to anon,authenticated;