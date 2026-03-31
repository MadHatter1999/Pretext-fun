# Pretext Playground

Vite + React + TypeScript app that turns public-domain passages from *Alice's Adventures in Wonderland* into a responsive reading experience powered by `@chenglou/pretext`, plus a realtime color ASCII lab for video-driven typography.

## Run

```bash
npm install
npm run dev
```

## Verify

```bash
npm test
npm run build
```

## What It Does

- Uses Project Gutenberg text and public-domain John Tenniel illustrations across the full Alice arc, from the rabbit-hole to waking on the bank.
- Fits the scene headline with Pretext before rendering.
- Lays out body text around the illustration with manual line placement instead of DOM text measurement.
- Measures whimsical marginal callouts with Pretext and routes the body around those note cards as additional obstacles.
- Animates spread changes by transitioning individually positioned lines.
- Keeps a small inspector for measured height, line count, and routed line positions.
- Includes a live color ASCII stage that can sample the camera, a shared screen, local MP4/WebM files, or direct CORS-safe video URLs in realtime.
- Accepts YouTube links as reference embeds, while keeping the actual pixel sampling on camera, screen, local, or direct video sources.

## Where Pretext Is Used

- [src/lib/pretextAdapter.ts](/c:/Users/TonyHealy/Documents/GitHub/Pretext-fun/src/lib/pretextAdapter.ts)
  `prepareParagraph(...)` caches the prepared paragraph.
  `measureParagraph(...)` computes total height and line count.
  `layoutParagraphFlow(...)` uses `layoutNextLine(...)` to route text around illustration obstacles.
- [src/lib/showcaseLayouts.ts](/c:/Users/TonyHealy/Documents/GitHub/Pretext-fun/src/lib/showcaseLayouts.ts)
  `fitHeadlineLayout(...)` sizes the scene title to the available width without awkward word breaks.
- [src/lib/readerWhimsy.ts](/c:/Users/TonyHealy/Documents/GitHub/Pretext-fun/src/lib/readerWhimsy.ts)
  `layoutReaderCallouts(...)` measures the whimsical note cards and returns their obstacle geometry so the main body can flow around them.
- [src/lib/colorVideoAscii.ts](/c:/Users/TonyHealy/Documents/GitHub/Pretext-fun/src/lib/colorVideoAscii.ts)
  `buildVideoAsciiGlyphSet(...)` uses Pretext-measured glyph widths through the shared ASCII measurement helpers.
  `buildVideoAsciiFrame(...)` packs sampled video pixels into positioned glyph rows for the realtime renderer.
- [src/lib/variableTypographicAscii.ts](/c:/Users/TonyHealy/Documents/GitHub/Pretext-fun/src/lib/variableTypographicAscii.ts)
  `buildMeasuredAsciiGlyphSet(...)` measures glyph widths once so the video renderer can relayout quickly per frame.

## Sources

- Text: Project Gutenberg ebook 928, *Alice's Adventures in Wonderland*.
- Illustrations: John Tenniel images from Wikimedia Commons.
