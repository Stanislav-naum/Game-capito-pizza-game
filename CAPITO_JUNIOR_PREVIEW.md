# CAPITO PIZZA MAKER JUNIOR
Preview only: capito-v2-preview. Never merge/deploy to production without review.

PIZZA CUT source is unchanged except a deferred game-selector script in head. Choosing CUT reloads with game=cut, which bypasses the selector. Prize/code/token/pass links bypass the selector. All existing assets and functions remain unchanged.

Junior uses only capito_junior_preview_* RPCs and its isolated RLS table. No player names, phones, registration, Telegram or prizes are used. Random server-assigned aliases; age bands only. Leaderboard: weekly Moscow Monday, top 10 per age band. Each attempt has a new alias; it is an attempts leaderboard. Achievements are per device and age band, unlocked only on confirmed server results. Clearing device storage clears achievements.

4–7: 3 recipes, 3 toppings, visible hints, 90s. 8–12: 5 recipes, 5 toppings, 5s memorization for each, 75s. Tap ingredients in order; undo; bake. Server scores each matching position 100 and each perfect pizza 200. Abandoned attempts are not ranked; elapsed/expired and repeated finish calls are handled server-side. No reward-bearing anti-cheat guarantee: anonymous preview competition has no identity/rate limit and should get server abuse protection before public prize use.

Validation: JavaScript parse; transactional PostgreSQL tests for both age bands, exact score, idempotency, expiry, invalid age, and revoked direct table privileges. Database test data rolled back.

Browser QA: completed 4–7 attempt (1500 points), confirmed Supabase save, weekly leaderboard and all three achievements. Tested 400px responsive screen and 8–12 memory phase. Kitchen layout compacted for small screens to keep toppings and controls in view.
