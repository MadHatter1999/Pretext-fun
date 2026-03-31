import {
  layout,
  layoutNextLine,
  layoutWithLines,
  prepare,
  prepareWithSegments,
  type LayoutCursor,
  type LayoutLine,
  type LayoutLinesResult,
  type LayoutResult,
  type PreparedText,
  type PreparedTextWithSegments,
} from '@chenglou/pretext';

export type WhiteSpaceMode = 'normal' | 'pre-wrap';

export type FontDescriptor = {
  fontFamily: string;
  fontSize: number;
  fontStyle?: 'normal' | 'italic';
  fontWeight?: number | 'normal' | 'bold' | 'lighter' | 'bolder';
};

export type PrepareParagraphInput = {
  text: string;
  font: string;
  whiteSpace: WhiteSpaceMode;
};

export type PreparedParagraph = PrepareParagraphInput & {
  cacheKey: string;
  measured: PreparedText;
  segmented: PreparedTextWithSegments;
};

export type FlowObstacle = {
  id: string;
  kind: 'body' | 'leaf' | 'ring' | 'slice';
  left: number;
  top: number;
  width: number;
  height: number;
};

export type FlowSlot = {
  x: number;
  width: number;
  side: 'full' | 'left' | 'right';
};

export type FlowLine = {
  text: string;
  width: number;
  x: number;
  y: number;
  availableWidth: number;
  slotSide: FlowSlot['side'];
  start: LayoutCursor;
  end: LayoutCursor;
};

export type FlowLayoutResult = {
  lineCount: number;
  height: number;
  stageHeight: number;
  lines: FlowLine[];
};

const GENERIC_FONT_FAMILIES = new Set([
  'serif',
  'sans-serif',
  'monospace',
  'cursive',
  'fantasy',
  'system-ui',
  'ui-serif',
  'ui-sans-serif',
  'ui-monospace',
  'emoji',
  'math',
  'fangsong',
]);

const preparedParagraphCache = new Map<string, PreparedParagraph>();

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown layout error.';
}

function normalizeFontFamilyToken(token: string): string {
  const trimmed = token.trim();
  if (trimmed.length === 0) {
    throw new Error('Font family names cannot be empty.');
  }

  if (
    trimmed.startsWith('"') ||
    trimmed.startsWith('\'') ||
    GENERIC_FONT_FAMILIES.has(trimmed.toLowerCase()) ||
    !/\s/.test(trimmed)
  ) {
    return trimmed;
  }

  return `"${trimmed.replace(/"/g, '\\"')}"`;
}

function normalizeFontFamily(fontFamily: string): string {
  const tokens = fontFamily
    .split(',')
    .map((token) => token.trim())
    .filter((token) => token.length > 0);

  if (tokens.length === 0) {
    throw new Error('Enter a font family such as Inter or "IBM Plex Sans".');
  }

  return tokens.map(normalizeFontFamilyToken).join(', ');
}

