export const TEAM_NAME_ALIASES: Record<string, string> = {
  'Korea Republic': 'South Korea',
  'IR Iran': 'Iran',
  USA: 'United States',
  "Côte d'Ivoire": 'Ivory Coast',
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
