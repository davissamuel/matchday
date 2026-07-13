# Fix 6: Stage cast validation + formatMatchLine dedup

## Fix 1: unrecognized knockout stage no longer silently dropped

### RED
Extended `renders knockout matches grouped by stage...` test in
`src/screens/__tests__/BracketScreen.test.tsx` with a third match, `stage: 'THIRD_PLACE_FINAL'`
(not one of the 5 known `STAGE_ORDER` values), asserting the raw stage string renders as a
section header and `knockout-match-3` is present.

Before the fix, the test failed:
```
Unable to find an element with text: THIRD_PLACE_FINAL
Tests: 1 failed, 3 passed, 4 total
```

### GREEN
Replaced the `STAGE_ORDER`-only filter in `src/screens/BracketScreen.tsx` with logic that derives
the actual set of knockout stages present in the data (excluding `GROUP_STAGE`), orders known
stages per `STAGE_ORDER`, and appends any unrecognized stage values at the end using the raw
string as both section key and fallback label (`STAGE_LABELS[stage] ?? stage`).

After the fix:
```
Tests: 4 passed, 4 total
```

Also changed `STAGE_ORDER` from a plain array to `as const` — required so TypeScript's narrowed
type for `knockoutStages` (after filtering out `'GROUP_STAGE'`) matches `STAGE_ORDER`'s element
type in the `.includes()` checks. No behavioral effect, needed to keep `tsc --noEmit` clean of
new errors.

## Fix 2: formatMatchLine deduplicated

Moved `formatMatchLine` into `src/domain/bracket.ts` as an exported function (pure extraction,
identical body). Removed the local duplicate definitions from `src/screens/BracketScreen.tsx`
and `src/screens/TeamDetailScreen.tsx`; both now import `formatMatchLine` from
`../domain/bracket` alongside their existing imports (`GroupStanding`/`BracketMatch`).

No new test added per instructions — behavior is exercised by existing tests in
`BracketScreen.test.tsx` and `TeamDetailScreen.test.tsx`, both of which passed unchanged after
the refactor.

## Full suite result

```
Test Suites: 17 passed, 17 total
Tests:       59 passed, 59 total
```

`npx tsc --noEmit` shows only pre-existing errors unrelated to this change (verified identical
via `git stash` against the base commit): `app.config.ts` `splash` property error, and the
`SectionList`/`GroupStanding`↔`BracketMatch` type-overlap errors in `BracketScreen.tsx` that
predate this fix.

## Files changed
- `src/domain/bracket.ts` — added exported `formatMatchLine`.
- `src/screens/BracketScreen.tsx` — derive knockout stages from data instead of a fixed
  allowlist; `STAGE_ORDER` now `as const`; removed local `formatMatchLine`, imports it from
  `../domain/bracket` instead.
- `src/screens/TeamDetailScreen.tsx` — removed local `formatMatchLine`, imports it from
  `../domain/bracket` instead.
- `src/screens/__tests__/BracketScreen.test.tsx` — added `THIRD_PLACE_FINAL` case to the
  existing knockout-grouping test.

## Self-review
- Fix 1 matches the requested behavior: no match is ever silently dropped regardless of stage
  value; known stages retain `STAGE_ORDER` ordering, unknown ones appended at the end.
- Fix 2 is a pure extraction with no behavior change, confirmed by unchanged existing tests.
- No unrelated code touched; `STAGE_ORDER`'s `as const` was the only change beyond what the
  task spec described, made to avoid introducing new `tsc` errors.