function assertPositiveNumber(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be a positive number.`);
  }
}

export function buildFontString({
  fontFamily,
  fontSize,
  fontStyle = 'normal',
  fontWeight = 400,
}: FontDescriptor): string {
  assertPositiveNumber(fontSize, 'Font size');

  const normalizedFamily = normalizeFontFamily(fontFamily);
  const normalizedWeight =
    typeof fontWeight === 'number' ? String(fontWeight) : fontWeight.trim() || '400';
  const normalizedStyle = fontStyle.trim() || 'normal';

  return `${normalizedStyle} ${normalizedWeight} ${fontSize}px ${normalizedFamily}`;
}

function buildPrepareCacheKey({ text, font, whiteSpace }: PrepareParagraphInput): string {
  return [text, font, whiteSpace].join('\u241f');
}

export function clearPreparedParagraphCache(): void {
  preparedParagraphCache.clear();
}

export function prepareParagraph(input: PrepareParagraphInput): PreparedParagraph {
  const cacheKey = buildPrepareCacheKey(input);
  const cached = preparedParagraphCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const options = { whiteSpace: input.whiteSpace };
    const preparedParagraph: PreparedParagraph = {
      ...input,
      cacheKey,
      measured: prepare(input.text, input.font, options),
      segmented: prepareWithSegments(input.text, input.font, options),
    };

    preparedParagraphCache.set(cacheKey, preparedParagraph);
    return preparedParagraph;
  } catch (error) {
    throw new Error(`Unable to prepare text layout: ${getErrorMessage(error)}`);
  }
}

export function measureParagraph(
  preparedParagraph: PreparedParagraph,
  width: number,
  lineHeight: number,
): LayoutResult {
  assertPositiveNumber(width, 'Width');
  assertPositiveNumber(lineHeight, 'Line height');

  try {
    return layout(preparedParagraph.measured, width, lineHeight);
  } catch (error) {
    throw new Error(`Unable to measure the paragraph: ${getErrorMessage(error)}`);
  }
}

export function layoutParagraphLines(
  preparedParagraph: PreparedParagraph,
  width: number,
  lineHeight: number,
): LayoutLinesResult {
  assertPositiveNumber(width, 'Width');
  assertPositiveNumber(lineHeight, 'Line height');

  try {
    return layoutWithLines(preparedParagraph.segmented, width, lineHeight);
  } catch (error) {
    throw new Error(`Unable to lay out paragraph lines: ${getErrorMessage(error)}`);
  }
}

function getObstacleSpanAtY(obstacle: FlowObstacle, centerY: number): {
  left: number;
  right: number;
} | null {
  const radiusX = obstacle.width / 2;
  const radiusY = obstacle.height / 2;
  const ellipseCenterX = obstacle.left + radiusX;
  const ellipseCenterY = obstacle.top + radiusY;
  const dy = Math.abs(centerY - ellipseCenterY);

  if (dy >= radiusY) {
    return null;
  }

  const dx = radiusX * Math.sqrt(1 - (dy * dy) / (radiusY * radiusY));
  return {
    left: ellipseCenterX - dx,
    right: ellipseCenterX + dx,
  };
}

function mergeSpans(
  stageWidth: number,
  spans: Array<{
    left: number;
    right: number;
  }>,
): Array<{
  left: number;
  right: number;
}> {
  const normalized = spans
    .map((span) => ({
      left: Math.max(0, Math.min(stageWidth, span.left)),
      right: Math.max(0, Math.min(stageWidth, span.right)),
    }))
    .filter((span) => span.right > span.left)
    .sort((leftSpan, rightSpan) => leftSpan.left - rightSpan.left);

  const merged: Array<{
    left: number;
    right: number;
  }> = [];

  for (const span of normalized) {
    const previous = merged.at(-1);
    if (!previous || span.left > previous.right) {
      merged.push(span);
      continue;
    }

    previous.right = Math.max(previous.right, span.right);
  }

  return merged;
}

export function resolveFlowSlotAtY(
  stageWidth: number,
  obstacles: FlowObstacle[],
  centerY: number,
): FlowSlot {
  assertPositiveNumber(stageWidth, 'Width');

  const spans = mergeSpans(
    stageWidth,
    obstacles
      .map((obstacle) => getObstacleSpanAtY(obstacle, centerY))
      .filter((span): span is { left: number; right: number } => span !== null),
  );

  if (spans.length === 0) {
    return {
      x: 0,
      width: stageWidth,
      side: 'full',
    };
  }

  const slots: FlowSlot[] = [];
  let cursor = 0;
  for (const span of spans) {
    if (span.left > cursor) {
      slots.push({
        x: cursor,
        width: span.left - cursor,
        side: cursor === 0 ? 'left' : 'right',
      });
    }

    cursor = Math.max(cursor, span.right);
  }

  if (cursor < stageWidth) {
    slots.push({
      x: cursor,
      width: stageWidth - cursor,
      side: slots.length === 0 ? 'full' : 'right',
    });
  }

  const widest = slots.reduce<FlowSlot | null>((bestSlot, slot) => {
    if (bestSlot === null || slot.width > bestSlot.width) {
      return slot;
    }

    return bestSlot;
  }, null);

  return (
    widest ?? {
      x: 0,
      width: stageWidth,
      side: 'full',
    }
  );
}

function isSameCursor(leftCursor: LayoutCursor, rightCursor: LayoutCursor): boolean {
  return (
    leftCursor.segmentIndex === rightCursor.segmentIndex &&
    leftCursor.graphemeIndex === rightCursor.graphemeIndex
  );
}

function toFlowLine(line: LayoutLine, slot: FlowSlot, y: number): FlowLine {
  return {
    text: line.text,
    width: line.width,
    x: slot.x,
    y,
    availableWidth: slot.width,
    slotSide: slot.side,
    start: line.start,
    end: line.end,
  };
}

export function layoutParagraphFlow(
  preparedParagraph: PreparedParagraph,
  width: number,
  lineHeight: number,
  obstacles: FlowObstacle[],
  options?: {
    topPadding?: number;
    bottomPadding?: number;
  },
): FlowLayoutResult {
  assertPositiveNumber(width, 'Width');
  assertPositiveNumber(lineHeight, 'Line height');

  const topPadding = options?.topPadding ?? lineHeight * 2;
  const bottomPadding = options?.bottomPadding ?? lineHeight * 2;
  const lines: FlowLine[] = [];

  try {
    let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };
    let y = topPadding;

    while (true) {
      const slot = resolveFlowSlotAtY(width, obstacles, y + lineHeight / 2);
      const nextLine = layoutNextLine(preparedParagraph.segmented, cursor, Math.max(slot.width, 1));
      if (nextLine === null) {
        break;
      }

      lines.push(toFlowLine(nextLine, slot, y));

      if (isSameCursor(cursor, nextLine.end)) {
        break;
      }

      cursor = nextLine.end;
      y += lineHeight;
    }

    const obstacleBottom = obstacles.reduce(
      (maxBottom, obstacle) => Math.max(maxBottom, obstacle.top + obstacle.height),
      0,
    );
    const contentBottom =
      lines.length > 0 ? lines[lines.length - 1]!.y + lineHeight : topPadding;

    return {
      lineCount: lines.length,
      height: lines.length * lineHeight,
      stageHeight: Math.max(contentBottom + bottomPadding, obstacleBottom + bottomPadding),
      lines,
    };
  } catch (error) {
    throw new Error(`Unable to route paragraph flow: ${getErrorMessage(error)}`);
  }
}
