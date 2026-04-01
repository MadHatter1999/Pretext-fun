import { describe, expect, test } from 'vitest';

import { READER_SCENES } from './readerContent';

describe('READER_SCENES figure sources', () => {
  test('use responsive Commons image variants instead of full originals', () => {
    for (const scene of READER_SCENES) {
      expect(scene.figure.src).toContain('Special:FilePath/');
      expect(scene.figure.src).toContain('?width=');
      expect(scene.figure.preloadSrc).toContain('?width=');
      expect(scene.figure.srcSet.split(',')).toHaveLength(5);
      expect(scene.figure.srcSet).toMatch(/\s\d+w/);
      expect(scene.figure.sizes.length).toBeGreaterThan(0);
    }
  });

  test('keep figure source pages separate from renderable image URLs', () => {
    for (const scene of READER_SCENES) {
      expect(scene.figure.sourceUrl).toContain('/wiki/File:');
      expect(scene.figure.sourceUrl).not.toBe(scene.figure.src);
    }
  });
});
