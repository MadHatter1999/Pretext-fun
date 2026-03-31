import {
  buildMeasuredAsciiGlyphSet,
  pickAsciiGlyph,
  type MeasuredAsciiGlyphSet,
} from './variableTypographicAscii';

export type VideoAsciiRenderMode = 'mono' | 'variable';

export type VideoAsciiMetrics = {
  cellHeight: number;
  cellWidth: number;
  columns: number;
  fontSize: number;
  rows: number;
  sampleHeight: number;
  sampleWidth: number;
};

export type VideoAsciiCell = {
  blue: number;
  char: string;
  green: number;
  red: number;
  width: number;
  x: number;
};

export type VideoAsciiTextRun = {
  color: string | null;
  text: string;
};

export type VideoAsciiTextRow = {
  segments: VideoAsciiTextRun[];
  text: string;
  width: number;
};

export type VideoAsciiFrame = {
  maxRowWidth: number;
  rows: Array<{
    cells: VideoAsciiCell[];
    width: number;
    y: number;
  }>;
};

export type VideoAsciiSettings = {
  brightness: number;
  colorBoost: number;
  contrast: number;
  density: number;
  invert: boolean;
  renderMode: VideoAsciiRenderMode;
};

export type CopyableAsciiSnapshot = {
  rows: string[];
  text: string;
};

export type StyledAsciiSnapshot = {
  rows: VideoAsciiTextRow[];
  text: string;
};

const ASCII_RAMP = '@#W$9876543210?!abc;:+=-,._ ';

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function samplePixel(
  frame: Pick<ImageData, 'data' | 'height' | 'width'>,
  normalizedX: number,
  normalizedY: number,
): {
  blue: number;
  green: number;
  red: number;
} {
  const x = clamp(normalizedX, 0, 0.9999) * Math.max(1, frame.width - 1);
  const y = clamp(normalizedY, 0, 0.9999) * Math.max(1, frame.height - 1);
  const startX = Math.floor(x);
  const startY = Math.floor(y);
  let red = 0;
  let green = 0;
  let blue = 0;
  let samples = 0;

  for (let offsetY = 0; offsetY < 2; offsetY += 1) {
    const sampleY = Math.min(frame.height - 1, startY + offsetY);
    for (let offsetX = 0; offsetX < 2; offsetX += 1) {
      const sampleX = Math.min(frame.width - 1, startX + offsetX);
      const index = (sampleY * frame.width + sampleX) * 4;
      red += frame.data[index] ?? 0;
      green += frame.data[index + 1] ?? 0;
      blue += frame.data[index + 2] ?? 0;
      samples += 1;
    }
  }

  return {
    blue: Math.round(blue / Math.max(1, samples)),
    green: Math.round(green / Math.max(1, samples)),
    red: Math.round(red / Math.max(1, samples)),
  };
}

function quantizeChannel(value: number, step = 24): number {
  return clamp(Math.round(value / step) * step, 0, 255);
}

export function resolveVideoAsciiFontSize(displayWidth: number, density: number): number {
  const safeDensity = clamp(density, 0.72, 1.55);
  return clamp(Math.round(displayWidth / (58 + safeDensity * 8)), 10, 20);
}

export function buildVideoAsciiGlyphSet(options: {
  density: number;
  displayWidth: number;
  fontFamily?: string;
  renderMode: VideoAsciiRenderMode;
}): MeasuredAsciiGlyphSet {
  const fontSize = resolveVideoAsciiFontSize(options.displayWidth, options.density);
  return buildMeasuredAsciiGlyphSet({
    characters: ASCII_RAMP,
    fontFamily:
      options.fontFamily ??
      (options.renderMode === 'variable'
        ? '"Inter Variable", Inter, sans-serif'
        : 'Consolas, "Courier New", monospace'),
    fontSize,
    fontStyle: 'normal',
    fontWeight: options.renderMode === 'variable' ? 650 : 400,
    lineHeight:
      options.renderMode === 'variable' ? Math.round(fontSize * 0.9) : Math.round(fontSize * 0.94),
  });
}

