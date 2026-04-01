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

export type ReaderWhisperLayout = {
  font: string;
  height: number;
  id: string;
  left: number;
  lineHeight: number;
  lines: ReaderCalloutLine[];
  opacity: number;
  paddingX: number;
  paddingY: number;
  rotation: number;
  top: number;
  tone: ReaderScene['callouts'][number]['tone'];
  variant: 'drift' | 'ribbon' | 'seal' | 'ticket';
  width: number;
};

export type ReaderStageMotifLayout = {
  height: number;
  id: string;
  left: number;
  opacity: number;
  rotation: number;
  top: number;
  tone: ReaderScene['callouts'][number]['tone'];
  variant:
    | 'arch'
    | 'card'
    | 'column'
    | 'crumb'
    | 'cup'
    | 'daisy'
    | 'diamond'
    | 'fall-line'
    | 'jar'
    | 'keyhole'
    | 'label'
    | 'leaf'
    | 'path'
    | 'peg'
    | 'petal'
    | 'ripple'
    | 'rule'
    | 'stamp'
    | 'steam'
    | 'trail'
    | 'watch';
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

function buildSceneWhisperSeeds(
  scene: ReaderScene,
): Array<{
  id: string;
  text: string;
  tone: ReaderScene['callouts'][number]['tone'];
  variant: ReaderWhisperLayout['variant'];
}> {
  if (scene.id === 'fall') {
    return [
      { id: 'down', text: 'down, down, down', tone: 'ink', variant: 'drift' },
      { id: 'marmalade', text: 'orange marmalade', tone: 'amber', variant: 'ticket' },
      { id: 'shelves', text: 'cupboards and shelves', tone: 'sage', variant: 'ribbon' },
      { id: 'latitude', text: 'latitude? longitude?', tone: 'berry', variant: 'seal' },
    ];
  }

  if (scene.id === 'hall') {
    return [
      { id: 'drink', text: 'drink me', tone: 'berry', variant: 'ticket' },
      { id: 'door', text: 'little golden key', tone: 'amber', variant: 'seal' },
      { id: 'curious', text: 'curiouser and curiouser', tone: 'sage', variant: 'drift' },
      { id: 'garden', text: 'through the tiny door', tone: 'ink', variant: 'ribbon' },
    ];
  }

  if (scene.id === 'tea') {
    return [
      { id: 'room', text: 'no room', tone: 'amber', variant: 'ribbon' },
      { id: 'time', text: "always six o'clock", tone: 'berry', variant: 'seal' },
      { id: 'tea', text: 'more tea', tone: 'sage', variant: 'ticket' },
      { id: 'riddle', text: 'why is a raven like a writing-desk?', tone: 'ink', variant: 'drift' },
    ];
  }

  if (scene.id === 'queen') {
    return [
      { id: 'heads', text: 'off with their heads', tone: 'berry', variant: 'ribbon' },
      { id: 'roses', text: 'paint the roses red', tone: 'amber', variant: 'ticket' },
      { id: 'croquet', text: 'flamingo mallets', tone: 'sage', variant: 'seal' },
      { id: 'hedgehog', text: 'hedgehog balls', tone: 'ink', variant: 'drift' },
    ];
  }

  if (scene.id === 'trial') {
    return [
      { id: 'sentence', text: 'sentence first', tone: 'amber', variant: 'ribbon' },
      { id: 'rule', text: 'rule forty-two', tone: 'berry', variant: 'ticket' },
      { id: 'jury', text: 'jury-box tumble', tone: 'sage', variant: 'seal' },
      { id: 'unimportant', text: 'unimportant, your majesty', tone: 'ink', variant: 'drift' },
    ];
  }

  if (scene.id === 'waking') {
    return [
      { id: 'cards', text: 'nothing but a pack of cards', tone: 'sage', variant: 'drift' },
      { id: 'dream', text: 'what a curious dream', tone: 'berry', variant: 'seal' },
      { id: 'summer', text: 'happy summer days', tone: 'amber', variant: 'ticket' },
      { id: 'after', text: 'after-time remembering', tone: 'ink', variant: 'ribbon' },
    ];
  }

  return [
    { id: 'rabbit', text: 'white rabbit', tone: 'amber', variant: 'ribbon' },
    { id: 'watch', text: 'waistcoat-pocket watch', tone: 'berry', variant: 'ticket' },
    { id: 'daisy', text: 'daisy-chain afternoon', tone: 'sage', variant: 'seal' },
    { id: 'curiosity', text: 'burning with curiosity', tone: 'ink', variant: 'drift' },
  ];
}

function resolveWhisperTypography(
  variant: ReaderWhisperLayout['variant'],
  stageWidth: number,
): {
  font: string;
  fontSize: number;
  lineHeight: number;
  paddingX: number;
  paddingY: number;
} {
  if (variant === 'seal') {
    const fontSize = clamp(Math.round(stageWidth / 36), 16, 25);
    return {
      font: buildFontString({
        fontFamily: 'Georgia, serif',
        fontSize,
        fontStyle: 'italic',
        fontWeight: 700,
      }),
      fontSize,
      lineHeight: Math.round(fontSize * 1.02),
      paddingX: clamp(Math.round(fontSize * 0.92), 14, 20),
      paddingY: clamp(Math.round(fontSize * 0.88), 12, 18),
    };
  }

  if (variant === 'ticket') {
    const fontSize = clamp(Math.round(stageWidth / 40), 15, 22);
    return {
      font: buildFontString({
        fontFamily: 'Inter, sans-serif',
        fontSize,
        fontWeight: 700,
      }),
      fontSize,
      lineHeight: Math.round(fontSize * 1),
      paddingX: clamp(Math.round(fontSize * 0.94), 14, 18),
      paddingY: clamp(Math.round(fontSize * 0.78), 10, 15),
    };
  }

  if (variant === 'ribbon') {
    const fontSize = clamp(Math.round(stageWidth / 37), 16, 24);
    return {
      font: buildFontString({
        fontFamily: 'Inter, sans-serif',
        fontSize,
        fontWeight: 800,
      }),
      fontSize,
      lineHeight: Math.round(fontSize * 0.96),
      paddingX: clamp(Math.round(fontSize * 1.05), 16, 22),
      paddingY: clamp(Math.round(fontSize * 0.74), 10, 14),
    };
  }

  const fontSize = clamp(Math.round(stageWidth / 26), 18, 34);
  return {
    font: buildFontString({
      fontFamily: 'Inter, sans-serif',
      fontSize,
      fontWeight: 800,
    }),
    fontSize,
    lineHeight: Math.round(fontSize * 0.94),
    paddingX: 0,
    paddingY: 0,
  };
}

function buildWhisperPlacements(
  sceneId: ReaderScene['id'],
  stageWidth: number,
  stageHeight: number,
  lineHeight: number,
  motionTimeMs: number,
): Array<{
  left: number;
  maxWidth: number;
  opacity: number;
  rotation: number;
  top: number;
}> {
  const driftX = Math.sin(motionTimeMs / 2600) * Math.min(stageWidth * 0.01, 6);
  const driftY = Math.cos(motionTimeMs / 2100) * Math.min(lineHeight * 0.22, 5);

  if (sceneId === 'fall') {
    return [
      { left: stageWidth * 0.58 + driftX, maxWidth: stageWidth * 0.22, opacity: 0.18, rotation: -8, top: lineHeight * 5.2 + driftY },
      { left: stageWidth * 0.12 - driftX, maxWidth: stageWidth * 0.2, opacity: 0.14, rotation: 90, top: stageHeight * 0.34 + driftY },
      { left: stageWidth * 0.5 + driftX, maxWidth: stageWidth * 0.26, opacity: 0.16, rotation: 4, top: stageHeight * 0.6 - driftY },
      { left: stageWidth * 0.1 - driftX, maxWidth: stageWidth * 0.26, opacity: 0.13, rotation: -5, top: stageHeight * 0.8 + driftY },
    ];
  }

  if (sceneId === 'hall') {
    return [
      { left: stageWidth * 0.06 + driftX, maxWidth: stageWidth * 0.22, opacity: 0.15, rotation: -2, top: lineHeight * 2.8 + driftY },
      { left: stageWidth * 0.06 - driftX, maxWidth: stageWidth * 0.24, opacity: 0.14, rotation: 90, top: stageHeight * 0.34 + driftY },
      { left: stageWidth * 0.54 + driftX, maxWidth: stageWidth * 0.24, opacity: 0.16, rotation: -3, top: stageHeight * 0.55 - driftY },
      { left: stageWidth * 0.18 - driftX, maxWidth: stageWidth * 0.26, opacity: 0.13, rotation: 2, top: stageHeight * 0.82 + driftY },
    ];
  }

  if (sceneId === 'tea') {
    return [
      { left: stageWidth * 0.42 + driftX, maxWidth: stageWidth * 0.18, opacity: 0.15, rotation: 7, top: lineHeight * 7.8 + driftY },
      { left: stageWidth * 0.72 - driftX, maxWidth: stageWidth * 0.18, opacity: 0.17, rotation: -4, top: stageHeight * 0.36 + driftY },
      { left: stageWidth * 0.06 + driftX, maxWidth: stageWidth * 0.28, opacity: 0.14, rotation: 3, top: stageHeight * 0.62 - driftY },
      { left: stageWidth * 0.52 - driftX, maxWidth: stageWidth * 0.28, opacity: 0.13, rotation: -2, top: stageHeight * 0.84 + driftY },
    ];
  }

  if (sceneId === 'queen') {
    return [
      { left: stageWidth * 0.08 + driftX, maxWidth: stageWidth * 0.24, opacity: 0.18, rotation: -4, top: lineHeight * 5.4 + driftY },
      { left: stageWidth * 0.16 - driftX, maxWidth: stageWidth * 0.2, opacity: 0.14, rotation: 90, top: stageHeight * 0.36 + driftY },
      { left: stageWidth * 0.5 + driftX, maxWidth: stageWidth * 0.26, opacity: 0.15, rotation: 5, top: stageHeight * 0.63 - driftY },
      { left: stageWidth * 0.6 - driftX, maxWidth: stageWidth * 0.2, opacity: 0.14, rotation: -3, top: stageHeight * 0.86 + driftY },
    ];
  }

  if (sceneId === 'trial') {
    return [
      { left: stageWidth * 0.38 + driftX, maxWidth: stageWidth * 0.22, opacity: 0.17, rotation: 5, top: lineHeight * 7.2 + driftY },
      { left: stageWidth * 0.72 - driftX, maxWidth: stageWidth * 0.18, opacity: 0.13, rotation: 90, top: stageHeight * 0.34 + driftY },
      { left: stageWidth * 0.14 + driftX, maxWidth: stageWidth * 0.22, opacity: 0.15, rotation: -4, top: stageHeight * 0.62 - driftY },
      { left: stageWidth * 0.46 - driftX, maxWidth: stageWidth * 0.26, opacity: 0.13, rotation: 2, top: stageHeight * 0.84 + driftY },
    ];
  }

  if (sceneId === 'waking') {
    return [
      { left: stageWidth * 0.08 + driftX, maxWidth: stageWidth * 0.26, opacity: 0.15, rotation: -3, top: lineHeight * 4.6 + driftY },
      { left: stageWidth * 0.48 - driftX, maxWidth: stageWidth * 0.22, opacity: 0.14, rotation: 5, top: stageHeight * 0.4 + driftY },
      { left: stageWidth * 0.12 + driftX, maxWidth: stageWidth * 0.26, opacity: 0.13, rotation: -2, top: stageHeight * 0.7 - driftY },
      { left: stageWidth * 0.58 - driftX, maxWidth: stageWidth * 0.24, opacity: 0.12, rotation: 2, top: stageHeight * 0.9 + driftY },
    ];
  }

  return [
    { left: stageWidth * 0.1 + driftX, maxWidth: stageWidth * 0.22, opacity: 0.14, rotation: -4, top: lineHeight * 5.6 + driftY },
    { left: stageWidth * 0.6 - driftX, maxWidth: stageWidth * 0.24, opacity: 0.13, rotation: 4, top: stageHeight * 0.36 + driftY },
    { left: stageWidth * 0.18 + driftX, maxWidth: stageWidth * 0.24, opacity: 0.13, rotation: -2, top: stageHeight * 0.68 - driftY },
    { left: stageWidth * 0.6 - driftX, maxWidth: stageWidth * 0.2, opacity: 0.12, rotation: 3, top: stageHeight * 0.88 + driftY },
  ];
}

export function layoutReaderWhispers(
  scene: ReaderScene,
  stageWidth: number,
  stageHeight: number,
  motionTimeMs: number,
): ReaderWhisperLayout[] {
  if (scene.id === 'bank') {
    return [];
  }

  const seeds = buildSceneWhisperSeeds(scene);
  const placements = buildWhisperPlacements(
    scene.id,
    stageWidth,
    stageHeight,
    Math.round(clamp(Math.round(stageWidth / 26), 18, 34) * 0.94),
    motionTimeMs,
  );
  const whisperCount = stageWidth < 600 ? 2 : Math.min(3, seeds.length);

  return seeds.slice(0, whisperCount).map((seed, index) => {
    const placement = placements[index] ?? placements[placements.length - 1]!;
    const typography = resolveWhisperTypography(seed.variant, stageWidth);
    const prepared = prepareParagraph({
      text: seed.text,
      font: typography.font,
      whiteSpace: 'normal',
    });
    const lineLayout = layoutParagraphLines(
      prepared,
      Math.max(110, clamp(Math.round(placement.maxWidth), 140, Math.round(stageWidth * 0.3)) - typography.paddingX * 2),
      typography.lineHeight,
    );
    const width = clamp(
      Math.max(...lineLayout.lines.map((line) => line.width), 0) + typography.paddingX * 2 + typography.fontSize * 0.24,
      120,
      Math.round(stageWidth * 0.32),
    );
    const height = Math.max(
      typography.lineHeight + typography.paddingY * 2,
      lineLayout.lines.length * typography.lineHeight + typography.paddingY * 2,
    );

    return {
      font: typography.font,
      height,
      id: seed.id,
      left: clamp(placement.left, 0, Math.max(0, stageWidth - width)),
      lineHeight: typography.lineHeight,
      lines: lineLayout.lines.map((line, lineIndex) => ({
        text: line.text,
        width: line.width,
        y: lineIndex * typography.lineHeight,
      })),
      opacity: placement.opacity,
      paddingX: typography.paddingX,
      paddingY: typography.paddingY,
      rotation: placement.rotation,
      top: Math.max(0, placement.top),
      tone: seed.tone,
      variant: seed.variant,
      width,
    };
  });
}

type StageMotifSeed = {
  tone: ReaderScene['callouts'][number]['tone'];
  variant: ReaderStageMotifLayout['variant'];
};

function buildStageMotifSeeds(scene: ReaderScene): StageMotifSeed[] {
  if (scene.id === 'bank') {
    return [
      { tone: 'sage', variant: 'daisy' },
      { tone: 'amber', variant: 'watch' },
      { tone: 'sage', variant: 'trail' },
    ];
  }

  if (scene.id === 'fall') {
    return [
      { tone: 'ink', variant: 'fall-line' },
      { tone: 'amber', variant: 'jar' },
      { tone: 'sage', variant: 'fall-line' },
      { tone: 'berry', variant: 'peg' },
      { tone: 'amber', variant: 'trail' },
    ];
  }

  if (scene.id === 'hall') {
    return [
      { tone: 'amber', variant: 'keyhole' },
      { tone: 'berry', variant: 'label' },
      { tone: 'sage', variant: 'path' },
      { tone: 'ink', variant: 'label' },
      { tone: 'amber', variant: 'keyhole' },
    ];
  }

  if (scene.id === 'tea') {
    return [
      { tone: 'amber', variant: 'cup' },
      { tone: 'berry', variant: 'steam' },
      { tone: 'sage', variant: 'cup' },
      { tone: 'ink', variant: 'crumb' },
      { tone: 'berry', variant: 'steam' },
    ];
  }

  if (scene.id === 'queen') {
    return [
      { tone: 'berry', variant: 'petal' },
      { tone: 'amber', variant: 'diamond' },
      { tone: 'sage', variant: 'petal' },
      { tone: 'ink', variant: 'arch' },
      { tone: 'berry', variant: 'diamond' },
    ];
  }

  if (scene.id === 'trial') {
    return [
      { tone: 'ink', variant: 'stamp' },
      { tone: 'berry', variant: 'rule' },
      { tone: 'amber', variant: 'stamp' },
      { tone: 'sage', variant: 'column' },
      { tone: 'ink', variant: 'rule' },
    ];
  }

  if (scene.id === 'waking') {
    return [
      { tone: 'sage', variant: 'leaf' },
      { tone: 'amber', variant: 'leaf' },
      { tone: 'berry', variant: 'card' },
      { tone: 'ink', variant: 'ripple' },
      { tone: 'sage', variant: 'card' },
    ];
  }

  return [];
}

function buildStageMotifPlacements(
  sceneId: ReaderScene['id'],
  stageWidth: number,
  stageHeight: number,
  motionTimeMs: number,
): Array<{
  height: number;
  left: number;
  opacity: number;
  rotation: number;
  top: number;
  width: number;
}> {
  const driftX = Math.sin(motionTimeMs / 2400) * Math.min(stageWidth * 0.008, 6);
  const driftY = Math.cos(motionTimeMs / 2100) * Math.min(stageHeight * 0.01, 6);

  if (sceneId === 'bank') {
    return [
      { left: stageWidth * 0.08 + driftX, top: stageHeight * 0.18 + driftY, width: 46, height: 46, rotation: -8, opacity: 0.16 },
      { left: stageWidth * 0.68 - driftX, top: stageHeight * 0.12 - driftY, width: 88, height: 88, rotation: 10, opacity: 0.12 },
      { left: stageWidth * 0.12 + driftX, top: stageHeight * 0.78 + driftY, width: 140, height: 16, rotation: 6, opacity: 0.14 },
    ];
  }

  if (sceneId === 'fall') {
    return [
      { left: stageWidth * 0.12 + driftX, top: stageHeight * 0.16 + driftY, width: 10, height: stageHeight * 0.24, rotation: -8, opacity: 0.16 },
      { left: stageWidth * 0.74 - driftX, top: stageHeight * 0.28 - driftY, width: 72, height: 98, rotation: 8, opacity: 0.15 },
      { left: stageWidth * 0.5 + driftX, top: stageHeight * 0.5 + driftY, width: 10, height: stageHeight * 0.22, rotation: 10, opacity: 0.14 },
      { left: stageWidth * 0.18 - driftX, top: stageHeight * 0.74 - driftY, width: 20, height: 38, rotation: 5, opacity: 0.18 },
      { left: stageWidth * 0.62 + driftX, top: stageHeight * 0.84 + driftY, width: 118, height: 14, rotation: -6, opacity: 0.14 },
    ];
  }

  if (sceneId === 'hall') {
    return [
      { left: stageWidth * 0.06 + driftX, top: stageHeight * 0.14 + driftY, width: 88, height: 126, rotation: -4, opacity: 0.14 },
      { left: stageWidth * 0.68 - driftX, top: stageHeight * 0.22 - driftY, width: 96, height: 44, rotation: 8, opacity: 0.16 },
      { left: stageWidth * 0.24 + driftX, top: stageHeight * 0.56 + driftY, width: 126, height: 16, rotation: 0, opacity: 0.13 },
      { left: stageWidth * 0.56 - driftX, top: stageHeight * 0.7 - driftY, width: 84, height: 42, rotation: -7, opacity: 0.14 },
      { left: stageWidth * 0.76 + driftX, top: stageHeight * 0.8 + driftY, width: 72, height: 104, rotation: 10, opacity: 0.13 },
    ];
  }

  if (sceneId === 'tea') {
    return [
      { left: stageWidth * 0.42 + driftX, top: stageHeight * 0.16 + driftY, width: 90, height: 64, rotation: -8, opacity: 0.14 },
      { left: stageWidth * 0.72 - driftX, top: stageHeight * 0.28 - driftY, width: 54, height: 120, rotation: 4, opacity: 0.14 },
      { left: stageWidth * 0.1 + driftX, top: stageHeight * 0.64 + driftY, width: 84, height: 60, rotation: 7, opacity: 0.13 },
      { left: stageWidth * 0.52 - driftX, top: stageHeight * 0.82 - driftY, width: 26, height: 26, rotation: 0, opacity: 0.18 },
      { left: stageWidth * 0.78 + driftX, top: stageHeight * 0.7 + driftY, width: 52, height: 118, rotation: -5, opacity: 0.13 },
    ];
  }

  if (sceneId === 'queen') {
    return [
      { left: stageWidth * 0.08 + driftX, top: stageHeight * 0.22 + driftY, width: 72, height: 38, rotation: -18, opacity: 0.18 },
      { left: stageWidth * 0.28 - driftX, top: stageHeight * 0.56 - driftY, width: 58, height: 58, rotation: 45, opacity: 0.14 },
      { left: stageWidth * 0.68 + driftX, top: stageHeight * 0.16 + driftY, width: 94, height: 52, rotation: 14, opacity: 0.16 },
      { left: stageWidth * 0.78 - driftX, top: stageHeight * 0.6 - driftY, width: 104, height: 56, rotation: -8, opacity: 0.13 },
      { left: stageWidth * 0.5 + driftX, top: stageHeight * 0.84 + driftY, width: 64, height: 64, rotation: 46, opacity: 0.16 },
    ];
  }

  if (sceneId === 'trial') {
    return [
      { left: stageWidth * 0.42 + driftX, top: stageHeight * 0.16 + driftY, width: 92, height: 72, rotation: -7, opacity: 0.14 },
      { left: stageWidth * 0.72 - driftX, top: stageHeight * 0.38 - driftY, width: 130, height: 18, rotation: 6, opacity: 0.14 },
      { left: stageWidth * 0.14 + driftX, top: stageHeight * 0.58 + driftY, width: 68, height: 68, rotation: 10, opacity: 0.14 },
      { left: stageWidth * 0.58 - driftX, top: stageHeight * 0.76 - driftY, width: 18, height: 120, rotation: 0, opacity: 0.12 },
      { left: stageWidth * 0.28 + driftX, top: stageHeight * 0.88 + driftY, width: 138, height: 18, rotation: -4, opacity: 0.14 },
    ];
  }

  if (sceneId === 'waking') {
    return [
      { left: stageWidth * 0.12 + driftX, top: stageHeight * 0.22 + driftY, width: 84, height: 48, rotation: -16, opacity: 0.16 },
      { left: stageWidth * 0.68 - driftX, top: stageHeight * 0.34 - driftY, width: 64, height: 88, rotation: 10, opacity: 0.14 },
      { left: stageWidth * 0.22 + driftX, top: stageHeight * 0.62 + driftY, width: 108, height: 108, rotation: 0, opacity: 0.11 },
      { left: stageWidth * 0.76 - driftX, top: stageHeight * 0.74 - driftY, width: 76, height: 102, rotation: -8, opacity: 0.13 },
      { left: stageWidth * 0.5 + driftX, top: stageHeight * 0.9 + driftY, width: 96, height: 96, rotation: 0, opacity: 0.12 },
    ];
  }

  return [];
}

export function layoutReaderStageMotifs(
  scene: ReaderScene,
  stageWidth: number,
  stageHeight: number,
  motionTimeMs: number,
): ReaderStageMotifLayout[] {
  if (scene.id === 'bank') {
    return [];
  }

  const seeds = buildStageMotifSeeds(scene);
  const placements = buildStageMotifPlacements(scene.id, stageWidth, stageHeight, motionTimeMs);

  return seeds.map((seed, index) => {
    const placement = placements[index] ?? placements[placements.length - 1];

    if (placement === undefined) {
      return null;
    }

    return {
      height: placement.height,
      id: `${scene.id}-motif-${index}`,
      left: placement.left,
      opacity: placement.opacity,
      rotation: placement.rotation,
      top: placement.top,
      tone: seed.tone,
      variant: seed.variant,
      width: placement.width,
    };
  }).filter((motif): motif is ReaderStageMotifLayout => motif !== null);
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
