import {
  buildFontString,
  layoutParagraphLines,
  prepareParagraph,
  type WhiteSpaceMode,
} from './pretextAdapter';

export type AsciiGlyphMetric = {
  brightness: number;
  char: string;
  width: number;
};

export type MeasuredAsciiGlyphSet = {
  font: string;
  fontFamily: string;
  fontSize: number;
  fontStyle: 'normal' | 'italic';
  fontWeight: number;
  glyphs: AsciiGlyphMetric[];
  lineHeight: number;
  nominalAdvance: number;
};

export type AsciiPanel = {
  font: string;
  fontFamily: string;
  fontSize: number;
  fontStyle: 'normal' | 'italic';
  fontWeight: number;
  label: string;
  lineHeight: number;
  maxRowWidth: number;
  rows: string[];
};

export type AsciiSourceCell = {
  radius: number;
  value: number;
  x: number;
  y: number;
};

export type AsciiFieldControls = {
  density: number;
  energy: number;
  focusX: number;
  focusY: number;
  mode: 'nebula' | 'ripple' | 'vortex';
  pointerStrength: number;
};

export type VariableTypographicAsciiDemo = {
  field: AsciiFieldControls;
  monospacePanel: AsciiPanel;
  panelHeight: number;
  panelWidth: number;
  proportionalPanels: AsciiPanel[];
  sourceCells: AsciiSourceCell[];
};

const DEFAULT_ASCII_RAMP =
  '@#WM%B8&$Q0OCLJUYXzcvunxrjft/|()1{}[]?-_+~<>i!lI;:,"^`\'. ';
const DEFAULT_WHITE_SPACE: WhiteSpaceMode = 'pre-wrap';
const glyphMeasurementCache = new Map<string, MeasuredAsciiGlyphSet>();

