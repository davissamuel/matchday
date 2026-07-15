# Matchday — Frontend Redesign Design Spec

## Overview

Matchday's three screens (Bracket, Team Detail, Simulation) are currently functional but visually bare — plain `Text` lists, default colors, no type scale, no theming. This spec covers a full visual redesign of all three screens into a clean, editorial/stats-driven look (in the spirit of a premium sports-stats publication), with light and dark mode support, team flags throughout, and a bottom tab navigation shell. No backend, data, or domain logic changes — this is a presentation-layer pass on top of the existing app described in `docs/superpowers/specs/2026-07-12-matchday-design.md`.

## Visual Direction

- **Personality:** Clean editorial/stats — light background by default, refined typography, generous whitespace, calm and data-forward (not a bold broadcast-scoreboard look, not a bare iOS-system-default look).
- **Theming:** Full light + dark mode, following the system `useColorScheme()` setting. Neutral near-white/near-black base with a gray scale for secondary text and borders.
- **Accent color:** A single bold accent — crimson red — used sparingly for active states, links, qualifying-position indicators, and the "win" segment of probability bars. No secondary accent colors.
- **Typography:** System font (San Francisco on iOS) at Tailwind's standard type scale (`text-xs` through `text-3xl`), with weight (`font-semibold`/`font-bold`) doing the work of hierarchy. No custom font loading.
- **Team identity:** Flag emoji shown next to every team name across all three screens (standings rows, match cards, team pickers, Team Detail header) for scanability and visual identity.

## Tooling

- **NativeWind v4** added as a dependency, following its official Expo 54 setup (Babel/Metro config, `global.css`, `tailwind.config.js`).
- `tailwind.config.js` defines custom design tokens rather than relying on default Tailwind colors:
  - A neutral scale for backgrounds/text/borders (light + dark variants via Tailwind's `dark:` variant).
  - `accent` = crimson red.
- A small `src/theme/colors.ts` module exports the same colors as raw hex values for the handful of RN props that don't accept `className` (e.g. `ActivityIndicator`'s `color` prop).
- No other new dependencies for styling (RN Paper and Tamagui were considered and rejected — see "Alternatives Considered" in the prior brainstorming discussion; RN Paper's Material Design defaults fight the editorial look, Tamagui's compiler setup is heavier than a 3-screen app warrants).

## Navigation

- Bottom tab bar (`@react-navigation/bottom-tabs`, already a dependency) with two tabs: **Bracket** and **Simulation**.
- Each tab owns its own native-stack navigator. **Team Detail** is pushed onto the Bracket stack (the only place it's navigated to today, via tapping a standings row). The Simulation screen does not link to Team Detail.
- Tab icons via `@expo/vector-icons` (ships with Expo, no new dependency): a bracket/tree icon for Bracket, a flask/dice icon for Simulation. Active tab tinted with the crimson accent; inactive tabs neutral gray.
- Headers: minimal, left-aligned screen title, iOS-default chevron-only back button (no label), consistent across both stacks.

## Screen Designs

### Bracket Screen (tab 1, entry point)

- Each group ("Group A"..."Group L") renders as a rounded card with a subtle border. Card header shows the group name; standings rows show flag + team name + points.
- Qualifying rows (1st/2nd place) are visually distinguished from 3rd/4th via bold text and a thin accent-colored left border on the row.
- Knockout-stage sections (Round of 32 → Final) render below the groups as match cards: each shows both teams (flag + name) with a "vs" divider, the score if the match is completed, or a muted gray italic placeholder for unresolved slots (e.g. "Winner of Group A vs. Runner-up of Group B").
- Loading state: centered `ActivityIndicator` tinted with the accent color. Error state: centered message text, styled but with the same no-retry behavior as today.

### Team Detail Screen (pushed from Bracket)

- Header block: large flag emoji, team name as a large bold headline, current strength rating shown as a `StatPill` (rounded chip containing the number).
- Below the header: a list of the team's matches so far, rendered using the same `MatchCard` component as the Bracket screen's knockout section (shared, not reimplemented).

### Simulation Screen (tab 2)

- Two scrollable team-picker lists (Team A, Team B), each row showing flag + team name. The selected row in each list is highlighted with the accent color (background or text), consistent with the "selected" state used elsewhere in the app.
- Once both teams are selected, a segmented probability bar renders: one horizontal rounded bar split into three proportional colored segments (Team A win / Draw / Team B win), with percentages labeled above each segment and team names below.
- "Simulate Match" renders as a solid accent-colored pill button. Pressing it replaces any prior result with a new bold-headline result card ("Result: Brazil").

## Shared Components

New presentational components in `src/components/`, each with a narrow prop interface and no data-fetching or navigation awareness:

- **`FlagLabel`** — flag emoji + team name. Used in standings rows, match cards, and team pickers.
- **`MatchCard`** — two-teams-vs-two-teams card with score/placeholder handling. Used in both the Bracket screen's knockout section and the Team Detail screen's match list.
- **`ProbabilityBar`** — the segmented win/draw/loss bar. Used only in Simulation.
- **`StatPill`** — rounded chip for a labeled stat. Used for the team rating on Team Detail.
- **`ScreenContainer`** — `SafeAreaView` wrapper with consistent padding/background applied via NativeWind classes. Wraps every screen.

## Testing Approach

Per the project's TDD mandate:

- All existing `testID`s on interactive/data elements (`bracket-list`, `bracket-error`, `bracket-loading`, `team-rating`, `team-a-*`, `team-b-*`, `simulate-button`, `probability-display`, `simulation-result`, etc.) are preserved unchanged, so existing screen tests continue to pass without rewrites.
- Each new shared component (`FlagLabel`, `MatchCard`, `ProbabilityBar`, `StatPill`, `ScreenContainer`) gets a failing smoke/snapshot test written first — rendering with representative sample props and asserting key text/testIDs are present — before the component is implemented and wired into a screen.
- No domain/data logic changes in this pass, so no new unit tests are needed for rating, probability, or bracket-structure math — that coverage already exists and is untouched.

## Out of Scope

- Any change to data sources, API clients, caching, rating pipeline, or bracket/probability math.
- Custom font loading (system font only).
- A third accent color or broadcast/scoreboard visual style (explicitly not chosen).
- Retry affordances on error states (matches current behavior; not part of this redesign).
