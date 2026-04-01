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
    expect(layout.obstacles.length).toBeGreaterThan(1);
    expect(layout.callouts.length).toBeGreaterThan(0);
  });

  test('keeps compact figures inside the paragraph flow instead of stacking them above it', () => {
    const layout = buildReaderSceneLayout(READER_SCENES[1]!, 420, 28);

    expect(layout.topPadding).toBeLessThan(layout.figure.top + layout.figure.height);
    expect(layout.figure.top).toBeLessThan(28 * 3);
    expect(layout.figure.left).toBeLessThan(420 * 0.3);
    expect(layout.stageMinHeight).toBeGreaterThan(layout.topPadding);
    expect(layout.callouts).toHaveLength(0);
    expect(layout.obstacles.length).toBeGreaterThan(1);
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

  test('mixes figure placement across spreads so images wrap text differently by scene', () => {
    const bank = buildReaderSceneLayout(READER_SCENES[0]!, 920, 30);
    const fall = buildReaderSceneLayout(READER_SCENES[1]!, 920, 30);
    const hall = buildReaderSceneLayout(READER_SCENES[2]!, 920, 30);
    const tea = buildReaderSceneLayout(READER_SCENES[3]!, 920, 30);
    const queen = buildReaderSceneLayout(READER_SCENES[4]!, 920, 30);
    const trial = buildReaderSceneLayout(READER_SCENES[5]!, 920, 30);
    const waking = buildReaderSceneLayout(READER_SCENES[6]!, 920, 30);

    expect(bank.figure.left).toBeGreaterThan(920 * 0.55);
    expect(fall.figure.left).toBeLessThan(920 * 0.35);
    expect(hall.figure.left).toBeGreaterThan(920 * 0.4);
    expect(tea.figure.left).toBeLessThan(920 * 0.25);
    expect(queen.figure.left).toBeGreaterThan(920 * 0.5);
    expect(trial.figure.left).toBeLessThan(920 * 0.25);
    expect(waking.figure.left).toBeGreaterThan(920 * 0.45);
  });

  test('starts later-scene figures within the opening paragraph lines', () => {
    const fall = buildReaderSceneLayout(READER_SCENES[1]!, 920, 30);
    const hall = buildReaderSceneLayout(READER_SCENES[2]!, 920, 30);
    const tea = buildReaderSceneLayout(READER_SCENES[3]!, 920, 30);
    const queen = buildReaderSceneLayout(READER_SCENES[4]!, 920, 30);
    const trial = buildReaderSceneLayout(READER_SCENES[5]!, 920, 30);
    const waking = buildReaderSceneLayout(READER_SCENES[6]!, 920, 30);

    expect(fall.figure.top).toBeGreaterThan(30);
    expect(fall.figure.top).toBeLessThan(30 * 3);
    expect(hall.figure.top).toBeGreaterThan(30);
    expect(hall.figure.top).toBeLessThan(30 * 3);
    expect(tea.figure.top).toBeGreaterThan(30);
    expect(tea.figure.top).toBeLessThan(30 * 3);
    expect(queen.figure.top).toBeGreaterThan(30);
    expect(queen.figure.top).toBeLessThan(30 * 3);
    expect(trial.figure.top).toBeGreaterThan(30);
    expect(trial.figure.top).toBeLessThan(30 * 3.25);
    expect(waking.figure.top).toBeGreaterThan(30);
    expect(waking.figure.top).toBeLessThan(30 * 3);
  });
});