export function computeVideoAsciiMetrics(
  displayWidth: number,
  displayHeight: number,
  density: number,
  nominalAdvance = 10,
  lineHeight = 14,
): VideoAsciiMetrics {
  const safeDensity = clamp(density, 0.72, 1.55);
  const tunedAdvance = Math.max(4, nominalAdvance * (1.06 / safeDensity));
  const columns = clamp(Math.floor(displayWidth / tunedAdvance), 26, 120);
  const rows = clamp(Math.floor(displayHeight / Math.max(10, lineHeight)), 18, 80);
  const cellWidth = displayWidth / columns;
  const cellHeight = displayHeight / rows;
  const fontSize = clamp(Math.round(lineHeight / 0.92), 10, 22);

  return {
    cellHeight,
    cellWidth,
    columns,
    fontSize,
    rows,
    sampleHeight: clamp(rows, 18, 80),
    sampleWidth: clamp(columns * 2, 72, 256),
  };
}

export function remapVideoPixel(
  red: number,
  green: number,
  blue: number,
  settings: VideoAsciiSettings,
): {
  blue: number;
  green: number;
  luminance: number;
  red: number;
} {
  const contrast = settings.contrast;
  const brightness = settings.brightness;
  const colorBoost = settings.colorBoost;
  const normalizedRed = red / 255;
  const normalizedGreen = green / 255;
  const normalizedBlue = blue / 255;

  const average = (normalizedRed + normalizedGreen + normalizedBlue) / 3;
  const boostedRed = average + (normalizedRed - average) * colorBoost;
  const boostedGreen = average + (normalizedGreen - average) * colorBoost;
  const boostedBlue = average + (normalizedBlue - average) * colorBoost;

  const adjustedRed = clamp((boostedRed - 0.5) * contrast + 0.5 + brightness, 0, 1);
  const adjustedGreen = clamp((boostedGreen - 0.5) * contrast + 0.5 + brightness, 0, 1);
  const adjustedBlue = clamp((boostedBlue - 0.5) * contrast + 0.5 + brightness, 0, 1);
  const luminance = clamp(
    adjustedRed * 0.2126 + adjustedGreen * 0.7152 + adjustedBlue * 0.0722,
    0,
    1,
  );

  return {
    blue: Math.round(adjustedBlue * 255),
    green: Math.round(adjustedGreen * 255),
    luminance: settings.invert ? 1 - luminance : luminance,
    red: Math.round(adjustedRed * 255),
  };
}

export function pickAsciiCharacter(luminance: number): string {
  const index = clamp(
    Math.round(clamp(luminance, 0, 1) * (ASCII_RAMP.length - 1)),
    0,
    ASCII_RAMP.length - 1,
  );
  return ASCII_RAMP[index] ?? ' ';
}

