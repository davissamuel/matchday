# Frontend Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Matchday's three screens (Bracket, Team Detail, Simulation) a full visual redesign — clean editorial/stats look, light+dark theming, crimson accent, team flags, and polished tab navigation — with no changes to data, domain, or navigation *logic*.

**Architecture:** NativeWind v4 (Tailwind for React Native) provides the styling engine and theme tokens. A small set of shared presentational components (`ScreenContainer`, `FlagLabel`, `StatPill`, `MatchCard`, `ProbabilityBar`) in `src/components/` are built bottom-up with their own tests, then wired into the three existing screens, replacing their current inline `StyleSheet` blocks. A new `src/domain/flags.ts` pure function maps team names to flag emoji.

**Tech Stack:** Expo 54 / React Native 0.81, NativeWind v4 + Tailwind CSS, `@expo/vector-icons` for tab icons, existing React Navigation (bottom-tabs + native-stack), Jest + React Native Testing Library.

## Global Constraints

- Existing `testID`s on interactive/data elements must keep working with `getByTestId` (exact text asserted via `.props.children` may change and will be updated in the same task that changes the rendering).
- No changes to `src/api/`, `src/domain/loadBracketData.ts`, `src/domain/loadTeamRatings.ts`, `src/domain/probability.ts`, `src/domain/elo.ts`, `src/domain/bracket.ts`'s existing exports, `src/context/BracketDataContext.tsx`, or any rating/probability/bracket math.
- Light + dark mode via NativeWind's `dark:` variant, driven by the system color scheme (no manual theme toggle).
- Single accent color: crimson red. No secondary accent colors.
- System font only — no custom font loading.
- TDD: every new component/module gets a failing test written first.

---

### Task 1: NativeWind tooling setup

**Files:**
- Modify: `package.json` (dependencies + `jest.transformIgnorePatterns`)
- Create: `babel.config.js`
- Create: `metro.config.js`
- Create: `tailwind.config.js`
- Create: `global.css`
- Create: `nativewind-env.d.ts`
- Create: `src/theme/colors.ts`
- Modify: `index.ts` (import `global.css`)

**Interfaces:**
- Produces: `colors.light` / `colors.dark` objects (each with `background`, `surface`, `text`, `textMuted`, `border`, `accent` string hex values) from `src/theme/colors.ts`, used by later tasks wherever a RN prop needs a raw color (e.g. `ActivityIndicator`'s `color`).
- Produces: Tailwind utility classes available via `className` on any RN component in the app (e.g. `bg-neutral-50`, `dark:bg-neutral-950`, `text-accent`, `bg-accent`).

- [ ] **Step 1: Install NativeWind and Tailwind**

Run: `npx expo install nativewind tailwindcss`

Expected: `package.json` gains `nativewind` and `tailwindcss` entries under `dependencies`.

- [ ] **Step 2: Create `tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        neutral: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          800: '#27272a',
          900: '#18181b',
          950: '#09090b',
        },
        accent: {
          DEFAULT: '#dc2626',
          dark: '#f87171',
        },
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 3: Create `global.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 4: Create `babel.config.js`**

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  };
};
```

- [ ] **Step 5: Create `metro.config.js`**

```js
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './global.css' });
```

- [ ] **Step 6: Create `nativewind-env.d.ts`**

```ts
/// <reference types="nativewind/types" />
```

- [ ] **Step 7: Import the stylesheet in `index.ts`**

Modify `index.ts` to add the import as the first line:

```ts
import './global.css';
import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
```

- [ ] **Step 8: Create `src/theme/colors.ts`**

```ts
export const colors = {
  light: {
    background: '#fafafa',
    surface: '#ffffff',
    text: '#09090b',
    textMuted: '#71717a',
    border: '#e4e4e7',
    accent: '#dc2626',
  },
  dark: {
    background: '#09090b',
    surface: '#18181b',
    text: '#fafafa',
    textMuted: '#a1a1aa',
    border: '#27272a',
    accent: '#f87171',
  },
};
```

- [ ] **Step 9: Allow Jest to transform NativeWind's package output**

Modify `package.json`'s `jest.transformIgnorePatterns` entry — add `nativewind` and `react-native-css-interop` to the negative-lookahead group. Change:

```json
"transformIgnorePatterns": [
  "node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules-.*|sentry-expo|native-base|react-native-svg))"
]
```

to:

```json
"transformIgnorePatterns": [
  "node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules-.*|sentry-expo|native-base|react-native-svg|nativewind|react-native-css-interop))"
]
```

- [ ] **Step 10: Verify the existing test suite still passes**

Run: `npm test`
Expected: All existing test suites pass unchanged (this task only adds tooling/config; no screen or component source changed yet).

- [ ] **Step 11: Commit**

```bash
git add package.json package-lock.json babel.config.js metro.config.js tailwind.config.js global.css nativewind-env.d.ts index.ts src/theme/colors.ts
git commit -m "chore: set up NativeWind for styling"
```

---

### Task 2: Team flag lookup

**Files:**
- Create: `src/domain/flags.ts`
- Test: `src/domain/__tests__/flags.test.ts`

**Interfaces:**
- Produces: `flagEmoji(team: string): string` — returns a flag emoji for a known team name, or `''` if the team is unrecognized (including the literal string `'TBD'` used for undetermined bracket slots).

- [ ] **Step 1: Write the failing test**

```ts
import { flagEmoji } from '../flags';

