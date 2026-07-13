import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { loadBracketData, BracketData } from '../domain/loadBracketData';
import { loadTeamRatings } from '../domain/loadTeamRatings';
import { TeamRating } from '../domain/types';
import { getFootballDataApiKey, shouldUseMockData } from '../config/env';
import { MOCK_BRACKET_DATA, MOCK_RATINGS } from '../domain/mockData';

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
    async function load() {
      try {
        if (shouldUseMockData()) {
          setBracket(MOCK_BRACKET_DATA);
          setRatings(MOCK_RATINGS);
          return;
        }
        const data = await loadBracketData({ apiKey: getFootballDataApiKey() });
        setBracket(data);
        const teams = Array.from(new Set(data.groups.map((g) => g.team)));
        const finished = data.matches.filter((m) => m.status === 'FINISHED');
        const teamRatings = await loadTeamRatings(teams, finished);
        setRatings(teamRatings);
      } catch (err) {
        setError((err as Error).message);
      }
    }
    load();
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
