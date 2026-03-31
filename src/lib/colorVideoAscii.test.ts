import { describe, expect, test } from 'vitest';

import {
  buildCopyableAsciiSnapshot,
  buildStyledAsciiSnapshot,
  buildVideoAsciiFrame,
  computeVideoAsciiMetrics,
  pickAsciiCharacter,
  remapVideoPixel,
  type VideoAsciiSettings,
} from './colorVideoAscii';
import type { MeasuredAsciiGlyphSet } from './variableTypographicAscii';

const glyphSet: MeasuredAsciiGlyphSet = {
  font: 'normal 650 16px Inter',
  fontFamily: 'Inter, sans-serif',
  fontSize: 16,
  fontStyle: 'normal',
  fontWeight: 650,
  glyphs: [
    { brightness: 0, char: '@', width: 12 },
    { brightness: 0.45, char: 'x', width: 10 },
    { brightness: 0.82, char: '.', width: 6 },
    { brightness: 1, char: ' ', width: 4 },
  ],
  lineHeight: 14,
  nominalAdvance: 10,
};

const baseSettings: VideoAsciiSettings = {
  brightness: 0,
  colorBoost: 1.1,
  contrast: 1,
  density: 1,
  invert: false,
  renderMode: 'variable',
};

function buildFrame(width: number, height: number): Pick<ImageData, 'data' | 'height' | 'width'> {
  const data = new Uint8ClampedArray(width * height * 4);

  for (let index = 0; index < width * height; index += 1) {
    const pixelIndex = index * 4;
    const brightness = (index % width) / Math.max(1, width - 1);
    data[pixelIndex] = Math.round(40 + brightness * 180);
    data[pixelIndex + 1] = Math.round(30 + brightness * 160);
    data[pixelIndex + 2] = Math.round(20 + brightness * 120);
    data[pixelIndex + 3] = 255;
  }

  return {
    data,
    height,
    width,
  };
}

describe('computeVideoAsciiMetrics', () => {
  test('keeps the sampling grid within sane bounds', () => {
    const metrics = computeVideoAsciiMetrics(960, 540, 1.2, 11, 15);

    expect(metrics.columns).toBeGreaterThanOrEqual(26);
    expect(metrics.columns).toBeLessThanOrEqual(120);
    expect(metrics.rows).toBeGreaterThanOrEqual(18);
    expect(metrics.sampleWidth).toBeGreaterThan(metrics.columns);
  });
});

describe('remapVideoPixel', () => {
  test('returns clamped rgb values and normalized luminance', () => {
    const mapped = remapVideoPixel(240, 64, 32, {
      ...baseSettings,
      brightness: 0.1,
      colorBoost: 1.4,
      contrast: 1.3,
    });

    expect(mapped.red).toBeGreaterThanOrEqual(0);
    expect(mapped.red).toBeLessThanOrEqual(255);
    expect(mapped.green).toBeGreaterThanOrEqual(0);
    expect(mapped.green).toBeLessThanOrEqual(255);
    expect(mapped.blue).toBeGreaterThanOrEqual(0);
    expect(mapped.blue).toBeLessThanOrEqual(255);
    expect(mapped.luminance).toBeGreaterThanOrEqual(0);
    expect(mapped.luminance).toBeLessThanOrEqual(1);
  });
});

describe('pickAsciiCharacter', () => {
  test('maps darker samples to denser glyphs than bright samples', () => {
    const dark = pickAsciiCharacter(0.08);
    const bright = pickAsciiCharacter(0.96);

    expect(dark).not.toBe(' ');
    expect(bright).not.toBe(dark);
    expect(pickAsciiCharacter(1)).toBe(' ');
  });
});

describe('buildVideoAsciiFrame', () => {
  test('packs a variable-width frame that stays within the stage width', () => {
    const frame = buildVideoAsciiFrame({
      frame: buildFrame(24, 18),
      glyphSet,
      settings: baseSettings,
      stageHeight: 280,
      stageWidth: 420,
    });

    expect(frame.rows.length).toBeGreaterThan(0);
    expect(frame.maxRowWidth).toBeLessThanOrEqual(420);
    expect(frame.rows.some((row) => row.cells.length > 0)).toBe(true);
  });

  test('uses nominal advances in mono mode', () => {
    const frame = buildVideoAsciiFrame({
      frame: buildFrame(20, 16),
      glyphSet,
      settings: {
        ...baseSettings,
        renderMode: 'mono',
      },
      stageHeight: 240,
      stageWidth: 360,
    });

    const firstRow = frame.rows.find((row) => row.cells.length > 3);
    expect(firstRow).toBeDefined();
    expect(firstRow?.cells.every((cell) => cell.width === glyphSet.nominalAdvance)).toBe(true);
  });
});

describe('buildCopyableAsciiSnapshot', () => {
  test('builds a copy-ready monospaced block from the sampled frame', () => {
    const snapshot = buildCopyableAsciiSnapshot({
      columns: 12,
      frame: buildFrame(18, 12),
      rows: 6,
      settings: baseSettings,
    });

    expect(snapshot.rows).toHaveLength(6);
    expect(snapshot.rows.every((row) => row.length === 12)).toBe(true);
    expect(snapshot.text.split('\n')).toHaveLength(6);
  });
});

describe('buildStyledAsciiSnapshot', () => {
  test('rebuilds a styled text block from the rendered frame rows', () => {
    const frame = buildVideoAsciiFrame({
      frame: buildFrame(24, 18),
      glyphSet,
      settings: baseSettings,
      stageHeight: 280,
      stageWidth: 420,
    });
    const snapshot = buildStyledAsciiSnapshot(frame);

    expect(snapshot.rows).toHaveLength(frame.rows.length);
    expect(snapshot.text.split('\n')).toHaveLength(frame.rows.length);
    expect(
      snapshot.rows.some((row) =>
        row.segments.some((segment) => segment.color !== null && segment.text.length > 0),
      ),
    ).toBe(true);
  });
});
