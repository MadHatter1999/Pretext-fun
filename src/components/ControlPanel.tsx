import type { ChangeEvent } from 'react';

import {
  SAMPLE_TEXTS,
  type PlaygroundSettings,
  type SampleText,
} from '../lib/playgroundState';

type ControlPanelProps = {
  activeSample: SampleText | null;
  fontPreview: string | null;
  isPending: boolean;
  settings: PlaygroundSettings;
  onFontFamilyChange: (value: string) => void;
  onFontSizeChange: (value: number) => void;
  onLineHeightChange: (value: number) => void;
  onReset: () => void;
  onSampleSelect: (sampleText: string) => void;
  onTextChange: (value: string) => void;
  onWhiteSpaceChange: (value: PlaygroundSettings['whiteSpace']) => void;
  onWidthChange: (value: number) => void;
};

function readNumberInput(event: ChangeEvent<HTMLInputElement>): number {
  const value = event.currentTarget.valueAsNumber;
  return Number.isFinite(value) ? value : 0;
}

export default function ControlPanel({
  activeSample,
  fontPreview,
  isPending,
  settings,
  onFontFamilyChange,
  onFontSizeChange,
  onLineHeightChange,
  onReset,
  onSampleSelect,
  onTextChange,
  onWhiteSpaceChange,
  onWidthChange,
}: ControlPanelProps) {
  return (
    <section className="panel controls-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Inputs</p>
          <h1>Pretext Playground</h1>
        </div>
        <button className="ghost-button" type="button" onClick={onReset}>
          Reset
        </button>
      </div>

      <p className="panel-copy">
        Steer a tropical text experiment: edit the copy, tune the typography, and watch Pretext
        reroute lines around a moving pineapple in real time.
      </p>

      <label className="field">
        <span className="field-label">Text</span>
        <textarea
          className="text-input"
          rows={11}
          value={settings.text}
          onChange={(event) => onTextChange(event.currentTarget.value)}
        />
      </label>

      <div className="sample-section">
        <div className="section-label-row">
          <span className="field-label">Sample texts</span>
          {isPending ? <span className="status-pill">Refreshing layout…</span> : null}
        </div>
        <div className="sample-grid">
          {SAMPLE_TEXTS.map((sample) => {
            const isActive = activeSample?.id === sample.id;
            return (
              <button
                key={sample.id}
                className={`sample-button${isActive ? ' is-active' : ''}`}
                type="button"
                onClick={() => onSampleSelect(sample.text)}
                title={sample.note}
              >
                {sample.label}
              </button>
            );
          })}
        </div>
        <p className="field-hint">{activeSample?.note ?? 'Choose a preset or paste your own text.'}</p>
      </div>

      <div className="field">
        <div className="section-label-row">
          <span className="field-label">Width</span>
          <span className="metric-inline">{Math.round(settings.width)}px</span>
        </div>
        <input
          className="slider-input"
          type="range"
          min="120"
          max="960"
          step="4"
          value={settings.width}
          onChange={(event) => onWidthChange(readNumberInput(event))}
        />
        <input
          className="number-input"
          type="number"
          min="120"
          max="960"
          step="4"
          value={settings.width}
          onChange={(event) => onWidthChange(readNumberInput(event))}
        />
      </div>

      <div className="field-row">
        <label className="field">
          <span className="field-label">Line height</span>
          <input
            className="number-input"
            type="number"
            min="12"
            max="72"
            step="1"
            value={settings.lineHeight}
            onChange={(event) => onLineHeightChange(readNumberInput(event))}
          />
        </label>

        <label className="field">
          <span className="field-label">Font size</span>
          <input
            className="number-input"
            type="number"
            min="8"
            max="72"
            step="1"
            value={settings.fontSize}
            onChange={(event) => onFontSizeChange(readNumberInput(event))}
          />
        </label>
      </div>

      <label className="field">
        <span className="field-label">Font family</span>
        <input
          className="text-field"
          type="text"
          value={settings.fontFamily}
          onChange={(event) => onFontFamilyChange(event.currentTarget.value)}
          placeholder="Inter, sans-serif"
        />
        <span className="field-hint">
          {fontPreview ? `Canvas font: ${fontPreview}` : 'Enter a family name to build the font shorthand.'}
        </span>
      </label>

      <div className="field">
        <span className="field-label">White-space mode</span>
        <div className="toggle-row" role="radiogroup" aria-label="White-space mode">
          <button
            className={`toggle-button${settings.whiteSpace === 'normal' ? ' is-active' : ''}`}
            type="button"
            onClick={() => onWhiteSpaceChange('normal')}
          >
            normal
          </button>
          <button
            className={`toggle-button${settings.whiteSpace === 'pre-wrap' ? ' is-active' : ''}`}
            type="button"
            onClick={() => onWhiteSpaceChange('pre-wrap')}
          >
            pre-wrap
          </button>
        </div>
      </div>
    </section>
  );
}
