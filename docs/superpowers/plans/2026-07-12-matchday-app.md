# Matchday App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a React Native (Expo) iPhone app that shows the live 2026 FIFA World Cup bracket, lets the user drill into a team, and lets them simulate any single matchup with a win/draw/loss probability derived from Elo-style team strength ratings.

**Architecture:** Client-only Expo app, no backend. Domain logic (Elo ratings, win/draw/loss probability, bracket normalization) is plain, dependency-free TypeScript, fully unit-tested. A thin API layer wraps football-data.org (live bracket/fixtures) and a historical international-results dataset (for computing ratings), each cached locally via AsyncStorage. A React Context loads bracket + rating data once at app start and exposes it to three screens via React Navigation: Bracket, Team Detail, and Simulation.

**Tech Stack:** Expo + React Native + TypeScript, React Navigation (bottom tabs + native stack), AsyncStorage, papaparse (CSV parsing), Jest (`jest-expo` preset) + React Native Testing Library.

## Global Constraints

- No backend — all API calls and caching happen on-device (per spec Architecture section).
- football-data.org free tier: 10 requests/minute — all football-data.org calls must go through the local cache layer, never called directly from UI code (per spec Data Sources #1).
- Historical ratings must fall back to a static FIFA-ranking-based seed when a team has no historical match data (per spec Rating Pipeline).
- TDD mandate (project CLAUDE.md): a failing test must exist before implementation code for every task below that touches domain logic, API clients, or data pipeline code.
- Simulation is single-matchup only — no full bracket-to-champion Monte Carlo simulation (per spec Out of Scope).

---

## File Structure

```
app.config.ts                         # Expo config incl. API key wiring
babel.config.js
tsconfig.json
package.json
jest.setup.js                         # AsyncStorage mock for tests
App.tsx                               # Entry point, renders RootNavigator
.env.example                          # Documents FOOTBALL_DATA_API_KEY
assets/data/fifa-ranking-seed.json    # Static fallback rating seed
src/
  config/
    env.ts                            # Reads API key from Expo config
  domain/
    types.ts                          # HistoricalMatch, TeamRating, MatchOutcome
    elo.ts                            # Elo rating math
    probability.ts                    # Win/draw/loss probability + simulateMatch
    teamNameAliases.ts                # Name normalization between data sources
    bracket.ts                        # Normalizes football-data.org JSON -> app types
    ratingPipeline.ts                 # Combines history + seed into TeamRating map
    loadBracketData.ts                # Orchestrates cached bracket fetch + normalize
    loadTeamRatings.ts                # Orchestrates cached rating computation
    __tests__/
      elo.test.ts
      probability.test.ts
      teamNameAliases.test.ts
      bracket.test.ts
      ratingPipeline.test.ts
      loadBracketData.test.ts
      loadTeamRatings.test.ts
  data/
    seedRatings.ts                    # Loads fifa-ranking-seed.json into a Map
    __tests__/
      seedRatings.test.ts
  api/
    footballDataClient.ts             # football-data.org typed fetch wrappers
    historicalResultsClient.ts        # Historical CSV fetch + parse
    cache.ts                          # Generic AsyncStorage TTL cache
    __tests__/
      footballDataClient.test.ts
      historicalResultsClient.test.ts
      cache.test.ts
  context/
    BracketDataContext.tsx            # Loads data once, provides to all screens
    __tests__/
      BracketDataContext.test.tsx
  navigation/
    RootNavigator.tsx                 # Tab + stack navigation shell
  screens/
    BracketScreen.tsx
    TeamDetailScreen.tsx
    SimulationScreen.tsx
    __tests__/
      BracketScreen.test.tsx
      TeamDetailScreen.test.tsx
      SimulationScreen.test.tsx
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `app.config.ts`, `babel.config.js`, `tsconfig.json`, `package.json`, `jest.setup.js`, `App.tsx`, `.env.example`, `.gitignore` (merged from Expo template)
- Create: `src/domain/__tests__/sanity.test.ts`

**Interfaces:** None yet — this task only establishes the toolchain.

- [ ] **Step 1: Scaffold a fresh Expo TypeScript project into a temp directory**

```bash
cd /Users/Davis/Dev/matchday
npx create-expo-app@latest scaffold-tmp --template blank-typescript
```

- [ ] **Step 2: Merge the scaffold into the repo root (excluding its own git history)**

```bash
rm -rf scaffold-tmp/.git
cp -r scaffold-tmp/. .
rm -rf scaffold-tmp
```

- [ ] **Step 3: Install additional dependencies**

```bash
npx expo install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npx expo install react-native-screens react-native-safe-area-context
npx expo install @react-native-async-storage/async-storage
npx expo install expo-constants
npm install papaparse dotenv
npm install --save-dev @types/papaparse jest-expo jest @types/jest react-test-renderer @testing-library/react-native
```

- [ ] **Step 4: Configure Jest**

Add to `package.json` (merge into the existing object, don't replace it):

```json
{
  "jest": {
    "preset": "jest-expo",
    "setupFiles": ["<rootDir>/jest.setup.js"],
    "transformIgnorePatterns": [
      "node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules-.*|sentry-expo|native-base|react-native-svg))"
    ]
  },
  "scripts": {
    "test": "jest"
  }
}
```

Create `jest.setup.js`:

```js
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
```

- [ ] **Step 5: Create the domain folder skeleton**

```bash
mkdir -p src/domain/__tests__ src/data/__tests__ src/api/__tests__ src/context/__tests__ src/navigation src/screens/__tests__ src/config assets/data
```

- [ ] **Step 6: Write a sanity test to confirm the test runner works end-to-end**

`src/domain/__tests__/sanity.test.ts`:

```ts
describe('project scaffolding', () => {
  it('runs a basic assertion', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 7: Run the test suite and confirm it passes**

Run: `npx jest src/domain/__tests__/sanity.test.ts`
Expected: `1 passed`

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: scaffold Expo TypeScript project with Jest"
```

---

### Task 2: Elo Rating Engine

**Files:**
- Create: `src/domain/types.ts`
- Create: `src/domain/elo.ts`
- Test: `src/domain/__tests__/elo.test.ts`

**Interfaces:**
- Produces: `MatchOutcome`, `HistoricalMatch`, `TeamRating` (types.ts); `DEFAULT_RATING: number`, `K_FACTOR: number`, `expectedScore(ratingA, ratingB): number`, `updateRatings(ratingA, ratingB, outcome): { ratingA, ratingB }`, `applyResults(initialRatings: Map<string, number>, matches: HistoricalMatch[], defaultRating?: number): Map<string, number>`, `computeRatingsFromHistory(matches: HistoricalMatch[], initialRating?: number): Map<string, number>` (elo.ts)

- [ ] **Step 1: Write `src/domain/types.ts`**

```ts
export type MatchOutcome = 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW';

export interface HistoricalMatch {
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
}

export interface TeamRating {
  team: string;
  rating: number;
  source: 'history' | 'seed' | 'default';
}
```

- [ ] **Step 2: Write the failing tests for the Elo engine**

`src/domain/__tests__/elo.test.ts`:

```ts
import { expectedScore, updateRatings, computeRatingsFromHistory, applyResults, DEFAULT_RATING } from '../elo';
import { HistoricalMatch } from '../types';

describe('expectedScore', () => {
  it('returns 0.5 for equal ratings', () => {
    expect(expectedScore(1500, 1500)).toBeCloseTo(0.5);
  });

  it('returns a higher score for the stronger team', () => {
    expect(expectedScore(1700, 1500)).toBeGreaterThan(0.5);
  });
});

describe('updateRatings', () => {
  it('increases the winner rating and decreases the loser rating', () => {
    const { ratingA, ratingB } = updateRatings(1500, 1500, 'HOME_TEAM');
    expect(ratingA).toBeGreaterThan(1500);
    expect(ratingB).toBeLessThan(1500);
  });

  it('leaves equal ratings unchanged on a draw', () => {
    const { ratingA, ratingB } = updateRatings(1500, 1500, 'DRAW');
    expect(ratingA).toBeCloseTo(1500);
    expect(ratingB).toBeCloseTo(1500);
  });
});

describe('computeRatingsFromHistory', () => {
  it('processes matches in chronological order and returns final ratings', () => {
    const matches: HistoricalMatch[] = [
      { date: '2020-01-01', homeTeam: 'A', awayTeam: 'B', homeScore: 2, awayScore: 0 },
      { date: '2020-02-01', homeTeam: 'B', awayTeam: 'A', homeScore: 1, awayScore: 1 },
    ];
    const ratings = computeRatingsFromHistory(matches);
    expect(ratings.get('A')).toBeGreaterThan(DEFAULT_RATING);
    expect(ratings.get('B')).toBeLessThan(DEFAULT_RATING);
  });

  it('uses the default rating for teams with no prior history', () => {
    const ratings = computeRatingsFromHistory([]);
    expect(ratings.size).toBe(0);
  });
});

describe('applyResults', () => {
  it('starts from provided initial ratings instead of the default', () => {
    const initial = new Map([['A', 1800], ['B', 1500]]);
    const matches: HistoricalMatch[] = [
      { date: '2021-01-01', homeTeam: 'A', awayTeam: 'B', homeScore: 0, awayScore: 3 },
    ];
    const updated = applyResults(initial, matches);
    expect(updated.get('A')).toBeLessThan(1800);
    expect(updated.get('B')).toBeGreaterThan(1500);
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npx jest src/domain/__tests__/elo.test.ts`
Expected: FAIL with "Cannot find module '../elo'"

- [ ] **Step 4: Implement `src/domain/elo.ts`**

```ts
import { HistoricalMatch, MatchOutcome } from './types';

export const DEFAULT_RATING = 1500;
export const K_FACTOR = 20;

export function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

export function updateRatings(
  ratingA: number,
  ratingB: number,
  outcome: MatchOutcome
): { ratingA: number; ratingB: number } {
  const scoreA = outcome === 'HOME_TEAM' ? 1 : outcome === 'AWAY_TEAM' ? 0 : 0.5;
  const scoreB = 1 - scoreA;
  const expectedA = expectedScore(ratingA, ratingB);
  const expectedB = 1 - expectedA;
  return {
    ratingA: ratingA + K_FACTOR * (scoreA - expectedA),
    ratingB: ratingB + K_FACTOR * (scoreB - expectedB),
  };
}

function outcomeFromScore(homeScore: number, awayScore: number): MatchOutcome {
  if (homeScore > awayScore) return 'HOME_TEAM';
  if (homeScore < awayScore) return 'AWAY_TEAM';
  return 'DRAW';
}

export function applyResults(
  initialRatings: Map<string, number>,
  matches: HistoricalMatch[],
  defaultRating: number = DEFAULT_RATING
): Map<string, number> {
  const ratings = new Map(initialRatings);
  const getRating = (team: string) => ratings.get(team) ?? defaultRating;
  const sorted = [...matches].sort((a, b) => a.date.localeCompare(b.date));

  for (const match of sorted) {
    const ratingA = getRating(match.homeTeam);
    const ratingB = getRating(match.awayTeam);
    const outcome = outcomeFromScore(match.homeScore, match.awayScore);
    const updated = updateRatings(ratingA, ratingB, outcome);
    ratings.set(match.homeTeam, updated.ratingA);
    ratings.set(match.awayTeam, updated.ratingB);
  }

  return ratings;
}

export function computeRatingsFromHistory(
  matches: HistoricalMatch[],
  initialRating: number = DEFAULT_RATING
): Map<string, number> {
  return applyResults(new Map(), matches, initialRating);
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx jest src/domain/__tests__/elo.test.ts`
Expected: `5 passed`

- [ ] **Step 6: Commit**

```bash
git add src/domain/types.ts src/domain/elo.ts src/domain/__tests__/elo.test.ts
git commit -m "feat: add Elo rating engine"
```

---

### Task 3: Win/Draw/Loss Probability Engine

**Files:**
- Create: `src/domain/probability.ts`
- Test: `src/domain/__tests__/probability.test.ts`

**Interfaces:**
- Consumes: `MatchOutcome` (from `./types`)
- Produces: `MatchProbability { winProbability, drawProbability, lossProbability }`, `DRAW_MARGIN: number`, `matchProbability(ratingA, ratingB): MatchProbability`, `simulateMatch(ratingA, ratingB, rng?: () => number): MatchOutcome`

- [ ] **Step 1: Write the failing tests**

`src/domain/__tests__/probability.test.ts`:

```ts
import { matchProbability, simulateMatch } from '../probability';

describe('matchProbability', () => {
  it('gives equal win/loss probability for equal ratings', () => {
    const { winProbability, lossProbability } = matchProbability(1500, 1500);
    expect(winProbability).toBeCloseTo(lossProbability);
  });

  it('gives a non-zero draw probability for equal ratings', () => {
    const { drawProbability } = matchProbability(1500, 1500);
    expect(drawProbability).toBeGreaterThan(0);
  });

  it('sums win + draw + loss to 1', () => {
    const { winProbability, drawProbability, lossProbability } = matchProbability(1650, 1420);
    expect(winProbability + drawProbability + lossProbability).toBeCloseTo(1);
  });

  it('favors the higher-rated team', () => {
    const { winProbability, lossProbability } = matchProbability(1800, 1400);
    expect(winProbability).toBeGreaterThan(lossProbability);
  });
});

describe('simulateMatch', () => {
  it('returns HOME_TEAM when the rng roll is below the win threshold', () => {
    expect(simulateMatch(1800, 1400, () => 0)).toBe('HOME_TEAM');
  });

  it('returns AWAY_TEAM when the rng roll is at the top of the range', () => {
    expect(simulateMatch(1800, 1400, () => 0.999)).toBe('AWAY_TEAM');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest src/domain/__tests__/probability.test.ts`
Expected: FAIL with "Cannot find module '../probability'"

- [ ] **Step 3: Implement `src/domain/probability.ts`**

```ts
import { MatchOutcome } from './types';

export interface MatchProbability {
  winProbability: number;
  drawProbability: number;
  lossProbability: number;
}

export const DRAW_MARGIN = 100;

export function matchProbability(ratingA: number, ratingB: number): MatchProbability {
  const dr = ratingA - ratingB;
  const winProbability = 1 / (1 + Math.pow(10, -(dr - DRAW_MARGIN) / 400));
  const lossProbability = 1 / (1 + Math.pow(10, (dr + DRAW_MARGIN) / 400));
  const drawProbability = Math.max(0, 1 - winProbability - lossProbability);
  return { winProbability, drawProbability, lossProbability };
}

export function simulateMatch(
  ratingA: number,
  ratingB: number,
  rng: () => number = Math.random
): MatchOutcome {
  const { winProbability, drawProbability } = matchProbability(ratingA, ratingB);
  const roll = rng();
  if (roll < winProbability) return 'HOME_TEAM';
  if (roll < winProbability + drawProbability) return 'DRAW';
  return 'AWAY_TEAM';
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest src/domain/__tests__/probability.test.ts`
Expected: `6 passed`

- [ ] **Step 5: Commit**

```bash
git add src/domain/probability.ts src/domain/__tests__/probability.test.ts
git commit -m "feat: add win/draw/loss probability engine"
```

---

### Task 4: Team Name Aliases

**Files:**
- Create: `src/domain/teamNameAliases.ts`
- Test: `src/domain/__tests__/teamNameAliases.test.ts`

**Interfaces:**
- Produces: `TEAM_NAME_ALIASES: Record<string, string>`, `normalizeTeamName(name: string): string`

- [ ] **Step 1: Write the failing tests**

`src/domain/__tests__/teamNameAliases.test.ts`:

```ts
import { normalizeTeamName } from '../teamNameAliases';

describe('normalizeTeamName', () => {
  it('maps a known alias to the canonical name', () => {
    expect(normalizeTeamName('Korea Republic')).toBe('South Korea');
  });

  it('maps USA to United States', () => {
    expect(normalizeTeamName('USA')).toBe('United States');
  });

  it('returns the input unchanged when there is no known alias', () => {
    expect(normalizeTeamName('Argentina')).toBe('Argentina');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest src/domain/__tests__/teamNameAliases.test.ts`
Expected: FAIL with "Cannot find module '../teamNameAliases'"

- [ ] **Step 3: Implement `src/domain/teamNameAliases.ts`**

```ts
export const TEAM_NAME_ALIASES: Record<string, string> = {
  'Korea Republic': 'South Korea',
  'IR Iran': 'Iran',
  USA: 'United States',
  'Côte d’Ivoire': 'Ivory Coast',
  'Congo DR': 'DR Congo',
  Czechia: 'Czech Republic',
  'Cabo Verde': 'Cape Verde',
  'Korea DPR': 'North Korea',
  'United Arab Emirates': 'UAE',
};

export function normalizeTeamName(name: string): string {
  return TEAM_NAME_ALIASES[name] ?? name;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest src/domain/__tests__/teamNameAliases.test.ts`
Expected: `3 passed`

- [ ] **Step 5: Commit**

```bash
git add src/domain/teamNameAliases.ts src/domain/__tests__/teamNameAliases.test.ts
git commit -m "feat: add team name alias normalization"
```

---

### Task 5: Historical Results Client

**Files:**
- Create: `src/api/historicalResultsClient.ts`
- Test: `src/api/__tests__/historicalResultsClient.test.ts`

**Interfaces:**
- Consumes: `HistoricalMatch` (from `../domain/types`)
- Produces: `fetchHistoricalMatches(sinceYear: number, fetchFn?: (url: string) => Promise<{ text: () => Promise<string> }>, csvUrl?: string): Promise<HistoricalMatch[]>`

- [ ] **Step 1: Write the failing tests**

`src/api/__tests__/historicalResultsClient.test.ts`:

```ts
import { fetchHistoricalMatches } from '../historicalResultsClient';

const FIXTURE_CSV = `date,home_team,away_team,home_score,away_score,tournament,city,country,neutral
1990-06-08,Argentina,Cameroon,0,1,FIFA World Cup,Milan,Italy,TRUE
2018-06-16,Argentina,Iceland,1,1,FIFA World Cup,Moscow,Russia,TRUE
2022-11-22,Argentina,Saudi Arabia,1,2,FIFA World Cup,Lusail,Qatar,TRUE
`;

function fakeFetch(): Promise<{ text: () => Promise<string> }> {
  return Promise.resolve({ text: () => Promise.resolve(FIXTURE_CSV) });
}

describe('fetchHistoricalMatches', () => {
  it('parses CSV rows into HistoricalMatch objects', async () => {
    const matches = await fetchHistoricalMatches(1900, fakeFetch);
    expect(matches).toHaveLength(3);
    expect(matches[0]).toEqual({
      date: '1990-06-08',
      homeTeam: 'Argentina',
      awayTeam: 'Cameroon',
      homeScore: 0,
      awayScore: 1,
    });
  });

  it('filters out matches before the given year', async () => {
    const matches = await fetchHistoricalMatches(2020, fakeFetch);
    expect(matches).toHaveLength(1);
    expect(matches[0].date).toBe('2022-11-22');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest src/api/__tests__/historicalResultsClient.test.ts`
Expected: FAIL with "Cannot find module '../historicalResultsClient'"

- [ ] **Step 3: Implement `src/api/historicalResultsClient.ts`**

```ts
import Papa from 'papaparse';
import { HistoricalMatch } from '../domain/types';

export type CsvFetchFn = (url: string) => Promise<{ text: () => Promise<string> }>;

const DEFAULT_CSV_URL =
  'https://raw.githubusercontent.com/martj42/international_results/master/results.csv';

export async function fetchHistoricalMatches(
  sinceYear: number,
  fetchFn: CsvFetchFn = fetch as unknown as CsvFetchFn,
  csvUrl: string = DEFAULT_CSV_URL
): Promise<HistoricalMatch[]> {
  const response = await fetchFn(csvUrl);
  const csvText = await response.text();
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const matches: HistoricalMatch[] = [];
  for (const row of parsed.data) {
    const year = Number(row.date?.slice(0, 4));
    const homeScore = Number(row.home_score);
    const awayScore = Number(row.away_score);
    if (!year || year < sinceYear || Number.isNaN(homeScore) || Number.isNaN(awayScore)) {
      continue;
    }
    matches.push({
      date: row.date,
      homeTeam: row.home_team,
      awayTeam: row.away_team,
      homeScore,
      awayScore,
    });
  }
  return matches;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest src/api/__tests__/historicalResultsClient.test.ts`
Expected: `2 passed`

- [ ] **Step 5: Commit**

```bash
git add src/api/historicalResultsClient.ts src/api/__tests__/historicalResultsClient.test.ts
git commit -m "feat: add historical international results client"
```

---

### Task 6: FIFA Ranking Seed Data

**Files:**
- Create: `assets/data/fifa-ranking-seed.json`
- Create: `src/data/seedRatings.ts`
- Test: `src/data/__tests__/seedRatings.test.ts`

**Interfaces:**
- Produces: `loadSeedRatings(): Map<string, number>`

- [ ] **Step 1: Create the seed data file**

`assets/data/fifa-ranking-seed.json` — approximate rating points as a fallback only, used when a team has no historical match data available from Task 5's data source. Extend this file over time as needed:

```json
{
  "Argentina": 2100,
  "France": 2050,
  "Brazil": 2040,
  "England": 2010,
  "Belgium": 1980,
  "Netherlands": 1970,
  "Portugal": 1970,
  "Spain": 1990,
  "Germany": 1960,
  "Italy": 1930,
  "Croatia": 1920,
  "Uruguay": 1900,
  "Colombia": 1890,
  "Morocco": 1880,
  "Japan": 1850,
  "South Korea": 1830,
  "Switzerland": 1870,
  "Denmark": 1870,
  "Senegal": 1840,
  "Ecuador": 1830,
  "Iran": 1810,
  "Australia": 1770,
  "United States": 1800,
  "Mexico": 1790,
  "Canada": 1780,
  "Ghana": 1740,
  "Nigeria": 1760,
  "Cameroon": 1740,
  "Tunisia": 1750,
  "Egypt": 1750,
  "Algeria": 1760,
  "Saudi Arabia": 1720,
  "Qatar": 1650,
  "Poland": 1800,
  "Serbia": 1830,
  "Austria": 1810,
  "Ukraine": 1790,
  "Wales": 1720,
  "Scotland": 1730,
  "Turkey": 1770,
  "Norway": 1780,
  "Sweden": 1750,
  "Czech Republic": 1750,
  "Greece": 1690,
  "Hungary": 1700,
  "Ivory Coast": 1780,
  "Mali": 1700,
  "DR Congo": 1650,
  "Panama": 1650,
  "Costa Rica": 1680,
  "Jamaica": 1620,
  "Paraguay": 1700,
  "Peru": 1680,
  "Venezuela": 1670,
  "Bolivia": 1550,
  "New Zealand": 1600,
  "Jordan": 1620,
  "Iraq": 1630,
  "UAE": 1600,
  "Uzbekistan": 1650,
  "Cape Verde": 1650
}
```

- [ ] **Step 2: Write the failing test**

`src/data/__tests__/seedRatings.test.ts`:

```ts
import { loadSeedRatings } from '../seedRatings';

describe('loadSeedRatings', () => {
  it('loads seed data into a Map keyed by team name', () => {
    const ratings = loadSeedRatings();
    expect(ratings.get('Argentina')).toBe(2100);
  });

  it('returns undefined for teams not present in the seed file', () => {
    const ratings = loadSeedRatings();
    expect(ratings.get('Atlantis')).toBeUndefined();
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx jest src/data/__tests__/seedRatings.test.ts`
Expected: FAIL with "Cannot find module '../seedRatings'"

- [ ] **Step 4: Implement `src/data/seedRatings.ts`**

```ts
import seedData from '../../assets/data/fifa-ranking-seed.json';

export function loadSeedRatings(): Map<string, number> {
  return new Map(Object.entries(seedData as Record<string, number>));
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx jest src/data/__tests__/seedRatings.test.ts`
Expected: `2 passed`

- [ ] **Step 6: Commit**

```bash
git add assets/data/fifa-ranking-seed.json src/data/seedRatings.ts src/data/__tests__/seedRatings.test.ts
git commit -m "feat: add static FIFA ranking seed data and loader"
```

---

### Task 7: Rating Pipeline

**Files:**
- Create: `src/domain/ratingPipeline.ts`
- Test: `src/domain/__tests__/ratingPipeline.test.ts`

**Interfaces:**
- Consumes: `HistoricalMatch`, `TeamRating` (from `./types`), `applyResults`, `DEFAULT_RATING` (from `./elo`)
- Produces: `buildTeamRatings(teams: string[], historicalMatches: HistoricalMatch[], seedRatings: Map<string, number>, defaultRating?: number): Map<string, TeamRating>`

- [ ] **Step 1: Write the failing tests**

`src/domain/__tests__/ratingPipeline.test.ts`:

```ts
import { buildTeamRatings } from '../ratingPipeline';
import { HistoricalMatch } from '../types';
import { DEFAULT_RATING } from '../elo';

describe('buildTeamRatings', () => {
  it('marks a team as source "history" when it appears in historical matches', () => {
    const matches: HistoricalMatch[] = [
      { date: '2023-01-01', homeTeam: 'Argentina', awayTeam: 'Brazil', homeScore: 1, awayScore: 0 },
    ];
    const result = buildTeamRatings(['Argentina', 'Brazil'], matches, new Map());
    expect(result.get('Argentina')?.source).toBe('history');
    expect(result.get('Argentina')?.rating).toBeGreaterThan(DEFAULT_RATING);
  });

  it('falls back to the seed rating when a team has no history', () => {
    const result = buildTeamRatings(['Qatar'], [], new Map([['Qatar', 1650]]));
    expect(result.get('Qatar')).toEqual({ team: 'Qatar', rating: 1650, source: 'seed' });
  });

  it('falls back to the default rating when a team has neither history nor a seed', () => {
    const result = buildTeamRatings(['NewTeam'], [], new Map());
    expect(result.get('NewTeam')).toEqual({ team: 'NewTeam', rating: DEFAULT_RATING, source: 'default' });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest src/domain/__tests__/ratingPipeline.test.ts`
Expected: FAIL with "Cannot find module '../ratingPipeline'"

- [ ] **Step 3: Implement `src/domain/ratingPipeline.ts`**

```ts
import { HistoricalMatch, TeamRating } from './types';
import { applyResults, DEFAULT_RATING } from './elo';

export function buildTeamRatings(
  teams: string[],
  historicalMatches: HistoricalMatch[],
  seedRatings: Map<string, number>,
  defaultRating: number = DEFAULT_RATING
): Map<string, TeamRating> {
  const teamsWithHistory = new Set<string>();
  for (const match of historicalMatches) {
    teamsWithHistory.add(match.homeTeam);
    teamsWithHistory.add(match.awayTeam);
  }

  const initial = new Map<string, number>();
  for (const team of teams) {
    if (teamsWithHistory.has(team)) continue;
    initial.set(team, seedRatings.get(team) ?? defaultRating);
  }

  const computed = applyResults(initial, historicalMatches, defaultRating);

  const result = new Map<string, TeamRating>();
  for (const team of teams) {
    const rating = computed.get(team) ?? seedRatings.get(team) ?? defaultRating;
    const source: TeamRating['source'] = teamsWithHistory.has(team)
      ? 'history'
      : seedRatings.has(team)
        ? 'seed'
        : 'default';
    result.set(team, { team, rating, source });
  }
  return result;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest src/domain/__tests__/ratingPipeline.test.ts`
Expected: `3 passed`

- [ ] **Step 5: Commit**

```bash
git add src/domain/ratingPipeline.ts src/domain/__tests__/ratingPipeline.test.ts
git commit -m "feat: add rating pipeline combining history, seed, and default fallback"
```

---

### Task 8: Football-data.org API Client

**Files:**
- Create: `src/api/footballDataClient.ts`
- Test: `src/api/__tests__/footballDataClient.test.ts`

**Interfaces:**
- Produces: `FootballDataTeamRef`, `FootballDataMatch`, `FootballDataMatchesResponse`, `FootballDataStandingTableRow`, `FootballDataStandingsGroup`, `FootballDataStandingsResponse`, `FootballDataClientConfig { apiKey: string; fetchFn?: typeof fetch; baseUrl?: string }`, `fetchWorldCupMatches(config): Promise<FootballDataMatchesResponse>`, `fetchWorldCupStandings(config): Promise<FootballDataStandingsResponse>`

- [ ] **Step 1: Write the failing tests**

`src/api/__tests__/footballDataClient.test.ts`:

```ts
import { fetchWorldCupMatches, fetchWorldCupStandings } from '../footballDataClient';

function fakeOkResponse(body: unknown) {
  return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) } as Response);
}

describe('fetchWorldCupMatches', () => {
  it('requests the WC matches endpoint with the auth header', async () => {
    const fetchFn = jest.fn(() => fakeOkResponse({ matches: [] }));
    await fetchWorldCupMatches({ apiKey: 'test-key', fetchFn: fetchFn as unknown as typeof fetch });
    expect(fetchFn).toHaveBeenCalledWith(
      'https://api.football-data.org/v4/competitions/WC/matches',
      { headers: { 'X-Auth-Token': 'test-key' } }
    );
  });

  it('throws when the response is not ok', async () => {
    const fetchFn = jest.fn(() =>
      Promise.resolve({ ok: false, status: 429 } as Response)
    );
    await expect(
      fetchWorldCupMatches({ apiKey: 'test-key', fetchFn: fetchFn as unknown as typeof fetch })
    ).rejects.toThrow('429');
  });
});

describe('fetchWorldCupStandings', () => {
  it('requests the WC standings endpoint', async () => {
    const fetchFn = jest.fn(() => fakeOkResponse({ standings: [] }));
    const result = await fetchWorldCupStandings({
      apiKey: 'test-key',
      fetchFn: fetchFn as unknown as typeof fetch,
    });
    expect(fetchFn).toHaveBeenCalledWith(
      'https://api.football-data.org/v4/competitions/WC/standings',
      { headers: { 'X-Auth-Token': 'test-key' } }
    );
    expect(result).toEqual({ standings: [] });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest src/api/__tests__/footballDataClient.test.ts`
Expected: FAIL with "Cannot find module '../footballDataClient'"

- [ ] **Step 3: Implement `src/api/footballDataClient.ts`**

```ts
export interface FootballDataTeamRef {
  id: number | null;
  name: string | null;
}

export interface FootballDataMatch {
  id: number;
  utcDate: string;
  status: string;
  stage: string;
  homeTeam: FootballDataTeamRef;
  awayTeam: FootballDataTeamRef;
  score: {
    fullTime: { home: number | null; away: number | null };
  };
}

export interface FootballDataMatchesResponse {
  matches: FootballDataMatch[];
}

export interface FootballDataStandingTableRow {
  position: number;
  team: { id: number; name: string };
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
}

export interface FootballDataStandingsGroup {
  group: string | null;
  table: FootballDataStandingTableRow[];
}

export interface FootballDataStandingsResponse {
  standings: FootballDataStandingsGroup[];
}

export interface FootballDataClientConfig {
  apiKey: string;
  fetchFn?: typeof fetch;
  baseUrl?: string;
}

const DEFAULT_BASE_URL = 'https://api.football-data.org/v4';

async function get<T>(path: string, config: FootballDataClientConfig): Promise<T> {
  const fetchFn = config.fetchFn ?? fetch;
  const baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
  const response = await fetchFn(`${baseUrl}${path}`, {
    headers: { 'X-Auth-Token': config.apiKey },
  });
  if (!response.ok) {
    throw new Error(`football-data.org request to ${path} failed: ${response.status}`);
  }
  return response.json();
}

export function fetchWorldCupMatches(
  config: FootballDataClientConfig
): Promise<FootballDataMatchesResponse> {
  return get<FootballDataMatchesResponse>('/competitions/WC/matches', config);
}

export function fetchWorldCupStandings(
  config: FootballDataClientConfig
): Promise<FootballDataStandingsResponse> {
  return get<FootballDataStandingsResponse>('/competitions/WC/standings', config);
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest src/api/__tests__/footballDataClient.test.ts`
Expected: `3 passed`

- [ ] **Step 5: Commit**

```bash
git add src/api/footballDataClient.ts src/api/__tests__/footballDataClient.test.ts
git commit -m "feat: add football-data.org API client"
```

---

### Task 9: Bracket Normalization

**Files:**
- Create: `src/domain/bracket.ts`
- Test: `src/domain/__tests__/bracket.test.ts`

**Interfaces:**
- Consumes: `FootballDataMatchesResponse`, `FootballDataStandingsResponse` (from `../api/footballDataClient`), `normalizeTeamName` (from `./teamNameAliases`)
- Produces: `Stage`, `GroupStanding`, `BracketMatch`, `normalizeStandings(raw): GroupStanding[]`, `normalizeMatches(raw): BracketMatch[]`

- [ ] **Step 1: Write the failing tests**

`src/domain/__tests__/bracket.test.ts`:

```ts
import { normalizeStandings, normalizeMatches } from '../bracket';
import { FootballDataStandingsResponse, FootballDataMatchesResponse } from '../../api/footballDataClient';

describe('normalizeStandings', () => {
  it('flattens groups into GroupStanding rows and normalizes team names', () => {
    const raw: FootballDataStandingsResponse = {
      standings: [
        {
          group: 'GROUP_A',
          table: [
            {
              position: 1,
              team: { id: 1, name: 'Korea Republic' },
              playedGames: 3,
              won: 2,
              draw: 1,
              lost: 0,
              points: 7,
              goalsFor: 5,
              goalsAgainst: 1,
            },
          ],
        },
        { group: null, table: [] },
      ],
    };
    const result = normalizeStandings(raw);
    expect(result).toEqual([
      {
        groupName: 'GROUP_A',
        team: 'South Korea',
        played: 3,
        won: 2,
        draw: 1,
        lost: 0,
        goalsFor: 5,
        goalsAgainst: 1,
        points: 7,
      },
    ]);
  });
});

describe('normalizeMatches', () => {
  it('maps a finished match with both teams known', () => {
    const raw: FootballDataMatchesResponse = {
      matches: [
        {
          id: 1,
          utcDate: '2026-06-15T18:00:00Z',
          status: 'FINISHED',
          stage: 'GROUP_STAGE',
          homeTeam: { id: 1, name: 'USA' },
          awayTeam: { id: 2, name: 'Wales' },
          score: { fullTime: { home: 2, away: 1 } },
        },
      ],
    };
    const result = normalizeMatches(raw);
    expect(result).toEqual([
      {
        id: 1,
        stage: 'GROUP_STAGE',
        utcDate: '2026-06-15T18:00:00Z',
        homeTeam: 'United States',
        awayTeam: 'Wales',
        homeScore: 2,
        awayScore: 1,
        status: 'FINISHED',
      },
    ]);
  });

  it('maps an undetermined knockout slot to "TBD"', () => {
    const raw: FootballDataMatchesResponse = {
      matches: [
        {
          id: 2,
          utcDate: '2026-07-01T18:00:00Z',
          status: 'SCHEDULED',
          stage: 'LAST_16',
          homeTeam: { id: null, name: null },
          awayTeam: { id: null, name: null },
          score: { fullTime: { home: null, away: null } },
        },
      ],
    };
    const result = normalizeMatches(raw);
    expect(result[0].homeTeam).toBe('TBD');
    expect(result[0].awayTeam).toBe('TBD');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest src/domain/__tests__/bracket.test.ts`
Expected: FAIL with "Cannot find module '../bracket'"

- [ ] **Step 3: Implement `src/domain/bracket.ts`**

```ts
import { FootballDataMatchesResponse, FootballDataStandingsResponse } from '../api/footballDataClient';
import { normalizeTeamName } from './teamNameAliases';

export type Stage =
  | 'GROUP_STAGE'
  | 'LAST_32'
  | 'LAST_16'
  | 'QUARTER_FINALS'
  | 'SEMI_FINALS'
  | 'FINAL';

export interface GroupStanding {
  groupName: string;
  team: string;
  played: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

export interface BracketMatch {
  id: number;
  stage: Stage;
  utcDate: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
}

export function normalizeStandings(raw: FootballDataStandingsResponse): GroupStanding[] {
  const result: GroupStanding[] = [];
  for (const group of raw.standings) {
    if (!group.group) continue;
    for (const row of group.table) {
      result.push({
        groupName: group.group,
        team: normalizeTeamName(row.team.name),
        played: row.playedGames,
        won: row.won,
        draw: row.draw,
        lost: row.lost,
        goalsFor: row.goalsFor,
        goalsAgainst: row.goalsAgainst,
        points: row.points,
      });
    }
  }
  return result;
}

export function normalizeMatches(raw: FootballDataMatchesResponse): BracketMatch[] {
  return raw.matches.map((match) => ({
    id: match.id,
    stage: match.stage as Stage,
    utcDate: match.utcDate,
    homeTeam: match.homeTeam.name ? normalizeTeamName(match.homeTeam.name) : 'TBD',
    awayTeam: match.awayTeam.name ? normalizeTeamName(match.awayTeam.name) : 'TBD',
    homeScore: match.score.fullTime.home,
    awayScore: match.score.fullTime.away,
    status: match.status,
  }));
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest src/domain/__tests__/bracket.test.ts`
Expected: `2 passed`

- [ ] **Step 5: Commit**

```bash
git add src/domain/bracket.ts src/domain/__tests__/bracket.test.ts
git commit -m "feat: add bracket normalization from football-data.org responses"
```

---

### Task 10: Local Cache Wrapper

**Files:**
- Create: `src/api/cache.ts`
- Test: `src/api/__tests__/cache.test.ts`

**Interfaces:**
- Produces: `getCached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>, storage?: { getItem, setItem }): Promise<T>`

- [ ] **Step 1: Write the failing tests**

`src/api/__tests__/cache.test.ts`:

```ts
import { getCached } from '../cache';

function fakeStorage() {
  const store = new Map<string, string>();
  return {
    getItem: jest.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
    setItem: jest.fn((key: string, value: string) => {
      store.set(key, value);
      return Promise.resolve();
    }),
  };
}

describe('getCached', () => {
  it('calls the fetcher and caches the result on a cache miss', async () => {
    const storage = fakeStorage();
    const fetcher = jest.fn(() => Promise.resolve({ value: 42 }));
    const result = await getCached('key', 60000, fetcher, storage);
    expect(result).toEqual({ value: 42 });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(storage.setItem).toHaveBeenCalledTimes(1);
  });

  it('returns the cached value without calling the fetcher when still fresh', async () => {
    const storage = fakeStorage();
    const fetcher = jest.fn(() => Promise.resolve({ value: 1 }));
    await getCached('key', 60000, fetcher, storage);
    const result = await getCached('key', 60000, fetcher, storage);
    expect(result).toEqual({ value: 1 });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('refetches when the cached value has expired', async () => {
    const storage = fakeStorage();
    let call = 0;
    const fetcher = jest.fn(() => Promise.resolve({ value: ++call }));
    await getCached('key', 0, fetcher, storage);
    const result = await getCached('key', 0, fetcher, storage);
    expect(result).toEqual({ value: 2 });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest src/api/__tests__/cache.test.ts`
Expected: FAIL with "Cannot find module '../cache'"

- [ ] **Step 3: Implement `src/api/cache.ts`**

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheEnvelope<T> {
  timestamp: number;
  data: T;
}

type Storage = Pick<typeof AsyncStorage, 'getItem' | 'setItem'>;

export async function getCached<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
  storage: Storage = AsyncStorage
): Promise<T> {
  const raw = await storage.getItem(key);
  if (raw) {
    const parsed: CacheEnvelope<T> = JSON.parse(raw);
    if (Date.now() - parsed.timestamp < ttlMs) {
      return parsed.data;
    }
  }
  const data = await fetcher();
  await storage.setItem(key, JSON.stringify({ timestamp: Date.now(), data }));
  return data;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest src/api/__tests__/cache.test.ts`
Expected: `3 passed`

- [ ] **Step 5: Commit**

```bash
git add src/api/cache.ts src/api/__tests__/cache.test.ts
git commit -m "feat: add generic AsyncStorage TTL cache"
```

---

### Task 11: Bracket + Rating Data Orchestration

**Files:**
- Create: `src/domain/loadBracketData.ts`
- Create: `src/domain/loadTeamRatings.ts`
- Test: `src/domain/__tests__/loadBracketData.test.ts`
- Test: `src/domain/__tests__/loadTeamRatings.test.ts`

**Interfaces:**
- Consumes: `getCached` (`../api/cache`), `fetchWorldCupMatches`, `fetchWorldCupStandings`, `FootballDataClientConfig` (`../api/footballDataClient`), `normalizeMatches`, `normalizeStandings`, `BracketMatch`, `GroupStanding` (`./bracket`), `fetchHistoricalMatches` (`../api/historicalResultsClient`), `loadSeedRatings` (`../data/seedRatings`), `buildTeamRatings` (`./ratingPipeline`), `applyResults` (`./elo`), `TeamRating`, `HistoricalMatch` (`./types`)
- Produces: `BracketData { groups: GroupStanding[]; matches: BracketMatch[] }`, `loadBracketData(config: FootballDataClientConfig): Promise<BracketData>`, `loadTeamRatings(teams: string[], finishedWorldCupMatches?: BracketMatch[]): Promise<Map<string, TeamRating>>`

- [ ] **Step 1: Write the failing test for `loadBracketData`**

`src/domain/__tests__/loadBracketData.test.ts`:

```ts
jest.mock('../../api/footballDataClient');
jest.mock('../../api/cache', () => ({
  getCached: (_key: string, _ttl: number, fetcher: () => Promise<unknown>) => fetcher(),
}));

import { loadBracketData } from '../loadBracketData';
import { fetchWorldCupMatches, fetchWorldCupStandings } from '../../api/footballDataClient';

describe('loadBracketData', () => {
  it('fetches, caches, and normalizes standings and matches', async () => {
    (fetchWorldCupStandings as jest.Mock).mockResolvedValue({
      standings: [
        {
          group: 'GROUP_A',
          table: [
            {
              position: 1,
              team: { id: 1, name: 'Argentina' },
              playedGames: 1,
              won: 1,
              draw: 0,
              lost: 0,
              points: 3,
              goalsFor: 2,
              goalsAgainst: 0,
            },
          ],
        },
      ],
    });
    (fetchWorldCupMatches as jest.Mock).mockResolvedValue({ matches: [] });

    const data = await loadBracketData({ apiKey: 'test-key' });

    expect(data.groups).toEqual([
      {
        groupName: 'GROUP_A',
        team: 'Argentina',
        played: 1,
        won: 1,
        draw: 0,
        lost: 0,
        goalsFor: 2,
        goalsAgainst: 0,
        points: 3,
      },
    ]);
    expect(data.matches).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/domain/__tests__/loadBracketData.test.ts`
Expected: FAIL with "Cannot find module '../loadBracketData'"

- [ ] **Step 3: Implement `src/domain/loadBracketData.ts`**

```ts
import { getCached } from '../api/cache';
import {
  fetchWorldCupMatches,
  fetchWorldCupStandings,
  FootballDataClientConfig,
} from '../api/footballDataClient';
import { normalizeMatches, normalizeStandings, BracketMatch, GroupStanding } from './bracket';

export interface BracketData {
  groups: GroupStanding[];
  matches: BracketMatch[];
}

const TTL_MS = 5 * 60 * 1000;

export async function loadBracketData(config: FootballDataClientConfig): Promise<BracketData> {
  const [standingsRaw, matchesRaw] = await Promise.all([
    getCached('wc-standings', TTL_MS, () => fetchWorldCupStandings(config)),
    getCached('wc-matches', TTL_MS, () => fetchWorldCupMatches(config)),
  ]);
  return {
    groups: normalizeStandings(standingsRaw),
    matches: normalizeMatches(matchesRaw),
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest src/domain/__tests__/loadBracketData.test.ts`
Expected: `1 passed`

- [ ] **Step 5: Write the failing test for `loadTeamRatings`**

`src/domain/__tests__/loadTeamRatings.test.ts`:

```ts
jest.mock('../../api/historicalResultsClient');
jest.mock('../../data/seedRatings');
jest.mock('../../api/cache', () => ({
  getCached: (_key: string, _ttl: number, fetcher: () => Promise<unknown>) => fetcher(),
}));

import { loadTeamRatings } from '../loadTeamRatings';
import { fetchHistoricalMatches } from '../../api/historicalResultsClient';
import { loadSeedRatings } from '../../data/seedRatings';
import { BracketMatch } from '../bracket';

describe('loadTeamRatings', () => {
  it('builds base ratings from history and seed, then applies finished World Cup results', async () => {
    (fetchHistoricalMatches as jest.Mock).mockResolvedValue([]);
    (loadSeedRatings as jest.Mock).mockReturnValue(new Map([['Argentina', 1800], ['Brazil', 1800]]));

    const finished: BracketMatch[] = [
      {
        id: 1,
        stage: 'GROUP_STAGE',
        utcDate: '2026-06-15T18:00:00Z',
        homeTeam: 'Argentina',
        awayTeam: 'Brazil',
        homeScore: 2,
        awayScore: 0,
        status: 'FINISHED',
      },
    ];

    const ratings = await loadTeamRatings(['Argentina', 'Brazil'], finished);

    expect(ratings.get('Argentina')!.rating).toBeGreaterThan(1800);
    expect(ratings.get('Brazil')!.rating).toBeLessThan(1800);
  });

  it('ignores unfinished or undetermined matches when updating ratings', async () => {
    (fetchHistoricalMatches as jest.Mock).mockResolvedValue([]);
    (loadSeedRatings as jest.Mock).mockReturnValue(new Map([['Argentina', 1800]]));

    const unfinished: BracketMatch[] = [
      {
        id: 2,
        stage: 'LAST_16',
        utcDate: '2026-07-01T18:00:00Z',
        homeTeam: 'TBD',
        awayTeam: 'TBD',
        homeScore: null,
        awayScore: null,
        status: 'SCHEDULED',
      },
    ];

    const ratings = await loadTeamRatings(['Argentina'], unfinished);
    expect(ratings.get('Argentina')!.rating).toBe(1800);
  });
});
```

- [ ] **Step 6: Run the test to verify it fails**

Run: `npx jest src/domain/__tests__/loadTeamRatings.test.ts`
Expected: FAIL with "Cannot find module '../loadTeamRatings'"

- [ ] **Step 7: Implement `src/domain/loadTeamRatings.ts`**

```ts
import { getCached } from '../api/cache';
import { fetchHistoricalMatches } from '../api/historicalResultsClient';
import { loadSeedRatings } from '../data/seedRatings';
import { buildTeamRatings } from './ratingPipeline';
import { applyResults } from './elo';
import { TeamRating, HistoricalMatch } from './types';
import { BracketMatch } from './bracket';

const TTL_MS = 24 * 60 * 60 * 1000;
const HISTORY_SINCE_YEAR = 2014;

function toHistoricalMatches(matches: BracketMatch[]): HistoricalMatch[] {
  return matches
    .filter(
      (m) =>
        m.status === 'FINISHED' &&
        m.homeScore !== null &&
        m.awayScore !== null &&
        m.homeTeam !== 'TBD' &&
        m.awayTeam !== 'TBD'
    )
    .map((m) => ({
      date: m.utcDate.slice(0, 10),
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      homeScore: m.homeScore as number,
      awayScore: m.awayScore as number,
    }));
}

export async function loadTeamRatings(
  teams: string[],
  finishedWorldCupMatches: BracketMatch[] = []
): Promise<Map<string, TeamRating>> {
  const historicalMatches = await getCached('historical-matches', TTL_MS, () =>
    fetchHistoricalMatches(HISTORY_SINCE_YEAR)
  );
  const seedRatings = loadSeedRatings();
  const base = buildTeamRatings(teams, historicalMatches, seedRatings);

  const baseRatingsMap = new Map(Array.from(base.entries()).map(([team, r]) => [team, r.rating]));
  const updated = applyResults(baseRatingsMap, toHistoricalMatches(finishedWorldCupMatches));

  const result = new Map<string, TeamRating>();
  for (const [team, teamRating] of base) {
    result.set(team, { ...teamRating, rating: updated.get(team) ?? teamRating.rating });
  }
  return result;
}
```

- [ ] **Step 8: Run the tests to verify they pass**

Run: `npx jest src/domain/__tests__/loadTeamRatings.test.ts`
Expected: `2 passed`

- [ ] **Step 9: Commit**

```bash
git add src/domain/loadBracketData.ts src/domain/loadTeamRatings.ts src/domain/__tests__/loadBracketData.test.ts src/domain/__tests__/loadTeamRatings.test.ts
git commit -m "feat: orchestrate cached bracket and rating data loading"
```

---

### Task 12: API Key Configuration

**Files:**
- Create: `src/config/env.ts`
- Modify: `app.config.ts` (replace the generated `app.json` config with an equivalent TypeScript config that wires the API key)
- Create: `.env.example`
- Modify: `.gitignore` (add `.env`)

**Interfaces:**
- Produces: `getFootballDataApiKey(): string`

- [ ] **Step 1: Delete the generated `app.json` and create `app.config.ts`**

```bash
rm -f app.json
```

`app.config.ts`:

```ts
import 'dotenv/config';
import { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'matchday',
  slug: 'matchday',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
  },
  extra: {
    footballDataApiKey: process.env.FOOTBALL_DATA_API_KEY,
  },
};

export default config;
```

- [ ] **Step 2: Create `.env.example`**

```
FOOTBALL_DATA_API_KEY=your_football_data_org_api_key_here
```

- [ ] **Step 3: Add `.env` to `.gitignore`**

Append to `.gitignore`:

```
.env
```

- [ ] **Step 4: Implement `src/config/env.ts`**

```ts
import Constants from 'expo-constants';

export function getFootballDataApiKey(): string {
  const key = Constants.expoConfig?.extra?.footballDataApiKey;
  if (!key || typeof key !== 'string') {
    throw new Error(
      'Missing FOOTBALL_DATA_API_KEY. Copy .env.example to .env and set your football-data.org API key.'
    );
  }
  return key;
}
```

- [ ] **Step 5: Create a local `.env` with a real API key**

Sign up for a free key at football-data.org, then:

```bash
cp .env.example .env
```

Edit `.env` and set `FOOTBALL_DATA_API_KEY` to the real key (this file is gitignored).

- [ ] **Step 6: Commit (excluding `.env`)**

```bash
git add app.config.ts .env.example .gitignore src/config/env.ts
git rm --cached app.json
git commit -m "feat: wire football-data.org API key through Expo config"
```

---

### Task 13: Bracket Data Context

**Files:**
- Create: `src/context/BracketDataContext.tsx`
- Test: `src/context/__tests__/BracketDataContext.test.tsx`

**Interfaces:**
- Consumes: `loadBracketData`, `BracketData` (`../domain/loadBracketData`), `loadTeamRatings` (`../domain/loadTeamRatings`), `TeamRating` (`../domain/types`), `getFootballDataApiKey` (`../config/env`)
- Produces: `BracketDataProvider({ children }): JSX.Element`, `useBracketDataContext(): { bracket: BracketData | null; ratings: Map<string, TeamRating> | null; error: string | null }`

- [ ] **Step 1: Write the failing test**

`src/context/__tests__/BracketDataContext.test.tsx`:

```tsx
jest.mock('../../domain/loadBracketData');
jest.mock('../../domain/loadTeamRatings');
jest.mock('../../config/env', () => ({ getFootballDataApiKey: () => 'test-key' }));

import React from 'react';
import { Text } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';
import { BracketDataProvider, useBracketDataContext } from '../BracketDataContext';
import { loadBracketData } from '../../domain/loadBracketData';
import { loadTeamRatings } from '../../domain/loadTeamRatings';

function Consumer() {
  const { bracket, ratings, error } = useBracketDataContext();
  if (error) return <Text>{error}</Text>;
  if (!bracket || !ratings) return <Text>loading</Text>;
  return <Text>{`${bracket.groups.length}-${ratings.size}`}</Text>;
}

describe('BracketDataProvider', () => {
  it('loads bracket data then ratings and exposes both to consumers', async () => {
    (loadBracketData as jest.Mock).mockResolvedValue({
      groups: [{ groupName: 'GROUP_A', team: 'Argentina', played: 0, won: 0, draw: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 }],
      matches: [],
    });
    (loadTeamRatings as jest.Mock).mockResolvedValue(
      new Map([['Argentina', { team: 'Argentina', rating: 1800, source: 'seed' }]])
    );

    const { getByText } = render(
      <BracketDataProvider>
        <Consumer />
      </BracketDataProvider>
    );

    expect(getByText('loading')).toBeTruthy();
    await waitFor(() => expect(getByText('1-1')).toBeTruthy());
  });

  it('exposes an error message when loading fails', async () => {
    (loadBracketData as jest.Mock).mockRejectedValue(new Error('network down'));

    const { getByText } = render(
      <BracketDataProvider>
        <Consumer />
      </BracketDataProvider>
    );

    await waitFor(() => expect(getByText('network down')).toBeTruthy());
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/context/__tests__/BracketDataContext.test.tsx`
Expected: FAIL with "Cannot find module '../BracketDataContext'"

- [ ] **Step 3: Implement `src/context/BracketDataContext.tsx`**

```tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { loadBracketData, BracketData } from '../domain/loadBracketData';
import { loadTeamRatings } from '../domain/loadTeamRatings';
import { TeamRating } from '../domain/types';
import { getFootballDataApiKey } from '../config/env';

interface BracketDataContextValue {
  bracket: BracketData | null;
  ratings: Map<string, TeamRating> | null;
  error: string | null;
}

const BracketDataContext = createContext<BracketDataContextValue>({
  bracket: null,
  ratings: null,
  error: null,
});

export function BracketDataProvider({ children }: { children: ReactNode }) {
  const [bracket, setBracket] = useState<BracketData | null>(null);
  const [ratings, setRatings] = useState<Map<string, TeamRating> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBracketData({ apiKey: getFootballDataApiKey() })
      .then(async (data) => {
        setBracket(data);
        const teams = Array.from(new Set(data.groups.map((g) => g.team)));
        const finished = data.matches.filter((m) => m.status === 'FINISHED');
        const teamRatings = await loadTeamRatings(teams, finished);
        setRatings(teamRatings);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <BracketDataContext.Provider value={{ bracket, ratings, error }}>
      {children}
    </BracketDataContext.Provider>
  );
}

export function useBracketDataContext(): BracketDataContextValue {
  return useContext(BracketDataContext);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest src/context/__tests__/BracketDataContext.test.tsx`
Expected: `2 passed`

- [ ] **Step 5: Commit**

```bash
git add src/context/BracketDataContext.tsx src/context/__tests__/BracketDataContext.test.tsx
git commit -m "feat: add BracketDataContext to load bracket and ratings once at app start"
```

---

### Task 14: Navigation Shell

**Files:**
- Create: `src/navigation/RootNavigator.tsx`
- Modify: `App.tsx`

**Interfaces:**
- Consumes: `BracketDataProvider` (`../context/BracketDataContext`), `BracketScreen`, `TeamDetailScreen`, `SimulationScreen` (created in Tasks 15-17 — this task creates placeholder components first so the navigator compiles, and the following tasks flesh them out with TDD)
- Produces: `BracketStackParamList { Bracket: undefined; TeamDetail: { team: string } }`, `RootNavigator(): JSX.Element`

- [ ] **Step 1: Create minimal placeholder screens so the navigator has components to render**

`src/screens/BracketScreen.tsx`:

```tsx
import React from 'react';
import { Text } from 'react-native';

export default function BracketScreen() {
  return <Text>Bracket</Text>;
}
```

`src/screens/TeamDetailScreen.tsx`:

```tsx
import React from 'react';
import { Text } from 'react-native';

export default function TeamDetailScreen() {
  return <Text>Team Detail</Text>;
}
```

`src/screens/SimulationScreen.tsx`:

```tsx
import React from 'react';
import { Text } from 'react-native';

export default function SimulationScreen() {
  return <Text>Simulation</Text>;
}
```

- [ ] **Step 2: Implement `src/navigation/RootNavigator.tsx`**

```tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BracketDataProvider } from '../context/BracketDataContext';
import BracketScreen from '../screens/BracketScreen';
import TeamDetailScreen from '../screens/TeamDetailScreen';
import SimulationScreen from '../screens/SimulationScreen';

export type BracketStackParamList = {
  Bracket: undefined;
  TeamDetail: { team: string };
};

const BracketStack = createNativeStackNavigator<BracketStackParamList>();

function BracketStackNavigator() {
  return (
    <BracketStack.Navigator>
      <BracketStack.Screen name="Bracket" component={BracketScreen} />
      <BracketStack.Screen
        name="TeamDetail"
        component={TeamDetailScreen}
        options={({ route }) => ({ title: route.params.team })}
      />
    </BracketStack.Navigator>
  );
}

const Tab = createBottomTabNavigator();

export default function RootNavigator() {
  return (
    <BracketDataProvider>
      <NavigationContainer>
        <Tab.Navigator>
          <Tab.Screen name="BracketTab" component={BracketStackNavigator} options={{ title: 'Bracket' }} />
          <Tab.Screen name="SimulateTab" component={SimulationScreen} options={{ title: 'Simulate' }} />
        </Tab.Navigator>
      </NavigationContainer>
    </BracketDataProvider>
  );
}
```

- [ ] **Step 3: Wire `App.tsx` to render the navigator**

```tsx
import React from 'react';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return <RootNavigator />;
}
```

- [ ] **Step 4: Verify the app builds and starts in Expo Go**

Run: `npx expo start`
Expected: Metro bundler starts with no TypeScript/compile errors; scanning the QR code with Expo Go on the iPhone shows a bottom tab bar with "Bracket" and "Simulate" tabs, each rendering their placeholder text.

- [ ] **Step 5: Commit**

```bash
git add App.tsx src/navigation/RootNavigator.tsx src/screens/BracketScreen.tsx src/screens/TeamDetailScreen.tsx src/screens/SimulationScreen.tsx
git commit -m "feat: add navigation shell with Bracket and Simulate tabs"
```

---

### Task 15: Bracket Screen

**Files:**
- Modify: `src/screens/BracketScreen.tsx`
- Test: `src/screens/__tests__/BracketScreen.test.tsx`

**Interfaces:**
- Consumes: `useBracketDataContext` (`../context/BracketDataContext`), `BracketStackParamList` (`../navigation/RootNavigator`)

- [ ] **Step 1: Write the failing test**

`src/screens/__tests__/BracketScreen.test.tsx`:

```tsx
jest.mock('../../context/BracketDataContext');
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

const mockNavigate = jest.fn();

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import BracketScreen from '../BracketScreen';
import { useBracketDataContext } from '../../context/BracketDataContext';

describe('BracketScreen', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('shows a loading indicator while data is null', () => {
    (useBracketDataContext as jest.Mock).mockReturnValue({ bracket: null, ratings: null, error: null });
    const { getByTestId } = render(<BracketScreen />);
    expect(getByTestId('bracket-loading')).toBeTruthy();
  });

  it('shows the error message when loading failed', () => {
    (useBracketDataContext as jest.Mock).mockReturnValue({ bracket: null, ratings: null, error: 'network down' });
    const { getByTestId } = render(<BracketScreen />);
    expect(getByTestId('bracket-error').props.children).toBe('network down');
  });

  it('renders group teams and navigates to TeamDetail on press', () => {
    (useBracketDataContext as jest.Mock).mockReturnValue({
      bracket: {
        groups: [
          { groupName: 'GROUP_A', team: 'Argentina', played: 1, won: 1, draw: 0, lost: 0, goalsFor: 2, goalsAgainst: 0, points: 3 },
        ],
        matches: [],
      },
      ratings: new Map(),
      error: null,
    });
    const { getByText } = render(<BracketScreen />);
    fireEvent.press(getByText('Argentina — 3 pts'));
    expect(mockNavigate).toHaveBeenCalledWith('TeamDetail', { team: 'Argentina' });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/screens/__tests__/BracketScreen.test.tsx`
Expected: FAIL because `BracketScreen` doesn't yet render loading/error/list states or use `useBracketDataContext`

- [ ] **Step 3: Implement `src/screens/BracketScreen.tsx`**

```tsx
import React from 'react';
import { SafeAreaView, SectionList, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useBracketDataContext } from '../context/BracketDataContext';
import { BracketStackParamList } from '../navigation/RootNavigator';

type Navigation = NativeStackNavigationProp<BracketStackParamList, 'Bracket'>;

export default function BracketScreen() {
  const navigation = useNavigation<Navigation>();
  const { bracket, error } = useBracketDataContext();

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Text testID="bracket-error">{error}</Text>
      </SafeAreaView>
    );
  }

  if (!bracket) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator testID="bracket-loading" />
      </SafeAreaView>
    );
  }

  const groupNames = Array.from(new Set(bracket.groups.map((g) => g.groupName))).sort();
  const sections = groupNames.map((groupName) => ({
    title: groupName,
    data: bracket.groups.filter((g) => g.groupName === groupName),
  }));

  return (
    <SafeAreaView style={styles.container}>
      <SectionList
        testID="bracket-list"
        sections={sections}
        keyExtractor={(item) => `${item.groupName}-${item.team}`}
        renderSectionHeader={({ section }) => <Text style={styles.groupHeader}>{section.title}</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate('TeamDetail', { team: item.team })}>
            <Text>{`${item.team} — ${item.points} pts`}</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  groupHeader: { fontWeight: 'bold', padding: 8, backgroundColor: '#eee' },
});
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest src/screens/__tests__/BracketScreen.test.tsx`
Expected: `3 passed`

- [ ] **Step 5: Commit**

```bash
git add src/screens/BracketScreen.tsx src/screens/__tests__/BracketScreen.test.tsx
git commit -m "feat: implement Bracket screen with group standings"
```

---

### Task 16: Team Detail Screen

**Files:**
- Modify: `src/screens/TeamDetailScreen.tsx`
- Test: `src/screens/__tests__/TeamDetailScreen.test.tsx`

**Interfaces:**
- Consumes: `useBracketDataContext` (`../context/BracketDataContext`), `BracketStackParamList` (`../navigation/RootNavigator`)

- [ ] **Step 1: Write the failing test**

`src/screens/__tests__/TeamDetailScreen.test.tsx`:

```tsx
jest.mock('../../context/BracketDataContext');
jest.mock('@react-navigation/native', () => ({
  useRoute: () => ({ params: { team: 'Argentina' } }),
}));

import React from 'react';
import { render } from '@testing-library/react-native';
import TeamDetailScreen from '../TeamDetailScreen';
import { useBracketDataContext } from '../../context/BracketDataContext';

describe('TeamDetailScreen', () => {
  it('shows a loading message when ratings are not yet available', () => {
    (useBracketDataContext as jest.Mock).mockReturnValue({ bracket: null, ratings: null, error: null });
    const { getByTestId } = render(<TeamDetailScreen />);
    expect(getByTestId('team-rating').props.children).toBe('Loading rating…');
  });

  it('shows the team name and rounded rating once loaded', () => {
    (useBracketDataContext as jest.Mock).mockReturnValue({
      bracket: null,
      ratings: new Map([['Argentina', { team: 'Argentina', rating: 1834.6, source: 'seed' }]]),
      error: null,
    });
    const { getByText, getByTestId } = render(<TeamDetailScreen />);
    expect(getByText('Argentina')).toBeTruthy();
    expect(getByTestId('team-rating').props.children).toBe('Rating: 1835');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/screens/__tests__/TeamDetailScreen.test.tsx`
Expected: FAIL because the placeholder screen doesn't render the team name/rating from context

- [ ] **Step 3: Implement `src/screens/TeamDetailScreen.tsx`**

```tsx
import React from 'react';
import { SafeAreaView, Text, StyleSheet } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useBracketDataContext } from '../context/BracketDataContext';
import { BracketStackParamList } from '../navigation/RootNavigator';

type TeamDetailRoute = RouteProp<BracketStackParamList, 'TeamDetail'>;

export default function TeamDetailScreen() {
  const route = useRoute<TeamDetailRoute>();
  const { ratings } = useBracketDataContext();
  const rating = ratings?.get(route.params.team);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{route.params.team}</Text>
      <Text testID="team-rating">
        {rating ? `Rating: ${Math.round(rating.rating)}` : 'Loading rating…'}
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold' },
});
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest src/screens/__tests__/TeamDetailScreen.test.tsx`
Expected: `2 passed`

- [ ] **Step 5: Commit**

```bash
git add src/screens/TeamDetailScreen.tsx src/screens/__tests__/TeamDetailScreen.test.tsx
git commit -m "feat: implement Team Detail screen with current rating"
```

---

### Task 17: Simulation Screen

**Files:**
- Modify: `src/screens/SimulationScreen.tsx`
- Test: `src/screens/__tests__/SimulationScreen.test.tsx`

**Interfaces:**
- Consumes: `useBracketDataContext` (`../context/BracketDataContext`), `matchProbability`, `simulateMatch` (`../domain/probability`)

- [ ] **Step 1: Write the failing test**

`src/screens/__tests__/SimulationScreen.test.tsx`:

```tsx
jest.mock('../../context/BracketDataContext');

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import SimulationScreen from '../SimulationScreen';
import { useBracketDataContext } from '../../context/BracketDataContext';

function mockContext() {
  (useBracketDataContext as jest.Mock).mockReturnValue({
    bracket: {
      groups: [
        { groupName: 'GROUP_A', team: 'Argentina', played: 0, won: 0, draw: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 },
        { groupName: 'GROUP_A', team: 'Brazil', played: 0, won: 0, draw: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 },
      ],
      matches: [],
    },
    ratings: new Map([
      ['Argentina', { team: 'Argentina', rating: 2000, source: 'seed' }],
      ['Brazil', { team: 'Brazil', rating: 1600, source: 'seed' }],
    ]),
    error: null,
  });
}

describe('SimulationScreen', () => {
  it('shows a loading message before bracket data is available', () => {
    (useBracketDataContext as jest.Mock).mockReturnValue({ bracket: null, ratings: null, error: null });
    const { getByTestId } = render(<SimulationScreen />);
    expect(getByTestId('simulation-loading')).toBeTruthy();
  });

  it('shows a probability breakdown once two teams are selected', () => {
    mockContext();
    const { getByTestId } = render(<SimulationScreen />);
    fireEvent.press(getByTestId('team-a-Argentina'));
    fireEvent.press(getByTestId('team-b-Brazil'));
    expect(getByTestId('probability-display')).toBeTruthy();
  });

  it('shows a simulated result after pressing Simulate', () => {
    mockContext();
    const { getByTestId } = render(<SimulationScreen />);
    fireEvent.press(getByTestId('team-a-Argentina'));
    fireEvent.press(getByTestId('team-b-Brazil'));
    fireEvent.press(getByTestId('simulate-button'));
    expect(getByTestId('simulation-result')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/screens/__tests__/SimulationScreen.test.tsx`
Expected: FAIL because the placeholder screen has none of these testIDs or team-picking behavior

- [ ] **Step 3: Implement `src/screens/SimulationScreen.tsx`**

```tsx
import React, { useState } from 'react';
import { SafeAreaView, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useBracketDataContext } from '../context/BracketDataContext';
import { matchProbability, simulateMatch } from '../domain/probability';

export default function SimulationScreen() {
  const { bracket, ratings } = useBracketDataContext();
  const [teamA, setTeamA] = useState<string | null>(null);
  const [teamB, setTeamB] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  if (!bracket || !ratings) {
    return (
      <SafeAreaView style={styles.container}>
        <Text testID="simulation-loading">Loading teams…</Text>
      </SafeAreaView>
    );
  }

  const teams = Array.from(new Set(bracket.groups.map((g) => g.team))).sort();
  const probability =
    teamA && teamB ? matchProbability(ratings.get(teamA)!.rating, ratings.get(teamB)!.rating) : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.sectionTitle}>Team A</Text>
        {teams.map((team) => (
          <TouchableOpacity
            key={`a-${team}`}
            testID={`team-a-${team}`}
            onPress={() => {
              setTeamA(team);
              setResult(null);
            }}
          >
            <Text style={team === teamA ? styles.selected : styles.option}>{team}</Text>
          </TouchableOpacity>
        ))}
        <Text style={styles.sectionTitle}>Team B</Text>
        {teams.map((team) => (
          <TouchableOpacity
            key={`b-${team}`}
            testID={`team-b-${team}`}
            onPress={() => {
              setTeamB(team);
              setResult(null);
            }}
          >
            <Text style={team === teamB ? styles.selected : styles.option}>{team}</Text>
          </TouchableOpacity>
        ))}
        {probability && (
          <Text testID="probability-display">
            {`${teamA} win ${Math.round(probability.winProbability * 100)}% · draw ${Math.round(
              probability.drawProbability * 100
            )}% · ${teamB} win ${Math.round(probability.lossProbability * 100)}%`}
          </Text>
        )}
        {teamA && teamB && (
          <TouchableOpacity
            testID="simulate-button"
            onPress={() => {
              const outcome = simulateMatch(ratings.get(teamA)!.rating, ratings.get(teamB)!.rating);
              const label = outcome === 'HOME_TEAM' ? teamA : outcome === 'AWAY_TEAM' ? teamB : 'Draw';
              setResult(`Result: ${label}`);
            }}
          >
            <Text style={styles.simulateButton}>Simulate Match</Text>
          </TouchableOpacity>
        )}
        {result && <Text testID="simulation-result">{result}</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  sectionTitle: { fontWeight: 'bold', marginTop: 12 },
  option: { padding: 6 },
  selected: { padding: 6, fontWeight: 'bold', color: 'blue' },
  simulateButton: { padding: 12, marginTop: 12, backgroundColor: '#ddd', textAlign: 'center' },
});
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest src/screens/__tests__/SimulationScreen.test.tsx`
Expected: `3 passed`

- [ ] **Step 5: Commit**

```bash
git add src/screens/SimulationScreen.tsx src/screens/__tests__/SimulationScreen.test.tsx
git commit -m "feat: implement single-match simulation screen"
```

---

### Task 18: Full Test Suite and On-Device Verification

**Files:** None created — verification only.

- [ ] **Step 1: Run the full test suite**

Run: `npx jest`
Expected: All test suites pass (Tasks 1-17).

- [ ] **Step 2: Start the app and load it on the iPhone via Expo Go**

Run: `npx expo start`

On the iPhone, open Expo Go and scan the printed QR code (ensure `.env` from Task 12 has a real football-data.org API key).

- [ ] **Step 3: Manually verify the golden path**

- Bracket tab loads group standings without crashing (allow a few seconds for the live API call).
- Tapping a team navigates to its Team Detail screen and shows a numeric rating.
- Simulate tab: select two teams, confirm a win/draw/loss percentage breakdown appears and sums to ~100%, then press "Simulate Match" and confirm a result appears.

- [ ] **Step 4: Commit any fixes discovered during manual verification**

If manual verification surfaces a bug, write a failing test reproducing it in the relevant task's test file, fix it, confirm the test passes, then:

```bash
git add -A
git commit -m "fix: <describe the bug found during on-device verification>"
```
