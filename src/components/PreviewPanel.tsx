import { useEffect, useMemo, useState, type CSSProperties } from 'react';

import type { LayoutLinesResult, LayoutResult } from '@chenglou/pretext';

import { buildDebugPayload } from '../lib/debugPayload';
import { buildPineappleScene } from '../lib/pineappleScene';
import {
  layoutParagraphFlow,
  type FlowLayoutResult,
  type PreparedParagraph,
} from '../lib/pretextAdapter';
import type { PlaygroundSettings } from '../lib/playgroundState';
import {
  createShowcaseBubbles,
  fitHeadlineLayout,
  type HeadlineLayout,
  type TightBubbleLayout,
} from '../lib/showcaseLayouts';

type PreviewTab = 'flow' | 'measure' | 'lines';

type PreviewPanelProps = {
  activeTab: PreviewTab;
  error: string | null;
  font: string | null;
  lineLayoutResult: LayoutLinesResult | null;
  measureResult: LayoutResult | null;
  onTabChange: (tab: PreviewTab) => void;
  preparedParagraph: PreparedParagraph | null;
  settings: PlaygroundSettings;
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown preview error.';
}

function formatWidth(width: number): string {
  return `${Math.round(width * 100) / 100}px`;
}

function PineappleFlowTab({
  bubbleLayouts,
  flowLayoutResult,
  font,
  headlineLayout,
  motionTimeMs,
  pineappleScene,
  settings,
}: {
  bubbleLayouts: TightBubbleLayout[];
  flowLayoutResult: FlowLayoutResult | null;
  font: string | null;
  headlineLayout: HeadlineLayout | null;
  motionTimeMs: number;
  pineappleScene: ReturnType<typeof buildPineappleScene>;
  settings: PlaygroundSettings;
}) {
  const stageHeight =
    flowLayoutResult?.stageHeight ??
    pineappleScene.body.top + pineappleScene.body.height + pineappleScene.bottomPadding;
  const heroHeight = (headlineLayout?.height ?? 160) + 108;

  return (
    <div className="preview-content preview-content--showcase">
      <div className="preview-stage hero-stage-shell">
        <div className="stage-ruler" style={{ width: `${settings.width}px` }}>
          <span>Adaptive headline</span>
          <span>{headlineLayout ? `${headlineLayout.fontSize}px fitted type` : 'waiting...'}</span>
        </div>
        <div
          className="hero-stage"
          style={{
            width: `${settings.width}px`,
            height: `${heroHeight}px`,
          }}
        >
          <div className="hero-glow hero-glow--left" />
          <div className="hero-glow hero-glow--right" />
          <div className="hero-chip">Pretext editorial storm</div>
          {headlineLayout?.lines.map((line, index) => {
            const xOffset =
              (settings.width - line.width) / 2 + Math.sin(index * 0.9 + motionTimeMs / 1600) * 10;
            return (
              <div
                key={`${index}-${line.text}`}
                className="hero-line"
                style={{
                  left: `${Math.max(0, xOffset)}px`,
                  top: `${40 + line.y}px`,
                  width: `${line.width}px`,
                  font: headlineLayout.font,
                  lineHeight: `${headlineLayout.lineHeight}px`,
                }}
              >
                {line.text}
              </div>
            );
          })}
          <div className="hero-subcopy">
            Binary-searched headline sizing, live obstacle flow, and shrink-wrapped annotation
            cards. No DOM text measurement.
          </div>
        </div>
      </div>

      <div className="showcase-grid">
        <div className="preview-stage pineapple-stage-shell">
          <div className="stage-ruler" style={{ width: `${settings.width}px` }}>
            <span>{flowLayoutResult?.lineCount ?? 0} routed lines</span>
            <span>{Math.round(stageHeight)}px animated stage</span>
          </div>
          <div
            className="pineapple-stage"
            style={{
              width: `${settings.width}px`,
              height: `${stageHeight}px`,
            }}
          >
            {pineappleScene.currents.map((current) => (
              <div
                key={current.id}
                className="current-ribbon"
                style={{
                  left: `${current.left}px`,
                  top: `${current.top}px`,
                  width: `${current.width}px`,
                  height: `${current.height}px`,
                  opacity: current.opacity,
                  transform: `rotate(${current.rotation}deg)`,
                }}
              />
            ))}
            {pineappleScene.bubbles.map((bubble) => (
              <div
                key={bubble.id}
                className="stage-bubble"
                style={{
                  left: `${bubble.left}px`,
                  top: `${bubble.top}px`,
                  width: `${bubble.size}px`,
                  height: `${bubble.size}px`,
                  opacity: bubble.opacity,
                }}
              />
            ))}
            <div
              className="pineapple-halo"
              style={{
                left: `${pineappleScene.body.left - pineappleScene.body.width * 0.24}px`,
                top: `${pineappleScene.body.top - pineappleScene.body.height * 0.16}px`,
                width: `${pineappleScene.body.width * 1.48}px`,
                height: `${pineappleScene.body.height * 1.34}px`,
              }}
            />
            <div
              className="pineapple-shadow"
              style={{
                left: `${pineappleScene.body.left - pineappleScene.body.width * 0.08}px`,
                top: `${pineappleScene.body.top + pineappleScene.body.height * 0.92}px`,
                width: `${pineappleScene.body.width * 1.18}px`,
                height: `${pineappleScene.body.height * 0.24}px`,
              }}
            />
            {pineappleScene.leaves.map((leaf) => (
              <div
                key={leaf.id}
                className="pineapple-leaf"
                style={{
                  left: `${leaf.left}px`,
                  top: `${leaf.top}px`,
                  width: `${leaf.width}px`,
                  height: `${leaf.height}px`,
                  transform: `rotate(${leaf.rotation}deg)`,
                }}
              />
            ))}
            {pineappleScene.rings.map((ring) => (
              <div
                key={ring.id}
                className="pineapple-ring"
                style={{
                  left: `${ring.left}px`,
                  top: `${ring.top}px`,
                  width: `${ring.width}px`,
                  height: `${ring.height}px`,
                  transform: `rotate(${ring.rotation}deg)`,
                }}
              >
                <div className="pineapple-ring-core" />
              </div>
            ))}
            <div
              className="pineapple-body"
              style={{
                left: `${pineappleScene.body.left}px`,
                top: `${pineappleScene.body.top}px`,
                width: `${pineappleScene.body.width}px`,
                height: `${pineappleScene.body.height}px`,
                transform: `rotate(${pineappleScene.body.rotation}deg)`,
              }}
            >
              <div className="pineapple-body-pattern" />
            </div>

            {flowLayoutResult?.lines.map((line, index) => (
              <div
                key={`${index}-${line.start.segmentIndex}-${line.y}`}
                className={`flow-line flow-line--${line.slotSide}`}
                style={{
                  left: `${line.x}px`,
                  top: `${line.y}px`,
                  width: `${Math.max(line.availableWidth, 2)}px`,
                  transform: `translateX(${Math.sin(motionTimeMs / 480 + index * 0.55) * 7}px)`,
                }}
                title={`${line.slotSide} slot, measured line width ${formatWidth(line.width)}`}
              >
                <div className="flow-line-lane" />
                <div
                  className="flow-line-ink"
                  style={{
                    width: `${Math.max(line.width, 2)}px`,
                    font: font ?? undefined,
                    lineHeight: `${settings.lineHeight}px`,
                  }}
                >
                  <span
                    className="flow-line-text"
                    style={{
                      whiteSpace: settings.whiteSpace === 'pre-wrap' ? 'break-spaces' : 'normal',
                    }}
                  >
                    {line.text.length > 0 ? line.text : '\u00A0'}
                  </span>
                </div>
              </div>
            ))}

            <div className="pineapple-stage-caption">
              Each line chooses a new slot around moving fruit, floating rings, and current bands.
            </div>
          </div>
        </div>

        <div className="note-dock">
          {bubbleLayouts.map((bubble, index) => (
            <div
              key={`${index}-${bubble.text}`}
              className="note-card"
              style={{
                width: `${bubble.width}px`,
                minHeight: `${bubble.height}px`,
                transform: `translateY(${Math.sin(motionTimeMs / 760 + index) * 7}px) rotate(${Math.sin(motionTimeMs / 1200 + index) * 2.8}deg)`,
              }}
            >
              <div className="note-card-kicker">Use case {index + 1}</div>
              <div className="note-card-lines" style={{ font: bubble.font }}>
                {bubble.lines.map((line, lineIndex) => (
                  <div
                    key={`${lineIndex}-${line.text}`}
                    className="note-card-line"
                    style={{
                      width: `${Math.max(line.width, 2)}px`,
                      lineHeight: `${bubble.lineHeight}px`,
                    }}
                  >
                    {line.text}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="preview-note">
        This scene combines three strong Pretext patterns at once: fit the headline, route the
        editorial copy line by line, and shrink-wrap the notes to their true multiline width.
      </p>
    </div>
  );
}

function MeasureTab({
  font,
  measureResult,
  settings,
}: {
  font: string | null;
  measureResult: LayoutResult | null;
  settings: PlaygroundSettings;
}) {
  const measureBoxStyle: CSSProperties & {
    '--measure-line-height': string;
  } = {
    '--measure-line-height': `${settings.lineHeight}px`,
    width: `${settings.width}px`,
    minHeight: `${measureResult?.height ?? settings.lineHeight}px`,
    height: `${measureResult?.height ?? settings.lineHeight}px`,
  };

  return (
    <div className="preview-content">
      <div className="preview-stage">
        <div className="stage-ruler" style={{ width: `${settings.width}px` }}>
          <span>{Math.round(settings.width)}px available width</span>
          <span>{Math.round(measureResult?.height ?? 0)}px computed height</span>
        </div>
        <div className="measure-box" style={measureBoxStyle}>
          <div
            className="measure-box-inner"
            style={{
              font: font ?? undefined,
              lineHeight: `${settings.lineHeight}px`,
              whiteSpace: settings.whiteSpace,
            }}
          >
            {settings.text || ' '}
          </div>
        </div>
      </div>
      <p className="preview-note">
        `prepare()` does the heavy lifting once. `layout()` stays cheap when only width or line
        height changes.
      </p>
    </div>
  );
}

function LinesTab({
  font,
  lineLayoutResult,
  settings,
}: {
  font: string | null;
  lineLayoutResult: LayoutLinesResult | null;
  settings: PlaygroundSettings;
}) {
  return (
    <div className="preview-content">
      <div className="preview-stage">
        <div className="stage-ruler" style={{ width: `${settings.width}px` }}>
          <span>{lineLayoutResult?.lines.length ?? 0} fixed-width lines</span>
          <span>{Math.round(settings.width)}px container width</span>
        </div>
        <div className="line-stack" style={{ width: `${settings.width}px` }}>
          {lineLayoutResult?.lines.map((line, index) => (
            <div key={`${index}-${line.start.segmentIndex}-${line.width}`} className="line-row">
              <div className="line-gutter" title={`Measured width ${formatWidth(line.width)}`}>
                {formatWidth(line.width)}
              </div>
              <div
                className="line-chip"
                style={{
                  width: `${Math.max(line.width, 2)}px`,
                  font: font ?? undefined,
                  lineHeight: `${settings.lineHeight}px`,
                }}
              >
                <span
                  className="line-chip-text"
                  style={{
                    whiteSpace: settings.whiteSpace === 'pre-wrap' ? 'break-spaces' : 'normal',
                  }}
                >
                  {line.text.length > 0 ? line.text : '\u00A0'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="preview-note">
        `prepareWithSegments()` plus `layoutWithLines()` gives you the exact line strings and line
        widths for custom renderers.
      </p>
    </div>
  );
}

export default function PreviewPanel({
  activeTab,
  error,
  font,
  lineLayoutResult,
  measureResult,
  onTabChange,
  preparedParagraph,
  settings,
}: PreviewPanelProps) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [motionTimeMs, setMotionTimeMs] = useState(0);

  useEffect(() => {
    if (activeTab !== 'flow' || error || !preparedParagraph) {
      return undefined;
    }

    let frameId = 0;
    const animate = (time: number) => {
      setMotionTimeMs(time);
      frameId = window.requestAnimationFrame(animate);
    };

    frameId = window.requestAnimationFrame(animate);
    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [activeTab, error, preparedParagraph]);

  useEffect(() => {
    if (copyState === 'idle') {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setCopyState('idle');
    }, 1600);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [copyState]);

  const pineappleScene = useMemo(
    () => buildPineappleScene(settings.width, settings.lineHeight, motionTimeMs),
    [motionTimeMs, settings.lineHeight, settings.width],
  );

  const headlineState = useMemo(() => {
    try {
      return {
        error: null,
        headlineLayout: fitHeadlineLayout({
          text: settings.text,
          fontFamily: settings.fontFamily,
          maxWidth: Math.max(200, settings.width - 48),
          maxHeight: 210,
          whiteSpace: settings.whiteSpace,
        }),
      };
    } catch (headlineError) {
      return {
        error: getErrorMessage(headlineError),
        headlineLayout: null,
      };
    }
  }, [settings.fontFamily, settings.text, settings.whiteSpace, settings.width]);

  const bubbleState = useMemo(() => {
    try {
      return {
        bubbleLayouts: createShowcaseBubbles(settings.fontFamily, Math.max(160, settings.width * 0.46)),
        error: null,
      };
    } catch (bubbleError) {
      return {
        bubbleLayouts: [] as TightBubbleLayout[],
        error: getErrorMessage(bubbleError),
      };
    }
  }, [settings.fontFamily, settings.width]);

  const flowState = useMemo(() => {
    if (!preparedParagraph) {
      return {
        error: error,
        flowLayoutResult: null,
      };
    }

    try {
      return {
        error: null,
        flowLayoutResult: layoutParagraphFlow(
          preparedParagraph,
          settings.width,
          settings.lineHeight,
          pineappleScene.obstacles,
          {
            topPadding: pineappleScene.topPadding,
            bottomPadding: pineappleScene.bottomPadding,
          },
        ),
      };
    } catch (flowError) {
      return {
        error: getErrorMessage(flowError),
        flowLayoutResult: null,
      };
    }
  }, [error, pineappleScene, preparedParagraph, settings.lineHeight, settings.width]);

  const combinedError = error ?? headlineState.error ?? bubbleState.error ?? flowState.error;
  const debugJson = useMemo(
    () =>
      JSON.stringify(
        buildDebugPayload(
          settings,
          font ?? '',
          measureResult,
          lineLayoutResult,
          flowState.flowLayoutResult,
        ),
        null,
        2,
      ),
    [font, lineLayoutResult, measureResult, flowState.flowLayoutResult, settings],
  );

  async function handleCopyDebug(): Promise<void> {
    try {
      await navigator.clipboard.writeText(debugJson);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
  }

  return (
    <section className="panel preview-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Output</p>
          <h2>Pineapple Current</h2>
          <p className="panel-copy">
            A moving pineapple turns the text block into a manual layout problem, and Pretext keeps
            the whole thing responsive.
          </p>
        </div>
        <div className="tab-row" role="tablist" aria-label="Preview mode">
          <button
            className={`tab-button${activeTab === 'flow' ? ' is-active' : ''}`}
            type="button"
            role="tab"
            aria-selected={activeTab === 'flow'}
            onClick={() => onTabChange('flow')}
          >
            Flow
          </button>
          <button
            className={`tab-button${activeTab === 'measure' ? ' is-active' : ''}`}
            type="button"
            role="tab"
            aria-selected={activeTab === 'measure'}
            onClick={() => onTabChange('measure')}
          >
            Measure
          </button>
          <button
            className={`tab-button${activeTab === 'lines' ? ' is-active' : ''}`}
            type="button"
            role="tab"
            aria-selected={activeTab === 'lines'}
            onClick={() => onTabChange('lines')}
          >
            Lines
          </button>
        </div>
      </div>

      <div className="metric-grid">
        <article className="metric-card">
          <span className="metric-label">Hero type</span>
          <strong>{headlineState.headlineLayout ? `${headlineState.headlineLayout.fontSize}px` : '--'}</strong>
        </article>
        <article className="metric-card">
          <span className="metric-label">Measure height</span>
          <strong>{measureResult ? `${Math.round(measureResult.height)}px` : '--'}</strong>
        </article>
        <article className="metric-card">
          <span className="metric-label">Flow lines</span>
          <strong>{flowState.flowLayoutResult?.lineCount ?? '--'}</strong>
        </article>
        <article className="metric-card">
          <span className="metric-label">Tight note</span>
          <strong>
            {bubbleState.bubbleLayouts[0] ? `${Math.round(bubbleState.bubbleLayouts[0].width)}px` : '--'}
          </strong>
        </article>
        <article className="metric-card">
          <span className="metric-label">Prepared font</span>
          <strong>{font ?? 'Invalid font'}</strong>
        </article>
      </div>

      {combinedError ? (
        <div className="error-banner" role="alert">
          {combinedError}
        </div>
      ) : activeTab === 'flow' ? (
        <PineappleFlowTab
          bubbleLayouts={bubbleState.bubbleLayouts}
          flowLayoutResult={flowState.flowLayoutResult}
          font={font}
          headlineLayout={headlineState.headlineLayout}
          motionTimeMs={motionTimeMs}
          pineappleScene={pineappleScene}
          settings={settings}
        />
      ) : activeTab === 'measure' ? (
        <MeasureTab font={font} measureResult={measureResult} settings={settings} />
      ) : (
        <LinesTab font={font} lineLayoutResult={lineLayoutResult} settings={settings} />
      )}

      <div className="debug-panel">
        <div className="section-label-row">
          <div>
            <span className="field-label">Debug JSON</span>
            <p className="field-hint">
              Includes fixed-width results plus the animated pineapple flow positions.
            </p>
          </div>
          <button className="ghost-button" type="button" onClick={handleCopyDebug}>
            {copyState === 'copied'
              ? 'Copied'
              : copyState === 'failed'
                ? 'Copy failed'
                : 'Copy JSON'}
          </button>
        </div>
        <textarea className="debug-textarea" readOnly value={debugJson} rows={18} spellCheck={false} />
      </div>
    </section>
  );
}