export function clearVariableTypographicAsciiCache(): void {
  glyphMeasurementCache.clear();
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function resolveAsciiFieldControls(controls?: Partial<AsciiFieldControls>): AsciiFieldControls {
  return {
    density: clamp(controls?.density ?? 1, 0.72, 1.55),
    energy: clamp(controls?.energy ?? 1, 0.35, 1.8),
    focusX: clamp(controls?.focusX ?? 0.5, 0, 1),
    focusY: clamp(controls?.focusY ?? 0.5, 0, 1),
    mode: controls?.mode ?? 'nebula',
    pointerStrength: clamp(controls?.pointerStrength ?? 0, 0, 1),
  };
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = clamp((value - edge0) / Math.max(0.0001, edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function buildGlyphSetCacheKey(options: {
  characters: string;
  fontFamily: string;
  fontSize: number;
  fontStyle: 'normal' | 'italic';
  fontWeight: number;
  lineHeight: number;
}): string {
  return [
    options.characters,
    options.fontFamily,
    options.fontSize,
    options.fontStyle,
    options.fontWeight,
    options.lineHeight,
  ].join('\u241f');
}

function getUniqueCharacters(characters: string): string[] {
  return Array.from(new Set(characters.split('')));
}

function getMedian(values: number[]): number {
  const sorted = [...values].sort((left, right) => left - right);
  if (sorted.length === 0) {
    return 0;
  }

  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1]! + sorted[middle]!) / 2;
  }

  return sorted[middle]!;
}

function measureGlyphWidth(char: string, font: string, lineHeight: number): number {
  const prepared = prepareParagraph({
    text: char,
    font,
    whiteSpace: DEFAULT_WHITE_SPACE,
  });
  const layout = layoutParagraphLines(prepared, Math.max(64, lineHeight * 4), lineHeight);

  return layout.lines[0]?.width ?? 0;
}

export function buildMeasuredAsciiGlyphSet(options: {
  characters?: string;
  fontFamily: string;
  fontSize: number;
  fontStyle?: 'normal' | 'italic';
  fontWeight?: number;
  lineHeight?: number;
}): MeasuredAsciiGlyphSet {
  const characters = options.characters ?? DEFAULT_ASCII_RAMP;
  const fontStyle = options.fontStyle ?? 'normal';
  const fontWeight = options.fontWeight ?? 400;
  const lineHeight = options.lineHeight ?? Math.round(options.fontSize * 0.86);
  const cacheKey = buildGlyphSetCacheKey({
    characters,
    fontFamily: options.fontFamily,
    fontSize: options.fontSize,
    fontStyle,
    fontWeight,
    lineHeight,
  });
  const cached = glyphMeasurementCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  const font = buildFontString({
    fontFamily: options.fontFamily,
    fontSize: options.fontSize,
    fontStyle,
    fontWeight,
  });
  const uniqueCharacters = getUniqueCharacters(characters);
  const glyphs = uniqueCharacters
    .map((char, index) => ({
      brightness: index / Math.max(1, uniqueCharacters.length - 1),
      char,
      width: measureGlyphWidth(char, font, lineHeight),
    }))
    .filter((glyph) => glyph.width > 0);
  const nominalAdvance = getMedian(glyphs.map((glyph) => glyph.width));

  const measured: MeasuredAsciiGlyphSet = {
    font,
    fontFamily: options.fontFamily,
    fontSize: options.fontSize,
    fontStyle,
    fontWeight,
    glyphs,
    lineHeight,
    nominalAdvance,
  };

  glyphMeasurementCache.set(cacheKey, measured);
  return measured;
}

export function sampleBrightnessField(
  x: number,
  y: number,
  width: number,
  height: number,
  timeMs: number,
  controls?: Partial<AsciiFieldControls>,
): number {
  const field = resolveAsciiFieldControls(controls);
  const nx = x / Math.max(1, width);
  const ny = y / Math.max(1, height);
  const t = (timeMs / 1000) * field.energy;

  const blobs = [
    {
      radius: 0.14 + field.energy * 0.02,
      strength: 1.1 + field.energy * 0.08,
      x: 0.3 + Math.sin(t * 0.72) * 0.11,
      y: 0.36 + Math.cos(t * 0.91) * 0.14,
    },
    {
      radius: 0.17 + field.energy * 0.02,
      strength: 1 + field.energy * 0.07,
      x: 0.72 + Math.cos(t * 0.54) * 0.1,
      y: 0.28 + Math.sin(t * 0.76) * 0.12,
    },
    {
      radius: 0.2 + field.energy * 0.02,
      strength: 0.9 + field.energy * 0.05,
      x: 0.56 + Math.sin(t * 0.48 + 1.6) * 0.13,
      y: 0.74 + Math.cos(t * 0.64 + 0.8) * 0.11,
    },
  ];

  let value = 0.05;

  for (const blob of blobs) {
    const dx = nx - blob.x;
    const dy = ny - blob.y;
    const distanceSquared = dx * dx + dy * dy;
    value += blob.strength * Math.exp(-distanceSquared / (blob.radius * blob.radius * 2));
  }

  const autoAttractorX = 0.5 + Math.cos(t * 0.37) * 0.08;
  const autoAttractorY = 0.52 + Math.sin(t * 0.51) * 0.1;
  const attractorX =
    autoAttractorX * (1 - field.pointerStrength) + field.focusX * field.pointerStrength;
  const attractorY =
    autoAttractorY * (1 - field.pointerStrength) + field.focusY * field.pointerStrength;
  const attractorDistance = Math.hypot(nx - attractorX, ny - attractorY);
  value +=
    (0.22 + field.energy * 0.08 + field.pointerStrength * 0.16) /
    (0.16 + attractorDistance * (2.8 - field.density * 0.25));

  value +=
    ((Math.sin(nx * (7.8 * field.density) + t * 1.7) +
      Math.cos(ny * (8.6 * field.density) - t * 1.2) +
      2) /
      4) *
    (0.11 + field.energy * 0.03);

  const swirl =
    Math.sin((nx - attractorX) * (15 * field.density) + t * 1.3) *
    Math.cos((ny - attractorY) * (12 * field.density) - t * 1.1);
  value += ((swirl + 1) / 2) * 0.08 * (0.4 + field.pointerStrength);

  if (field.mode === 'vortex') {
    const angle = Math.atan2(ny - attractorY, nx - attractorX);
    const ring = Math.sin(angle * 5 + attractorDistance * 28 - t * 3.4);
    value += ((ring + 1) / 2) * 0.22;
  } else if (field.mode === 'ripple') {
    const ring = Math.sin(attractorDistance * 36 - t * 4.6);
    value += ((ring + 1) / 2) * 0.28 * (0.55 + field.pointerStrength * 0.45);
  } else {
    const mist =
      Math.sin(nx * (4.5 + field.density * 1.4) - t * 1.2) *
      Math.sin(ny * (6.4 + field.density * 1.8) + t * 0.8);
    value += ((mist + 1) / 2) * 0.16;
  }

  const normalized = clamp(value / 2.55, 0, 1);
  return smoothstep(0.08, 0.96, normalized);
}

export function buildSourceCells(options: {
  cols: number;
  field?: Partial<AsciiFieldControls>;
  height: number;
  rows: number;
  timeMs: number;
  width: number;
}): AsciiSourceCell[] {
  const cells: AsciiSourceCell[] = [];
  const stepX = options.width / Math.max(1, options.cols);
  const stepY = options.height / Math.max(1, options.rows);
  const radius = Math.min(stepX, stepY) * 0.36;

  for (let rowIndex = 0; rowIndex < options.rows; rowIndex += 1) {
    for (let columnIndex = 0; columnIndex < options.cols; columnIndex += 1) {
      const x = columnIndex * stepX + stepX / 2;
      const y = rowIndex * stepY + stepY / 2;
      cells.push({
        radius,
        value: sampleBrightnessField(x, y, options.width, options.height, options.timeMs, options.field),
        x,
        y,
      });
    }
  }

  return cells;
}

export function pickAsciiGlyph(
  glyphs: AsciiGlyphMetric[],
  brightness: number,
  targetWidth: number,
  options?: {
    previousChar?: string;
    repeatCount?: number;
  },
): AsciiGlyphMetric {
  const repeatCount = options?.repeatCount ?? 0;
  const previousChar = options?.previousChar;
  const nearbyGlyphs = glyphs.filter((glyph) => Math.abs(glyph.brightness - brightness) <= 0.16);
  const candidateGlyphs = nearbyGlyphs.length >= 4 ? nearbyGlyphs : glyphs;

  let bestGlyph = candidateGlyphs[0]!;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const glyph of candidateGlyphs) {
    const brightnessScore = Math.abs(glyph.brightness - brightness) * 3.4;
    const widthScore = Math.abs(glyph.width - targetWidth) / Math.max(1, targetWidth);
    const whitespacePenalty =
      glyph.char === ' ' ? (brightness > 0.88 ? 0.02 : 0.4 + (0.88 - brightness) * 0.35) : 0;
    const repetitionPenalty =
      glyph.char === previousChar ? 0.14 + repeatCount * 0.06 : 0;
    const score = brightnessScore + widthScore * 0.28 + whitespacePenalty + repetitionPenalty;

    if (score < bestScore) {
      bestGlyph = glyph;
      bestScore = score;
    }
  }

  return bestGlyph;
}

