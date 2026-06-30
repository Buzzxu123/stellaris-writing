# Zodiac Writing App Architecture

## 1. Product Definition

This application is a standalone desktop writing tool with a celestial progress system.

It has two equally important halves:

- `Writing workspace`: where the user writes individual pieces with strong paragraph behavior and reliable copy/export fidelity.
- `Zodiac galaxy view`: where the user's writing progress is visualized as real constellations that gradually light up.

The concept preview implies a premium, quiet, slightly mystical writing experience rather than a gamified toy.

## 2. What The Preview UI Already Contains

The concept image implies the following major interface regions.

### A. Zodiac Ring Carousel

Purpose:

- Display all twelve zodiac constellations at once.
- Let the user swipe or drag through them.
- Bring one selected zodiac into the front-center focus position.

Behavior:

- Twelve constellations sit on a circular orbit.
- The focused zodiac appears larger, closer, brighter, and more legible.
- Non-focused zodiacs recede with lower opacity and smaller scale.
- Swiping rotates the whole orbit rather than paging one flat card at a time.

Implementation note:

- This should be a polar-layout carousel, not a standard horizontal slider.
- We can use transformed DOM/SVG groups with eased snapping to the nearest zodiac.

### B. Focused Constellation Detail

Purpose:

- Show the selected zodiac as a real star chart.
- Let the user click a star and jump into the linked writing piece.

Behavior:

- Each star is a node in the chart.
- Each line segment reflects the real constellation topology as closely as practical.
- Each star has multiple states: locked/unbound, bound but unfinished, completed and glowing, optionally highlighted on hover.
- Clicking a star opens the linked piece in the editor.

Implementation note:

- `SVG` is the best first implementation because stars need precise hit targets, glow states, and line connections.
- Real constellation datasets can be normalized into x/y coordinates and connection lists.

### C. Writing Status Card

Purpose:

- Explain the currently selected star or piece.
- Show progress without entering the editor.

Behavior:

- Shows note title
- Shows zodiac name and star name
- Shows current count vs target
- Shows status like `Unlinked`, `In Progress`, `Lit`
- Shows CTA such as `Start Writing` or `Continue`

### D. Writing Editor

Purpose:

- Provide a dedicated space for long-form writing.
- Preserve beautiful first-line indentation and copy fidelity.

Behavior:

- Full-screen or split-view editor
- Clean typography
- Local autosave
- Word/character count
- One-click copy preserving formatting

## 3. Functional Architecture

The product can be split into six subsystems.

### 3.1 Constellation System

Responsibilities:

- Store zodiac metadata
- Store star coordinates and star-to-star connections
- Map each star to one writing piece
- Compute lit state from writing progress

Core entities:

- `Zodiac`
- `ConstellationStar`
- `StarConnection`
- `WritingPiece`
- `ProgressState`

Suggested model:

```ts
type Zodiac = {
  id: string;
  name: string;
  symbol: string;
  stars: ConstellationStar[];
  connections: StarConnection[];
};

type ConstellationStar = {
  id: string;
  zodiacId: string;
  label: string;
  x: number;
  y: number;
  magnitude?: number;
  linkedPieceId?: string;
};

type StarConnection = {
  from: string;
  to: string;
};

type WritingPiece = {
  id: string;
  title: string;
  content: string;
  paragraphMode?: "zh" | "en" | "none";
  stats: {
    characters: number;
    words: number;
  };
};
```

### 3.2 Editor System

Responsibilities:

- Rich text editing
- Paragraph indentation logic
- Copy/export fidelity
- Autosave and document recovery

Why `TipTap` / `ProseMirror`:

- Strong control over keyboard behavior
- Structured document model
- Reliable HTML generation for clipboard export
- Custom paragraph attributes are straightforward

### 3.3 Indentation Engine

This is one of the most important product features.

Your requirement is not just "insert spaces". It is "make paragraph starts feel correct in Chinese and English, and remain correct when copied elsewhere."

That means we should implement indentation semantically:

- If the user presses space twice at the start of an empty paragraph:
  - mark the paragraph as `zh-indent`
  - render it visually as `text-indent: 2em`
- If the user presses space once at the start of an empty paragraph:
  - mark the paragraph as `en-indent`
  - render it visually as `text-indent: 2ch`

Why this is better than literal spaces:

- It survives font changes more gracefully.
- It copies to Word more reliably through HTML clipboard payloads.
- It avoids broken alignment in markdown editors and note apps.
- It remains editable without weird invisible spacing bugs.

Clipboard strategy:

- Put both `text/html` and `text/plain` on the clipboard.
- `text/html` preserves paragraph styles for Word and rich editors.
- `text/plain` provides fallback content for plain-text targets.

For Obsidian specifically:

- If the user pastes into reading-rich contexts, HTML may preserve better.
- If the user wants markdown-safe export, we should later add `Copy as Markdown`.

## 4. Realistic Constellation Requirement

You asked to stay close to real star counts.

That means:

