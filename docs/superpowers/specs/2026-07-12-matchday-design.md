# Matchday — Design Spec

## Overview

Matchday is a personal iPhone app for following the 2026 FIFA World Cup: viewing the up-to-date bracket (groups + knockout rounds), drilling into teams, and running "what if" match simulations with win probabilities derived from team strength ratings.

## Architecture

- **Platform:** React Native app built with Expo, run via Expo Go on the user's iPhone. No Xcode/Mac build step, no App Store distribution required.
- **No backend.** The app calls external data APIs directly and caches responses locally on-device (AsyncStorage). This is a single-user personal app, so there is no need to host or maintain a server.

### Data Sources

1. **football-data.org** (free tier, 10 requests/minute, committed by its maintainer to stay free) — live World Cup bracket structure, group standings, fixtures, and results. Also the source for lineups/team info when those features are added later.
2. **A free international-results historical dataset/API** — used to compute Elo-style strength ratings for teams from real match history. Chosen because football-data.org's free tier only covers 12 competitions (mostly European leagues + WC/Euros) and lacks historical data for most non-European national teams.
3. **A static FIFA World Ranking snapshot**, bundled into the app at build time (captured pre-tournament) — used as the seed rating for any team the historical-results source doesn't cover.

### Rating Pipeline

On app launch/refresh:
1. For each team, attempt to compute a strength rating from historical match results (source #2).
2. If historical data isn't available for that team, fall back to a rating derived from the static FIFA ranking snapshot (source #3).
3. As real World Cup results come in via football-data.org, update the corresponding teams' ratings so probabilities stay current through the tournament.

## Core Features (v1)

### 1. Bracket View
- Models the full 2026 format: 12 groups of 4 teams → group standings, then the knockout tree (Round of 32 → Round of 16 → Quarterfinals → Semifinals → Final).
- Displays completed results, in-progress matches (data is delayed on the free tier, not sub-second live), and unresolved future slots (e.g. "Winner of Group A vs. Runner-up of Group B").
- Tapping a round shows its matches; tapping a team opens the Team Detail screen.

### 2. Team Detail Screen
- v1 shows: team name/flag, current strength rating, and the team's path through the group/knockout stage so far.
- Structured so lineups and season stats can be added as additional sections later without reworking navigation — not built in v1.

### 3. Match Simulation
- User picks any two teams — an actual upcoming bracket matchup, or any hypothetical pairing (including already-eliminated teams).
- Displays win/draw/loss probability computed from the two teams' current strength ratings.
- A "Simulate" action rolls one outcome from that probability distribution and displays a result. This is exploratory only and never affects the real bracket state.

### Out of Scope for v1
- Team lineups and season stats (planned for a future iteration; architecture should not block adding them)
- Push notifications
- Multi-user support
- Full Monte Carlo bracket-to-champion simulation (only single-matchup simulation is in scope)

## Tech Stack

- Expo (React Native + TypeScript), run via Expo Go
- React Navigation for screen flow (Bracket → Team Detail / Simulation)
- AsyncStorage for local caching of API responses and computed ratings
- Jest + React Native Testing Library for tests

## Component Boundaries

- **Rating/probability math** (Elo-style rating updates, win/draw/loss probability formula) is implemented as plain TypeScript functions with no React or API dependency, so it's fully unit-testable in isolation.
- **API layer** is a thin client module per data source (football-data.org client, historical-results client), each independently mockable in tests, decoupled from UI components.
- **Bracket structure logic** (group standings computation, knockout-round advancement) is separated from rendering so it can be tested against fixture data without a UI.

## Testing Approach

Per this project's TDD mandate: failing tests are written first for rating calculations, probability math, and bracket-structure logic (group standings, knockout advancement) before implementation code. UI components receive lighter smoke/interaction tests.
