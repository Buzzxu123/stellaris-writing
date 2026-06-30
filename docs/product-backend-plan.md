# Stellaris Product Logic Plan

## Navigation Model

The left navigation should map to real product jobs, not decorative pages.

- `Check-In`: daily writing entry point, zodiac progress wheel, selected linked note.
- `My Notes`: all writing pieces, search/filter later, open any linked star note.
- `Statistics`: derived progress, total words, lit stars, active notes, streak health.
- `Calendar`: weekly/monthly writing rhythm, check-in days, missed days, streaks.
- `Settings`: targets, copy, export preferences, profile, local data location.

`Constellations` is removed because the constellation browser already lives inside `Check-In`.

## Local-First Backend Shape

Phase 1 can stay local-first and use a repository layer over localStorage. Tauri file storage should replace the adapter later without changing UI components.

```ts
type LibraryState = {
  pieces: Record<string, WritingPiece>;
  copy: AppCopy;
  preferences: UserPreferences;
  checkins: Record<string, DailyCheckIn>;
};

type DailyCheckIn = {
  date: string;
  pieceIds: string[];
  effectiveWords: number;
  completedStarIds: string[];
};

type UserPreferences = {
  defaultParagraphMode: "zh" | "en" | "none";
  defaultTarget: number;
  themeMode: "auto" | "day" | "night";
};
```

## Derived Services

- `ProgressService`: computes star state, zodiac completion, global completion.
- `StatsService`: totals words, active notes, lit stars, completion percentage.
- `CalendarService`: groups writing changes by date and computes streaks.
- `ClipboardService`: exports HTML/plain text with paragraph indentation.
- `AssetService`: maps zodiac ids to generated asteroid sprites and star styles.
- `ThemeService`: resolves the active theme every second from `themeMode`; `auto` switches to day at 06:00 and night at 18:00, while user-selected `day` or `night` overrides auto until changed.

## Next Implementation Step

Move the current in-component localStorage reads/writes into `src/domain/storage.ts`, then expose small pure functions in `src/domain/progress.ts` and `src/domain/calendar.ts`. This keeps Tauri file persistence easy to add later.
