import type { FlowObstacle } from './pretextAdapter';
import type { ReaderCallout, ReaderFigure, ReaderScene } from './readerContent';

export type ReaderFigurePlacement = ReaderFigure & {
  height: number;
  left: number;
  rotation: number;
  top: number;
  width: number;
};

export type ReaderCalloutPlacement = ReaderCallout & {
  left: number;
  rotation: number;
  top: number;
  width: number;
};

export type ReaderSceneLayout = {
  bottomPadding: number;
  callouts: ReaderCalloutPlacement[];
  figure: ReaderFigurePlacement;
  obstacles: FlowObstacle[];
  stageMinHeight: number;
  topPadding: number;
};

export const READER_STAGE_MAX_WIDTH = 980;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function resolveReaderStageWidth(availableWidth: number): number {
  return clamp(Math.round(availableWidth), 320, READER_STAGE_MAX_WIDTH);
}

export function resolveReaderBodyFontSize(stageWidth: number, sizeBias: number = 0): number {
  const baseSize = clamp(Math.round(stageWidth / 48), 17, 21);
  return clamp(baseSize + sizeBias, 16, 24);
}

function createObstacle(
  id: string,
  left: number,
  top: number,
  width: number,
  height: number,
): FlowObstacle {
  return {
    id,
    kind: 'slice',
    left,
    top,
    width,
    height,
  };
}

function createCenteredObstacle(
  id: string,
  stageWidth: number,
  centerX: number,
  top: number,
  width: number,
  height: number,
): FlowObstacle {
  const safeWidth = clamp(width, 1, stageWidth);
  return createObstacle(
    id,
    clamp(centerX - safeWidth / 2, 0, Math.max(0, stageWidth - safeWidth)),
    Math.max(0, top),
    safeWidth,
    height,
  );
}

function getObstacleBounds(obstacles: FlowObstacle[]): {
  bottom: number;
  top: number;
} {
  return obstacles.reduce(
    (bounds, obstacle) => ({
      bottom: Math.max(bounds.bottom, obstacle.top + obstacle.height),
      top: Math.min(bounds.top, obstacle.top),
    }),
    {
      bottom: 0,
      top: Number.POSITIVE_INFINITY,
    },
  );
}

function createFigureObstacles(
  stageWidth: number,
  lineHeight: number,
  figureLeft: number,
  figureTop: number,
  figureWidth: number,
  figureHeight: number,
): FlowObstacle[] {
  const centerX = figureLeft + figureWidth / 2;
  const horizontalPadding = clamp(lineHeight * 0.8, 18, 30);
  const topPadding = clamp(lineHeight * 0.45, 8, 16);
  const bottomPadding = clamp(lineHeight * 0.95, 18, 30);
  const captionHeight = clamp(lineHeight * 2.2, 42, 64);

  return [
    createCenteredObstacle(
      'figure-crown',
      stageWidth,
      centerX,
      figureTop - topPadding,
      figureWidth * 0.74 + horizontalPadding * 1.4,
      figureHeight * 0.26 + topPadding,
    ),
    createCenteredObstacle(
      'figure-body',
      stageWidth,
      centerX,
      figureTop + figureHeight * 0.17,
      figureWidth + horizontalPadding * 2.1,
      figureHeight * 0.42,
    ),
    createCenteredObstacle(
      'figure-lower',
      stageWidth,
      centerX,
      figureTop + figureHeight * 0.55,
      figureWidth * 0.88 + horizontalPadding * 1.6,
      figureHeight * 0.28 + bottomPadding,
    ),
    createCenteredObstacle(
      'figure-caption',
      stageWidth,
      centerX,
      figureTop + figureHeight - captionHeight * 0.82,
      figureWidth * 0.94 + horizontalPadding * 1.2,
      captionHeight,
    ),
  ];
}

