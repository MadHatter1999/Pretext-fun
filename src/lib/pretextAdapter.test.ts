// @vitest-environment jsdom

import { clearCache } from '@chenglou/pretext';
import { beforeAll, beforeEach, describe, expect, test } from 'vitest';

import {
  buildFontString,
  clearPreparedParagraphCache,
  layoutParagraphFlow,
  layoutParagraphLines,
  measureParagraph,
  prepareParagraph,
  resolveFlowSlotAtY,
} from './pretextAdapter';

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

describe('buildFontString', () => {
  test('quotes multi-word font families and preserves generics', () => {
    expect(
      buildFontString({
        fontFamily: 'IBM Plex Sans, sans-serif',
        fontSize: 18,
      }),
    ).toBe('normal 400 18px "IBM Plex Sans", sans-serif');
  });

  test('rejects invalid font size values', () => {
    expect(() =>
      buildFontString({
        fontFamily: 'Inter',
        fontSize: 0,
      }),
    ).toThrow('Font size must be a positive number.');
  });
});

describe('prepareParagraph', () => {
  test('memoizes prepared output for the same text, font, and white-space mode', () => {
    const font = buildFontString({
      fontFamily: 'Inter, sans-serif',
      fontSize: 16,
    });

    const first = prepareParagraph({
      text: 'Cache me once.',
      font,
      whiteSpace: 'normal',
    });
    const second = prepareParagraph({
      text: 'Cache me once.',
      font,
      whiteSpace: 'normal',
    });

    expect(second).toBe(first);
  });
});

describe('layout adapter integration', () => {
  const font = buildFontString({
    fontFamily: 'Inter, sans-serif',
    fontSize: 16,
  });

  test('measures and lays out emoji-rich content', () => {
    const prepared = prepareParagraph({
      text: 'Ship it 🚀 now ✅ with extra sparkle ✨ and one more launch 🚀',
      font,
      whiteSpace: 'normal',
    });

    const measureResult = measureParagraph(prepared, 15, 20);
    const lineLayoutResult = layoutParagraphLines(prepared, 15, 20);

    expect(measureResult.lineCount).toBe(lineLayoutResult.lineCount);
    expect(lineLayoutResult.lines.some((line) => line.text.includes('🚀'))).toBe(true);
  });

  test('wraps mixed CJK text into multiple lines', () => {
    const prepared = prepareParagraph({
      text: '在东京的夜里，排版 quietly shifts as 幅が変わり、문장도 자연스럽게 다시 줄이 바뀝니다。',
      font,
      whiteSpace: 'normal',
    });

    const lineLayoutResult = layoutParagraphLines(prepared, 12, 20);

    expect(lineLayoutResult.lineCount).toBeGreaterThan(1);
    expect(lineLayoutResult.lines.some((line) => /東京|排版|문장/u.test(line.text))).toBe(true);
  });

  test('handles mixed bidi text without losing line content', () => {
    const prepared = prepareParagraph({
      text: 'Build 2.4 وصلت إلى دبي، ואז the team replied in English before العودة العربية.',
      font,
      whiteSpace: 'normal',
    });

    const lineLayoutResult = layoutParagraphLines(prepared, 16, 20);

    expect(lineLayoutResult.lineCount).toBeGreaterThan(1);
    expect(lineLayoutResult.lines.some((line) => /دبي|ואז/u.test(line.text))).toBe(true);
  });

  test('preserves explicit newlines in pre-wrap mode', () => {
    const prepared = prepareParagraph({
      text: 'alpha\nbeta\ngamma',
      font,
      whiteSpace: 'pre-wrap',
    });

    const measureResult = measureParagraph(prepared, 120, 22);
    const lineLayoutResult = layoutParagraphLines(prepared, 120, 22);

    expect(measureResult.lineCount).toBe(3);
    expect(lineLayoutResult.lines.map((line) => line.text)).toEqual(['alpha', 'beta', 'gamma']);
  });

  test('finds a narrower left or right slot when an obstacle overlaps a line', () => {
    const slot = resolveFlowSlotAtY(
      320,
      [
        {
          id: 'body',
          kind: 'body',
          left: 120,
          top: 80,
          width: 80,
          height: 120,
        },
      ],
      140,
    );

    expect(slot.width).toBeLessThan(320);
    expect(['left', 'right']).toContain(slot.side);
  });

  test('routes text around obstacles with per-line x offsets', () => {
    const prepared = prepareParagraph({
      text:
        'Pretext lets this sentence dodge a pineapple instead of pretending every line has the same width. ' +
        'The routed layout should keep bending as the obstacle interrupts the paragraph over and over again.',
      font,
      whiteSpace: 'normal',
    });

    const flowResult = layoutParagraphFlow(
      prepared,
      180,
      22,
      [
        {
          id: 'body',
          kind: 'body',
          left: 72,
          top: 60,
          width: 92,
          height: 150,
        },
      ],
      {
        topPadding: 40,
        bottomPadding: 32,
      },
    );

    expect(flowResult.lineCount).toBeGreaterThan(0);
    expect(flowResult.lines[0]?.text.length).toBeGreaterThan(0);
    expect(flowResult.stageHeight).toBeGreaterThan(flowResult.height);
  });
});
