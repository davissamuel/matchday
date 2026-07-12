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

  it('maps both straight- and curly-apostrophe spellings of Ivory Coast', () => {
    expect(normalizeTeamName("Côte d'Ivoire")).toBe('Ivory Coast');
    expect(normalizeTeamName('Côte d’Ivoire')).toBe('Ivory Coast');
  });
});
