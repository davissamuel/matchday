import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { loadLeagueData } from '../domain/loadLeagueData';
import { LeagueMatch, LeagueStanding } from '../domain/league';
import { PREMIER_LEAGUE_CODE } from '../api/footballDataClient';
import { getFootballDataApiKey, shouldUseMockData } from '../config/env';
import { MOCK_LEAGUE_DATA } from '../domain/mockData';

interface LeagueDataContextValue {
  standings: LeagueStanding[] | null;
  matches: LeagueMatch[] | null;
  error: string | null;
}

const LeagueDataContext = createContext<LeagueDataContextValue>({
  standings: null,
  matches: null,
  error: null,
});

export function LeagueDataProvider({ children }: { children: ReactNode }) {
  const [standings, setStandings] = useState<LeagueStanding[] | null>(null);
  const [matches, setMatches] = useState<LeagueMatch[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        if (shouldUseMockData()) {
          setStandings(MOCK_LEAGUE_DATA.standings);
          setMatches(MOCK_LEAGUE_DATA.matches);
          return;
        }
        const data = await loadLeagueData(PREMIER_LEAGUE_CODE, { apiKey: getFootballDataApiKey() });
        setStandings(data.standings);
        setMatches(data.matches);
      } catch (err) {
        setError((err as Error).message);
      }
    }
    load();
  }, []);

  return (
    <LeagueDataContext.Provider value={{ standings, matches, error }}>
      {children}
    </LeagueDataContext.Provider>
  );
}

export function useLeagueDataContext(): LeagueDataContextValue {
  return useContext(LeagueDataContext);
}
