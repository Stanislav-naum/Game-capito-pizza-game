# CAPITO Junior — guest release candidate

Branch: capito-v2-preview. Production main is unchanged.

## Included
Two age bands, 13 recipe riddles, 1–6 ingredients, free kitchen, bake/cut/serve, guest reactions, device Russian speech, pizza history, child leaderboard and achievements. Coloring: nine pages, three rotating Monday packs (Europe/Moscow), local gallery, PNG and print. Supplied CAPITO logo throughout Junior and selector.

## Final fixes (2026-11-24)
- New isolated leaderboard_v5 uses the sum of all recipe maxima, matching finish_v5; only version 5 sessions are ranked.
- Easy mode shows picture hints immediately; older children may reveal them.
- Selector hides the underlying adult interface and has an opaque fallback before CSS loads.
- Screen changes move keyboard focus to the screen heading.
- Removed old adult CUT 2.0 experimental blocks. Adult index is byte-for-byte current main except one deferred selector script.

## Validation
- SQL transactions: both ages, perfect scores 1500/3500, result/ranking equality, idempotent retry, expired score 0, anon direct table access denied. Rolled back.
- Browser: full 3-order easy attempt, bake, three cuts, guest delivery, saved 1500, matching leaderboard, achievements; older group starts 5 rounds with hidden hints. Isolated UI smoke-test score removed after validation.
- Mobile 390x844: recipe, ingredient controls and actions visible; selector cleanly opens both paths.
- Prior coloring checks retained: fill boundaries, recoloring, undo, gallery restoration, PNG export, Moscow Monday boundary and 3-pack cycle; 360px layout has no horizontal overflow.
- Database health advisory returned no findings. Junior uses intentionally public SECURITY DEFINER RPCs and an RLS table without direct anon access.

## Launch
Draft PR #1 contains this candidate. Review Preview before authorizing merge into main, because the original instruction limits work to the test branch. After approval, merge, wait for Vercel production success, and smoke-test the production menu, Junior and CUT entry without submitting adult scores or prize redemptions.

## Rollback
Revert the release merge in main to restore the prior adult site. Junior RPCs and table are isolated and can remain; do not touch adult scores, registration, Telegram or prize functions.

## Practical limits
Voice depends on available device Russian voices. Local achievements and coloring disappear if device storage is cleared. The Junior leaderboard ranks anonymous attempts and does not award real prizes. Weekly coloring rotates a prepared three-pack catalog; it does not generate unlimited new art.
