import type { FlowObstacle } from './pretextAdapter';
import type { ReaderFigure, ReaderScene } from './readerContent';

export type ReaderFigurePlacement = ReaderFigure & {
  height: number;
  left: number;
  rotation: number;
  top: number;
  width: number;
};

export type ReaderSceneLayout = {
  bottomPadding: number;
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

function createObstacle(id: string, left: number, top: number, width: number, height: number): FlowObstacle {
  return {
    id,
    kind: 'slice',
    left,
    top,
    width,
    height,
  };
}

function createFigureObstacle(
  stageWidth: number,
  lineHeight: number,
  figureLeft: number,
  figureTop: number,
  figureWidth: number,
  figureHeight: number,
): FlowObstacle {
  const horizontalPadding = clamp(lineHeight * 0.8, 18, 30);
  const topPadding = clamp(lineHeight * 0.45, 8, 16);
  const bottomPadding = clamp(lineHeight * 1.15, 22, 36);
  const obstacleLeft = Math.max(0, figureLeft - horizontalPadding);
  const obstacleRight = Math.min(stageWidth, figureLeft + figureWidth + horizontalPadding);

  return createObstacle(
    'figure-safe-zone',
    obstacleLeft,
    Math.max(0, figureTop - topPadding),
    obstacleRight - obstacleLeft,
    figureHeight + topPadding + bottomPadding,
  );
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
    const figureWidth = Math.min(width * 0.56, 250);
    const figureHeight = figureWidth * 1.18;
    const driftX = Math.sin(motionTimeMs / 1800) * Math.min(width * 0.012, 4);
    const driftY = Math.cos(motionTimeMs / 2200) * Math.min(lineHeight * 0.2, 4);
    const figureLeft = (width - figureWidth) / 2 + driftX;
    const figureTop = lineHeight * 0.6 + driftY;
    const obstacle = createFigureObstacle(width, lineHeight, figureLeft, figureTop, figureWidth, figureHeight);

    return {
      bottomPadding: lineHeight * 2.8,
      figure: {
        ...scene.figure,
        height: figureHeight,
        left: figureLeft,
        rotation: Math.sin(motionTimeMs / 2600) * 0.8,
        top: figureTop,
        width: figureWidth,
      },
      obstacles: [obstacle],
      stageMinHeight: obstacle.top + obstacle.height + lineHeight * 3.8,
      topPadding: obstacle.top + obstacle.height + lineHeight * 1.4,
    };
  }

  if (scene.id === 'bank') {
    const figureWidth = clamp(width * 0.28, 180, 270);
    const figureHeight = figureWidth * 1.52;
    const driftX = Math.sin(motionTimeMs / 2400) * Math.min(width * 0.008, 4);
    const driftY = Math.cos(motionTimeMs / 2600) * Math.min(lineHeight * 0.12, 3);
    const figureLeft = width - figureWidth - 12 + driftX;
    const figureTop = lineHeight * 0.45 + driftY;
    const obstacle = createFigureObstacle(width, lineHeight, figureLeft, figureTop, figureWidth, figureHeight);

    return {
      bottomPadding: lineHeight * 2.4,
      figure: {
        ...scene.figure,
        height: figureHeight,
        left: figureLeft,
        rotation: 2 + Math.sin(motionTimeMs / 2800) * 0.55,
        top: figureTop,
        width: figureWidth,
      },
      obstacles: [obstacle],
      stageMinHeight: obstacle.top + obstacle.height + lineHeight * 2.6,
      topPadding: lineHeight * 0.55,
    };
  }

  if (scene.id === 'fall') {
    const figureWidth = clamp(width * 0.2, 130, 180);
    const figureHeight = figureWidth * 2.05;
    const driftX = Math.sin(motionTimeMs / 2200) * Math.min(width * 0.01, 4);
    const driftY = Math.cos(motionTimeMs / 1900) * Math.min(lineHeight * 0.2, 5);
    const figureLeft = width * 0.07 + driftX;
    const figureTop = lineHeight * 1 + driftY;
    const obstacle = createFigureObstacle(width, lineHeight, figureLeft, figureTop, figureWidth, figureHeight);

    return {
      bottomPadding: lineHeight * 2.5,
      figure: {
        ...scene.figure,
        height: figureHeight,
        left: figureLeft,
        rotation: -1.4 + Math.sin(motionTimeMs / 2400) * 0.8,
        top: figureTop,
        width: figureWidth,
      },
      obstacles: [obstacle],
      stageMinHeight: obstacle.top + obstacle.height + lineHeight * 3,
      topPadding: lineHeight * 0.8,
    };
  }

  const figureWidth = clamp(width * 0.32, 210, 320);
  const figureHeight = figureWidth * 1.14;
  const driftX = Math.sin(motionTimeMs / 2400) * Math.min(width * 0.01, 4);
  const driftY = Math.cos(motionTimeMs / 2600) * Math.min(lineHeight * 0.18, 4);
  const figureLeft = width - figureWidth - 10 + driftX;
  const figureTop = lineHeight * 3.7 + driftY;
  const obstacle = createFigureObstacle(width, lineHeight, figureLeft, figureTop, figureWidth, figureHeight);

  return {
    bottomPadding: lineHeight * 2.5,
    figure: {
      ...scene.figure,
      height: figureHeight,
      left: figureLeft,
      rotation: 1.5 + Math.sin(motionTimeMs / 2800) * 0.55,
      top: figureTop,
      width: figureWidth,
    },
    obstacles: [obstacle],
    stageMinHeight: obstacle.top + obstacle.height + lineHeight * 2.8,
    topPadding: lineHeight * 0.7,
  };
}