export function buildAsciiRows(options: {
  field?: Partial<AsciiFieldControls>;
  glyphSet: MeasuredAsciiGlyphSet;
  height: number;
  timeMs: number;
  width: number;
}): {
  maxRowWidth: number;
  rows: string[];
} {
  const rows: string[] = [];
  const rowCount = Math.max(1, Math.floor(options.height / options.glyphSet.lineHeight));
  const columnCount = clamp(
    Math.floor(options.width / Math.max(4, options.glyphSet.nominalAdvance * 0.92)),
    22,
    112,
  );
  const cellWidth = options.width / columnCount;
  let maxRowWidth = 0;

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    const y = rowIndex * options.glyphSet.lineHeight + options.glyphSet.lineHeight * 0.72;
    let row = '';
    let rowWidth = 0;
    let previousChar: string | undefined;
    let repeatCount = 0;

    for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
      const x = columnIndex * cellWidth + cellWidth / 2;
      const brightness = sampleBrightnessField(
        x,
        y,
        options.width,
        options.height,
        options.timeMs,
        options.field,
      );
      const glyph = pickAsciiGlyph(
        options.glyphSet.glyphs,
        brightness,
        cellWidth,
        {
          previousChar,
          repeatCount,
        },
      );
      const nextWidth = glyph.width > 0 ? glyph.width : options.glyphSet.nominalAdvance;
      row += glyph.char;
      rowWidth += nextWidth;
      repeatCount = glyph.char === previousChar ? repeatCount + 1 : 0;
      previousChar = glyph.char;
    }

    rows.push(row);
    maxRowWidth = Math.max(maxRowWidth, rowWidth);
  }

  return {
    maxRowWidth,
    rows,
  };
}

