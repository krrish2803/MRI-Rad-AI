import { describe, expect, it } from 'vitest';
import { filterApiObject, filterApiText } from '../src/utils/safeText';

describe('restricted clinical language filter', () => {
  it('removes restricted sentences and preserves technical observations', () => {
    const filtered = filterApiText('PI-RADS 5, high risk. Motion is limited. Biopsy is recommended.');
    expect(filtered.removed).toBe(true);
    expect(filtered.text).toBe('Motion is limited.');
    expect(filtered.text).not.toMatch(/PI.?RADS|risk|biopsy|recommend/i);
  });

  it('filters restricted language recursively from API objects', () => {
    const filtered = filterApiObject({
      technical_observation: 'Artifact is visible in this slice.',
      note: 'This is benign. Review the field of view.',
      details: ['Contrast is adequate.', 'The patient should undergo biopsy.'],
    });
    expect(filtered.removed).toBe(true);
    expect(filtered.value).toEqual({
      technical_observation: 'Artifact is visible in this slice.',
      note: 'Review the field of view.',
      details: ['Contrast is adequate.'],
    });
  });
});
