import { describe, expect, test } from 'vitest';

import { READER_SCENES } from './readerContent';
import {
  buildReaderSceneLayout,
  resolveReaderBodyFontSize,
  resolveReaderStageWidth,
} from './readerLayout';

describe('buildReaderSceneLayout', () => {
  test('clamps the reader stage width to a comfortable measure', () => {
    expect(resolveReaderStageWidth(240)).toBe(320);
    expect(resolveReaderStageWidth(860)).toBe(860);
    expect(resolveReaderStageWidth(1600)).toBe(980);
  });

  test('adjusts the body font size from the reading measure with a bounded bias', () => {
    expect(resolveReaderBodyFontSize(480)).toBe(17);
    expect(resolveReaderBodyFontSize(980)).toBe(20);
    expect(resolveReaderBodyFontSize(980, 3)).toBe(23);
  });

  test('keeps desktop figures inside the stage width', () => {
    const layout = buildReaderSceneLayout(READER_SCENES[0]!, 900, 30);

    expect(layout.figure.left).toBeGreaterThanOrEqual(0);
    expect(layout.figure.left + layout.figure.width).toBeLessThanOrEqual(900);
    expect(layout.obstacles.length).toBe(1);
    expect(layout.callouts.length).toBeGreaterThan(0);
  });

  test('stacks the figure above the text in compact mode', () => {
    const layout = buildReaderSceneLayout(READER_SCENES[1]!, 420, 28);

    expect(layout.topPadding).toBeGreaterThan(layout.figure.top + layout.figure.height);
    expect(layout.figure.left).toBeGreaterThan(0);
    expect(layout.stageMinHeight).toBeGreaterThan(layout.topPadding);
    expect(layout.callouts).toHaveLength(0);
  });

  test('supports later scenes from the end of the story', () => {
    const layout = buildReaderSceneLayout(READER_SCENES[6]!, 920, 30);

    expect(READER_SCENES).toHaveLength(7);
    expect(layout.figure.top).toBeGreaterThan(0);
    expect(layout.callouts.length).toBeGreaterThan(0);
  });

  test('keeps the max-whimsy scene set populated with three callouts per spread', () => {
    expect(READER_SCENES.every((scene) => scene.callouts.length === 3)).toBe(true);
  });
});
