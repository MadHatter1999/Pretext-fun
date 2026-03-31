import type { FlowObstacle } from './pretextAdapter';

export type PineappleDecoration = FlowObstacle & {
  rotation: number;
};

export type CurrentRibbon = {
  id: string;
  left: number;
  top: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
};

export type Bubble = {
  id: string;
  left: number;
  top: number;
  size: number;
  opacity: number;
};

export type PineappleScene = {
  body: PineappleDecoration;
  leaves: PineappleDecoration[];
  rings: PineappleDecoration[];
  currents: CurrentRibbon[];
  bubbles: Bubble[];
  obstacles: FlowObstacle[];
  topPadding: number;
  bottomPadding: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function createLeaf(
  id: string,
  centerX: number,
  top: number,
  width: number,
  height: number,
  rotation: number,
): PineappleDecoration {
  return {
    id,
    kind: 'leaf',
    left: centerX - width / 2,
    top,
    width,
    height,
    rotation,
  };
}

function createRing(
  id: string,
  centerX: number,
  centerY: number,
  width: number,
  height: number,
  rotation: number,
): PineappleDecoration {
  return {
    id,
    kind: 'ring',
    left: centerX - width / 2,
    top: centerY - height / 2,
    width,
    height,
    rotation,
  };
}

export function buildPineappleScene(
  stageWidth: number,
  lineHeight: number,
  motionTimeMs: number,
): PineappleScene {
  const bodyWidth = clamp(stageWidth * 0.22, 112, 168);
  const bodyHeight = bodyWidth * 1.28;
  const swayX = Math.sin(motionTimeMs / 930) * stageWidth * 0.07;
  const bobY = Math.cos(motionTimeMs / 1180) * lineHeight * 0.65;
  const bodyCenterX = stageWidth * 0.49 + swayX;
  const bodyTop = lineHeight * 5.1 + bobY;
  const body: PineappleDecoration = {
    id: 'pineapple-body',
    kind: 'body',
    left: bodyCenterX - bodyWidth / 2,
    top: bodyTop,
    width: bodyWidth,
    height: bodyHeight,
    rotation: Math.sin(motionTimeMs / 1600) * 4.5,
  };

  const leafWidth = bodyWidth * 0.33;
  const leaves = [
    createLeaf(
      'pineapple-leaf-left',
      bodyCenterX - bodyWidth * 0.2,
      bodyTop - lineHeight * 3.1,
      leafWidth * 0.94,
      lineHeight * 4.7,
      -30 + Math.sin(motionTimeMs / 1080) * 5,
    ),
    createLeaf(
      'pineapple-leaf-center',
      bodyCenterX,
      bodyTop - lineHeight * 3.9,
      leafWidth,
      lineHeight * 5.4,
      Math.sin(motionTimeMs / 1320) * 4,
    ),
    createLeaf(
      'pineapple-leaf-right',
      bodyCenterX + bodyWidth * 0.2,
      bodyTop - lineHeight * 3.1,
      leafWidth * 0.94,
      lineHeight * 4.7,
      30 + Math.cos(motionTimeMs / 1140) * 5,
    ),
  ];

  const ringWidth = clamp(stageWidth * 0.19, 66, 108);
  const ringHeight = ringWidth * 0.84;
  const rings = [
    createRing(
      'ring-upper-left',
      stageWidth * 0.22 + Math.sin(motionTimeMs / 720) * stageWidth * 0.06,
      lineHeight * 5.4 + Math.cos(motionTimeMs / 780) * lineHeight * 0.8,
      ringWidth,
      ringHeight,
      -16 + Math.sin(motionTimeMs / 880) * 10,
    ),
    createRing(
      'ring-lower-right',
      stageWidth * 0.79 + Math.sin(motionTimeMs / 860 + 1.1) * stageWidth * 0.05,
      bodyTop + bodyHeight * 0.62 + Math.cos(motionTimeMs / 740) * lineHeight,
      ringWidth * 1.02,
      ringHeight * 1.06,
      22 + Math.cos(motionTimeMs / 940) * 12,
    ),
    createRing(
      'ring-deep-left',
      stageWidth * 0.24 + Math.cos(motionTimeMs / 790 + 0.8) * stageWidth * 0.055,
      bodyTop + bodyHeight * 1.1 + Math.sin(motionTimeMs / 710) * lineHeight,
      ringWidth * 0.9,
      ringHeight * 0.92,
      -28 + Math.sin(motionTimeMs / 690) * 10,
    ),
  ];

  const currents: CurrentRibbon[] = [
    {
      id: 'current-top',
      left: -stageWidth * 0.08,
      top: lineHeight * 2.2,
      width: stageWidth * 0.82,
      height: lineHeight * 2.2,
      rotation: -8 + Math.sin(motionTimeMs / 1200) * 4,
      opacity: 0.22,
    },
    {
      id: 'current-mid',
      left: stageWidth * 0.26,
      top: bodyTop + bodyHeight * 0.24,
      width: stageWidth * 0.72,
      height: lineHeight * 2.8,
      rotation: 7 + Math.cos(motionTimeMs / 1320) * 4,
      opacity: 0.18,
    },
    {
      id: 'current-low',
      left: -stageWidth * 0.04,
      top: bodyTop + bodyHeight * 1.08,
      width: stageWidth * 0.92,
      height: lineHeight * 2.4,
      rotation: -5 + Math.sin(motionTimeMs / 970) * 5,
      opacity: 0.2,
    },
  ];

  const bubbles: Bubble[] = Array.from({ length: 9 }, (_, index) => {
    const fraction = (index + 1) / 10;
    return {
      id: `bubble-${index}`,
      left:
        stageWidth * (0.12 + fraction * 0.74) +
        Math.sin(motionTimeMs / (900 + index * 70) + index) * stageWidth * 0.02,
      top:
        lineHeight * (2.6 + (index % 4) * 2.4) +
        Math.cos(motionTimeMs / (820 + index * 60) + index * 0.7) * lineHeight * 0.8,
      size: 6 + (index % 3) * 4,
      opacity: 0.14 + (index % 3) * 0.06,
    };
  });

  return {
    body,
    leaves,
    rings,
    currents,
    bubbles,
    obstacles: [rings[0]!, body, ...leaves, rings[1]!, rings[2]!],
    topPadding: Math.max(lineHeight * 3.8, 98),
    bottomPadding: Math.max(lineHeight * 3.4, 94),
  };
}
