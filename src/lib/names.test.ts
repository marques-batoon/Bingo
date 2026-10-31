import { describe, expect, it } from 'vitest';
import { NAME_MAX, cleanName, randomPlayerName } from './names';

describe('names', () => {
  it('caps length and tidies spaces', () => {
    expect(cleanName('  Ana   Marie  ')).toBe('Ana Marie');
    expect(cleanName('x'.repeat(30))).toHaveLength(NAME_MAX);
    expect(cleanName('   ')).toBe('');
  });

  it('random names fit the limit', () => {
    for (let i = 0; i < 200; i++) expect(randomPlayerName().length).toBeLessThanOrEqual(NAME_MAX);
  });
});