function createCalloutPlacement(
  callout: ReaderCallout,
  stageWidth: number,
  left: number,
  top: number,
  width: number,
  rotation: number,
): ReaderCalloutPlacement {
  const safeWidth = clamp(width, 156, Math.max(156, stageWidth - 32));

  return {
    ...callout,
    left: clamp(left, 12, Math.max(12, stageWidth - safeWidth - 12)),
    rotation,
    top: Math.max(0, top),
    width: safeWidth,
  };
}

type CalloutPlacementSpec = {
  left: number;
  rotation: number;
  top: number;
  width: number;
};

function buildSceneCalloutPlacements(
  scene: ReaderScene,
  stageWidth: number,
  lineHeight: number,
  motionTimeMs: number,
): CalloutPlacementSpec[] {
  const driftX = Math.sin(motionTimeMs / 3200) * Math.min(stageWidth * 0.006, 4);
  const driftY = Math.cos(motionTimeMs / 2800) * Math.min(lineHeight * 0.14, 4);

  if (scene.id === 'bank') {
    return [
      {
        left: stageWidth * 0.035 + driftX,
        top: lineHeight * 7.8 + driftY,
        width: clamp(stageWidth * 0.23, 176, 220),
        rotation: -2.6 + Math.sin(motionTimeMs / 3100) * 0.45,
      },
      {
        left: stageWidth * 0.2 + driftX,
        top: lineHeight * 13.6 - driftY,
        width: clamp(stageWidth * 0.2, 164, 200),
        rotation: 1.8 + Math.cos(motionTimeMs / 2600) * 0.4,
      },
      {
        left: stageWidth * 0.52 - driftX,
        top: lineHeight * 16.1 + driftY,
        width: clamp(stageWidth * 0.21, 166, 204),
        rotation: -1.2 + Math.sin(motionTimeMs / 2500) * 0.35,
      },
    ];
  }

  if (scene.id === 'fall') {
    return [
      {
        left: stageWidth - clamp(stageWidth * 0.24, 176, 228) - 18 + driftX,
        top: lineHeight * 5.5 + driftY,
        width: clamp(stageWidth * 0.24, 176, 228),
        rotation: 2.2 + Math.cos(motionTimeMs / 3000) * 0.5,
      },
      {
        left: stageWidth * 0.42 - driftX,
        top: lineHeight * 11.4 + driftY,
        width: clamp(stageWidth * 0.2, 164, 198),
        rotation: -2.4 + Math.sin(motionTimeMs / 2400) * 0.45,
      },
      {
        left: stageWidth * 0.68 + driftX,
        top: lineHeight * 17.1 - driftY,
        width: clamp(stageWidth * 0.18, 154, 186),
        rotation: 1.4 + Math.cos(motionTimeMs / 2900) * 0.4,
      },
    ];
  }

  if (scene.id === 'hall') {
    return [
      {
        left: 14 + driftX,
        top: lineHeight * 2.2 + driftY,
        width: clamp(stageWidth * 0.22, 170, 214),
        rotation: -1.6 + Math.sin(motionTimeMs / 3300) * 0.4,
      },
      {
        left: stageWidth * 0.08 - driftX,
        top: lineHeight * 10.7 + driftY,
        width: clamp(stageWidth * 0.19, 158, 194),
        rotation: 2.2 + Math.cos(motionTimeMs / 2600) * 0.4,
      },
      {
        left: stageWidth * 0.54 + driftX,
        top: lineHeight * 17.4 - driftY,
        width: clamp(stageWidth * 0.2, 160, 198),
        rotation: -1.1 + Math.sin(motionTimeMs / 2800) * 0.35,
      },
    ];
  }

  if (scene.id === 'tea') {
    return [
      {
        left: stageWidth - clamp(stageWidth * 0.26, 188, 236) - 14 + driftX,
        top: lineHeight * 8.4 + driftY,
        width: clamp(stageWidth * 0.26, 188, 236),
        rotation: 1.4 + Math.cos(motionTimeMs / 3200) * 0.5,
      },
      {
        left: stageWidth * 0.36 - driftX,
        top: lineHeight * 14.1 + driftY,
        width: clamp(stageWidth * 0.2, 166, 202),
        rotation: -2.2 + Math.sin(motionTimeMs / 2500) * 0.4,
      },
      {
        left: stageWidth * 0.62 + driftX,
        top: lineHeight * 18.8 - driftY,
        width: clamp(stageWidth * 0.18, 152, 188),
        rotation: 1.8 + Math.cos(motionTimeMs / 2900) * 0.45,
      },
    ];
  }

  if (scene.id === 'queen') {
    return [
      {
        left: 14 + driftX,
        top: lineHeight * 6.9 + driftY,
        width: clamp(stageWidth * 0.25, 184, 232),
        rotation: -2.1 + Math.sin(motionTimeMs / 3100) * 0.5,
      },
      {
        left: stageWidth * 0.24 - driftX,
        top: lineHeight * 13.8 + driftY,
        width: clamp(stageWidth * 0.2, 166, 204),
        rotation: 1.7 + Math.cos(motionTimeMs / 2600) * 0.4,
      },
      {
        left: stageWidth * 0.55 + driftX,
        top: lineHeight * 18.5 - driftY,
        width: clamp(stageWidth * 0.18, 154, 188),
        rotation: -1.4 + Math.sin(motionTimeMs / 2900) * 0.35,
      },
    ];
  }

  if (scene.id === 'trial') {
    return [
      {
        left: stageWidth - clamp(stageWidth * 0.25, 184, 232) - 16 + driftX,
        top: lineHeight * 5.8 + driftY,
        width: clamp(stageWidth * 0.25, 184, 232),
        rotation: 1.8 + Math.cos(motionTimeMs / 3000) * 0.45,
      },
      {
        left: stageWidth * 0.48 - driftX,
        top: lineHeight * 13.1 + driftY,
        width: clamp(stageWidth * 0.21, 168, 206),
        rotation: -2 + Math.sin(motionTimeMs / 2800) * 0.45,
      },
      {
        left: stageWidth * 0.7 + driftX,
        top: lineHeight * 18.3 - driftY,
        width: clamp(stageWidth * 0.17, 150, 180),
        rotation: 1.1 + Math.cos(motionTimeMs / 2500) * 0.35,
      },
    ];
  }

  return [
    {
      left: 18 + driftX,
      top: lineHeight * 4.1 + driftY,
      width: clamp(stageWidth * 0.24, 180, 224),
      rotation: -1.3 + Math.sin(motionTimeMs / 3000) * 0.4,
    },
    {
      left: stageWidth * 0.22 - driftX,
      top: lineHeight * 11.8 + driftY,
      width: clamp(stageWidth * 0.2, 164, 198),
      rotation: 2 + Math.cos(motionTimeMs / 2800) * 0.4,
    },
    {
      left: stageWidth * 0.56 + driftX,
      top: lineHeight * 17.2 - driftY,
      width: clamp(stageWidth * 0.18, 152, 188),
      rotation: -1.5 + Math.sin(motionTimeMs / 2600) * 0.35,
    },
  ];
}

