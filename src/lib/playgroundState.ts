import type { WhiteSpaceMode } from './pretextAdapter';

export type PlaygroundSettings = {
  text: string;
  width: number;
  lineHeight: number;
  fontSize: number;
  fontFamily: string;
  whiteSpace: WhiteSpaceMode;
};

export type SampleText = {
  id: string;
  label: string;
  note: string;
  text: string;
};

export const SAMPLE_TEXTS: readonly SampleText[] = [
  {
    id: 'english',
    label: 'English paragraph',
    note: 'A pineapple-themed paragraph about cached measurement and fast relayout.',
    text:
      'The pineapple drifts through the paragraph like a tiny art director, forcing every line to choose a new route. Pretext handles the one-time preparation first, then keeps the relayout light enough to feel playful while the shape keeps moving.',
  },
  {
    id: 'cjk',
    label: 'Mixed CJK',
    note: 'Chinese, Japanese, and Korean mixed with Latin punctuation.',
    text:
      '在东京的雨夜里，设计团队说“排版应该像呼吸一样自然”。その後、the prototype kept flowing, 그리고 문장은 폭이 바뀔 때마다 부드럽게 다시 줄바꿈되었습니다。',
  },
  {
    id: 'bidi',
    label: 'Mixed RTL/LTR',
    note: 'English, Arabic, and Hebrew in the same paragraph.',
    text:
      'Release notes say build 2.4 reached دبي at 18:30, ואז the support team replied in English, ثم عاد النص العربي ليشرح why the mirrored punctuation still matters.',
  },
  {
    id: 'emoji',
    label: 'Emoji-heavy line set',
    note: 'This sample includes newline breaks. Switch to pre-wrap to preserve them.',
    text:
      'Launch prep 🚀\nCoffee status ☕☕☕\nChecks passing ✅ ready ✅ steady ✅ go\nMood board 🎨✨🧠📐',
  },
] as const;

export const DEFAULT_SETTINGS: PlaygroundSettings = {
  text: SAMPLE_TEXTS[0]!.text,
  width: 360,
  lineHeight: 28,
  fontSize: 18,
  fontFamily: 'Inter, sans-serif',
  whiteSpace: 'normal',
};

export function createDefaultSettings(): PlaygroundSettings {
  return { ...DEFAULT_SETTINGS };
}

export function findActiveSample(text: string): SampleText | null {
  return SAMPLE_TEXTS.find((sample) => sample.text === text) ?? null;
}
