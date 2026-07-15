# Matchday

A personal iPhone app for following the 2026 FIFA World Cup — browse the live bracket, drill into any team, and run "what if" match simulations backed by real strength ratings.

Built with Expo and React Native, run through Expo Go. No backend: the app calls public football data APIs directly and caches results on-device.

## Features

- **Bracket** — group standings and the knockout tree (Round of 32 through the Final), with live results as they come in.
- **Team Detail** — a team's flag, current strength rating, and its matches so far.
- **Simulation** — pick any two teams, real matchup or hypothetical, and see win/draw/loss odds computed from each team's rating. "Simulate" rolls one outcome from that distribution — exploratory only, it never touches the real bracket.

Ratings come from an Elo-style pipeline: real historical results where available, falling back to a bundled FIFA World Ranking snapshot for teams without history, updated as real tournament results arrive.

## Tech Stack

- [Expo](https://docs.expo.dev/) (React Native + TypeScript), run via Expo Go
- [React Navigation](https://reactnavigation.org/) for the tab/stack flow
- [NativeWind](https://www.nativewind.dev/) (Tailwind CSS) for styling, with light/dark theming
- `AsyncStorage` for local caching of API responses and computed ratings
- Jest + React Native Testing Library for tests

## Getting Started

### Prerequisites

- Node.js
- The [Expo Go](https://expo.dev/go) app on your iPhone (or an iOS/Android simulator)

### Setup

```bash
npm install
cp .env.example .env
```

Edit `.env` and add a free API key from [football-data.org](https://www.football-data.org/) (10 requests/minute, free tier):

```
FOOTBALL_DATA_API_KEY=your_football_data_org_api_key_here
```

Don't have a key yet, or just want to preview the UI? Set `USE_MOCK_DATA=true` in `.env` instead — the app will run entirely on bundled fake bracket/rating data.

### Run

```bash
npm start
```

Scan the QR code with your iPhone's camera (opens in Expo Go), or press `i` / `a` in the terminal to launch an iOS/Android simulator.

## Testing

```bash
npm test
```

Rating calculations, probability math, and bracket-structure logic are covered by unit tests with no UI dependency; screens have smoke/interaction tests.

## Project Structure

```
src/
  api/          # Thin clients for football-data.org and the historical-results source, plus local caching
  domain/       # Pure logic: bracket structure, Elo ratings, win/draw/loss probability
  data/         # Bundled static data (FIFA ranking seed)
  context/      # App-wide data loading/state (BracketDataProvider)
  navigation/   # Tab/stack navigation
  screens/      # Bracket, Team Detail, and Simulation screens
  components/   # Shared presentational components (FlagLabel, MatchCard, ProbabilityBar, ...)
  theme/        # Color tokens for light/dark mode
```

## License

MIT
