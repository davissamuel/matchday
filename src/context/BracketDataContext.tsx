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
