# Matchday

A personal app for following the Premier League — current standings and match results/fixtures, built to help you keep up with what's happening week to week.

Built with Expo and React Native, run through Expo Go. No backend: the app calls the football-data.org API directly and caches results on-device.

## Features

- **Standings** — the full league table (position, played, goal difference, points), tap a team to drill in.
- **Fixtures** — recent results and upcoming matches.
- **Team Detail** — a team's league position and its match list.

## Tech Stack

- [Expo](https://docs.expo.dev/) (React Native + TypeScript), run via Expo Go
- [React Navigation](https://reactnavigation.org/) for the tab/stack flow
- [NativeWind](https://www.nativewind.dev/) (Tailwind CSS) for styling, with light/dark theming
- `AsyncStorage` for local caching of API responses
- Jest + React Native Testing Library for tests

## Getting Started

### Prerequisites

- Node.js
- The [Expo Go](https://expo.dev/go) app on your phone (or an iOS/Android simulator)

### Setup

```bash
npm install
cp .env.example .env
```

Edit `.env` and add a free API key from [football-data.org](https://www.football-data.org/) (10 requests/minute, free tier):

```
FOOTBALL_DATA_API_KEY=your_football_data_org_api_key_here
```

Don't have a key yet, or just want to preview the UI? Set `USE_MOCK_DATA=true` in `.env` instead — the app will run entirely on bundled fake standings/fixtures data.

### Run

```bash
npm start
```

Scan the QR code with your phone's camera (opens in Expo Go), or press `i` / `a` in the terminal to launch an iOS/Android simulator.

**"Could not connect to the server" when scanning?** Your phone and computer aren't reachable over the same LAN (different Wi-Fi, a VPN, or a network with client isolation). Run with a tunnel instead, which routes through Expo's servers:

```bash
npx expo start --tunnel
```

(Installs `@expo/ngrok` on first use.) If `npm start` is already running, press `s` in the terminal to cycle connection modes instead of restarting.

## Testing

```bash
npm test
```

Standings/fixtures normalization is covered by unit tests with no UI dependency; screens have smoke/interaction tests.

## Project Structure

```
src/
  api/          # Thin client for football-data.org, plus local caching
  domain/       # Pure logic: standings/fixtures normalization
  context/      # App-wide data loading/state (LeagueDataProvider)
  navigation/   # Tab/stack navigation
  screens/      # Standings, Fixtures, and Team Detail screens
  components/   # Shared presentational components (MatchCard, TeamLabel, ...)
  theme/        # Color tokens for light/dark mode
```

The data layer is parameterized by competition code (`PREMIER_LEAGUE_CODE`), so adding another league later is a data change, not a rework.

## License

MIT
