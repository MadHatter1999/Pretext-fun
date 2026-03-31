import type { LayoutLinesResult, LayoutResult } from '@chenglou/pretext';

import type { FlowLayoutResult } from './pretextAdapter';
import type { PlaygroundSettings } from './playgroundState';

export type DebugPayload = {
  inputSettings: PlaygroundSettings & {
    font: string;
  };
  computedHeight: number;
  lineCount: number;
  lines: Array<{
    text: string;
    width: number;
  }>;
  pineappleFlow: {
    computedHeight: number;
    lineCount: number;
    stageHeight: number;
    lines: Array<{
      text: string;
      width: number;
      x: number;
      y: number;
      availableWidth: number;
      slotSide: string;
    }>;
  } | null;
};

export function buildDebugPayload(
  settings: PlaygroundSettings,
  font: string,
  measureResult: LayoutResult | null,
  lineLayoutResult: LayoutLinesResult | null,
  flowLayoutResult: FlowLayoutResult | null,
): DebugPayload {
  return {
    inputSettings: {
      ...settings,
      font,
    },
    computedHeight: measureResult?.height ?? 0,
    lineCount: measureResult?.lineCount ?? 0,
    lines:
      lineLayoutResult?.lines.map((line) => ({
        text: line.text,
        width: Number(line.width.toFixed(2)),
      })) ?? [],
    pineappleFlow: flowLayoutResult
      ? {
          computedHeight: flowLayoutResult.height,
          lineCount: flowLayoutResult.lineCount,
          stageHeight: Number(flowLayoutResult.stageHeight.toFixed(2)),
          lines: flowLayoutResult.lines.map((line) => ({
            text: line.text,
            width: Number(line.width.toFixed(2)),
            x: Number(line.x.toFixed(2)),
            y: Number(line.y.toFixed(2)),
            availableWidth: Number(line.availableWidth.toFixed(2)),
            slotSide: line.slotSide,
          })),
        }
      : null,
  };
}