function buildAsciiPanel(options: {
  field?: Partial<AsciiFieldControls>;
  fontFamily: string;
  fontSize: number;
  fontStyle: 'normal' | 'italic';
  fontWeight: number;
  height: number;
  label: string;
  timeMs: number;
  width: number;
}): AsciiPanel {
  const glyphSet = buildMeasuredAsciiGlyphSet({
    fontFamily: options.fontFamily,
    fontSize: options.fontSize,
    fontStyle: options.fontStyle,
    fontWeight: options.fontWeight,
  });
  const rows = buildAsciiRows({
    field: options.field,
    glyphSet,
    height: options.height,
    timeMs: options.timeMs,
    width: options.width,
  });

  return {
    font: glyphSet.font,
    fontFamily: options.fontFamily,
    fontSize: glyphSet.fontSize,
    fontStyle: glyphSet.fontStyle,
    fontWeight: glyphSet.fontWeight,
    label: options.label,
    lineHeight: glyphSet.lineHeight,
    maxRowWidth: rows.maxRowWidth,
    rows: rows.rows,
  };
}

export function createVariableTypographicAsciiDemo(options: {
  field?: Partial<AsciiFieldControls>;
  panelHeight: number;
  panelWidth: number;
  timeMs: number;
}): VariableTypographicAsciiDemo {
  const field = resolveAsciiFieldControls(options.field);
  const proportionalPanelHeight = Math.max(44, Math.floor((options.panelHeight - 40) / 6));
  const proportionalFontSize = clamp(Math.round(options.panelWidth / (23 * field.density)), 9, 15);
  const monospaceFontSize = clamp(Math.round(options.panelWidth / (24 * field.density)), 9, 14);
  const proportionalSpecs = [
    { fontStyle: 'normal' as const, fontWeight: 400, label: '400 roman' },
    { fontStyle: 'italic' as const, fontWeight: 400, label: '400 italic' },
    { fontStyle: 'normal' as const, fontWeight: 600, label: '600 roman' },
    { fontStyle: 'italic' as const, fontWeight: 600, label: '600 italic' },
    { fontStyle: 'normal' as const, fontWeight: 800, label: '800 roman' },
    { fontStyle: 'italic' as const, fontWeight: 800, label: '800 italic' },
  ];

  return {
    field,
    monospacePanel: buildAsciiPanel({
      field,
      fontFamily: 'Consolas, "Courier New", monospace',
      fontSize: monospaceFontSize,
      fontStyle: 'normal',
      fontWeight: 400,
      height: options.panelHeight,
      label: '400 mono',
      timeMs: options.timeMs,
      width: options.panelWidth,
    }),
    panelHeight: options.panelHeight,
    panelWidth: options.panelWidth,
    proportionalPanels: proportionalSpecs.map((spec) =>
      buildAsciiPanel({
        field,
        fontFamily: 'Georgia, serif',
        fontSize: proportionalFontSize,
        fontStyle: spec.fontStyle,
        fontWeight: spec.fontWeight,
        height: proportionalPanelHeight,
        label: spec.label,
        timeMs: options.timeMs,
        width: options.panelWidth,
      }),
    ),
    sourceCells: buildSourceCells({
      cols: clamp(Math.floor((options.panelWidth / 16) * field.density), 16, 42),
      field,
      height: options.panelHeight,
      rows: clamp(Math.floor((options.panelHeight / 16) * field.density), 12, 32),
      timeMs: options.timeMs,
      width: options.panelWidth,
    }),
  };
}
