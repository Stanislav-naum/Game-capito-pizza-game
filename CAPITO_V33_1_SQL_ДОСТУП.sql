-- Выполните только если Зал славы по-прежнему сообщает об ошибке доступа.
-- Открывает анонимным посетителям только вызов функции публичного рейтинга.
GRANT EXECUTE ON FUNCTION public.get_pizza_all_time_leaderboard() TO anon, authenticated;