function resolveReaderCallouts(
  scene: ReaderScene,
  stageWidth: number,
  lineHeight: number,
  motionTimeMs: number,
): ReaderCalloutPlacement[] {
  if (stageWidth < 720 || scene.callouts.length === 0) {
    return [];
  }

  const placements = buildSceneCalloutPlacements(scene, stageWidth, lineHeight, motionTimeMs);

  return scene.callouts.map((callout, index) => {
    const placement = placements[index] ?? placements[placements.length - 1]!;
    return createCalloutPlacement(
      callout,
      stageWidth,
      placement.left,
      placement.top,
      placement.width,
      placement.rotation,
    );
  });
}

export function buildReaderSceneLayout(
  scene: ReaderScene,
  stageWidth: number,
  lineHeight: number,
  motionTimeMs: number = 0,
): ReaderSceneLayout {
  const width = resolveReaderStageWidth(stageWidth);
  const compact = width < 720;

  if (compact) {
    const driftX = Math.sin(motionTimeMs / 1800) * Math.min(width * 0.012, 4);
    const driftY = Math.cos(motionTimeMs / 2200) * Math.min(lineHeight * 0.2, 4);
    let figureWidth = clamp(width * 0.33, 122, 198);
    let figureLeft = width - figureWidth - 10 + driftX;
    let figureTop = lineHeight * 1.4 + driftY;
    let rotation = 1.2 + Math.sin(motionTimeMs / 2600) * 0.6;

    if (scene.id === 'bank') {
      figureWidth = clamp(width * 0.35, 126, 204);
      figureLeft = width - figureWidth - 10 + driftX;
      figureTop = lineHeight * 1.15 + driftY;
      rotation = 1.8 + Math.sin(motionTimeMs / 2500) * 0.5;
    } else if (scene.id === 'fall') {
      figureWidth = clamp(width * 0.25, 108, 142);
      figureLeft = width * 0.08 + driftX;
      figureTop = lineHeight * 1.3 + driftY;
      rotation = -1.2 + Math.sin(motionTimeMs / 2400) * 0.75;
    } else if (scene.id === 'hall') {
      figureWidth = clamp(width * 0.31, 124, 178);
      figureLeft = width - figureWidth - 12 + driftX;
      figureTop = lineHeight * 1.55 + driftY;
      rotation = 1.1 + Math.sin(motionTimeMs / 2700) * 0.55;
    } else if (scene.id === 'tea') {
      figureWidth = clamp(width * 0.35, 140, 194);
      figureLeft = width * 0.06 + driftX;
      figureTop = lineHeight * 1.65 + driftY;
      rotation = -1 + Math.sin(motionTimeMs / 2500) * 0.55;
    } else if (scene.id === 'queen') {
      figureWidth = clamp(width * 0.28, 116, 158);
      figureLeft = width - figureWidth - 14 + driftX;
      figureTop = lineHeight * 1.45 + driftY;
      rotation = 1.9 + Math.sin(motionTimeMs / 2600) * 0.45;
    } else if (scene.id === 'trial') {
      figureWidth = clamp(width * 0.27, 114, 154);
      figureLeft = width * 0.08 + driftX;
      figureTop = lineHeight * 1.8 + driftY;
      rotation = -1.4 + Math.sin(motionTimeMs / 2400) * 0.5;
    } else if (scene.id === 'waking') {
      figureWidth = clamp(width * 0.28, 118, 160);
      figureLeft = width - figureWidth - 12 + driftX;
      figureTop = lineHeight * 1.55 + driftY;
      rotation = 1 + Math.sin(motionTimeMs / 2800) * 0.4;
    }

    const safeFigureLeft = clamp(figureLeft, 8, Math.max(8, width - figureWidth - 8));
    const figureHeight = figureWidth * scene.figure.displayAspectRatio;
    const obstacles = createFigureObstacles(
      width,
      lineHeight,
      safeFigureLeft,
      figureTop,
      figureWidth,
      figureHeight,
    );

    return {
      bottomPadding: lineHeight * 2.6,
      callouts: [],
      figure: {
        ...scene.figure,
        height: figureHeight,
        left: safeFigureLeft,
        rotation,
        top: figureTop,
        width: figureWidth,
      },
      obstacles,
      stageMinHeight: lineHeight * 12,
      topPadding: lineHeight * 0.9,
    };
  }

  const callouts = resolveReaderCallouts(scene, width, lineHeight, motionTimeMs);

  if (scene.id === 'bank') {
    const figureWidth = clamp(width * 0.27, 182, 258);
    const figureHeight = figureWidth * scene.figure.displayAspectRatio;
    const driftX = Math.sin(motionTimeMs / 2400) * Math.min(width * 0.008, 4);
    const driftY = Math.cos(motionTimeMs / 2600) * Math.min(lineHeight * 0.12, 3);
    const figureLeft = width - figureWidth - 18 + driftX;
    const figureTop = lineHeight * 0.55 + driftY;
    const obstacles = createFigureObstacles(
      width,
      lineHeight,
      figureLeft,
      figureTop,
      figureWidth,
      figureHeight,
    );
    const obstacleBounds = getObstacleBounds(obstacles);

    return {
      bottomPadding: lineHeight * 2.4,
      callouts,
      figure: {
        ...scene.figure,
        height: figureHeight,
        left: figureLeft,
        rotation: 2 + Math.sin(motionTimeMs / 2800) * 0.55,
        top: figureTop,
        width: figureWidth,
      },
      obstacles,
      stageMinHeight: obstacleBounds.bottom + lineHeight * 2.8,
      topPadding: lineHeight * 0.55,
    };
  }

  if (scene.id === 'fall') {
    const figureWidth = clamp(width * 0.17, 128, 160);
    const figureHeight = figureWidth * scene.figure.displayAspectRatio;
    const driftX = Math.sin(motionTimeMs / 2200) * Math.min(width * 0.01, 4);
    const driftY = Math.cos(motionTimeMs / 1900) * Math.min(lineHeight * 0.2, 5);
    const figureLeft = width * 0.09 + driftX;
    const figureTop = lineHeight * 1.55 + driftY;
    const obstacles = createFigureObstacles(
      width,
      lineHeight,
      figureLeft,
      figureTop,
      figureWidth,
      figureHeight,
    );
    const obstacleBounds = getObstacleBounds(obstacles);

    return {
      bottomPadding: lineHeight * 2.5,
      callouts,
      figure: {
        ...scene.figure,
        height: figureHeight,
        left: figureLeft,
        rotation: -1.4 + Math.sin(motionTimeMs / 2400) * 0.8,
        top: figureTop,
        width: figureWidth,
      },
      obstacles,
      stageMinHeight: obstacleBounds.bottom + lineHeight * 3.1,
      topPadding: lineHeight * 0.75,
    };
  }

  if (scene.id === 'hall') {
    const figureWidth = clamp(width * 0.23, 184, 232);
    const figureHeight = figureWidth * scene.figure.displayAspectRatio;
    const driftX = Math.sin(motionTimeMs / 2400) * Math.min(width * 0.01, 4);
    const driftY = Math.cos(motionTimeMs / 2600) * Math.min(lineHeight * 0.18, 4);
    const figureLeft = width * 0.57 + driftX;
    const figureTop = lineHeight * 1.8 + driftY;
    const obstacles = createFigureObstacles(
      width,
      lineHeight,
      figureLeft,
      figureTop,
      figureWidth,
      figureHeight,
    );
    const obstacleBounds = getObstacleBounds(obstacles);

    return {
      bottomPadding: lineHeight * 2.5,
      callouts,
      figure: {
        ...scene.figure,
        height: figureHeight,
        left: figureLeft,
        rotation: 1.5 + Math.sin(motionTimeMs / 2800) * 0.55,
        top: figureTop,
        width: figureWidth,
      },
      obstacles,
      stageMinHeight: obstacleBounds.bottom + lineHeight * 2.8,
      topPadding: lineHeight * 0.78,
    };
  }

  if (scene.id === 'tea') {
    const figureWidth = clamp(width * 0.27, 202, 248);
    const figureHeight = figureWidth * scene.figure.displayAspectRatio;
    const driftX = Math.sin(motionTimeMs / 2500) * Math.min(width * 0.01, 5);
    const driftY = Math.cos(motionTimeMs / 2100) * Math.min(lineHeight * 0.16, 4);
    const figureLeft = width * 0.08 + driftX;
    const figureTop = lineHeight * 1.9 + driftY;
    const obstacles = createFigureObstacles(
      width,
      lineHeight,
      figureLeft,
      figureTop,
      figureWidth,
      figureHeight,
    );
    const obstacleBounds = getObstacleBounds(obstacles);

    return {
      bottomPadding: lineHeight * 2.7,
      callouts,
      figure: {
        ...scene.figure,
        height: figureHeight,
        left: figureLeft,
        rotation: -1.2 + Math.sin(motionTimeMs / 2600) * 0.6,
        top: figureTop,
        width: figureWidth,
      },
      obstacles,
      stageMinHeight: obstacleBounds.bottom + lineHeight * 3.4,
      topPadding: lineHeight * 0.8,
    };
  }

  if (scene.id === 'queen') {
    const figureWidth = clamp(width * 0.21, 170, 206);
    const figureHeight = figureWidth * scene.figure.displayAspectRatio;
    const driftX = Math.sin(motionTimeMs / 2300) * Math.min(width * 0.009, 4);
    const driftY = Math.cos(motionTimeMs / 2500) * Math.min(lineHeight * 0.14, 4);
    const figureLeft = width * 0.59 + driftX;
    const figureTop = lineHeight * 1.7 + driftY;
    const obstacles = createFigureObstacles(
      width,
      lineHeight,
      figureLeft,
      figureTop,
      figureWidth,
      figureHeight,
    );
    const obstacleBounds = getObstacleBounds(obstacles);

    return {
      bottomPadding: lineHeight * 2.7,
      callouts,
      figure: {
        ...scene.figure,
        height: figureHeight,
        left: figureLeft,
        rotation: 2.1 + Math.sin(motionTimeMs / 2700) * 0.5,
        top: figureTop,
        width: figureWidth,
      },
      obstacles,
      stageMinHeight: obstacleBounds.bottom + lineHeight * 3,
      topPadding: lineHeight * 0.8,
    };
  }

  if (scene.id === 'trial') {
    const figureWidth = clamp(width * 0.19, 156, 188);
    const figureHeight = figureWidth * scene.figure.displayAspectRatio;
    const driftX = Math.sin(motionTimeMs / 2200) * Math.min(width * 0.009, 4);
    const driftY = Math.cos(motionTimeMs / 2400) * Math.min(lineHeight * 0.14, 4);
    const figureLeft = width * 0.1 + driftX;
    const figureTop = lineHeight * 2 + driftY;
    const obstacles = createFigureObstacles(
      width,
      lineHeight,
      figureLeft,
      figureTop,
      figureWidth,
      figureHeight,
    );
    const obstacleBounds = getObstacleBounds(obstacles);

    return {
      bottomPadding: lineHeight * 2.6,
      callouts,
      figure: {
        ...scene.figure,
        height: figureHeight,
        left: figureLeft,
        rotation: -1.7 + Math.sin(motionTimeMs / 2500) * 0.55,
        top: figureTop,
        width: figureWidth,
      },
      obstacles,
      stageMinHeight: obstacleBounds.bottom + lineHeight * 3.1,
      topPadding: lineHeight * 0.8,
    };
  }

  const figureWidth = clamp(width * 0.19, 164, 194);
  const figureHeight = figureWidth * scene.figure.displayAspectRatio;
  const driftX = Math.sin(motionTimeMs / 2400) * Math.min(width * 0.009, 4);
  const driftY = Math.cos(motionTimeMs / 2600) * Math.min(lineHeight * 0.15, 4);
  const figureLeft = width * 0.55 + driftX;
  const figureTop = lineHeight * 1.85 + driftY;
  const obstacles = createFigureObstacles(
    width,
    lineHeight,
    figureLeft,
    figureTop,
    figureWidth,
    figureHeight,
  );
  const obstacleBounds = getObstacleBounds(obstacles);

  return {
    bottomPadding: lineHeight * 2.8,
    callouts,
    figure: {
      ...scene.figure,
      height: figureHeight,
      left: figureLeft,
      rotation: 1.2 + Math.sin(motionTimeMs / 2900) * 0.45,
      top: figureTop,
      width: figureWidth,
    },
    obstacles,
    stageMinHeight: obstacleBounds.bottom + lineHeight * 2.9,
    topPadding: lineHeight * 0.82,
  };
}
