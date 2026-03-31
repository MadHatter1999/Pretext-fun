import {
  layout,
  layoutWithLines,
  prepareWithSegments,
  walkLineRanges,
  type LayoutLine,
  type PreparedTextWithSegments,
} from '@chenglou/pretext';

import { buildFontString, type WhiteSpaceMode } from './pretextAdapter';

export type HeadlineLine = {
  text: string;
  width: number;
  x: number;
  y: number;
};

export type HeadlineLayout = {
  text: string;
  font: string;
  fontSize: number;
  lineHeight: number;
  width: number;
  height: number;
  lines: HeadlineLine[];
};

export type TightBubbleLayout = {
  text: string;
  font: string;
  lineHeight: number;
  contentWidth: number;
  width: number;
  height: number;
  lines: LayoutLine[];
};

export const SHOWCASE_NOTES = [
  'Adaptive headline sizing fills the frame without ugly in-word breaks.',
  'Obstacle flow lets every line pick a fresh width as the stage keeps moving.',
  'Tight wrap bubbles collapse to the widest real line instead of a blunt max width.',
] as const;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeHeadlineText(text: string): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length === 0) {
    return 'Pineapple currents';
  }

  const firstSentence = normalized.split(/[.!?]/u)[0]?.trim() ?? normalized;
  const clipped = firstSentence.slice(0, 72).trim();
  return clipped.length > 0 ? clipped : normalized.slice(0, 72).trim();
}

function layoutHeadlineLines(
  prepared: PreparedTextWithSegments,
  maxWidth: number,
  lineHeight: number,
): HeadlineLine[] {
  const result = layoutWithLines(prepared, maxWidth, lineHeight);
  return result.lines.map((line, index) => ({
    text: line.text,
    width: line.width,
    x: 0,
    y: index * lineHeight,
  }));
}

export function fitHeadlineLayout(options: {
  text: string;
  fontFamily: string;
  maxWidth: number;
  maxHeight: number;
  minFontSize?: number;
  maxFontSize?: number;
  whiteSpace?: WhiteSpaceMode;
}): HeadlineLayout {
  const headlineText = normalizeHeadlineText(options.text);
  const maxWidth = clamp(options.maxWidth, 160, 1400);
  const maxHeight = clamp(options.maxHeight, 80, 480);
  const minFontSize = options.minFontSize ?? 24;
  const maxFontSize = options.maxFontSize ?? clamp(Math.floor(maxHeight * 0.66), 42, 120);
  const whiteSpace = options.whiteSpace ?? 'normal';

  let lo = minFontSize;
  let hi = maxFontSize;
  let best: HeadlineLayout | null = null;

  while (lo <= hi) {
    const fontSize = Math.floor((lo + hi) / 2);
    const lineHeight = Math.round(fontSize * 0.9);
    const font = buildFontString({
      fontFamily: options.fontFamily,
      fontSize,
      fontWeight: 800,
    });
    const prepared = prepareWithSegments(headlineText, font, { whiteSpace });

    let breaksWord = false;
    const lineCount = walkLineRanges(prepared, maxWidth, (line) => {
      if (line.end.graphemeIndex !== 0) {
        breaksWord = true;
      }
    });

    const height = lineCount * lineHeight;
    if (!breaksWord && height <= maxHeight && lineCount <= 4) {
      best = {
        text: headlineText,
        font,
        fontSize,
        lineHeight,
        width: maxWidth,
        height,
        lines: layoutHeadlineLines(prepared, maxWidth, lineHeight),
      };
      lo = fontSize + 1;
    } else {
      hi = fontSize - 1;
    }
  }

  if (best !== null) {
    return best;
  }

  const fallbackFont = buildFontString({
    fontFamily: options.fontFamily,
    fontSize: minFontSize,
    fontWeight: 800,
  });
  const fallbackLineHeight = Math.round(minFontSize * 0.92);
  const fallbackPrepared = prepareWithSegments(headlineText, fallbackFont, { whiteSpace });
  const fallbackResult = layoutWithLines(fallbackPrepared, maxWidth, fallbackLineHeight);

  return {
    text: headlineText,
    font: fallbackFont,
    fontSize: minFontSize,
    lineHeight: fallbackLineHeight,
    width: maxWidth,
    height: fallbackResult.height,
    lines: fallbackResult.lines.map((line, index) => ({
      text: line.text,
      width: line.width,
      x: 0,
      y: index * fallbackLineHeight,
    })),
  };
}

function collectWrapMetrics(
  prepared: PreparedTextWithSegments,
  maxWidth: number,
  lineHeight: number,
): {
  height: number;
  lineCount: number;
  maxLineWidth: number;
} {
  let maxLineWidth = 0;
  const lineCount = walkLineRanges(prepared, maxWidth, (line) => {
    if (line.width > maxLineWidth) {
      maxLineWidth = line.width;
    }
  });

  return {
    height: lineCount * lineHeight,
    lineCount,
    maxLineWidth,
  };
}

export function computeTightBubbleLayout(options: {
  text: string;
  fontFamily: string;
  maxWidth: number;
  fontSize?: number;
}): TightBubbleLayout {
  const fontSize = options.fontSize ?? 15;
  const lineHeight = Math.round(fontSize * 1.35);
  const font = buildFontString({
    fontFamily: options.fontFamily,
    fontSize,
    fontWeight: 600,
  });
  const prepared = prepareWithSegments(options.text, font);
  const initial = collectWrapMetrics(prepared, options.maxWidth, lineHeight);

  let lo = 1;
  let hi = Math.max(1, Math.ceil(options.maxWidth));

  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const lineCount = layout(prepared, mid, lineHeight).lineCount;
    if (lineCount <= initial.lineCount) {
      hi = mid;
    } else {
      lo = mid + 1;
    }
  }

  const result = layoutWithLines(prepared, lo, lineHeight);
  const metrics = collectWrapMetrics(prepared, lo, lineHeight);
  const horizontalPadding = 20;
  const verticalPadding = 16;

  return {
    text: options.text,
    font,
    lineHeight,
    contentWidth: Math.ceil(metrics.maxLineWidth),
    width: Math.ceil(metrics.maxLineWidth) + horizontalPadding * 2,
    height: result.height + verticalPadding * 2,
    lines: result.lines,
  };
}

export function createShowcaseBubbles(fontFamily: string, maxWidth: number): TightBubbleLayout[] {
  return SHOWCASE_NOTES.map((text) =>
    computeTightBubbleLayout({
      text,
      fontFamily,
      maxWidth,
    }),
  );
}

export function extractHeadlineText(text: string): string {
  return normalizeHeadlineText(text);
}
