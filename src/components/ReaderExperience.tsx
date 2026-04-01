import {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type RefObject,
} from 'react';

import AsciiPlayground from './AsciiPlayground';
import { BOOK_SOURCE, READER_SCENES, type ReaderScene } from '../lib/readerContent';
import {
  buildReaderSceneLayout,
  resolveReaderBodyFontSize,
  resolveReaderStageWidth,
} from '../lib/readerLayout';
import { layoutReaderCallouts } from '../lib/readerWhimsy';
import {
  buildFontString,
  layoutParagraphFlow,
  measureParagraph,
  prepareParagraph,
} from '../lib/pretextAdapter';
import { fitHeadlineLayout } from '../lib/showcaseLayouts';

type CopyState = 'idle' | 'copied' | 'error';

function useElementWidth(ref: RefObject<HTMLElement | null>): number {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (element === null) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry === undefined) {
        return;
      }

      setWidth(Math.round(entry.contentRect.width));
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return width;
}

function buildSceneLabel(scene: ReaderScene, index: number): string {
  return `${scene.chapter} - Scene ${index + 1}`;
}

function formatPixels(value: number): string {
  return `${Math.round(value).toLocaleString('en-US')} px`;
}

export default function ReaderExperience() {
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [fontSizeBias, setFontSizeBias] = useState(0);
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const [motionTimeMs, setMotionTimeMs] = useState(0);
  const [isPending, startTransition] = useTransition();
  const stageRef = useRef<HTMLDivElement | null>(null);
  const stageWidth = useElementWidth(stageRef);

  useEffect(() => {
    let frameId = 0;
    let previousTick = -1;

    const animate = (time: number) => {
      const nextTick = Math.floor(time / 220) * 220;
      if (nextTick !== previousTick) {
        previousTick = nextTick;
        setMotionTimeMs(nextTick);
      }

      frameId = window.requestAnimationFrame(animate);
    };

    frameId = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    if (copyState === 'idle') {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCopyState('idle');
    }, 1600);

    return () => window.clearTimeout(timeoutId);
  }, [copyState]);

  useEffect(() => {
    const head = document.head;
    const connectionTargets = [
      ['preconnect', 'https://commons.wikimedia.org'],
      ['preconnect', 'https://upload.wikimedia.org'],
    ] as const;
    const links = connectionTargets.map(([rel, href]) => {
      let link = head.querySelector<HTMLLinkElement>(`link[rel="${rel}"][href="${href}"]`);
      let created = false;

      if (link === null) {
        link = document.createElement('link');
        link.rel = rel;
        link.href = href;
        link.crossOrigin = 'anonymous';
        head.appendChild(link);
        created = true;
      }

      return { created, link };
    });

    return () => {
      for (const { created, link } of links) {
        if (created) {
          link.remove();
        }
      }
    };
  }, []);

  useEffect(() => {
    const preloadIndices = [
      (activeSceneIndex + 1) % READER_SCENES.length,
      (activeSceneIndex + 2) % READER_SCENES.length,
      (activeSceneIndex - 1 + READER_SCENES.length) % READER_SCENES.length,
    ];

    const seen = new Set<string>();
    const preloadedImages = preloadIndices
      .map((index) => READER_SCENES[index]?.figure)
      .filter((figure): figure is ReaderScene['figure'] => figure !== undefined)
      .filter((figure) => {
        if (seen.has(figure.preloadSrc)) {
          return false;
        }

        seen.add(figure.preloadSrc);
        return true;
      })
      .map((figure) => {
        const image = new Image();
        image.decoding = 'async';
        image.sizes = figure.sizes;
        image.srcset = figure.srcSet;
        image.src = figure.preloadSrc;
        return image;
      });

    return () => {
      for (const image of preloadedImages) {
        image.src = '';
        image.srcset = '';
      }
    };
  }, [activeSceneIndex]);

  const activeScene = READER_SCENES[activeSceneIndex] ?? READER_SCENES[0]!;
  const viewportStageWidth = stageWidth > 0 ? stageWidth : 760;
  const effectiveStageWidth = resolveReaderStageWidth(viewportStageWidth);
  const contentInsetLeft = Math.max(24, Math.round(effectiveStageWidth * 0.035));
  const contentInsetRight = Math.max(20, Math.round(effectiveStageWidth * 0.025));
  const contentWidth = Math.max(260, effectiveStageWidth - contentInsetLeft - contentInsetRight);
  const fontSize = resolveReaderBodyFontSize(effectiveStageWidth, fontSizeBias);
  const lineHeight = Math.round(fontSize * 1.62);
  const bodyFont = useMemo(
    () =>
      buildFontString({
        fontFamily: 'Inter, sans-serif',
        fontSize,
        fontWeight: 400,
      }),
    [fontSize],
  );

  const preparedParagraph = useMemo(
    () =>
      prepareParagraph({
        text: activeScene.text,
        font: bodyFont,
        whiteSpace: 'normal',
      }),
    [activeScene.text, bodyFont],
  );

  const sceneLayout = useMemo(
    () => buildReaderSceneLayout(activeScene, contentWidth, lineHeight, motionTimeMs),
    [activeScene, contentWidth, lineHeight, motionTimeMs],
  );

  const calloutLayouts = useMemo(
    () => layoutReaderCallouts(sceneLayout.callouts, contentWidth),
    [contentWidth, sceneLayout.callouts],
  );

  const flowObstacles = useMemo(
    () => [...sceneLayout.obstacles, ...calloutLayouts.map((callout) => callout.obstacle)],
    [calloutLayouts, sceneLayout.obstacles],
  );

  const flowLayout = useMemo(
    () =>
      layoutParagraphFlow(preparedParagraph, contentWidth, lineHeight, flowObstacles, {
        topPadding: sceneLayout.topPadding,
        bottomPadding: sceneLayout.bottomPadding,
      }),
    [contentWidth, flowObstacles, lineHeight, preparedParagraph, sceneLayout.bottomPadding, sceneLayout.topPadding],
  );

  const measureLayout = useMemo(
    () => measureParagraph(preparedParagraph, contentWidth, lineHeight),
    [contentWidth, lineHeight, preparedParagraph],
  );

  const headlineLayout = useMemo(
    () =>
      fitHeadlineLayout({
        text: activeScene.title,
        fontFamily: 'Inter, sans-serif',
        maxWidth: Math.max(260, effectiveStageWidth - 40),
        maxHeight: 180,
      }),
    [activeScene.title, effectiveStageWidth],
  );

  const heroInset = Math.max(12, Math.round(headlineLayout.lineHeight * 0.22));
  const heroHeight = headlineLayout.height + heroInset * 2;
  const calloutBottom = calloutLayouts.reduce(
    (maxBottom, callout) => Math.max(maxBottom, callout.top + callout.height),
    0,
  );
  const stageHeight = Math.max(
    sceneLayout.stageMinHeight,
    flowLayout.stageHeight,
    sceneLayout.figure.top + sceneLayout.figure.height + lineHeight * 1.8,
    calloutBottom + lineHeight * 1.2,
  );
  const inspectorValue = useMemo(
    () =>
      JSON.stringify(
        {
          scene: {
            id: activeScene.id,
            chapter: activeScene.chapter,
            title: activeScene.title,
            sourceLabel: activeScene.sourceLabel,
          },
          input: {
            font: bodyFont,
            fontSize,
            fontSizeBias,
            lineHeight,
            viewportStageWidth,
            stageWidth: effectiveStageWidth,
            contentWidth,
            contentInsetLeft,
            contentInsetRight,
          },
          measured: {
            height: measureLayout.height,
            lineCount: measureLayout.lineCount,
          },
          flow: {
            obstacleCount: flowObstacles.length,
            stageHeight,
            lineCount: flowLayout.lineCount,
            figure: sceneLayout.figure,
            callouts: calloutLayouts.map((callout) => ({
              id: callout.id,
              label: callout.label,
              tone: callout.tone,
              left: callout.left,
              top: callout.top,
              width: callout.width,
              height: callout.height,
              lineCount: callout.lines.length,
            })),
            lines: flowLayout.lines.map((line) => ({
              text: line.text,
              width: line.width,
              x: line.x,
              y: line.y,
              availableWidth: line.availableWidth,
              slotSide: line.slotSide,
            })),
          },
        },
        null,
        2,
      ),
    [
      activeScene.chapter,
      activeScene.id,
      activeScene.sourceLabel,
      activeScene.title,
      bodyFont,
      calloutLayouts,
      contentInsetLeft,
      contentInsetRight,
      contentWidth,
      effectiveStageWidth,
      flowLayout.lineCount,
      flowLayout.lines,
      flowObstacles.length,
      fontSize,
      fontSizeBias,
      lineHeight,
      measureLayout.height,
      measureLayout.lineCount,
      sceneLayout.figure,
      stageHeight,
      viewportStageWidth,
    ],
  );

  const copyStatusLabel =
    copyState === 'copied'
      ? 'Copied.'
      : copyState === 'error'
        ? 'Copy failed.'
        : isPending
          ? 'Switching spread...'
          : 'Ready to copy.';

  const handleSceneChange = (nextIndex: number) => {
    if (nextIndex === activeSceneIndex) {
      return;
    }

    setCopyState('idle');
    startTransition(() => {
      setActiveSceneIndex(nextIndex);
    });
  };

  const handleCopyMetrics = async () => {
    try {
      await navigator.clipboard.writeText(inspectorValue);
      setCopyState('copied');
    } catch {
      setCopyState('error');
    }
  };

  return (
    <main className={`reader-shell is-${activeScene.theme}`}>
      <header className="reader-header">
        <div className="reader-brand">
          <p className="reader-brand-mark">Pretext Reader</p>
          <h1>Pretext Playground</h1>
          <p>
            A public-domain Alice sequence where illustrations and measured callouts actually change
            the reading geometry. Pretext prepares each passage once, then re-lays out the page as
            figures and notes drift through it.
          </p>
        </div>

        <div className="reader-controls">
          <nav className="scene-nav" aria-label="Reading scenes">
            {READER_SCENES.map((scene, index) => (
              <button
                key={scene.id}
                className={`scene-button${index === activeSceneIndex ? ' is-active' : ''}`}
                type="button"
                onClick={() => handleSceneChange(index)}
              >
                <small>{buildSceneLabel(scene, index)}</small>
                <span>{scene.title}</span>
              </button>
            ))}
          </nav>

          <div className="type-controls" aria-label="Body size controls">
            <button
              type="button"
              onClick={() => setFontSizeBias((currentBias) => Math.max(-2, currentBias - 1))}
            >
              A-
            </button>
            <span>Body {fontSize}px</span>
            <button
              type="button"
              onClick={() => setFontSizeBias((currentBias) => Math.min(3, currentBias + 1))}
            >
              A+
            </button>
          </div>
        </div>
      </header>

      <section className={`reader-hero is-${activeScene.theme}`} key={`hero-${activeScene.id}`}>
        <p className="reader-kicker">
          {activeScene.chapter} / {activeScene.sourceLabel}
        </p>

        <div
          className="reader-hero-canvas"
          style={{ height: heroHeight, maxWidth: effectiveStageWidth }}
        >
          {headlineLayout.lines.map((line, index) => (
            <div
              key={`${activeScene.id}-headline-${index}`}
              className="reader-hero-line"
              style={
                {
                  left: line.x,
                  top: line.y + heroInset,
                  width: Math.min(headlineLayout.width, contentWidth),
                  font: headlineLayout.font,
                  lineHeight: `${headlineLayout.lineHeight}px`,
                  '--line-float-y': `${Math.sin(motionTimeMs / 820 + index * 0.68) * 1.8}px`,
                  animationDelay: `${index * 70}ms`,
                } as CSSProperties
              }
            >
              {line.text}
            </div>
          ))}
        </div>

        <p className="reader-deck">{activeScene.deck}</p>
      </section>

      {activeSceneIndex === 0 ? <AsciiPlayground maxWidth={effectiveStageWidth} /> : null}

      <section className="reader-stage-grid" key={`scene-${activeScene.id}`}>
        <aside className="reader-aside">
          <p className="reader-aside-label">Reading Note</p>
          <p className="reader-quote">{activeScene.quote}</p>
          <p className="reader-source-line">
            Text from{' '}
            <a href={BOOK_SOURCE.url} target="_blank" rel="noreferrer">
              {BOOK_SOURCE.label}
            </a>
            . Illustration from{' '}
            <a href={activeScene.figure.sourceUrl} target="_blank" rel="noreferrer">
              {activeScene.figure.credit}
            </a>
            .
          </p>
        </aside>

        <div className="reader-stage-wrap" ref={stageRef}>
          <div
            className={`reader-stage is-${activeScene.theme}`}
            style={{ height: stageHeight, width: effectiveStageWidth }}
          >
            <figure
              className="reader-figure"
              style={{
                left: contentInsetLeft + sceneLayout.figure.left,
                top: sceneLayout.figure.top,
                width: sceneLayout.figure.width,
                height: sceneLayout.figure.height,
                transform: `rotate(${sceneLayout.figure.rotation}deg)`,
              }}
              >
              <img
                src={sceneLayout.figure.src}
                srcSet={sceneLayout.figure.srcSet}
                sizes={sceneLayout.figure.sizes}
                alt={sceneLayout.figure.alt}
                decoding="async"
                fetchPriority="high"
                loading="eager"
              />
              <figcaption>
                {sceneLayout.figure.caption} {sceneLayout.figure.credit}
              </figcaption>
            </figure>

            {calloutLayouts.map((callout) => (
              <aside
                key={`${activeScene.id}-${callout.id}`}
                className={`reader-callout is-${callout.tone} is-scene-${activeScene.theme}`}
                style={{
                  left: contentInsetLeft + callout.left,
                  top: callout.top,
                  width: callout.width,
                  height: callout.height,
                  padding: `${callout.paddingY}px ${callout.paddingX}px`,
                  transform: `rotate(${callout.rotation}deg)`,
                }}
              >
                <p
                  className="reader-callout-label"
                  style={{
                    fontSize: callout.labelFontSize,
                    lineHeight: `${callout.labelFontSize}px`,
                  }}
                >
                  {callout.label}
                </p>
                <div
                  className="reader-callout-body"
                  style={{
                    height: callout.height - callout.textTop - callout.paddingY,
                    marginTop: callout.textTop - callout.paddingY - callout.labelFontSize,
                  }}
                >
                  {callout.lines.map((line, index) => (
                    <div
                      key={`${callout.id}-${index}`}
                      className="reader-callout-line"
                      style={
                        {
                          left: callout.paddingX,
                          top: line.y,
                          width: callout.contentWidth,
                          font: callout.font,
                          lineHeight: `${callout.lineHeight}px`,
                        } as CSSProperties
                      }
                    >
                      {line.text.length > 0 ? line.text : '\u00A0'}
                    </div>
                  ))}
                </div>
              </aside>
            ))}

            {flowLayout.lines.map((line, index) => {
              return (
                <div
                  key={`${activeScene.id}-${index}`}
                  className={`story-line is-${line.slotSide}`}
                  style={
                    {
                      left: contentInsetLeft + line.x,
                      top: line.y,
                      width: line.availableWidth,
                      font: bodyFont,
                      lineHeight: `${lineHeight}px`,
                    } as CSSProperties
                  }
                >
                  {line.text.length > 0 ? line.text : '\u00A0'}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="reader-footer">
        <div>
          <p className="reader-aside-label">Layout Snapshot</p>
          <p className="reader-source-line">
            {measureLayout.lineCount} measured lines, {flowLayout.lineCount} flowed lines, measure{' '}
            {formatPixels(effectiveStageWidth)}, stage {formatPixels(stageHeight)}.
          </p>
        </div>

        <div className="reader-footer-nav">
          <button
            type="button"
            onClick={() =>
              handleSceneChange((activeSceneIndex - 1 + READER_SCENES.length) % READER_SCENES.length)
            }
          >
            Previous spread
          </button>
          <button
            type="button"
            onClick={() => handleSceneChange((activeSceneIndex + 1) % READER_SCENES.length)}
          >
            Next spread
          </button>
        </div>
      </footer>

      <details className="reader-inspector">
        <summary>Debug JSON</summary>
        <p>Copy the prepared font, measured result, obstacle geometry, and final flowed lines.</p>
        <textarea readOnly value={inspectorValue} rows={16} />
        <div className="reader-inspector-actions">
          <span>{copyStatusLabel}</span>
          <button type="button" onClick={handleCopyMetrics}>
            Copy metrics
          </button>
        </div>
      </details>
    </main>
  );
}