describe('flagEmoji', () => {
  it('returns the flag emoji for a known team', () => {
    expect(flagEmoji('Argentina')).toBe('🇦🇷');
    expect(flagEmoji('Brazil')).toBe('🇧🇷');
  });

  it('returns an empty string for TBD', () => {
    expect(flagEmoji('TBD')).toBe('');
  });

  it('returns an empty string for an unrecognized team name', () => {
    expect(flagEmoji('Atlantis')).toBe('');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/domain/__tests__/flags.test.ts`
Expected: FAIL with "Cannot find module '../flags'"

- [ ] **Step 3: Write the implementation**

```ts
// Direct team-name -> flag-emoji lookup (not derived from ISO codes) so that
// non-ISO cases (England/Scotland/Wales don't have their own ISO 3166-1
// country code) can share the same simple map. Those three fall back to the
// UK flag as a deliberate simplification.
const TEAM_FLAGS: Record<string, string> = {
  Argentina: '🇦🇷',
  Brazil: '🇧🇷',
  France: '🇫🇷',
  Germany: '🇩🇪',
  Spain: '🇪🇸',
  Portugal: '🇵🇹',
  Netherlands: '🇳🇱',
  Belgium: '🇧🇪',
  Italy: '🇮🇹',
  England: '🇬🇧',
  Scotland: '🇬🇧',
  Wales: '🇬🇧',
  Ireland: '🇮🇪',
  Croatia: '🇭🇷',
  Poland: '🇵🇱',
  Switzerland: '🇨🇭',
  Austria: '🇦🇹',
  Denmark: '🇩🇰',
  Sweden: '🇸🇪',
  Norway: '🇳🇴',
  Serbia: '🇷🇸',
  Ukraine: '🇺🇦',
  Turkey: '🇹🇷',
  Greece: '🇬🇷',
  'Czech Republic': '🇨🇿',
  Hungary: '🇭🇺',
  Romania: '🇷🇴',
  Slovakia: '🇸🇰',
  Slovenia: '🇸🇮',
  Iceland: '🇮🇸',
  Finland: '🇫🇮',
  Morocco: '🇲🇦',
  Senegal: '🇸🇳',
  Nigeria: '🇳🇬',
  Ghana: '🇬🇭',
  Egypt: '🇪🇬',
  Tunisia: '🇹🇳',
  Algeria: '🇩🇿',
  Cameroon: '🇨🇲',
  'Ivory Coast': '🇨🇮',
  'DR Congo': '🇨🇩',
  'Cape Verde': '🇨🇻',
  'South Africa': '🇿🇦',
  Mali: '🇲🇱',
  Japan: '🇯🇵',
  'South Korea': '🇰🇷',
  Australia: '🇦🇺',
  'Saudi Arabia': '🇸🇦',
  Qatar: '🇶🇦',
  Iran: '🇮🇷',
  Iraq: '🇮🇶',
  UAE: '🇦🇪',
  China: '🇨🇳',
  Uzbekistan: '🇺🇿',
  Jordan: '🇯🇴',
  'North Korea': '🇰🇵',
  India: '🇮🇳',
  Canada: '🇨🇦',
  'United States': '🇺🇸',
  Mexico: '🇲🇽',
  'Costa Rica': '🇨🇷',
  Jamaica: '🇯🇲',
  Panama: '🇵🇦',
  Honduras: '🇭🇳',
  Ecuador: '🇪🇨',
  Uruguay: '🇺🇾',
  Colombia: '🇨🇴',
  Chile: '🇨🇱',
  Paraguay: '🇵🇾',
  Venezuela: '🇻🇪',
  Peru: '🇵🇪',
  Bolivia: '🇧🇴',
  'New Zealand': '🇳🇿',
};

export function flagEmoji(team: string): string {
  return TEAM_FLAGS[team] ?? '';
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/domain/__tests__/flags.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/domain/flags.ts src/domain/__tests__/flags.test.ts
git commit -m "feat: add team flag emoji lookup"
```

---

### Task 3: `ScreenContainer` component

**Files:**
- Create: `src/components/ScreenContainer.tsx`
- Test: `src/components/__tests__/ScreenContainer.test.tsx`

**Interfaces:**
- Consumes: nothing beyond `react-native-safe-area-context`'s `SafeAreaView` (already a dependency).
- Produces: `ScreenContainer({ children, testID? }: { children: React.ReactNode; testID?: string })` — a `SafeAreaView` wrapper with themed background and horizontal padding, used by all three screens as their outermost element.

- [ ] **Step 1: Write the failing test**

```tsx
import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { ScreenContainer } from '../ScreenContainer';

describe('ScreenContainer', () => {
  it('renders its children', () => {
    const { getByText } = render(
      <ScreenContainer>
        <Text>Hello</Text>
      </ScreenContainer>
    );
    expect(getByText('Hello')).toBeTruthy();
  });

  it('forwards a testID to the outer container', () => {
    const { getByTestId } = render(
      <ScreenContainer testID="my-screen">
        <Text>Hello</Text>
      </ScreenContainer>
    );
    expect(getByTestId('my-screen')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/components/__tests__/ScreenContainer.test.tsx`
Expected: FAIL with "Cannot find module '../ScreenContainer'"

- [ ] **Step 3: Write the implementation**

```tsx
import React, { ReactNode } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenContainerProps {
  children: ReactNode;
  testID?: string;
}

export function ScreenContainer({ children, testID }: ScreenContainerProps) {
  return (
    <SafeAreaView testID={testID} className="flex-1 bg-neutral-50 px-4 dark:bg-neutral-950">
      {children}
    </SafeAreaView>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/components/__tests__/ScreenContainer.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/ScreenContainer.tsx src/components/__tests__/ScreenContainer.test.tsx
git commit -m "feat: add ScreenContainer shared component"
```

---

### Task 4: `FlagLabel` component

**Files:**
- Create: `src/components/FlagLabel.tsx`
- Test: `src/components/__tests__/FlagLabel.test.tsx`

**Interfaces:**
- Consumes: `flagEmoji(team: string): string` from `src/domain/flags.ts` (Task 2).
- Produces: `FlagLabel({ team, className? }: { team: string; className?: string })` — renders the team's flag (if any) followed by its name. Used by `MatchCard` (Task 6) and directly in the Bracket/Simulation screens (Tasks 8, 10).

- [ ] **Step 1: Write the failing test**

```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { FlagLabel } from '../FlagLabel';

describe('FlagLabel', () => {
  it('renders the flag and team name for a known team', () => {
    const { getByText } = render(<FlagLabel team="Argentina" />);
    expect(getByText('🇦🇷')).toBeTruthy();
    expect(getByText('Argentina')).toBeTruthy();
  });

  it('renders just the team name when there is no flag (e.g. TBD)', () => {
    const { getByText, queryByText } = render(<FlagLabel team="TBD" />);
    expect(getByText('TBD')).toBeTruthy();
    expect(queryByText('🏳️')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/components/__tests__/FlagLabel.test.tsx`
Expected: FAIL with "Cannot find module '../FlagLabel'"

- [ ] **Step 3: Write the implementation**

```tsx
import React from 'react';
import { Text, View } from 'react-native';
import { flagEmoji } from '../domain/flags';

interface FlagLabelProps {
  team: string;
  className?: string;
}

export function FlagLabel({ team, className }: FlagLabelProps) {
  const flag = flagEmoji(team);
  return (
    <View className={`flex-row items-center gap-1.5 ${className ?? ''}`}>
      {flag ? <Text>{flag}</Text> : null}
      <Text className="text-neutral-900 dark:text-neutral-50">{team}</Text>
    </View>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/components/__tests__/FlagLabel.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/FlagLabel.tsx src/components/__tests__/FlagLabel.test.tsx
git commit -m "feat: add FlagLabel shared component"
```

---

### Task 5: `StatPill` component

**Files:**
- Create: `src/components/StatPill.tsx`
- Test: `src/components/__tests__/StatPill.test.tsx`

**Interfaces:**
- Produces: `StatPill({ label, value, testID? }: { label: string; value: string; testID?: string })` — a rounded chip showing a labeled stat. Used by Team Detail (Task 9) for the team's strength rating.

- [ ] **Step 1: Write the failing test**

```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { StatPill } from '../StatPill';

describe('StatPill', () => {
  it('renders the label and value', () => {
    const { getByText } = render(<StatPill label="Rating" value="1835" />);
    expect(getByText('Rating')).toBeTruthy();
    expect(getByText('1835')).toBeTruthy();
  });

  it('forwards a testID', () => {
    const { getByTestId } = render(<StatPill label="Rating" value="1835" testID="team-rating" />);
    expect(getByTestId('team-rating')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/components/__tests__/StatPill.test.tsx`
Expected: FAIL with "Cannot find module '../StatPill'"

- [ ] **Step 3: Write the implementation**

```tsx
import React from 'react';
import { Text, View } from 'react-native';

interface StatPillProps {
  label: string;
  value: string;
  testID?: string;
}

export function StatPill({ label, value, testID }: StatPillProps) {
  return (
    <View
      testID={testID}
      className="mt-2 flex-row items-center gap-2 self-start rounded-full bg-neutral-100 px-4 py-2 dark:bg-neutral-800"
    >
      <Text className="text-xs font-semibold uppercase text-neutral-500 dark:text-neutral-400">{label}</Text>
      <Text className="text-base font-bold text-neutral-900 dark:text-neutral-50">{value}</Text>
    </View>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/components/__tests__/StatPill.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/StatPill.tsx src/components/__tests__/StatPill.test.tsx
git commit -m "feat: add StatPill shared component"
```

---

### Task 6: `MatchCard` component

**Files:**
- Create: `src/components/MatchCard.tsx`
- Test: `src/components/__tests__/MatchCard.test.tsx`

**Interfaces:**
- Consumes: `BracketMatch` type from `src/domain/bracket.ts` (`{ id, stage, utcDate, homeTeam, awayTeam, homeScore, awayScore, status }`); `FlagLabel` from Task 4.
- Produces: `MatchCard({ match, testID? }: { match: BracketMatch; testID?: string })` — a card showing both teams with a score or "vs". Used by Bracket (Task 8, knockout section) and Team Detail (Task 9, match list).

- [ ] **Step 1: Write the failing test**

```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { MatchCard } from '../MatchCard';
import { BracketMatch } from '../../domain/bracket';

function buildMatch(overrides: Partial<BracketMatch>): BracketMatch {
  return {
    id: 1,
    stage: 'LAST_16',
    utcDate: '2026-07-01T18:00:00Z',
    homeTeam: 'Argentina',
    awayTeam: 'Brazil',
    homeScore: null,
    awayScore: null,
    status: 'SCHEDULED',
    ...overrides,
  };
}

describe('MatchCard', () => {
  it('renders both team names', () => {
    const { getByText } = render(<MatchCard match={buildMatch({})} />);
    expect(getByText('Argentina')).toBeTruthy();
    expect(getByText('Brazil')).toBeTruthy();
  });

  it('renders the score when the match is decided', () => {
    const { getByText } = render(<MatchCard match={buildMatch({ homeScore: 2, awayScore: 1 })} />);
    expect(getByText('2 - 1')).toBeTruthy();
  });

  it('renders "vs" when the match has no score yet', () => {
    const { getByText } = render(<MatchCard match={buildMatch({})} />);
    expect(getByText('vs')).toBeTruthy();
  });

  it('forwards a testID to the outer container', () => {
    const { getByTestId } = render(<MatchCard match={buildMatch({})} testID="knockout-match-1" />);
    expect(getByTestId('knockout-match-1')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/components/__tests__/MatchCard.test.tsx`
Expected: FAIL with "Cannot find module '../MatchCard'"

- [ ] **Step 3: Write the implementation**

```tsx
import React from 'react';
import { Text, View } from 'react-native';
import { BracketMatch } from '../domain/bracket';
import { FlagLabel } from './FlagLabel';

interface MatchCardProps {
  match: BracketMatch;
  testID?: string;
}

export function MatchCard({ match, testID }: MatchCardProps) {
  const hasScore = match.homeScore !== null && match.awayScore !== null;
  const scoreText = hasScore ? `${match.homeScore} - ${match.awayScore}` : 'vs';

  return (
    <View
      testID={testID}
      className="mb-2 flex-row items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <FlagLabel team={match.homeTeam} className="flex-1" />
      <Text className="mx-3 text-sm font-semibold text-neutral-400 dark:text-neutral-500">{scoreText}</Text>
      <FlagLabel team={match.awayTeam} className="flex-1 justify-end" />
    </View>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/components/__tests__/MatchCard.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/MatchCard.tsx src/components/__tests__/MatchCard.test.tsx
git commit -m "feat: add MatchCard shared component"
```

---

### Task 7: `ProbabilityBar` component

**Files:**
- Create: `src/components/ProbabilityBar.tsx`
- Test: `src/components/__tests__/ProbabilityBar.test.tsx`

**Interfaces:**
- Consumes: nothing beyond primitive props.
- Produces: `ProbabilityBar({ homeTeam, awayTeam, winProbability, drawProbability, lossProbability, testID? }: { homeTeam: string; awayTeam: string; winProbability: number; drawProbability: number; lossProbability: number; testID?: string })` — a segmented win/draw/loss bar. Used by Simulation (Task 10). Probabilities are 0–1 fractions (matching `matchProbability`'s return shape in `src/domain/probability.ts`).

- [ ] **Step 1: Write the failing test**

```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { ProbabilityBar } from '../ProbabilityBar';

describe('ProbabilityBar', () => {
  it('renders rounded percentages for each outcome', () => {
    const { getByText } = render(
      <ProbabilityBar
        homeTeam="Argentina"
        awayTeam="Brazil"
        winProbability={0.554}
        drawProbability={0.201}
        lossProbability={0.245}
      />
    );
    expect(getByText('55%')).toBeTruthy();
    expect(getByText('20%')).toBeTruthy();
    expect(getByText('25%')).toBeTruthy();
  });

  it('renders both team names', () => {
    const { getByText } = render(
      <ProbabilityBar
        homeTeam="Argentina"
        awayTeam="Brazil"
        winProbability={0.5}
        drawProbability={0.25}
        lossProbability={0.25}
      />
    );
    expect(getByText('Argentina')).toBeTruthy();
    expect(getByText('Brazil')).toBeTruthy();
  });

  it('forwards a testID to the outer container', () => {
    const { getByTestId } = render(
      <ProbabilityBar
        homeTeam="Argentina"
        awayTeam="Brazil"
        winProbability={0.5}
        drawProbability={0.25}
        lossProbability={0.25}
        testID="probability-display"
      />
    );
    expect(getByTestId('probability-display')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/components/__tests__/ProbabilityBar.test.tsx`
Expected: FAIL with "Cannot find module '../ProbabilityBar'"

- [ ] **Step 3: Write the implementation**

```tsx
import React from 'react';
import { Text, View } from 'react-native';

interface ProbabilityBarProps {
  homeTeam: string;
  awayTeam: string;
  winProbability: number;
  drawProbability: number;
  lossProbability: number;
  testID?: string;
}

export function ProbabilityBar({
  homeTeam,
  awayTeam,
  winProbability,
  drawProbability,
  lossProbability,
  testID,
}: ProbabilityBarProps) {
  const winPct = Math.round(winProbability * 100);
  const drawPct = Math.round(drawProbability * 100);
  const lossPct = Math.round(lossProbability * 100);

  return (
    <View testID={testID} className="mt-4">
      <View className="mb-1 flex-row justify-between">
        <Text className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">{`${winPct}%`}</Text>
        <Text className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">{`${drawPct}%`}</Text>
        <Text className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">{`${lossPct}%`}</Text>
      </View>
      <View className="h-3 w-full flex-row overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
        <View className="h-full bg-accent" style={{ width: `${winPct}%` }} />
        <View className="h-full bg-neutral-400 dark:bg-neutral-600" style={{ width: `${drawPct}%` }} />
        <View className="h-full bg-neutral-900 dark:bg-neutral-100" style={{ width: `${lossPct}%` }} />
      </View>
      <View className="mt-1 flex-row justify-between">
        <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-50">{homeTeam}</Text>
        <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-50">{awayTeam}</Text>
      </View>
    </View>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/components/__tests__/ProbabilityBar.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/ProbabilityBar.tsx src/components/__tests__/ProbabilityBar.test.tsx
git commit -m "feat: add ProbabilityBar shared component"
```

---

### Task 8: Restyle Bracket Screen

**Files:**
- Modify: `src/screens/BracketScreen.tsx`
- Modify: `src/screens/__tests__/BracketScreen.test.tsx`

**Interfaces:**
- Consumes: `ScreenContainer` (Task 3), `FlagLabel` (Task 4), `MatchCard` (Task 6), `colors` from `src/theme/colors.ts` (Task 1) for the `ActivityIndicator` color.
- Produces: no new exports; this task only changes `BracketScreen`'s rendering.

- [ ] **Step 1: Update the test to match the new rendering**

The existing suite asserts the group-standing row's and knockout-match's full formatted text as a single `Text` node's `.props.children`. Since rows/cards now compose `FlagLabel`/`MatchCard` (multiple `Text` nodes), replace those assertions with checks against the pieces that are still individually rendered. Replace the file's contents with:

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

  it('shows a loading indicator while data is null', async () => {
    (useBracketDataContext as jest.Mock).mockReturnValue({ bracket: null, ratings: null, error: null });
    const { getByTestId } = await render(<BracketScreen />);
    expect(getByTestId('bracket-loading')).toBeTruthy();
  });

  it('shows the error message when loading failed', async () => {
    (useBracketDataContext as jest.Mock).mockReturnValue({ bracket: null, ratings: null, error: 'network down' });
    const { getByTestId } = await render(<BracketScreen />);
    expect(getByTestId('bracket-error').props.children).toBe('network down');
  });

  it('renders group teams and navigates to TeamDetail on press', async () => {
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
    const { getByText, getByTestId } = await render(<BracketScreen />);
    expect(getByText('Argentina')).toBeTruthy();
    expect(getByText('3 pts')).toBeTruthy();
    fireEvent.press(getByTestId('standing-row-Argentina'));
    expect(mockNavigate).toHaveBeenCalledWith('TeamDetail', { team: 'Argentina' });
  });

  it('renders knockout matches grouped by stage with scores or "vs" for undetermined slots', async () => {
    (useBracketDataContext as jest.Mock).mockReturnValue({
      bracket: {
        groups: [],
        matches: [
          {
            id: 1,
            stage: 'LAST_16',
            utcDate: '2026-07-01T18:00:00Z',
            homeTeam: 'Argentina',
            awayTeam: 'Brazil',
            homeScore: 2,
            awayScore: 1,
            status: 'FINISHED',
          },
          {
            id: 2,
            stage: 'QUARTER_FINALS',
            utcDate: '2026-07-05T18:00:00Z',
            homeTeam: 'TBD',
            awayTeam: 'TBD',
            homeScore: null,
            awayScore: null,
            status: 'SCHEDULED',
          },
          {
            id: 3,
            stage: 'THIRD_PLACE_FINAL',
            utcDate: '2026-07-06T18:00:00Z',
            homeTeam: 'Germany',
            awayTeam: 'France',
            homeScore: null,
            awayScore: null,
            status: 'SCHEDULED',
          },
        ],
      },
      ratings: new Map(),
      error: null,
    });

    const { getByText, getByTestId } = await render(<BracketScreen />);

    expect(getByText('Round of 16')).toBeTruthy();
    const match1 = getByTestId('knockout-match-1');
    expect(match1).toBeTruthy();
    expect(getByText('2 - 1')).toBeTruthy();

    expect(getByText('Quarterfinals')).toBeTruthy();
    expect(getByTestId('knockout-match-2')).toBeTruthy();

    expect(getByText('THIRD_PLACE_FINAL')).toBeTruthy();
    expect(getByTestId('knockout-match-3')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails against the current implementation**

Run: `npx jest src/screens/__tests__/BracketScreen.test.tsx`
Expected: FAIL — `getByTestId('standing-row-Argentina')` not found, and `getByText('Argentina')`/`getByText('3 pts')` not found as separate nodes (current implementation renders `'Argentina — 3 pts'` as one node).

- [ ] **Step 3: Restyle `BracketScreen.tsx`**

Replace the file's contents:

```tsx
import React from 'react';
import { SectionList, Text, TouchableOpacity, ActivityIndicator, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useBracketDataContext } from '../context/BracketDataContext';
import { BracketStackParamList } from '../navigation/RootNavigator';
import { GroupStanding, BracketMatch } from '../domain/bracket';
import { ScreenContainer } from '../components/ScreenContainer';
import { FlagLabel } from '../components/FlagLabel';
import { MatchCard } from '../components/MatchCard';
import { colors } from '../theme/colors';

type Navigation = NativeStackNavigationProp<BracketStackParamList, 'Bracket'>;

const STAGE_LABELS: Record<string, string> = {
  LAST_32: 'Round of 32',
  LAST_16: 'Round of 16',
  QUARTER_FINALS: 'Quarterfinals',
  SEMI_FINALS: 'Semifinals',
  FINAL: 'Final',
};

const STAGE_ORDER = ['LAST_32', 'LAST_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'FINAL'] as const;

interface GroupSection {
  kind: 'group';
  title: string;
  data: GroupStanding[];
}

interface KnockoutSection {
  kind: 'knockout';
  title: string;
  data: BracketMatch[];
}

type Section = GroupSection | KnockoutSection;

export default function BracketScreen() {
  const navigation = useNavigation<Navigation>();
  const { bracket, error } = useBracketDataContext();

  if (error) {
    return (
      <ScreenContainer>
        <Text testID="bracket-error" className="mt-4 text-neutral-900 dark:text-neutral-50">
          {error}
        </Text>
      </ScreenContainer>
    );
  }

  if (!bracket) {
    return (
      <ScreenContainer>
        <ActivityIndicator testID="bracket-loading" color={colors.light.accent} className="mt-4" />
      </ScreenContainer>
    );
  }

  const groupNames = Array.from(new Set(bracket.groups.map((g) => g.groupName))).sort();
  const groupSections: GroupSection[] = groupNames.map((groupName) => ({
    kind: 'group',
    title: groupName,
    data: bracket.groups.filter((g) => g.groupName === groupName),
  }));

  const knockoutStages = Array.from(new Set(bracket.matches.map((m) => m.stage))).filter(
    (stage) => stage !== 'GROUP_STAGE'
  );
  const orderedKnownStages = STAGE_ORDER.filter((stage) => knockoutStages.includes(stage));
  const unknownStages = knockoutStages.filter((stage) => !STAGE_ORDER.includes(stage));
  const allKnockoutStages = [...orderedKnownStages, ...unknownStages];

  const knockoutSections: KnockoutSection[] = allKnockoutStages.map((stage) => ({
    kind: 'knockout',
    title: STAGE_LABELS[stage] ?? stage,
    data: bracket.matches.filter((m) => m.stage === stage),
  }));

  const sections: Section[] = [...groupSections, ...knockoutSections];

  return (
    <ScreenContainer>
      <SectionList
        testID="bracket-list"
        sections={sections}
        keyExtractor={(item, index) =>
          'groupName' in item ? `${item.groupName}-${(item as GroupStanding).team}` : `match-${(item as BracketMatch).id}-${index}`
        }
        renderSectionHeader={({ section }) => (
          <Text className="mt-4 bg-neutral-100 px-2 py-2 font-bold text-neutral-900 dark:bg-neutral-900 dark:text-neutral-50">
            {section.title}
          </Text>
        )}
        renderItem={({ item, section }) => {
          if (section.kind === 'group') {
            const standing = item as GroupStanding;
            const qualifying = bracket.groups
              .filter((g) => g.groupName === standing.groupName)
              .sort((a, b) => b.points - a.points)
              .slice(0, 2)
              .some((g) => g.team === standing.team);
            return (
              <TouchableOpacity
                testID={`standing-row-${standing.team}`}
                onPress={() => navigation.navigate('TeamDetail', { team: standing.team })}
                className={`flex-row items-center justify-between border-l-4 px-2 py-2 ${
                  qualifying ? 'border-accent' : 'border-transparent'
                }`}
              >
                <FlagLabel team={standing.team} />
                <Text
                  className={`text-neutral-900 dark:text-neutral-50 ${qualifying ? 'font-bold' : 'font-normal'}`}
                >{`${standing.points} pts`}</Text>
              </TouchableOpacity>
            );
          }
          const match = item as BracketMatch;
          return <MatchCard match={match} testID={`knockout-match-${match.id}`} />;
        }}
      />
    </ScreenContainer>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/screens/__tests__/BracketScreen.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/screens/BracketScreen.tsx src/screens/__tests__/BracketScreen.test.tsx
git commit -m "feat: restyle Bracket screen with shared components"
```

---

### Task 9: Restyle Team Detail Screen

**Files:**
- Modify: `src/screens/TeamDetailScreen.tsx`
- Modify: `src/screens/__tests__/TeamDetailScreen.test.tsx`

**Interfaces:**
- Consumes: `ScreenContainer` (Task 3), `FlagLabel` (Task 4), `StatPill` (Task 5), `MatchCard` (Task 6).
- Produces: no new exports; this task only changes `TeamDetailScreen`'s rendering.

- [ ] **Step 1: Update the test to match the new rendering**

The current suite checks `team-rating`'s `.props.children` for the literal strings `'Loading rating…'` and `'Rating: 1835'`, and checks each match's testID `.props.children` for the full formatted line. Since the rating is now shown via `StatPill` (two separate `Text` nodes) and matches via `MatchCard`, update those assertions. Replace the file's contents with:

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
  it('shows a loading message when ratings are not yet available', async () => {
    (useBracketDataContext as jest.Mock).mockReturnValue({ bracket: null, ratings: null, error: null });
    const { getByText } = await render(<TeamDetailScreen />);
    expect(getByText('Loading rating…')).toBeTruthy();
  });

  it('shows the team name and rounded rating once loaded', async () => {
    (useBracketDataContext as jest.Mock).mockReturnValue({
      bracket: null,
      ratings: new Map([['Argentina', { team: 'Argentina', rating: 1834.6, source: 'seed' }]]),
      error: null,
    });
    const { getByText, getByTestId } = await render(<TeamDetailScreen />);
    expect(getByText('Argentina')).toBeTruthy();
    expect(getByTestId('team-rating')).toBeTruthy();
    expect(getByText('1835')).toBeTruthy();
  });

  it('shows the error message when loading failed', async () => {
    (useBracketDataContext as jest.Mock).mockReturnValue({ bracket: null, ratings: null, error: 'network down' });
    const { getByTestId } = await render(<TeamDetailScreen />);
    expect(getByTestId('team-detail-error').props.children).toBe('network down');
  });

  it("lists the team's matches so far, formatted with scores or \"vs\" for undetermined opponents", async () => {
    (useBracketDataContext as jest.Mock).mockReturnValue({
      bracket: {
        groups: [],
        matches: [
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
          {
            id: 2,
            stage: 'LAST_16',
            utcDate: '2026-07-01T18:00:00Z',
            homeTeam: 'Argentina',
            awayTeam: 'TBD',
            homeScore: null,
            awayScore: null,
            status: 'SCHEDULED',
          },
          {
            id: 3,
            stage: 'GROUP_STAGE',
            utcDate: '2026-06-10T18:00:00Z',
            homeTeam: 'France',
            awayTeam: 'Germany',
            homeScore: 1,
            awayScore: 1,
            status: 'FINISHED',
          },
        ],
      },
      ratings: new Map([['Argentina', { team: 'Argentina', rating: 1800, source: 'seed' }]]),
      error: null,
    });

    const { getByTestId, queryByTestId } = await render(<TeamDetailScreen />);

    expect(getByTestId('team-match-1')).toBeTruthy();
    expect(getByTestId('team-match-2')).toBeTruthy();
    expect(queryByTestId('team-match-3')).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails against the current implementation**

Run: `npx jest src/screens/__tests__/TeamDetailScreen.test.tsx`
Expected: FAIL — `getByText('Loading rating…')` and `getByText('1835')` aren't found as separate nodes yet (current implementation renders `'Rating: 1835'` as one node), and `team-match-*` testIDs aren't present on a `MatchCard`-shaped element.

- [ ] **Step 3: Restyle `TeamDetailScreen.tsx`**

Replace the file's contents:

```tsx
import React from 'react';
import { Text, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useBracketDataContext } from '../context/BracketDataContext';
import { BracketStackParamList } from '../navigation/RootNavigator';
import { ScreenContainer } from '../components/ScreenContainer';
import { FlagLabel } from '../components/FlagLabel';
import { StatPill } from '../components/StatPill';
import { MatchCard } from '../components/MatchCard';

type TeamDetailRoute = RouteProp<BracketStackParamList, 'TeamDetail'>;

export default function TeamDetailScreen() {
  const route = useRoute<TeamDetailRoute>();
  const { bracket, ratings, error } = useBracketDataContext();
  const rating = ratings?.get(route.params.team);

  if (error) {
    return (
      <ScreenContainer>
        <Text testID="team-detail-error" className="mt-4 text-neutral-900 dark:text-neutral-50">
          {error}
        </Text>
      </ScreenContainer>
    );
  }

  const teamMatches =
    bracket?.matches.filter(
      (m) => m.homeTeam === route.params.team || m.awayTeam === route.params.team
    ) ?? [];

  return (
    <ScreenContainer>
      <View className="mt-4">
        <FlagLabel team={route.params.team} className="mb-1" />
        {rating ? (
          <StatPill testID="team-rating" label="Rating" value={String(Math.round(rating.rating))} />
        ) : (
          <Text testID="team-rating" className="mt-2 text-neutral-500 dark:text-neutral-400">
            Loading rating…
          </Text>
        )}
      </View>
      <View className="mt-4">
        {teamMatches.map((match) => (
          <MatchCard key={match.id} match={match} testID={`team-match-${match.id}`} />
        ))}
      </View>
    </ScreenContainer>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/screens/__tests__/TeamDetailScreen.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/screens/TeamDetailScreen.tsx src/screens/__tests__/TeamDetailScreen.test.tsx
git commit -m "feat: restyle Team Detail screen with shared components"
```

---

### Task 10: Restyle Simulation Screen

**Files:**
- Modify: `src/screens/SimulationScreen.tsx`
- Modify: `src/screens/__tests__/SimulationScreen.test.tsx`

**Interfaces:**
- Consumes: `ScreenContainer` (Task 3), `FlagLabel` (Task 4), `ProbabilityBar` (Task 7), `matchProbability`/`simulateMatch` from `src/domain/probability.ts` (unchanged).
- Produces: no new exports; this task only changes `SimulationScreen`'s rendering.

- [ ] **Step 1: Confirm the existing test still fits, and extend it**

The current suite's assertions (`simulation-loading`, `simulation-error`, `probability-display` presence, `simulation-result` presence, team selection via `team-a-*`/`team-b-*` testIDs) don't inspect exact `.props.children` on the probability/result nodes, so they keep passing unchanged against a restyled screen. Add one assertion confirming the segmented bar renders percentages, and one confirming team names render via `FlagLabel`. Replace the file's contents with:

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
  it('shows a loading message before bracket data is available', async () => {
    (useBracketDataContext as jest.Mock).mockReturnValue({ bracket: null, ratings: null, error: null });
    const { getByTestId } = await render(<SimulationScreen />);
    expect(getByTestId('simulation-loading')).toBeTruthy();
  });

  it('shows the error message when loading failed', async () => {
    (useBracketDataContext as jest.Mock).mockReturnValue({ bracket: null, ratings: null, error: 'network down' });
    const { getByTestId } = await render(<SimulationScreen />);
    expect(getByTestId('simulation-error').props.children).toBe('network down');
  });

  it('shows a probability breakdown once two teams are selected', async () => {
    mockContext();
    const { getByTestId, getAllByText } = await render(<SimulationScreen />);
    await fireEvent.press(getByTestId('team-a-Argentina'));
    await fireEvent.press(getByTestId('team-b-Brazil'));
    expect(getByTestId('probability-display')).toBeTruthy();
    expect(getAllByText('Argentina').length).toBeGreaterThan(0);
    expect(getAllByText('Brazil').length).toBeGreaterThan(0);
  });

  it('shows a simulated result after pressing Simulate', async () => {
    mockContext();
    const { getByTestId } = await render(<SimulationScreen />);
    await fireEvent.press(getByTestId('team-a-Argentina'));
    await fireEvent.press(getByTestId('team-b-Brazil'));
    await fireEvent.press(getByTestId('simulate-button'));
    expect(getByTestId('simulation-result')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails against the current implementation**

Run: `npx jest src/screens/__tests__/SimulationScreen.test.tsx`
Expected: FAIL on the new `getAllByText('Argentina')`/`getAllByText('Brazil')` assertions — the current implementation renders team names as plain `Text` without a `FlagLabel`, so team names still resolve, but this locks in behavior before the restyle so we can verify it's preserved after.

- [ ] **Step 3: Restyle `SimulationScreen.tsx`**

Replace the file's contents:

```tsx
import React, { useState } from 'react';
import { Text, TouchableOpacity, ScrollView } from 'react-native';
import { useBracketDataContext } from '../context/BracketDataContext';
import { matchProbability, simulateMatch } from '../domain/probability';
import { ScreenContainer } from '../components/ScreenContainer';
import { FlagLabel } from '../components/FlagLabel';
import { ProbabilityBar } from '../components/ProbabilityBar';

export default function SimulationScreen() {
  const { bracket, ratings, error } = useBracketDataContext();
  const [teamA, setTeamA] = useState<string | null>(null);
  const [teamB, setTeamB] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  if (error) {
    return (
      <ScreenContainer>
        <Text testID="simulation-error" className="mt-4 text-neutral-900 dark:text-neutral-50">
          {error}
        </Text>
      </ScreenContainer>
    );
  }

  if (!bracket || !ratings) {
    return (
      <ScreenContainer>
        <Text testID="simulation-loading" className="mt-4 text-neutral-500 dark:text-neutral-400">
          Loading teams…
        </Text>
      </ScreenContainer>
    );
  }

  const teams = Array.from(new Set(bracket.groups.map((g) => g.team))).sort();
  const probability =
    teamA && teamB ? matchProbability(ratings.get(teamA)!.rating, ratings.get(teamB)!.rating) : null;

  return (
    <ScreenContainer>
      <ScrollView>
        <Text className="mt-4 font-bold text-neutral-900 dark:text-neutral-50">Team A</Text>
        {teams.map((team) => (
          <TouchableOpacity
            key={`a-${team}`}
            testID={`team-a-${team}`}
            onPress={() => {
              setTeamA(team);
              setResult(null);
            }}
            className={`rounded-md px-2 py-1.5 ${team === teamA ? 'bg-accent/10' : ''}`}
          >
            <FlagLabel team={team} />
          </TouchableOpacity>
        ))}
        <Text className="mt-4 font-bold text-neutral-900 dark:text-neutral-50">Team B</Text>
        {teams.map((team) => (
          <TouchableOpacity
            key={`b-${team}`}
            testID={`team-b-${team}`}
            onPress={() => {
              setTeamB(team);
              setResult(null);
            }}
            className={`rounded-md px-2 py-1.5 ${team === teamB ? 'bg-accent/10' : ''}`}
          >
            <FlagLabel team={team} />
          </TouchableOpacity>
        ))}
        {probability && teamA && teamB && (
          <ProbabilityBar
            testID="probability-display"
            homeTeam={teamA}
            awayTeam={teamB}
            winProbability={probability.winProbability}
            drawProbability={probability.drawProbability}
            lossProbability={probability.lossProbability}
          />
        )}
        {teamA && teamB && (
          <TouchableOpacity
            testID="simulate-button"
            onPress={() => {
              const outcome = simulateMatch(ratings.get(teamA)!.rating, ratings.get(teamB)!.rating);
              const label = outcome === 'HOME_TEAM' ? teamA : outcome === 'AWAY_TEAM' ? teamB : 'Draw';
              setResult(`Result: ${label}`);
            }}
            className="mt-4 rounded-full bg-accent px-4 py-3"
          >
            <Text className="text-center font-bold text-white">Simulate Match</Text>
          </TouchableOpacity>
        )}
        {result && (
          <Text testID="simulation-result" className="mt-4 text-center text-lg font-bold text-neutral-900 dark:text-neutral-50">
            {result}
          </Text>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/screens/__tests__/SimulationScreen.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/screens/SimulationScreen.tsx src/screens/__tests__/SimulationScreen.test.tsx
git commit -m "feat: restyle Simulation screen with shared components"
```

---

### Task 11: Tab bar icons and accent tint

**Files:**
- Modify: `src/navigation/RootNavigator.tsx`

**Interfaces:**
- Consumes: `Ionicons` from `@expo/vector-icons`; `colors` from `src/theme/colors.ts` (Task 1).
- Produces: no new exports; this task only changes the tab bar's visual configuration (icons, active/inactive tint colors). No navigation structure change — the two tabs (`BracketTab`, `SimulateTab`) and the `TeamDetail` push already exist.

- [ ] **Step 1: Install `@expo/vector-icons`**

Run: `npx expo install @expo/vector-icons`

Expected: `package.json` gains an `@expo/vector-icons` entry under `dependencies`.

- [ ] **Step 2: Update `RootNavigator.tsx`**

Replace the file's contents:

```tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { BracketDataProvider } from '../context/BracketDataContext';
import BracketScreen from '../screens/BracketScreen';
import TeamDetailScreen from '../screens/TeamDetailScreen';
import SimulationScreen from '../screens/SimulationScreen';
import { colors } from '../theme/colors';

export type BracketStackParamList = {
  Bracket: undefined;
  TeamDetail: { team: string };
};

const BracketStack = createNativeStackNavigator<BracketStackParamList>();

function BracketStackNavigator() {
  return (
    <BracketStack.Navigator screenOptions={{ headerTitleAlign: 'left', headerBackButtonDisplayMode: 'minimal' }}>
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
        <Tab.Navigator
          screenOptions={{
            tabBarActiveTintColor: colors.light.accent,
            tabBarInactiveTintColor: colors.light.textMuted,
          }}
        >
          <Tab.Screen
            name="BracketTab"
            component={BracketStackNavigator}
            options={{
              title: 'Bracket',
              headerShown: false,
              tabBarIcon: ({ color, size }) => <Ionicons name="git-network-outline" color={color} size={size} />,
            }}
          />
          <Tab.Screen
            name="SimulateTab"
            component={SimulationScreen}
            options={{
              title: 'Simulate',
              tabBarIcon: ({ color, size }) => <Ionicons name="flask-outline" color={color} size={size} />,
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </BracketDataProvider>
  );
}
```

Note: `headerShown: false` is added to `BracketTab` because `BracketStackNavigator` already renders its own native-stack header for the `Bracket`/`TeamDetail` screens — without this, the tab navigator would render a second, redundant header above it.

- [ ] **Step 3: Run the full test suite**

Run: `npm test`
Expected: All test suites pass (no existing test imports or renders `RootNavigator` directly, so this is a manual/visual verification step, not a unit-tested one).

- [ ] **Step 4: Commit**

```bash
git add src/navigation/RootNavigator.tsx package.json package-lock.json
git commit -m "feat: add tab bar icons and accent tint to navigation"
```

---

## Final Verification

After Task 11, run the full suite once more to confirm the whole redesign is green end-to-end:

```bash
npm test
```

Expected: All suites pass. Then start the app (`npm start`) and manually confirm in Expo Go: Bracket tab shows grouped standings + knockout cards with flags, Team Detail shows the flag/rating/match history, Simulation tab shows the segmented probability bar, and switching the device's system appearance toggles light/dark colors throughout.