export function buildVideoAsciiFrame(options: {
  frame: Pick<ImageData, 'data' | 'height' | 'width'>;
  glyphSet: MeasuredAsciiGlyphSet;
  settings: VideoAsciiSettings;
  stageHeight: number;
  stageWidth: number;
}): VideoAsciiFrame {
  const metrics = computeVideoAsciiMetrics(
    options.stageWidth,
    options.stageHeight,
    options.settings.density,
    options.glyphSet.nominalAdvance,
    options.glyphSet.lineHeight,
  );
  const rows: VideoAsciiFrame['rows'] = [];
  let maxRowWidth = 0;

  for (let rowIndex = 0; rowIndex < metrics.rows; rowIndex += 1) {
    const y = rowIndex * options.glyphSet.lineHeight;
    const cells: VideoAsciiCell[] = [];
    let x = 0;
    let previousChar: string | undefined;
    let repeatCount = 0;
    let iterations = 0;

    while (
      x < options.stageWidth - options.glyphSet.nominalAdvance * 0.4 &&
      iterations < metrics.columns * 3
    ) {
      const normalizedX = (x + options.glyphSet.nominalAdvance * 0.5) / Math.max(1, options.stageWidth);
      const normalizedY =
        (y + options.glyphSet.lineHeight * 0.55) / Math.max(1, options.stageHeight);
      const pixel = samplePixel(options.frame, normalizedX, normalizedY);
      const mapped = remapVideoPixel(pixel.red, pixel.green, pixel.blue, options.settings);
      const glyph =
        options.settings.renderMode === 'variable'
          ? pickAsciiGlyph(options.glyphSet.glyphs, mapped.luminance, options.glyphSet.nominalAdvance, {
              previousChar,
              repeatCount,
            })
          : {
              brightness: mapped.luminance,
              char: pickAsciiCharacter(mapped.luminance),
              width: options.glyphSet.nominalAdvance,
            };
      const advance =
        options.settings.renderMode === 'variable'
          ? clamp(
              glyph.width > 0 ? glyph.width : options.glyphSet.nominalAdvance,
              options.glyphSet.nominalAdvance * 0.54,
              options.glyphSet.nominalAdvance * 1.42,
            )
          : options.glyphSet.nominalAdvance;

      if (x + advance > options.stageWidth && cells.length > 0) {
        break;
      }

      cells.push({
        blue: mapped.blue,
        char: glyph.char,
        green: mapped.green,
        red: mapped.red,
        width: advance,
        x,
      });

      x += advance;
      repeatCount = glyph.char === previousChar ? repeatCount + 1 : 0;
      previousChar = glyph.char;
      iterations += 1;
    }

    rows.push({
      cells,
      width: x,
      y,
    });
    maxRowWidth = Math.max(maxRowWidth, x);
  }

  return {
    maxRowWidth,
    rows,
  };
}

export function buildStyledAsciiSnapshot(frame: VideoAsciiFrame): StyledAsciiSnapshot {
  const styledRows: VideoAsciiTextRow[] = frame.rows.map((row) => {
    const trimmedLength = row.cells.reduceRight((lastVisibleIndex, cell, index) => {
      if (lastVisibleIndex >= 0) {
        return lastVisibleIndex;
      }

      return cell.char.trim().length > 0 ? index : -1;
    }, -1);
    const visibleCells =
      trimmedLength >= 0 ? row.cells.slice(0, trimmedLength + 1) : [];
    const segments: VideoAsciiTextRun[] = [];
    let text = '';
    let currentRun: VideoAsciiTextRun | null = null;

    for (const cell of visibleCells) {
      const color =
        cell.char === ' '
          ? null
          : `rgb(${quantizeChannel(cell.red)} ${quantizeChannel(cell.green)} ${quantizeChannel(cell.blue)})`;
      text += cell.char;

      if (currentRun !== null && currentRun.color === color) {
        currentRun.text += cell.char;
        continue;
      }

      currentRun = {
        color,
        text: cell.char,
      };
      segments.push(currentRun);
    }

    return {
      segments,
      text,
      width: row.width,
    };
  });

  return {
    rows: styledRows,
    text: styledRows.map((row) => row.text).join('\n'),
  };
}

export function buildCopyableAsciiSnapshot(options: {
  columns: number;
  frame: Pick<ImageData, 'data' | 'height' | 'width'>;
  rows: number;
  settings: VideoAsciiSettings;
}): CopyableAsciiSnapshot {
  const rows: string[] = [];
  const columnCount = clamp(options.columns, 8, 240);
  const rowCount = clamp(options.rows, 6, 140);

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    let row = '';

    for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
      const pixel = samplePixel(
        options.frame,
        (columnIndex + 0.5) / columnCount,
        (rowIndex + 0.5) / rowCount,
      );
      const mapped = remapVideoPixel(pixel.red, pixel.green, pixel.blue, options.settings);
      row += pickAsciiCharacter(mapped.luminance);
    }

    rows.push(row);
  }

  return {
    rows,
    text: rows.join('\n'),
  };
}