- Each zodiac should use a real or near-real visible star selection rather than a symbolic five-point icon.
- We do not need every catalogued astronomical star.
- We should select the recognizable stars used in common constellation diagrams.

Practical rule:

- Use the major visible stars from each zodiac constellation map.
- Keep the recognizable line structure.
- Normalize each map to a consistent canvas.

This gives us the right balance between authenticity and usability.

## 5. Screen Architecture

Recommended first version screens:

### Screen 1: Galaxy Home

Contains:

- zodiac ring carousel
- focused constellation
- progress card
- total completion overview

Primary jobs:

- browse zodiacs
- inspect stars
- enter a writing piece

### Screen 2: Piece Editor

Contains:

- piece title
- zodiac/star breadcrumb
- editor canvas
- live count
- indent mode hints
- copy button

Primary jobs:

- write
- autosave
- copy/export

### Screen 3: Constellation Binding Manager

Contains:

- list of stars in selected zodiac
- piece assignment controls
- create new piece action
- relink/unlink actions

Primary jobs:

- bind stars to writing pieces
- manage writing map

## 6. Motion and Interaction Design

To stay faithful to the preview, motion is part of the product architecture.

Key interactions:

- Drag or scroll rotates the zodiac wheel.
- Release snaps the nearest zodiac into focus.
- Focused constellation gently breathes with low-amplitude glow.
- Lit stars shimmer subtly rather than flashing.
- Completing a piece triggers a star ignition animation.
- Completing a zodiac triggers line illumination across that constellation.

These are product features, not decorative extras, because they reinforce the writing-progression loop.

## 7. Storage Architecture

Recommended local-first structure:

- App metadata in local JSON or SQLite
- Writing pieces stored as project files on disk
- Constellation progress derived from piece stats

Suggested first-pass approach:

- `Tauri Store` or JSON for app state
- individual document files for user writing content

Example data split:

- `library.json`: zodiac bindings, UI state, preferences
- `pieces/<id>.json` or `pieces/<id>.html`: content and metadata

Later upgrade path:

- move to SQLite if search, versioning, or large libraries become important

## 8. Copy and Export Architecture

This is a core promise of the product.

We should support at least:

- `Copy`
- `Copy as Markdown`
- `Export as .docx` later
- `Export as Markdown` later

Phase 1 success criteria:

- Pasting into Word keeps paragraph indentation and paragraph breaks.
- Pasting into Obsidian keeps readable paragraph structure.
- Pasting into mainstream note apps does not collapse formatting.

## 9. Proposed Technical Stack

### Desktop Shell

- `Tauri`

Why:

- Much lighter than Electron
- Good filesystem access
- Cross-platform path
- Strong fit for a local-first writing tool

### Frontend

- `React`
- `TypeScript`
- `Vite`

### Editor

- `TipTap`

### Visualization

- `SVG` for constellation maps
- `Framer Motion` or motion-light CSS transforms for ring interactions

### Storage

- local JSON first
- optional SQLite later

## 10. Build Plan

### Phase 0: Design Lock

Output:

- confirm core writing rules
- confirm the visual direction from the preview
- confirm the data model around stars and pieces

### Phase 1: Clickable Prototype

Output:

- zodiac ring UI
- focus snapping
- one sample constellation rendered in SVG
- clickable stars
- fake progress states

Success:

- the app already feels like the preview

### Phase 2: Real Editor

Output:

- TipTap editor view
- autosave
- live counts
- Chinese/English paragraph indentation shortcuts
- copy preserving formatting

Success:

- the writing experience itself is already usable

### Phase 3: Real Data Integration

Output:

- real zodiac datasets
- star-to-piece binding
- lit-state computation from counts
- full progress persistence

### Phase 4: Completion Rituals

Output:

- constellation completion animations
- full zodiac completion states
- all-stars-lit ending state

## 11. Product Risks To Handle Early

### Risk A: "3000" counting ambiguity

Chinese and English text count differently.

We should decide whether completion is based on:

- raw character count
- CJK character count plus English word count
- estimated reading-language-aware count

My recommendation:

- define a custom `effective count`
- Chinese text counts by visible CJK characters
- English text counts by words
- mixed text can sum both

This will feel fairer than a single naive metric.

### Risk B: Clipboard fidelity across apps

Word and Obsidian do not interpret clipboard content identically.

Mitigation:

- implement HTML + plain-text clipboard together
- test with Word, Obsidian, Apple Notes, Notion
- later add explicit export modes

### Risk C: Real constellation complexity

Some zodiac constellations have many stars and awkward shapes.

Mitigation:

- use curated visible stars, not exhaustive astronomical catalogs
- preserve recognizability over scientific completeness

## 12. Recommended Next Development Move

The best next step is to build `Phase 1 + Phase 2` together in a lightweight shell:

- scaffold the desktop app
- build the zodiac home screen
- build one working editor route
- implement indentation and copy behavior early

That gives us the visual identity and the hardest writing mechanics first, which is the right foundation for the rest of the product.
