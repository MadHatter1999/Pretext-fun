// @vitest-environment jsdom

import { clearCache } from '@chenglou/pretext';
import { beforeAll, beforeEach, describe, expect, test } from 'vitest';

import { clearPreparedParagraphCache } from './pretextAdapter';
import {
  computeTightBubbleLayout,
  extractHeadlineText,
  fitHeadlineLayout,
} from './showcaseLayouts';

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
});

describe('extractHeadlineText', () => {
  test('pulls a compact first-sentence headline from a paragraph', () => {
    expect(
      extractHeadlineText(
        'Pineapple storms redraw the page every frame. The second sentence should not appear.',
      ),
    ).toBe('Pineapple storms redraw the page every frame');
  });
});

describe('fitHeadlineLayout', () => {
  test('fits a headline inside the requested bounds', () => {
    const result = fitHeadlineLayout({
      text: 'Animated pineapple currents reshape editorial text in real time.',
      fontFamily: 'Inter, sans-serif',
      maxWidth: 320,
      maxHeight: 160,
    });

    expect(result.height).toBeLessThanOrEqual(160);
    expect(result.lines.length).toBeGreaterThan(0);
    expect(result.fontSize).toBeGreaterThanOrEqual(24);
  });
});

describe('computeTightBubbleLayout', () => {
  test('returns a width based on the widest real line rather than the full max width', () => {
    const result = computeTightBubbleLayout({
      text: 'Tight bubbles should shrink around their true line lengths.',
      fontFamily: 'Inter, sans-serif',
      maxWidth: 260,
    });

    expect(result.width).toBeLessThan(300);
    expect(result.lines.length).toBeGreaterThan(0);
    expect(result.contentWidth).toBeLessThanOrEqual(result.width);
  });
});
