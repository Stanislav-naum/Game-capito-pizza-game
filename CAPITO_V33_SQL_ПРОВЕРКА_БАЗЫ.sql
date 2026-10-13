-- Запустите в Supabase → SQL Editor и пришлите результат.
-- Этот запрос ничего не изменяет в базе данных.
SELECT table_schema, table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema='public'
  AND (table_name ILIKE '%pizza%' OR table_name ILIKE '%score%' OR table_name ILIKE '%leader%')
ORDER BY table_name, ordinal_position;

-- Также проверьте, существует ли уже функция исторического рейтинга:
SELECT routine_schema, routine_name
FROM information_schema.routines
WHERE routine_schema='public' AND routine_name ILIKE '%pizza%';
