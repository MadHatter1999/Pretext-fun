import {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type RefObject,
} from 'react';

import {
  buildCopyableAsciiSnapshot,
  buildVideoAsciiFrame,
  buildVideoAsciiGlyphSet,
  computeVideoAsciiMetrics,
  type VideoAsciiSettings,
} from '../lib/colorVideoAscii';

type AsciiPlaygroundProps = {
  maxWidth: number;
};

type SourceMode = 'camera' | 'idle' | 'reference' | 'screen' | 'upload' | 'url';
type CopyState = 'copied' | 'error' | 'idle';
type VideoStatus = 'error' | 'idle' | 'loading' | 'ready' | 'reference';

type VideoFrameCallback = (now: number, metadata: unknown) => void;

type HTMLVideoElementWithFrameCallback = HTMLVideoElement & {
  cancelVideoFrameCallback?: (handle: number) => void;
  requestVideoFrameCallback?: (callback: VideoFrameCallback) => number;
};

const DEFAULT_VIDEO_URL = 'https://www.youtube.com/watch?v=WtoxxHADnGk';
const DEFAULT_VIDEO_SETTINGS: VideoAsciiSettings = {
  brightness: 0.02,
  colorBoost: 1.24,
  contrast: 1.18,
  density: 1,
  invert: false,
  renderMode: 'variable',
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function extractYouTubeVideoId(value: string): string | null {
  const trimmed = value.trim();

  try {
    const url = new URL(trimmed);
    const hostname = url.hostname.replace(/^www\./iu, '').replace(/^m\./iu, '');

    if (hostname === 'youtu.be') {
      return url.pathname.split('/').filter(Boolean)[0] ?? null;
    }

    if (hostname === 'youtube.com' || hostname === 'youtube-nocookie.com') {
      const directId = url.searchParams.get('v');
      if (directId) {
        return directId;
      }

      const pathParts = url.pathname.split('/').filter(Boolean);
      const embedIndex = pathParts.findIndex((part) =>
        ['embed', 'shorts', 'live'].includes(part.toLowerCase()),
      );
      if (embedIndex >= 0) {
        return pathParts[embedIndex + 1] ?? null;
      }
    }
  } catch {
    return null;
  }

  return null;
}

function buildYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?playsinline=1&rel=0&modestbranding=1`;
}

function stopMediaStream(stream: MediaStream | null): void {
  if (stream === null) {
    return;
  }

  for (const track of stream.getTracks()) {
    track.stop();
  }
}

function resolveSourceLabel(sourceMode: SourceMode): string {
  switch (sourceMode) {
    case 'camera':
      return 'Live camera';
    case 'screen':
      return 'Live screen';
    case 'upload':
      return 'Local file';
    case 'url':
      return 'Direct video';
    case 'reference':
      return 'Reference embed';
    default:
      return 'No source';
  }
}

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

function AsciiPlayground({ maxWidth }: AsciiPlaygroundProps) {
  const [videoSource, setVideoSource] = useState<string | null>(null);
  const [streamSource, setStreamSource] = useState<MediaStream | null>(null);
  const [videoUrlInput, setVideoUrlInput] = useState(DEFAULT_VIDEO_URL);
  const [referenceLinkUrl, setReferenceLinkUrl] = useState(DEFAULT_VIDEO_URL);
  const [referenceEmbedUrl, setReferenceEmbedUrl] = useState<string | null>(
    buildYouTubeEmbedUrl('WtoxxHADnGk'),
  );
  const [videoAspectRatio, setVideoAspectRatio] = useState(16 / 9);
  const [sourceMode, setSourceMode] = useState<SourceMode>('reference');
  const [asciiSnapshotText, setAsciiSnapshotText] = useState('');
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const [status, setStatus] = useState<VideoStatus>('reference');
  const [statusMessage, setStatusMessage] = useState(
    'Reference clip loaded below. For live ASCII sampling, use Camera, Screen, Upload, or a direct video URL.',
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoSettings, setVideoSettings] = useState(DEFAULT_VIDEO_SETTINGS);
  const animationFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const sampleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const samplingBlockedRef = useRef(false);
  const snapshotTextRef = useRef('');
  const snapshotUpdateTimeRef = useRef(0);
  const stageCanvasPaneRef = useRef<HTMLDivElement | null>(null);
  const videoFrameRequestRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const measuredStageWidth = useElementWidth(stageCanvasPaneRef);
  const fallbackStageWidth =
    maxWidth >= 1180 ? Math.min(maxWidth - 360, 760) : maxWidth >= 760 ? Math.min(maxWidth, 820) : maxWidth;

  const stageWidth = clamp(
    measuredStageWidth > 0 ? measuredStageWidth : fallbackStageWidth,
    280,
    1180,
  );
  const stageHeight = clamp(Math.round(stageWidth / videoAspectRatio), 260, 620);
  const glyphSet = useMemo(
    () =>
      buildVideoAsciiGlyphSet({
        density: videoSettings.density,
        displayWidth: stageWidth,
        renderMode: videoSettings.renderMode,
      }),
    [stageWidth, videoSettings.density, videoSettings.renderMode],
  );
  const asciiMetrics = useMemo(
    () =>
      computeVideoAsciiMetrics(
        stageWidth,
        stageHeight,
        videoSettings.density,
        glyphSet.nominalAdvance,
        glyphSet.lineHeight,
      ),
    [glyphSet.lineHeight, glyphSet.nominalAdvance, stageHeight, stageWidth, videoSettings.density],
  );
  const copyableColumns = clamp(Math.round(stageWidth / 9.6), 40, 120);
  const copyableRows = clamp(Math.round(stageHeight / 18), 16, 72);
  const copyTextAreaHeight = clamp(copyableRows * 13 + 30, 220, stageHeight);
  const sourceLabel = resolveSourceLabel(sourceMode);
  const previewLabel =
    sourceMode === 'reference'
      ? 'Reference'
      : sourceMode === 'camera' || sourceMode === 'screen'
        ? 'Live input'
        : sourceMode === 'upload' || sourceMode === 'url'
        ? 'Source video'
          : 'Preview';
  const copyStatusLabel =
    copyState === 'copied' ? 'ASCII copied.' : copyState === 'error' ? 'Copy failed.' : '';

  const clearObjectUrl = () => {
    if (objectUrlRef.current !== null) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  const stopCurrentStream = () => {
    stopMediaStream(streamSource);
    setStreamSource(null);
  };

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
    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }

      clearObjectUrl();
      stopMediaStream(streamSource);
    };
  }, [streamSource]);

  useEffect(() => {
    const video = videoRef.current;
    if (video === null) {
      return;
    }

    if (streamSource !== null) {
      video.srcObject = streamSource;
      return () => {
        if (video.srcObject === streamSource) {
          video.srcObject = null;
        }
      };
    }

    if (video.srcObject !== null) {
      video.srcObject = null;
    }
  }, [streamSource]);

  useEffect(() => {
    const video = videoRef.current;
    if (video === null || streamSource !== null) {
      return;
    }

    video.load();
  }, [streamSource, videoSource]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const sampleCanvas = sampleCanvasRef.current;
    if (canvas === null || sampleCanvas === null) {
      return;
    }

    const outputContext = canvas.getContext('2d');
    const sampleContext = sampleCanvas.getContext('2d', { willReadFrequently: true });
    if (outputContext === null || sampleContext === null) {
      return;
    }

    let cancelled = false;

    const resizeOutputSurface = () => {
      const dpr = window.devicePixelRatio || 1;
      const pixelWidth = Math.max(1, Math.round(stageWidth * dpr));
      const pixelHeight = Math.max(1, Math.round(stageHeight * dpr));

      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
        canvas.style.width = `${stageWidth}px`;
        canvas.style.height = `${stageHeight}px`;
      }

      outputContext.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const cancelScheduledFrame = () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      const currentVideo = videoRef.current as HTMLVideoElementWithFrameCallback | null;
      if (
        currentVideo !== null &&
        videoFrameRequestRef.current !== null &&
        typeof currentVideo.cancelVideoFrameCallback === 'function'
      ) {
        currentVideo.cancelVideoFrameCallback(videoFrameRequestRef.current);
        videoFrameRequestRef.current = null;
      }
    };

    const drawPlaceholder = () => {
      resizeOutputSurface();
      outputContext.fillStyle = '#090705';
      outputContext.fillRect(0, 0, stageWidth, stageHeight);

      outputContext.fillStyle = 'rgba(255, 209, 138, 0.06)';
      outputContext.fillRect(20, 20, Math.min(stageWidth - 40, 360), 124);

      outputContext.fillStyle = '#fff1d8';
      outputContext.font = '700 28px Inter, sans-serif';
      outputContext.fillText('Live ASCII stage', 36, 56);

      outputContext.fillStyle = 'rgba(255, 241, 216, 0.74)';
      outputContext.font = '400 14px Inter, sans-serif';
      outputContext.fillText(
        sourceMode === 'reference'
          ? 'Use Camera or Screen to read frames live, or upload a clip for direct sampling.'
          : 'Waiting for a readable video source to feed the renderer.',
        36,
        88,
      );
      outputContext.fillText(
        videoSettings.renderMode === 'variable'
          ? 'Pretext variable mode is packing measured glyph widths into each frame.'
          : 'Classic mono mode is sampling a fixed ASCII grid.',
        36,
        110,
      );
      if (snapshotTextRef.current.length > 0) {
        snapshotTextRef.current = '';
        setAsciiSnapshotText('');
      }
    };

    const drawFrame = () => {
      if (cancelled) {
        return;
      }

      resizeOutputSurface();
      outputContext.fillStyle = '#090705';
      outputContext.fillRect(0, 0, stageWidth, stageHeight);

      const video = videoRef.current;
      if (
        video === null ||
        samplingBlockedRef.current ||
        video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
        video.videoWidth === 0
      ) {
        drawPlaceholder();
        return;
      }

      sampleCanvas.width = asciiMetrics.sampleWidth;
      sampleCanvas.height = asciiMetrics.sampleHeight;
      sampleContext.imageSmoothingEnabled = false;
      sampleContext.drawImage(video, 0, 0, sampleCanvas.width, sampleCanvas.height);

      let sampledFrame: ImageData;
      try {
        sampledFrame = sampleContext.getImageData(0, 0, sampleCanvas.width, sampleCanvas.height);
      } catch {
        samplingBlockedRef.current = true;
        setIsPlaying(false);
        setStatus('error');
        setStatusMessage(
          'This source blocks canvas pixel reads. Use Camera, Screen, a local file, or a direct video URL that allows CORS.',
        );
        video.pause();
        drawPlaceholder();
        return;
      }

      const asciiFrame = buildVideoAsciiFrame({
        frame: sampledFrame,
        glyphSet,
        settings: videoSettings,
        stageHeight,
        stageWidth,
      });
      const snapshot = buildCopyableAsciiSnapshot({
        columns: copyableColumns,
        frame: sampledFrame,
        rows: copyableRows,
        settings: {
          ...videoSettings,
          renderMode: 'mono',
        },
      });
      snapshotTextRef.current = snapshot.text;
      const now = performance.now();
      if (now - snapshotUpdateTimeRef.current >= 180 || snapshot.text.length === 0) {
        snapshotUpdateTimeRef.current = now;
        setAsciiSnapshotText(snapshot.text);
      }

      outputContext.font = glyphSet.font;
      outputContext.textBaseline = 'top';

      for (const row of asciiFrame.rows) {
        for (const cell of row.cells) {
          if (cell.char === ' ') {
            continue;
          }

          outputContext.fillStyle = `rgb(${cell.red} ${cell.green} ${cell.blue})`;
          outputContext.fillText(cell.char, cell.x, row.y);
        }
      }
    };

    const scheduleNextFrame = () => {
      const currentVideo = videoRef.current as HTMLVideoElementWithFrameCallback | null;
      if (currentVideo === null || cancelled || currentVideo.paused || currentVideo.ended) {
        return;
      }

      if (typeof currentVideo.requestVideoFrameCallback === 'function') {
        videoFrameRequestRef.current = currentVideo.requestVideoFrameCallback(() => {
          drawFrame();
          scheduleNextFrame();
        });
        return;
      }

      animationFrameRef.current = window.requestAnimationFrame(() => {
        drawFrame();
        scheduleNextFrame();
      });
    };

    const handleLoadedMetadata = () => {
      const video = videoRef.current;
      if (video === null) {
        return;
      }

      samplingBlockedRef.current = false;
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        setVideoAspectRatio(video.videoWidth / video.videoHeight);
      }

      setStatus(sourceMode === 'reference' ? 'reference' : 'ready');
      setStatusMessage(
        sourceMode === 'camera'
          ? 'Reading camera frames live into the ASCII stage.'
          : sourceMode === 'screen'
            ? 'Reading shared-screen frames live into the ASCII stage.'
            : videoSettings.renderMode === 'variable'
              ? 'Sampling live frames with Pretext-measured glyph widths.'
              : 'Sampling live frames with a classic mono ASCII grid.',
      );
      drawFrame();
      void video.play().catch(() => {
        setIsPlaying(false);
      });
    };

    const handlePlay = () => {
      cancelScheduledFrame();
      setIsPlaying(true);
      scheduleNextFrame();
    };

    const handlePause = () => {
      cancelScheduledFrame();
      setIsPlaying(false);
      drawFrame();
    };

    const handleError = () => {
      cancelScheduledFrame();
      setStatus('error');
      setStatusMessage(
        'The video could not be loaded. Try Camera, Screen, a local MP4/WebM, or a direct video URL that allows CORS.',
      );
      drawPlaceholder();
    };

    const video = videoRef.current;
    const hasRenderableVideo = videoSource !== null || streamSource !== null;
    if (video === null) {
      drawPlaceholder();
      return () => {
        cancelled = true;
        cancelScheduledFrame();
      };
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('loadeddata', handleLoadedMetadata);
    video.addEventListener('canplay', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handlePause);
    video.addEventListener('error', handleError);

    if (!hasRenderableVideo) {
      drawPlaceholder();
    } else if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
      handleLoadedMetadata();
    }

    return () => {
      cancelled = true;
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('loadeddata', handleLoadedMetadata);
      video.removeEventListener('canplay', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handlePause);
      video.removeEventListener('error', handleError);
      cancelScheduledFrame();
    };
  }, [
    asciiMetrics.sampleHeight,
    asciiMetrics.sampleWidth,
    copyableColumns,
    copyableRows,
    glyphSet,
    sourceMode,
    stageHeight,
    stageWidth,
    streamSource,
    videoSettings,
    videoSource,
  ]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file === undefined) {
      return;
    }

    clearObjectUrl();
    stopCurrentStream();

    const objectUrl = URL.createObjectURL(file);
    objectUrlRef.current = objectUrl;
    samplingBlockedRef.current = false;
    setReferenceEmbedUrl(null);
    setVideoSource(objectUrl);
    setVideoUrlInput('');
    setSourceMode('upload');
    setStatus('loading');
    setStatusMessage(`Loading ${file.name}...`);
  };

  const handleLoadUrl = () => {
    const trimmedUrl = videoUrlInput.trim();
    if (trimmedUrl.length === 0) {
      return;
    }

    const youTubeVideoId = extractYouTubeVideoId(trimmedUrl);
    if (youTubeVideoId !== null) {
      clearObjectUrl();
      stopCurrentStream();
      setVideoSource(null);
      setReferenceEmbedUrl(buildYouTubeEmbedUrl(youTubeVideoId));
      setReferenceLinkUrl(trimmedUrl);
      setSourceMode('reference');
      setStatus('reference');
      setStatusMessage(
        'Reference clip loaded. Use Camera, Screen, Upload, or a direct video file URL for live ASCII sampling.',
      );
      return;
    }

    clearObjectUrl();
    stopCurrentStream();
    samplingBlockedRef.current = false;
    setReferenceEmbedUrl(null);
    setReferenceLinkUrl(trimmedUrl);
    setVideoSource(trimmedUrl);
    setSourceMode('url');
    setStatus('loading');
    setStatusMessage('Loading remote video...');
  };

  const handleStartCamera = async () => {
    if (
      typeof navigator === 'undefined' ||
      navigator.mediaDevices === undefined ||
      typeof navigator.mediaDevices.getUserMedia !== 'function'
    ) {
      setStatus('error');
      setStatusMessage('Camera capture is not available in this browser.');
      return;
    }

    try {
      clearObjectUrl();
      stopCurrentStream();
      samplingBlockedRef.current = false;
      setReferenceEmbedUrl(null);
      setVideoSource(null);
      setSourceMode('camera');
      setStatus('loading');
      setStatusMessage('Opening camera...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          frameRate: { ideal: 30, max: 30 },
        },
      });

      stream.getVideoTracks()[0]?.addEventListener('ended', () => {
        setStreamSource(null);
        setSourceMode('idle');
        setStatus('idle');
        setStatusMessage('Camera feed ended.');
        setIsPlaying(false);
      });

      setStreamSource(stream);
    } catch {
      setSourceMode('idle');
      setStatus('error');
      setStatusMessage('Camera access was blocked or unavailable.');
    }
  };

  const handleShareScreen = async () => {
    if (
      typeof navigator === 'undefined' ||
      navigator.mediaDevices === undefined ||
      typeof navigator.mediaDevices.getDisplayMedia !== 'function'
    ) {
      setStatus('error');
      setStatusMessage('Screen capture is not available in this browser.');
      return;
    }

    try {
      clearObjectUrl();
      stopCurrentStream();
      samplingBlockedRef.current = false;
      setReferenceEmbedUrl(null);
      setVideoSource(null);
      setSourceMode('screen');
      setStatus('loading');
      setStatusMessage('Waiting for screen share permission...');
      const stream = await navigator.mediaDevices.getDisplayMedia({
        audio: false,
        video: {
          frameRate: { ideal: 30, max: 30 },
        },
      });

      stream.getVideoTracks()[0]?.addEventListener('ended', () => {
        setStreamSource(null);
        setSourceMode('idle');
        setStatus('idle');
        setStatusMessage('Screen share ended.');
        setIsPlaying(false);
      });

      setStreamSource(stream);
    } catch {
      setSourceMode('idle');
      setStatus('error');
      setStatusMessage('Screen sharing was cancelled or unavailable.');
    }
  };

  const handleClearVideo = () => {
    clearObjectUrl();
    stopCurrentStream();

    if (fileInputRef.current !== null) {
      fileInputRef.current.value = '';
    }

    samplingBlockedRef.current = false;
    setVideoSource(null);
    setReferenceEmbedUrl(null);
    setReferenceLinkUrl('');
    setVideoUrlInput('');
    snapshotTextRef.current = '';
    setAsciiSnapshotText('');
    setSourceMode('idle');
    setIsPlaying(false);
    setStatus('idle');
    setStatusMessage(
      'Paste a YouTube reference URL, or use Camera, Screen, Upload, or a direct video file URL for live sampling.',
    );
  };

  const handleCopyAsciiSnapshot = async () => {
    const snapshot = snapshotTextRef.current || asciiSnapshotText;
    if (snapshot.trim().length === 0) {
      setCopyState('error');
      return;
    }

    try {
      await navigator.clipboard.writeText(snapshot);
      setCopyState('copied');
    } catch {
      setCopyState('error');
    }
  };

  return (
    <section className="ascii-demo">
      <div className="video-ascii-shell" style={{ maxWidth }}>
        <div className="video-ascii-intro">
          <p className="reader-kicker">Realtime Color ASCII</p>
          <h2 className="ascii-title">Live video, rendered as type.</h2>
          <p className="reader-deck">
            Feed the stage from your camera, screen, uploaded clips, or direct video URLs. YouTube
            links stay in the reference dock while the renderer samples readable frames in real time.
          </p>

          <div className="video-ascii-command-bar">
            <div className="video-ascii-url-row">
              <input
                type="url"
                value={videoUrlInput}
                placeholder="Paste a YouTube reference link, or a direct MP4/WebM URL."
                onChange={(event) => setVideoUrlInput(event.target.value)}
              />
            </div>

            <div className="video-ascii-primary-actions">
              <button type="button" onClick={handleLoadUrl}>
                Load link
              </button>
              <button type="button" onClick={() => fileInputRef.current?.click()}>
                Upload clip
              </button>
              <button type="button" onClick={handleClearVideo}>
                Clear
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/ogg"
                onChange={handleFileChange}
                hidden
              />
            </div>

            <div className="video-ascii-live-actions">
              <button type="button" onClick={handleStartCamera}>
                Use camera
              </button>
              <button type="button" onClick={handleShareScreen}>
                Share screen
              </button>
              <span className={`video-ascii-source-pill is-${sourceMode}`}>{sourceLabel}</span>
            </div>
          </div>
        </div>

        <div className="video-ascii-stage-card">
          <div className="video-ascii-stage-head">
            <div>
              <p className="video-ascii-stage-kicker">ASCII Output</p>
              <h3>Live frame sampler</h3>
            </div>
            <div className="video-ascii-stage-actions">
              <button type="button" onClick={handleCopyAsciiSnapshot}>
                Copy text
              </button>
              <div className={`video-ascii-status-pill is-${status}`}>{sourceLabel}</div>
            </div>
          </div>

          <div className="video-ascii-stage-body">
            <div
              ref={stageCanvasPaneRef}
              className="video-ascii-canvas-pane"
              style={{ minHeight: stageHeight }}
            >
              <canvas ref={canvasRef} className="video-ascii-canvas" />
            </div>

            <div className="video-ascii-preview-pane">
              <div className="video-ascii-preview-frame">
                <div className="video-ascii-preview-head">
                  <span>{previewLabel}</span>
                  <div className="video-ascii-preview-meta">
                    {referenceEmbedUrl !== null && referenceLinkUrl.length > 0 ? (
                      <a href={referenceLinkUrl} target="_blank" rel="noreferrer">
                        Open YouTube
                      </a>
                    ) : null}
                    <span>{status === 'ready' && isPlaying ? 'Live' : 'Standby'}</span>
                  </div>
                </div>
                {referenceEmbedUrl !== null ? (
                  <iframe
                    className="video-ascii-embed"
                    src={referenceEmbedUrl}
                    title="YouTube reference video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    ref={videoRef}
                    className="video-ascii-preview"
                    src={streamSource === null ? videoSource ?? undefined : undefined}
                    crossOrigin="anonymous"
                    controls
                    loop
                    muted
                    playsInline
                  />
                )}
              </div>
            </div>
          </div>

          <div className="video-ascii-copy-panel">
            <div className="video-ascii-copy-head">
              <div>
                <p className="video-ascii-stage-kicker">Copyable ASCII</p>
                <h3>Mono text snapshot</h3>
              </div>
              <button type="button" onClick={handleCopyAsciiSnapshot}>
                Copy mono text
              </button>
            </div>
            <textarea
              className="video-ascii-copy-textarea"
              readOnly
              spellCheck={false}
              style={{ height: `${copyTextAreaHeight}px` }}
              value={
                asciiSnapshotText.length > 0
                  ? asciiSnapshotText
                  : 'Load a readable live source and the copyable mono snapshot will appear here.'
              }
            />
          </div>
          <canvas ref={sampleCanvasRef} hidden />
        </div>

        <div className="video-ascii-controls-card">
          <div className="video-ascii-stage-head">
            <div>
              <p className="video-ascii-stage-kicker">Render Controls</p>
              <h3>Density, tone, and glyph behavior</h3>
            </div>
            <div className="video-ascii-status-pill">
              {asciiMetrics.columns} x {asciiMetrics.rows}
            </div>
          </div>

          <div className="ascii-mode-row" role="group" aria-label="ASCII render mode">
            {[
              { id: 'variable', label: 'Pretext variable' },
              { id: 'mono', label: 'Classic mono' },
            ].map((mode) => (
              <button
                key={mode.id}
                type="button"
                className={`ascii-mode-button${
                  videoSettings.renderMode === mode.id ? ' is-active' : ''
                }`}
                aria-pressed={videoSettings.renderMode === mode.id}
                onClick={() =>
                  setVideoSettings((current) => ({
                    ...current,
                    renderMode: mode.id as VideoAsciiSettings['renderMode'],
                  }))
                }
              >
                {mode.label}
              </button>
            ))}
          </div>

          <div className="ascii-toolbar">
            <label className="ascii-control">
              <span>Density {videoSettings.density.toFixed(2)}x</span>
              <input
                type="range"
                min="0.8"
                max="1.45"
                step="0.05"
                value={videoSettings.density}
                onChange={(event) =>
                  setVideoSettings((current) => ({
                    ...current,
                    density: Number(event.target.value),
                  }))
                }
              />
            </label>

            <label className="ascii-control">
              <span>Contrast {videoSettings.contrast.toFixed(2)}x</span>
              <input
                type="range"
                min="0.8"
                max="1.6"
                step="0.05"
                value={videoSettings.contrast}
                onChange={(event) =>
                  setVideoSettings((current) => ({
                    ...current,
                    contrast: Number(event.target.value),
                  }))
                }
              />
            </label>

            <label className="ascii-control">
              <span>Color boost {videoSettings.colorBoost.toFixed(2)}x</span>
              <input
                type="range"
                min="1"
                max="1.8"
                step="0.05"
                value={videoSettings.colorBoost}
                onChange={(event) =>
                  setVideoSettings((current) => ({
                    ...current,
                    colorBoost: Number(event.target.value),
                  }))
                }
              />
            </label>

            <label className="ascii-control">
              <span>Brightness {videoSettings.brightness.toFixed(2)}</span>
              <input
                type="range"
                min="-0.2"
                max="0.24"
                step="0.02"
                value={videoSettings.brightness}
                onChange={(event) =>
                  setVideoSettings((current) => ({
                    ...current,
                    brightness: Number(event.target.value),
                  }))
                }
              />
            </label>
          </div>

          <div className="video-ascii-meta">
            <p className={`ascii-helper status-${status}`}>
              {status === 'ready' && isPlaying ? 'Playing. ' : ''}
              {statusMessage}
              {copyStatusLabel.length > 0 ? ` ${copyStatusLabel}` : ''}
            </p>

            <div className="video-ascii-meta-group">
              <div className="video-ascii-stats" aria-label="ASCII render metrics">
                <span>{videoSettings.renderMode === 'variable' ? 'Pretext variable' : 'Classic mono'}</span>
                <span>
                  {asciiMetrics.columns} x {asciiMetrics.rows}
                </span>
                <span>{glyphSet.fontSize}px</span>
              </div>

              <label className="video-ascii-toggle">
                <input
                  type="checkbox"
                  checked={videoSettings.invert}
                  onChange={(event) =>
                    setVideoSettings((current) => ({
                      ...current,
                      invert: event.target.checked,
                    }))
                  }
                />
                <span>Invert ramp</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default memo(AsciiPlayground);
