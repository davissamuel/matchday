# Matchday — Premier League Tracker Pivot (MVP)

## Overview

Matchday pivots from a 2026 FIFA World Cup bracket app to a Premier League
tracker: current league standings and match results/fixtures, aimed at
helping the user follow what's happening in the league week to week. This
supersedes `docs/superpowers/specs/2026-07-12-matchday-design.md` — the
bracket/knockout structure and Elo-based match simulation described there
no longer apply.

## Why this shape

A league is a round-robin table, not an elimination bracket — there is no
group stage, no knockout tree, no "winner of X vs runner-up of Y" slot.
Reusing the bracket domain model for a league would be a mismatch, not a
simplification, so the bracket/knockout code is removed rather than
adapted.

The World Cup build's win-probability Simulation feature (Elo ratings
computed from international match history) is out of scope for this
pivot. It doesn't fit a personal club-following tool as directly as
standings and results do, and keeping the app "pretty straightforward"
means not carrying that surface area forward speculatively. The
underlying Elo/probability code is removed, not left in as unused dead
code; it can be rebuilt later, repointed at club-level data, if a
prediction feature is wanted.

Team flags are also removed: `flagEmoji`/`FlagLabel` mapped *national
team* names to country flag emoji. Premier League teams are clubs, which
don't have a natural flag identity, so that lookup table has no
equivalent here. A plain team-name label replaces it.

## Core Features (v1)

### 1. Standings Screen (entry point)
- One ranked table for the Premier League: position, team, played, W/D/L,
  goal difference, points.
- Tapping a row opens Team Detail.

### 2. Fixtures Screen
- Two sections: recent **Results** (most recent first) and upcoming
  **Fixtures** (soonest first), each match rendered as a card (teams +
  score, or "vs" for unplayed matches).

### 3. Team Detail Screen (pushed from Standings)
- Team name, current league position, and record (W/D/L, points).
- The team's match list (past results + upcoming fixtures), reusing the
  same match card as the Fixtures screen.

### Out of Scope for v1
- Match simulation / win-probability predictions (removed, not deferred
  silently — see "Why this shape" above)
- Multiple leagues/competitions (Premier League only; the data layer is
  parameterized by competition code so adding a league later is a data
  change, not a rework)
- Push notifications, live/sub-minute scores (football-data.org free
  tier is delayed, same constraint as before)
- Team crests/badges (would need a new asset/image pipeline; plain text
  team names for v1)

## Data Source

football-data.org (same free tier as before, already covers the Premier
League): `/competitions/PL/standings` and `/competitions/PL/matches`.

The league standings response has no `group` field to key off — instead
it returns three views (`TOTAL`/`HOME`/`AWAY`) per stage; v1 uses the
`TOTAL` table only.

## Component Boundaries

- **API layer**: `footballDataClient.ts` generalized to take a
  competition code (`fetchCompetitionStandings`/`fetchCompetitionMatches`)
  instead of hardcoded World Cup endpoints.
- **Domain**: `src/domain/league.ts` (replacing `bracket.ts`) holds
  `LeagueStanding`/`LeagueMatch` types and pure normalization functions,
  unit-tested against fixture data with no React/API dependency.
- **Data loading**: `loadLeagueData.ts` + `LeagueDataContext` (replacing
  `loadBracketData.ts` + `BracketDataContext`) fetch and cache standings
  + matches for a given competition code.

## Testing Approach

Per this project's TDD mandate: failing tests are written first for the
league normalization functions and the generalized API client before
their implementations. Screens get smoke tests per the existing
convention (representative props/mock data, assert key text/testIDs).
