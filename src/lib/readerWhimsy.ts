import {
  buildFontString,
  layoutParagraphLines,
  prepareParagraph,
  type FlowObstacle,
} from './pretextAdapter';
import type { ReaderScene } from './readerContent';
import type { ReaderCalloutPlacement } from './readerLayout';

export type ReaderCalloutLine = {
  text: string;
  width: number;
  y: number;
};

export type ReaderCalloutLayout = ReaderCalloutPlacement & {
  contentWidth: number;
  font: string;
  height: number;
  labelFontSize: number;
  lineHeight: number;
  lines: ReaderCalloutLine[];
  obstacle: FlowObstacle;
  obstacleInset: number;
  paddingX: number;
  paddingY: number;
  textTop: number;
};

export type ReaderFlourishLayout = {
  font: string;
  height: number;
  id: string;
  left: number;
  lineHeight: number;
  lines: ReaderCalloutLine[];
  rotation: number;
  top: number;
  tone: ReaderScene['callouts'][number]['tone'];
  width: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function buildFlourishPlacements(
  sceneId: ReaderScene['id'],
  stageWidth: number,
  lineHeight: number,
  motionTimeMs: number,
): Array<{
  left: number;
  maxWidth: number;
  rotation: number;
  top: number;
}> {
  const driftX = Math.sin(motionTimeMs / 2500) * Math.min(stageWidth * 0.008, 5);
  const driftY = Math.cos(motionTimeMs / 2200) * Math.min(lineHeight * 0.18, 4);

  if (sceneId === 'fall') {
    return [
      {
        left: stageWidth * 0.03 + driftX,
        maxWidth: stageWidth * 0.28,
        rotation: -3.2 + Math.sin(motionTimeMs / 1800) * 0.8,
        top: lineHeight * 0.1 + driftY,
      },
      {
        left: stageWidth * 0.32 - driftX,
        maxWidth: stageWidth * 0.3,
        rotation: 2.4 + Math.cos(motionTimeMs / 1900) * 0.7,
        top: lineHeight * 1.6 - driftY,
      },
      {
        left: stageWidth * 0.67 + driftX,
        maxWidth: stageWidth * 0.24,
        rotation: -2 + Math.sin(motionTimeMs / 1700) * 0.8,
        top: lineHeight * 0.55 + driftY,
      },
    ];
  }

  if (sceneId === 'tea') {
    return [
      {
        left: stageWidth * 0.04 + driftX,
        maxWidth: stageWidth * 0.28,
        rotation: -2.4 + Math.sin(motionTimeMs / 2100) * 0.6,
        top: lineHeight * 0.35 + driftY,
      },
      {
        left: stageWidth * 0.38 - driftX,
        maxWidth: stageWidth * 0.27,
        rotation: 2.8 + Math.cos(motionTimeMs / 1800) * 0.8,
        top: lineHeight * 1.75 - driftY,
      },
      {
        left: stageWidth * 0.66 + driftX,
        maxWidth: stageWidth * 0.25,
        rotation: -1.4 + Math.sin(motionTimeMs / 1600) * 0.6,
        top: lineHeight * 0.2 + driftY,
      },
    ];
  }

  if (sceneId === 'queen') {
    return [
      {
        left: stageWidth * 0.03 + driftX,
        maxWidth: stageWidth * 0.3,
        rotation: -2.8 + Math.sin(motionTimeMs / 2200) * 0.7,
        top: lineHeight * 0.15 + driftY,
      },
      {
        left: stageWidth * 0.35 - driftX,
        maxWidth: stageWidth * 0.26,
        rotation: 2.3 + Math.cos(motionTimeMs / 1800) * 0.7,
        top: lineHeight * 1.7 - driftY,
      },
      {
        left: stageWidth * 0.66 + driftX,
        maxWidth: stageWidth * 0.24,
        rotation: -1.6 + Math.sin(motionTimeMs / 2000) * 0.6,
        top: lineHeight * 0.5 + driftY,
      },
    ];
  }

  if (sceneId === 'trial') {
    return [
      {
        left: stageWidth * 0.04 + driftX,
        maxWidth: stageWidth * 0.26,
        rotation: -2 + Math.sin(motionTimeMs / 2300) * 0.6,
        top: lineHeight * 0.4 + driftY,
      },
      {
        left: stageWidth * 0.35 - driftX,
        maxWidth: stageWidth * 0.28,
        rotation: 1.8 + Math.cos(motionTimeMs / 2000) * 0.7,
        top: lineHeight * 1.9 - driftY,
      },
      {
        left: stageWidth * 0.68 + driftX,
        maxWidth: stageWidth * 0.22,
        rotation: -1.3 + Math.sin(motionTimeMs / 1700) * 0.6,
        top: lineHeight * 0.45 + driftY,
      },
    ];
  }

  if (sceneId === 'waking') {
    return [
      {
        left: stageWidth * 0.04 + driftX,
        maxWidth: stageWidth * 0.28,
        rotation: -1.8 + Math.sin(motionTimeMs / 2400) * 0.5,
        top: lineHeight * 0.3 + driftY,
      },
      {
        left: stageWidth * 0.36 - driftX,
        maxWidth: stageWidth * 0.28,
        rotation: 1.7 + Math.cos(motionTimeMs / 2100) * 0.6,
        top: lineHeight * 1.65 - driftY,
      },
      {
        left: stageWidth * 0.66 + driftX,
        maxWidth: stageWidth * 0.24,
        rotation: -1 + Math.sin(motionTimeMs / 1800) * 0.45,
        top: lineHeight * 0.5 + driftY,
      },
    ];
  }

  if (sceneId === 'hall') {
    return [
      {
        left: stageWidth * 0.04 + driftX,
        maxWidth: stageWidth * 0.28,
        rotation: -2.1 + Math.sin(motionTimeMs / 2200) * 0.55,
        top: lineHeight * 0.15 + driftY,
      },
      {
        left: stageWidth * 0.38 - driftX,
        maxWidth: stageWidth * 0.24,
        rotation: 2 + Math.cos(motionTimeMs / 1900) * 0.6,
        top: lineHeight * 1.8 - driftY,
      },
      {
        left: stageWidth * 0.66 + driftX,
        maxWidth: stageWidth * 0.24,
        rotation: -1.2 + Math.sin(motionTimeMs / 1700) * 0.5,
        top: lineHeight * 0.4 + driftY,
      },
    ];
  }

  return [
    {
      left: stageWidth * 0.04 + driftX,
      maxWidth: stageWidth * 0.28,
      rotation: -2.4 + Math.sin(motionTimeMs / 2200) * 0.6,
      top: lineHeight * 0.25 + driftY,
    },
    {
      left: stageWidth * 0.36 - driftX,
      maxWidth: stageWidth * 0.28,
      rotation: 1.9 + Math.cos(motionTimeMs / 2000) * 0.7,
      top: lineHeight * 1.7 - driftY,
    },
    {
      left: stageWidth * 0.68 + driftX,
      maxWidth: stageWidth * 0.22,
      rotation: -1.1 + Math.sin(motionTimeMs / 1800) * 0.55,
      top: lineHeight * 0.45 + driftY,
    },
  ];
}

export function layoutReaderFlourishes(
  scene: ReaderScene,
  stageWidth: number,
  motionTimeMs: number,
): ReaderFlourishLayout[] {
  if (scene.callouts.length === 0) {
    return [];
  }

  const fontSize = clamp(Math.round(stageWidth / 48), 14, 20);
  const lineHeight = Math.round(fontSize * 1.04);
  const font = buildFontString({
    fontFamily: 'Inter, sans-serif',
    fontSize,
    fontWeight: 800,
  });
  const placements = buildFlourishPlacements(scene.id, stageWidth, lineHeight, motionTimeMs);

  return scene.callouts.map((callout, index) => {
    const placement = placements[index] ?? placements[placements.length - 1]!;
    const prepared = prepareParagraph({
      text: callout.label,
      font,
      whiteSpace: 'normal',
    });
    const textWidth = clamp(Math.round(stageWidth * 0.16), 130, Math.round(placement.maxWidth));
    const lineLayout = layoutParagraphLines(prepared, textWidth, lineHeight);
    const width = Math.max(
      clamp(
        Math.max(...lineLayout.lines.map((line) => line.width), 0) + fontSize,
        118,
        Math.round(placement.maxWidth),
      ),
      118,
    );
    const height = Math.max(lineHeight * 1.5, lineLayout.lines.length * lineHeight + fontSize);

    return {
      font,
      height,
      id: callout.id,
      left: clamp(placement.left, 0, Math.max(0, stageWidth - width)),
      lineHeight,
      lines: lineLayout.lines.map((line, lineIndex) => ({
        text: line.text,
        width: line.width,
        y: lineIndex * lineHeight,
      })),
      rotation: placement.rotation,
      top: Math.max(0, placement.top),
      tone: callout.tone,
      width,
    };
  });
}

export function layoutReaderCallouts(
  callouts: ReaderCalloutPlacement[],
  stageWidth: number,
): ReaderCalloutLayout[] {
  const fontSize = clamp(Math.round(stageWidth / 36), 15, 19);
  const lineHeight = Math.round(fontSize * 1.34);
  const paddingX = clamp(Math.round(fontSize * 0.95), 14, 18);
  const paddingY = clamp(Math.round(fontSize * 0.82), 12, 16);
  const labelFontSize = clamp(Math.round(fontSize * 0.58), 11, 13);
  const labelGap = clamp(Math.round(fontSize * 0.48), 6, 10);
  const font = buildFontString({
    fontFamily: 'Georgia, serif',
    fontSize,
    fontStyle: 'italic',
    fontWeight: 400,
  });

  return callouts.map((callout) => {
    const contentWidth = Math.max(120, callout.width - paddingX * 2);
    const rotationInset = Math.round(Math.abs(callout.rotation) * 4.5);
    const obstacleInset = clamp(Math.round(fontSize * 1.1) + rotationInset, 18, 34);
    const prepared = prepareParagraph({
      text: callout.text,
      font,
      whiteSpace: 'normal',
    });
    const lineLayout = layoutParagraphLines(prepared, contentWidth, lineHeight);
    const textTop = paddingY + labelFontSize + labelGap;
    const textHeight = Math.max(lineHeight, lineLayout.lines.length * lineHeight);
    const height = textTop + textHeight + paddingY;

    return {
      ...callout,
      contentWidth,
      font,
      height,
      labelFontSize,
      lineHeight,
      lines: lineLayout.lines.map((line, index) => ({
        text: line.text,
        width: line.width,
        y: index * lineHeight,
      })),
      obstacle: {
        id: `callout-${callout.id}`,
        kind: 'slice',
        left: Math.max(0, callout.left - obstacleInset),
        top: Math.max(0, callout.top - obstacleInset),
        width: Math.min(stageWidth, callout.left + callout.width + obstacleInset) - Math.max(0, callout.left - obstacleInset),
        height: height + obstacleInset * 2,
      },
      obstacleInset,
      paddingX,
      paddingY,
      textTop,
    };
  });
}
