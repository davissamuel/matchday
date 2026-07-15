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
