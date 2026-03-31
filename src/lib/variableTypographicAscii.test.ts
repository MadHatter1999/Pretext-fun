// @vitest-environment jsdom

import { clearCache } from '@chenglou/pretext';
import { beforeAll, beforeEach, describe, expect, test } from 'vitest';

import { clearPreparedParagraphCache } from './pretextAdapter';
import {
  buildMeasuredAsciiGlyphSet,
  clearVariableTypographicAsciiCache,
  createVariableTypographicAsciiDemo,
  sampleBrightnessField,
} from './variableTypographicAscii';

type MockCanvasContext = {
  font: string;
  measureText: (text: string) => {
    width: number;
  };
};

const graphemeSegmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}\p{Regional_Indicator}\uFE0F]/u;
const cjkRegex = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u;
const bidiRegex = /[\p{Script=Arabic}\p{Script=Hebrew}]/u;

function parseFontSize(font: string): number {
  const match = font.match(/(\d+(?:\.\d+)?)px/u);
  return match ? Number(match[1]) : 16;
}

function getGraphemeWidth(segment: string): number {
  if (segment === '\n') {
    return 0;
  }

  if (emojiRegex.test(segment)) {
    return 2.5;
  }

  if (cjkRegex.test(segment)) {
    return 1.9;
  }

  if (bidiRegex.test(segment)) {
    return 1.15;
  }

  if (/\s/u.test(segment)) {
    return 0.45;
  }

  if (/[WM@#%&8QB]/u.test(segment)) {
    return 1.5;
  }

  if (/[.:,;!|iIl]/u.test(segment)) {
    return 0.58;
  }

  return 1;
}

function createMockCanvasContext(): MockCanvasContext {
  return {
    font: 'normal 400 16px Inter',
    measureText(text: string) {
      const scale = parseFontSize(this.font) / 16;
      let width = 0;

      for (const part of graphemeSegmenter.segment(text)) {
        width += getGraphemeWidth(part.segment);
      }

      return {
        width: width * scale,
      };
    },
  };
}

beforeAll(() => {
  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    configurable: true,
    value(contextId: string) {
      if (contextId !== '2d') {
        return null;
      }

      return createMockCanvasContext();
    },
  });
});

beforeEach(() => {
  clearCache();
  clearPreparedParagraphCache();
  clearVariableTypographicAsciiCache();
});

describe('sampleBrightnessField', () => {
  test('stays within a normalized range', () => {
    const values = [
      sampleBrightnessField(0, 0, 320, 240, 0),
      sampleBrightnessField(120, 80, 320, 240, 900),
      sampleBrightnessField(319, 239, 320, 240, 1800),
    ];

    expect(values.every((value) => value >= 0 && value <= 1)).toBe(true);
  });

  test('responds to an interactive attractor focus', () => {
    const passive = sampleBrightnessField(240, 60, 320, 240, 800);
    const focused = sampleBrightnessField(240, 60, 320, 240, 800, {
      focusX: 240 / 320,
      focusY: 60 / 240,
      pointerStrength: 1,
    });

    expect(focused).toBeGreaterThan(passive);
  });
});

describe('buildMeasuredAsciiGlyphSet', () => {
  test('captures wider and narrower glyphs for proportional character choice', () => {
    const glyphSet = buildMeasuredAsciiGlyphSet({
      characters: 'W.i ',
      fontFamily: 'Georgia, serif',
      fontSize: 14,
      fontWeight: 400,
    });

    const wideGlyph = glyphSet.glyphs.find((glyph) => glyph.char === 'W');
    const narrowGlyph = glyphSet.glyphs.find((glyph) => glyph.char === '.');

    expect(wideGlyph).toBeDefined();
    expect(narrowGlyph).toBeDefined();
    expect((wideGlyph?.width ?? 0) > (narrowGlyph?.width ?? 0)).toBe(true);
  });
});

describe('createVariableTypographicAsciiDemo', () => {
  test('builds proportional and monospace panels from the same field', () => {
    const demo = createVariableTypographicAsciiDemo({
      panelHeight: 240,
      panelWidth: 260,
      timeMs: 1200,
    });

    expect(demo.proportionalPanels).toHaveLength(6);
    expect(demo.monospacePanel.rows.length).toBeGreaterThan(0);
    expect(demo.sourceCells.length).toBeGreaterThan(0);
    expect(demo.proportionalPanels[0]?.rows[0]?.length).toBeGreaterThan(0);
  });

  test('increases source density when the field density is raised', () => {
    const sparse = createVariableTypographicAsciiDemo({
      field: { density: 0.8 },
      panelHeight: 240,
      panelWidth: 260,
      timeMs: 1200,
    });
    const dense = createVariableTypographicAsciiDemo({
      field: { density: 1.4 },
      panelHeight: 240,
      panelWidth: 260,
      timeMs: 1200,
    });

    expect(dense.sourceCells.length).toBeGreaterThan(sparse.sourceCells.length);
  });
});
