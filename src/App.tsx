import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, Dispatch, KeyboardEvent, MouseEvent, SetStateAction } from 'react'
import { invoke } from '@tauri-apps/api/core'
import './App.css'

type ProgressState = 'unbound' | 'draft' | 'lit'
type ViewMode = 'galaxy' | 'editor' | 'notes' | 'statistics' | 'calendar' | 'settings'
type ParagraphMode = 'zh' | 'en' | 'none'
type ThemeMode = 'auto' | 'day' | 'night'
type ActiveTheme = 'day' | 'night'

type ConstellationStar = {
  id: string
  label: string
  x: number
  y: number
  magnitude: number
}

type StarConnection = {
  from: string
  to: string
}

type Zodiac = {
  id: string
  name: string
  latin: string
  symbol: string
  element: string
  stars: ConstellationStar[]
  connections: StarConnection[]
}

type WritingPiece = {
  id: string
  zodiacId: string
  starId: string
  title: string
  content: string
  target: number
  paragraphMode: ParagraphMode
  updatedAt: string
  anchors: StarAnchor[]
  dockLog: string
}

type WritingStats = {
  characters: number
  words: number
  effective: number
}

type StarAnchor = {
  id: string
  start: number
  end: number
  tag: string
  createdAt: string
}

type AppCopy = {
  leftSlogan: string
  quote: string
  author: string
}

const zodiacs: Zodiac[] = [
  {
    id: 'aries',
    name: '白羊座',
    latin: 'Aries',
    symbol: '♈',
    element: 'Fire',
    stars: [
      { id: 'hamal', label: 'Hamal', x: 23, y: 43, magnitude: 2 },
      { id: 'sheratan', label: 'Sheratan', x: 44, y: 51, magnitude: 2.6 },
      { id: 'mesarthim', label: 'Mesarthim', x: 58, y: 60, magnitude: 3.9 },
      { id: 'bharani', label: 'Bharani', x: 72, y: 39, magnitude: 4.3 },
    ],
    connections: [
      { from: 'hamal', to: 'sheratan' },
      { from: 'sheratan', to: 'mesarthim' },
      { from: 'sheratan', to: 'bharani' },
    ],
  },
  {
    id: 'taurus',
    name: '金牛座',
    latin: 'Taurus',
    symbol: '♉',
    element: 'Earth',
    stars: [
      { id: 'aldebaran', label: 'Aldebaran', x: 52, y: 55, magnitude: 0.9 },
      { id: 'elnath', label: 'Elnath', x: 77, y: 18, magnitude: 1.7 },
      { id: 'ain', label: 'Ain', x: 38, y: 48, magnitude: 3.5 },
      { id: 'theta1', label: 'Theta Tauri', x: 31, y: 61, magnitude: 3.8 },
      { id: 'zeta', label: 'Zeta Tauri', x: 75, y: 79, magnitude: 3 },
      { id: 'lambda', label: 'Lambda Tauri', x: 60, y: 38, magnitude: 3.4 },
    ],
    connections: [
      { from: 'elnath', to: 'lambda' },
      { from: 'lambda', to: 'aldebaran' },
      { from: 'aldebaran', to: 'ain' },
      { from: 'ain', to: 'theta1' },
      { from: 'aldebaran', to: 'zeta' },
    ],
  },
  {
    id: 'gemini',
    name: '双子座',
    latin: 'Gemini',
    symbol: '♊',
    element: 'Air',
    stars: [
      { id: 'castor', label: 'Castor', x: 30, y: 18, magnitude: 1.6 },
      { id: 'pollux', label: 'Pollux', x: 48, y: 24, magnitude: 1.1 },
      { id: 'alhena', label: 'Alhena', x: 66, y: 70, magnitude: 1.9 },
      { id: 'wasat', label: 'Wasat', x: 50, y: 52, magnitude: 3.5 },
      { id: 'mekbuda', label: 'Mekbuda', x: 37, y: 67, magnitude: 4 },
      { id: 'tejat', label: 'Tejat', x: 71, y: 42, magnitude: 2.9 },
    ],
    connections: [
      { from: 'castor', to: 'wasat' },
      { from: 'wasat', to: 'mekbuda' },
      { from: 'pollux', to: 'tejat' },
      { from: 'tejat', to: 'alhena' },
      { from: 'wasat', to: 'tejat' },
    ],
  },
  {
    id: 'cancer',
    name: '巨蟹座',
    latin: 'Cancer',
    symbol: '♋',
    element: 'Water',
    stars: [
      { id: 'acubens', label: 'Acubens', x: 40, y: 74, magnitude: 4.3 },
      { id: 'altarf', label: 'Altarf', x: 74, y: 67, magnitude: 3.5 },
      { id: 'asellus-n', label: 'Asellus Borealis', x: 44, y: 35, magnitude: 4.7 },
      { id: 'asellus-s', label: 'Asellus Australis', x: 53, y: 48, magnitude: 3.9 },
      { id: 'iota', label: 'Iota Cancri', x: 23, y: 24, magnitude: 4 },
    ],
    connections: [
      { from: 'iota', to: 'asellus-n' },
      { from: 'asellus-n', to: 'asellus-s' },
      { from: 'asellus-s', to: 'acubens' },
      { from: 'asellus-s', to: 'altarf' },
    ],
  },
  {
    id: 'leo',
    name: '狮子座',
    latin: 'Leo',
    symbol: '♌',
    element: 'Fire',
    stars: [
      { id: 'regulus', label: 'Regulus', x: 33, y: 70, magnitude: 1.4 },
      { id: 'denebola', label: 'Denebola', x: 79, y: 52, magnitude: 2.1 },
      { id: 'algieba', label: 'Algieba', x: 37, y: 37, magnitude: 2.2 },
      { id: 'zosma', label: 'Zosma', x: 63, y: 42, magnitude: 2.6 },
      { id: 'chertan', label: 'Chertan', x: 61, y: 61, magnitude: 3.3 },
      { id: 'rasalas', label: 'Rasalas', x: 27, y: 22, magnitude: 3.9 },
    ],
    connections: [
      { from: 'regulus', to: 'algieba' },
      { from: 'algieba', to: 'rasalas' },
      { from: 'regulus', to: 'chertan' },
      { from: 'chertan', to: 'zosma' },
      { from: 'zosma', to: 'denebola' },
      { from: 'chertan', to: 'denebola' },
    ],
  },
  {
    id: 'virgo',
    name: '处女座',
    latin: 'Virgo',
    symbol: '♍',
    element: 'Earth',
    stars: [
      { id: 'spica', label: 'Spica', x: 72, y: 78, magnitude: 1 },
      { id: 'zavijava', label: 'Zavijava', x: 21, y: 38, magnitude: 3.6 },
      { id: 'porrima', label: 'Porrima', x: 43, y: 52, magnitude: 2.7 },
      { id: 'vindemiatrix', label: 'Vindemiatrix', x: 62, y: 30, magnitude: 2.8 },
      { id: 'heze', label: 'Heze', x: 57, y: 68, magnitude: 3.4 },
    ],
    connections: [
      { from: 'zavijava', to: 'porrima' },
      { from: 'porrima', to: 'vindemiatrix' },
      { from: 'porrima', to: 'heze' },
      { from: 'heze', to: 'spica' },
    ],
  },
  {
    id: 'libra',
    name: '天秤座',
    latin: 'Libra',
    symbol: '♎',
    element: 'Air',
    stars: [
      { id: 'zubenes', label: 'Zubeneschamali', x: 34, y: 24, magnitude: 2.6 },
      { id: 'zubenel', label: 'Zubenelgenubi', x: 28, y: 64, magnitude: 2.8 },
      { id: 'brachium', label: 'Brachium', x: 70, y: 73, magnitude: 3.3 },
      { id: 'sigma', label: 'Sigma Librae', x: 72, y: 37, magnitude: 3.3 },
    ],
    connections: [
      { from: 'zubenes', to: 'zubenel' },
      { from: 'zubenes', to: 'sigma' },
      { from: 'zubenel', to: 'brachium' },
      { from: 'sigma', to: 'brachium' },
    ],
  },
  {
    id: 'scorpio',
    name: '天蝎座',
    latin: 'Scorpius',
    symbol: '♏',
    element: 'Water',
    stars: [
      { id: 'antares', label: 'Antares', x: 45, y: 42, magnitude: 1 },
      { id: 'acrabh', label: 'Acrab', x: 32, y: 24, magnitude: 2.6 },
      { id: 'dschubba', label: 'Dschubba', x: 42, y: 20, magnitude: 2.3 },
      { id: 'shaula', label: 'Shaula', x: 76, y: 76, magnitude: 1.6 },
      { id: 'sargas', label: 'Sargas', x: 64, y: 68, magnitude: 1.9 },
      { id: 'lesath', label: 'Lesath', x: 84, y: 67, magnitude: 2.7 },
      { id: 'wei', label: 'Wei', x: 52, y: 59, magnitude: 2.9 },
    ],
    connections: [
      { from: 'acrabh', to: 'dschubba' },
      { from: 'dschubba', to: 'antares' },
      { from: 'antares', to: 'wei' },
      { from: 'wei', to: 'sargas' },
      { from: 'sargas', to: 'shaula' },
      { from: 'shaula', to: 'lesath' },
    ],
  },
  {
    id: 'sagittarius',
    name: '射手座',
    latin: 'Sagittarius',
    symbol: '♐',
    element: 'Fire',
    stars: [
      { id: 'kaus-a', label: 'Kaus Australis', x: 50, y: 68, magnitude: 1.8 },
      { id: 'nunki', label: 'Nunki', x: 72, y: 42, magnitude: 2 },
      { id: 'ascella', label: 'Ascella', x: 36, y: 48, magnitude: 2.6 },
      { id: 'kaus-m', label: 'Kaus Media', x: 47, y: 43, magnitude: 2.7 },
      { id: 'kaus-b', label: 'Kaus Borealis', x: 55, y: 28, magnitude: 2.8 },
      { id: 'rukhbat', label: 'Rukbat', x: 26, y: 75, magnitude: 4 },
    ],
    connections: [
      { from: 'rukhbat', to: 'ascella' },
      { from: 'ascella', to: 'kaus-m' },
      { from: 'kaus-m', to: 'kaus-b' },
      { from: 'kaus-m', to: 'kaus-a' },
      { from: 'kaus-a', to: 'nunki' },
      { from: 'kaus-b', to: 'nunki' },
    ],
  },
  {
    id: 'capricorn',
    name: '摩羯座',
    latin: 'Capricornus',
    symbol: '♑',
    element: 'Earth',
    stars: [
      { id: 'dabih', label: 'Dabih', x: 28, y: 24, magnitude: 3.1 },
      { id: 'algiedi', label: 'Algedi', x: 20, y: 34, magnitude: 3.6 },
      { id: 'nashira', label: 'Nashira', x: 70, y: 52, magnitude: 3.7 },
      { id: 'deneb', label: 'Deneb Algedi', x: 80, y: 62, magnitude: 2.8 },
      { id: 'omega', label: 'Omega Capricorni', x: 48, y: 75, magnitude: 4.1 },
    ],
    connections: [
      { from: 'algiedi', to: 'dabih' },
      { from: 'dabih', to: 'omega' },
      { from: 'omega', to: 'deneb' },
      { from: 'deneb', to: 'nashira' },
      { from: 'nashira', to: 'dabih' },
    ],
  },
  {
    id: 'aquarius',
    name: '水瓶座',
    latin: 'Aquarius',
    symbol: '♒',
    element: 'Air',
    stars: [
      { id: 'sadalsuud', label: 'Sadalsuud', x: 35, y: 38, magnitude: 2.9 },
      { id: 'sadalmelik', label: 'Sadalmelik', x: 48, y: 25, magnitude: 3 },
      { id: 'skats', label: 'Skat', x: 68, y: 62, magnitude: 3.3 },
      { id: 'ancha', label: 'Ancha', x: 42, y: 60, magnitude: 4.1 },
      { id: 'albali', label: 'Albali', x: 23, y: 69, magnitude: 3.8 },
      { id: 'situla', label: 'Situla', x: 71, y: 32, magnitude: 5 },
    ],
    connections: [
      { from: 'sadalsuud', to: 'sadalmelik' },
      { from: 'sadalsuud', to: 'ancha' },
      { from: 'ancha', to: 'albali' },
      { from: 'ancha', to: 'skats' },
      { from: 'sadalmelik', to: 'situla' },
      { from: 'situla', to: 'skats' },
    ],
  },
  {
    id: 'pisces',
    name: '双鱼座',
    latin: 'Pisces',
    symbol: '♓',
    element: 'Water',
    stars: [
      { id: 'alrescha', label: 'Alrescha', x: 50, y: 73, magnitude: 3.8 },
      { id: 'fomal', label: 'Fum al Samakah', x: 27, y: 38, magnitude: 4.5 },
      { id: 'torcular', label: 'Torcular', x: 43, y: 48, magnitude: 4.3 },
      { id: 'omega-p', label: 'Omega Piscium', x: 67, y: 45, magnitude: 4 },
      { id: 'kappa', label: 'Kappa Piscium', x: 77, y: 30, magnitude: 4.9 },
      { id: 'iota-p', label: 'Iota Piscium', x: 23, y: 22, magnitude: 4.1 },
    ],
    connections: [
      { from: 'iota-p', to: 'fomal' },
      { from: 'fomal', to: 'torcular' },
      { from: 'torcular', to: 'alrescha' },
      { from: 'alrescha', to: 'omega-p' },
      { from: 'omega-p', to: 'kappa' },
    ],
  },
]

const zodiacMottos: Record<string, { archetype: string; traits: string }> = {
  aries: { archetype: 'The Initiator', traits: 'Brave · Direct · Restless' },
  taurus: { archetype: 'The Keeper', traits: 'Patient · Sensual · Steady' },
  gemini: { archetype: 'The Messenger', traits: 'Curious · Quick · Bright' },
  cancer: { archetype: 'The Nurturer', traits: 'Intuitive · Protective · Imaginative' },
  leo: { archetype: 'The Radiant', traits: 'Warm · Proud · Generous' },
  virgo: { archetype: 'The Weaver', traits: 'Precise · Tender · Useful' },
  libra: { archetype: 'The Harmonist', traits: 'Graceful · Fair · Perceptive' },
  scorpio: { archetype: 'The Deepener', traits: 'Magnetic · Private · Transforming' },
  sagittarius: { archetype: 'The Seeker', traits: 'Open · Restless · Hopeful' },
  capricorn: { archetype: 'The Builder', traits: 'Patient · Exacting · Loyal' },
  aquarius: { archetype: 'The Visionary', traits: 'Clear · Strange · Humane' },
  pisces: { archetype: 'The Dreamer', traits: 'Porous · Poetic · Devoted' },
}

const titleSeed = 'Tides Remember What We Forget'
const draftSeed =
  'The tide remembers what the shore pretends to release, and every return leaves a brighter mark inside the dark.'

function buildPreviewDraft() {
  const seedWords = draftSeed.split(' ')
  const words = Array.from({ length: 3247 }, (_, index) => seedWords[index % seedWords.length])

  return Array.from({ length: Math.ceil(words.length / 95) }, (_, index) =>
    words.slice(index * 95, index * 95 + 95).join(' '),
  ).join('\n\n')
}

const storageKey = 'zodiac-writing-pieces-v2'
const copyStorageKey = 'zodiac-writing-copy-v1'
const themeStorageKey = 'zodiac-writing-theme-v1'
const editorPageSize = 1800
const initialUpdatedAt = '2026-06-30T00:00:00.000Z'

const defaultCopy: AppCopy = {
  leftSlogan: "The stars don't write for you.\nThey remind you why you do.",
  quote: 'Your words are the stars\nyou bring into being.',
  author: 'Anais Nin',
}

function createInitialPieces() {
  return Object.fromEntries(
    zodiacs.flatMap((zodiac) =>
      zodiac.stars.map((star) => {
        const id = `${zodiac.id}-${star.id}`
        return [
          id,
          {
            id,
            zodiacId: zodiac.id,
            starId: star.id,
            title:
              zodiac.id === 'cancer' && star.id === 'acubens'
                ? titleSeed
                : `${zodiac.latin} · ${star.label}`,
            content:
              zodiac.id === 'cancer' && star.id === 'acubens'
                ? buildPreviewDraft()
                : '',
            target: 3000,
            paragraphMode: 'en',
            updatedAt: initialUpdatedAt,
            anchors: [],
            dockLog: '',
          } satisfies WritingPiece,
        ]
      }),
    ),
  )
}

function normalizePieces(pieces: Record<string, WritingPiece>) {
  return Object.fromEntries(
    Object.entries(pieces).map(([id, piece]) => [
      id,
      {
        ...piece,
        updatedAt: piece.updatedAt ?? initialUpdatedAt,
        anchors: piece.anchors ?? [],
        dockLog: piece.dockLog ?? '',
      },
    ]),
  )
}

function countWriting(content: string): WritingStats {
  const cjkMatches = content.match(/[\u3400-\u9fff]/g) ?? []
  const wordMatches = content.match(/[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)*/g) ?? []
  const visibleCharacters = content.replace(/\s/g, '').length

  return {
    characters: visibleCharacters,
    words: wordMatches.length,
    effective: cjkMatches.length + wordMatches.length,
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escapeYaml(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

function safeMarkdownFilename(value: string) {
  const name = value
    .replace(/[/:*?"<>|\\]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\.+|\.+$/g, '')

  return `${name || 'Untitled Note'}.md`
}

function plainTextForExport(content: string) {
  return content
    .split(/\n{2,}|\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.trim().length > 0)
    .join('\n\n')
}

function htmlForExport(piece: WritingPiece) {
  return piece.content
    .split(/\n{2,}|\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map(
      (paragraph) =>
        `<p style="margin:0 0 12px;line-height:1.8;">${escapeHtml(paragraph)}</p>`,
    )
    .join('')
}

function connectionKey(zodiac: Zodiac, connection: StarConnection) {
  return `${zodiac.id}-${connection.from}-${connection.to}`
}

function textSymbol(symbol: string) {
  return `${symbol}\uFE0E`
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value)
}

function starTone(starId: string) {
  return Array.from(starId).reduce((sum, char) => sum + char.charCodeAt(0), 0) %
    2 ===
    0
    ? 'gold'
    : 'blue'
}

function getAutoTheme(date: Date): ActiveTheme {
  const hour = date.getHours()
  return hour >= 6 && hour < 18 ? 'day' : 'night'
}

function formatClock(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date)
}

function starIntensity(piece: WritingPiece) {
  return Math.min(100, Math.floor(countWriting(piece.content).effective / 30))
}

function markdownForPiece(
  piece: WritingPiece,
  zodiac: Zodiac,
  star: ConstellationStar,
) {
  const stats = countWriting(piece.content)
  const body = plainTextForExport(piece.content).trim()

  return [
    '---',
    `title: "${escapeYaml(piece.title)}"`,
    `zodiac: "${escapeYaml(zodiac.latin)}"`,
    `star: "${escapeYaml(star.label)}"`,
    `words: ${stats.effective}`,
    `characters: ${stats.characters}`,
    `target: ${piece.target}`,
    `paragraphMode: "${piece.paragraphMode}"`,
    `exportedAt: "${new Date().toISOString()}"`,
    '---',
    '',
    `# ${piece.title}`,
    '',
    `- Zodiac: ${zodiac.latin}`,
    `- Star: ${star.label}`,
    `- Progress: ${formatNumber(stats.effective)} / ${formatNumber(piece.target)} words`,
    '',
    body || '_No writing yet._',
    '',
  ].join('\n')
}

function pieceForStar(
  pieces: Record<string, WritingPiece>,
  zodiacId: string,
  starId: string,
) {
  return pieces[`${zodiacId}-${starId}`]
}

function splitIntoPages(content: string) {
  if (!content) {
    return ['']
  }

  const pages: string[] = []

  for (let index = 0; index < content.length; index += editorPageSize) {
    pages.push(content.slice(index, index + editorPageSize))
  }

  return pages
}

function adjustAnchorsForEdit(
  anchors: StarAnchor[],
  oldText: string,
  nextText: string,
  pageOffset: number,
) {
  if (oldText === nextText) {
    return anchors
  }

  let prefixLength = 0
  const maxPrefix = Math.min(oldText.length, nextText.length)

  while (
    prefixLength < maxPrefix &&
    oldText[prefixLength] === nextText[prefixLength]
  ) {
    prefixLength += 1
  }

  let suffixLength = 0

  while (
    suffixLength < oldText.length - prefixLength &&
    suffixLength < nextText.length - prefixLength &&
    oldText[oldText.length - 1 - suffixLength] ===
      nextText[nextText.length - 1 - suffixLength]
  ) {
    suffixLength += 1
  }

  const oldChangeStart = pageOffset + prefixLength
  const oldChangeEnd = pageOffset + oldText.length - suffixLength
  const delta = nextText.length - oldText.length

  return anchors.map((anchor) => {
    if (anchor.end <= oldChangeStart) {
      return anchor
    }

    if (anchor.start >= oldChangeEnd) {
      return {
        ...anchor,
        start: Math.max(0, anchor.start + delta),
        end: Math.max(0, anchor.end + delta),
      }
    }

    return {
      ...anchor,
      end: Math.max(anchor.start, anchor.end + delta),
    }
  })
}

function App() {
  const [selectedIndex, setSelectedIndex] = useState(3)
  const [viewMode, setViewMode] = useState<ViewMode>('galaxy')
  const [selectedStarId, setSelectedStarId] = useState(zodiacs[3].stars[0].id)
  const [copyState, setCopyState] = useState('Copy')
  const [saveState, setSaveState] = useState('Save Markdown')
  const [editorPage, setEditorPage] = useState(0)
  const [pendingViewMode, setPendingViewMode] = useState<ViewMode | null>(null)
  const [dockLogDraft, setDockLogDraft] = useState('')
  const [anchorDraft, setAnchorDraft] = useState<{
    start: number
    end: number
    tag: string
    x: number
    y: number
  } | null>(null)
  const [anchorPreview, setAnchorPreview] = useState<StarAnchor | null>(null)
  const writingSurfaceRef = useRef<HTMLTextAreaElement>(null)
  const [now, setNow] = useState(() => new Date())
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const saved = window.localStorage.getItem(themeStorageKey)
    return saved === 'day' || saved === 'night' || saved === 'auto' ? saved : 'auto'
  })
  const [appCopy, setAppCopy] = useState<AppCopy>(() => {
    const saved = window.localStorage.getItem(copyStorageKey)
    return saved ? { ...defaultCopy, ...JSON.parse(saved) } : defaultCopy
  })
  const [pieces, setPieces] = useState<Record<string, WritingPiece>>(() => {
    const saved = window.localStorage.getItem(storageKey)

    if (!saved) {
      return createInitialPieces()
    }

    return normalizePieces({
      ...createInitialPieces(),
      ...JSON.parse(saved),
    })
  })

  const selectedZodiac = zodiacs[selectedIndex]
  const selectedStar =
    selectedZodiac.stars.find((star) => star.id === selectedStarId) ??
    selectedZodiac.stars[0]
  const selectedPiece = pieces[`${selectedZodiac.id}-${selectedStar.id}`]
  const selectedStats = countWriting(selectedPiece.content)
  const activeTheme = themeMode === 'auto' ? getAutoTheme(now) : themeMode
  const editorPages = splitIntoPages(selectedPiece.content)
  const currentEditorPage = Math.min(editorPage, editorPages.length - 1)
  const currentEditorText = editorPages[currentEditorPage] ?? ''
  const anchorPreviewText = anchorPreview
    ? selectedPiece.content.slice(anchorPreview.start, anchorPreview.end)
    : ''

  const zodiacProgress = useMemo(() => {
    return zodiacs.map((zodiac) => {
      const lit = zodiac.stars.filter((star) => {
        const piece = pieces[`${zodiac.id}-${star.id}`]
        return countWriting(piece.content).effective >= piece.target
      }).length

      return {
        zodiacId: zodiac.id,
        lit,
        total: zodiac.stars.length,
      }
    })
  }, [pieces])

  const totalProgress = useMemo(() => {
    const lit = zodiacProgress.reduce((sum, item) => sum + item.lit, 0)
    const total = zodiacProgress.reduce((sum, item) => sum + item.total, 0)
    return { lit, total, percent: Math.round((lit / total) * 100) }
  }, [zodiacProgress])

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(pieces))
  }, [pieces])

  useEffect(() => {
    window.localStorage.setItem(copyStorageKey, JSON.stringify(appCopy))
  }, [appCopy])

  useEffect(() => {
    window.localStorage.setItem(themeStorageKey, themeMode)
  }, [themeMode])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    setEditorPage(0)
  }, [selectedPiece.id])

  function selectZodiac(index: number) {
    const nextIndex = (index + zodiacs.length) % zodiacs.length
    setSelectedIndex(nextIndex)
    setSelectedStarId(zodiacs[nextIndex].stars[0].id)
    setCopyState('Copy')
  }

  function getPieceState(zodiacId: string, starId: string): ProgressState {
    const piece = pieces[`${zodiacId}-${starId}`]

    if (!piece) {
      return 'unbound'
    }

    const stats = countWriting(piece.content)

    if (stats.effective === 0) {
      return 'unbound'
    }

    return stats.effective >= piece.target ? 'lit' : 'draft'
  }

  function getStarIntensity(zodiacId: string, starId: string) {
    const piece = pieceForStar(pieces, zodiacId, starId)
    return piece ? starIntensity(piece) : 0
  }

  function getStarState(starId: string): ProgressState {
    return getPieceState(selectedZodiac.id, starId)
  }

  function updatePiece(pieceId: string, update: Partial<WritingPiece>) {
    setPieces((currentPieces) => ({
      ...currentPieces,
      [pieceId]: {
        ...currentPieces[pieceId],
        ...update,
        updatedAt: new Date().toISOString(),
      },
    }))
  }

  function updateSelectedPiece(update: Partial<WritingPiece>) {
    updatePiece(selectedPiece.id, update)
  }

  function navigateTo(nextViewMode: ViewMode) {
    if (viewMode === 'editor' && nextViewMode !== 'editor') {
      setPendingViewMode(nextViewMode)
      setDockLogDraft('')
      return
    }

    setViewMode(nextViewMode)
  }

  function submitDockLog() {
    updateSelectedPiece({ dockLog: dockLogDraft.trim() || 'over' })

    if (pendingViewMode) {
      setViewMode(pendingViewMode)
    }

    setPendingViewMode(null)
    setDockLogDraft('')
  }

  function updateCurrentEditorPage(pageText: string) {
    const nextPages = [...editorPages]
    const shouldAdvancePage = pageText.length > editorPageSize
    const adjustedAnchors = adjustAnchorsForEdit(
      selectedPiece.anchors,
      currentEditorText,
      pageText,
      currentEditorPage * editorPageSize,
    )

    if (shouldAdvancePage) {
      const overflow = pageText.slice(editorPageSize)
      nextPages[currentEditorPage] = pageText.slice(0, editorPageSize)
      nextPages[currentEditorPage + 1] = `${overflow}${nextPages[currentEditorPage + 1] ?? ''}`
      setEditorPage(currentEditorPage + 1)
      window.requestAnimationFrame(() => {
        writingSurfaceRef.current?.focus()
        if (writingSurfaceRef.current) {
          writingSurfaceRef.current.selectionStart = overflow.length
          writingSurfaceRef.current.selectionEnd = overflow.length
        }
      })
    } else {
      nextPages[currentEditorPage] = pageText
    }

    updateSelectedPiece({ content: nextPages.join(''), anchors: adjustedAnchors })
  }

  function handleWritingKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === 'a') {
      event.preventDefault()
      openAnchorMenu()
      return
    }
  }

  function openAnchorMenu(event?: MouseEvent<HTMLTextAreaElement>) {
    const target = writingSurfaceRef.current

    if (!target || target.selectionStart === target.selectionEnd) {
      return
    }

    event?.preventDefault()

    const pageOffset = currentEditorPage * editorPageSize
    setAnchorDraft({
      start: pageOffset + target.selectionStart,
      end: pageOffset + target.selectionEnd,
      tag: '#伏笔',
      x: event?.clientX ?? window.innerWidth / 2,
      y: event?.clientY ?? window.innerHeight / 2,
    })
  }

  function createAnchor() {
    if (!anchorDraft) {
      return
    }

    const tag = anchorDraft.tag.trim() || '#锚点'
    const normalizedTag = tag.startsWith('#') ? tag : `#${tag}`
    updateSelectedPiece({
      anchors: [
        ...selectedPiece.anchors,
        {
          id: `${Date.now()}-${anchorDraft.start}`,
          start: anchorDraft.start,
          end: anchorDraft.end,
          tag: normalizedTag,
          createdAt: new Date().toISOString(),
        },
      ],
    })
    setAnchorDraft(null)
  }

  function previewAnchor(anchor: StarAnchor) {
    setAnchorPreview(anchor)
  }

  async function copyPiece() {
    const html = htmlForExport(selectedPiece)
    const text = plainTextForExport(selectedPiece.content)

    if (navigator.clipboard && 'ClipboardItem' in window) {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([text], { type: 'text/plain' }),
        }),
      ])
    } else {
      await navigator.clipboard.writeText(text)
    }

    setCopyState('Copied')
    window.setTimeout(() => setCopyState('Copy'), 1600)
  }

  async function savePieceAsMarkdown() {
    const markdown = markdownForPiece(selectedPiece, selectedZodiac, selectedStar)
    const filename = safeMarkdownFilename(
      `${selectedPiece.title} - ${selectedZodiac.latin} - ${selectedStar.label}`,
    )

    try {
      const path = await invoke<string>('save_markdown_file', {
        filename,
        contents: markdown,
      })
      setSaveState(`Saved: ${path}`)
    } catch {
      const url = URL.createObjectURL(
        new Blob([markdown], { type: 'text/markdown;charset=utf-8' }),
      )
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.append(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      setSaveState('Downloaded Markdown')
    }

    window.setTimeout(() => setSaveState('Save Markdown'), 2200)
  }

  return (
    <main className={`app-shell theme-${activeTheme}`}>
      <aside className="sidebar" aria-label="App navigation">
        <button className="brand" type="button" onClick={() => navigateTo('galaxy')}>
          <span className="brand-mark">✦</span>
          <span>
            <strong>STELLARIS</strong>
            <small>WRITING CHECK-IN</small>
          </span>
        </button>
        <nav className="side-nav" aria-label="Primary views">
          <button
            className={viewMode === 'galaxy' ? 'active' : ''}
            type="button"
            onClick={() => navigateTo('galaxy')}
          >
            <span>✦</span>
            Check-In
          </button>
          <button
            className={viewMode === 'notes' || viewMode === 'editor' ? 'active' : ''}
            type="button"
            onClick={() => navigateTo('notes')}
          >
            <span>□</span>
            My Notes
          </button>
          <button
            className={viewMode === 'statistics' ? 'active' : ''}
            type="button"
            onClick={() => navigateTo('statistics')}
          >
            <span>▥</span>
            Statistics
          </button>
          <button
            className={viewMode === 'calendar' ? 'active' : ''}
            type="button"
            onClick={() => navigateTo('calendar')}
          >
            <span>☽</span>
            Calendar
          </button>
          <button
            className={viewMode === 'settings' ? 'active' : ''}
            type="button"
            onClick={() => navigateTo('settings')}
          >
            <span>⚙</span>
            Settings
          </button>
        </nav>
        <div className="sidebar-card moon-card">
          <span>☾</span>
          <p>{defaultCopy.leftSlogan}</p>
        </div>
        <div className="sidebar-card compact-card">
          <strong>Weekly Compass</strong>
          <span>{totalProgress.lit} / 7 Check-Ins</span>
          <div>
            <i style={{ width: `${totalProgress.percent}%` }} />
          </div>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p>Choose a constellation</p>
            <h2>to focus your words.</h2>
          </div>
          <div className="time-theme-cluster">
            <time dateTime={now.toISOString()}>{formatClock(now)}</time>
            <button
              className="moon-toggle"
              type="button"
              onClick={() =>
                setThemeMode((current) =>
                  current === 'auto' ? 'day' : current === 'day' ? 'night' : 'auto',
                )
              }
            >
              {themeMode === 'auto'
                ? `Auto · ${activeTheme === 'day' ? 'Day' : 'Night'}`
                : themeMode === 'day'
                  ? '☉ Day Mode'
                  : '◐ Night Mode'}
            </button>
          </div>
        </header>

      {viewMode === 'galaxy' ? (
        <section className="galaxy-layout" aria-label="Constellation progress">
          <div className="orbit-panel">
            <div className="orbit" aria-label="Zodiac wheel">
              {zodiacs.map((zodiac, index) => {
                if (index === selectedIndex) {
                  return null
                }

                const angle = ((index - selectedIndex) / zodiacs.length) * 360 + 90
                const progress = zodiacProgress.find(
                  (item) => item.zodiacId === zodiac.id,
                )
                const radian = (angle * Math.PI) / 180
                const depth = Math.cos(radian)
                const x = Math.cos(radian) * 345
                const y = Math.sin(radian) * 300
                const scale = 0.72 + (depth + 1) * 0.16

                return (
                  <button
                    className="zodiac-orb"
                    key={zodiac.id}
                    style={{
                      transform: `translate(${x}px, ${y}px) scale(${scale})`,
                      opacity: 0.3 + (depth + 1) * 0.35,
                      zIndex: Math.round((depth + 1) * 10),
                    }}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectZodiac(index)}
                  >
                    <span>{textSymbol(zodiac.symbol)}</span>
                    <svg className="mini-map" viewBox="0 0 100 100" aria-hidden="true">
                      {zodiac.connections.map((connection) => {
                        const from = zodiac.stars.find(
                          (star) => star.id === connection.from,
                        )
                        const to = zodiac.stars.find((star) => star.id === connection.to)

                        if (!from || !to) {
                          return null
                        }

                        return (
                          <line
                            key={connectionKey(zodiac, connection)}
                            x1={from.x}
                            x2={to.x}
                            y1={from.y}
                            y2={to.y}
                          />
                        )
                      })}
                      {zodiac.stars.map((star) => {
                        const state = getPieceState(zodiac.id, star.id)
                        const intensity = getStarIntensity(zodiac.id, star.id)
                        const tone = intensity > 0 ? starTone(star.id) : ''
                        const radius =
                          state === 'lit'
                            ? Math.max(2.2, 5.2 - star.magnitude * 0.48)
                            : Math.max(1.05, 2.4 - star.magnitude * 0.18)

                        return (
                          <circle
                            className={`${state} ${tone}`}
                            cx={star.x}
                            cy={star.y}
                            key={star.id}
                            r={radius}
                            style={{
                              '--star-opacity': `${Math.max(0.18, intensity / 100)}`,
                              '--star-glow': `${intensity}`,
                            } as CSSProperties}
                          />
                        )
                      })}
                    </svg>
                    <strong>{zodiac.latin.toUpperCase()}</strong>
                    <small>
                      {progress?.lit ?? 0}/{progress?.total ?? 0}
                    </small>
                  </button>
                )
              })}
            </div>
            <section className="constellation-panel" aria-labelledby="constellation-title">
              <span className="focused-symbol">{textSymbol(selectedZodiac.symbol)}</span>
              <div className="section-heading">
                <div>
                  <h1 id="constellation-title">{selectedZodiac.latin.toUpperCase()}</h1>
                  <p>
                    {zodiacMottos[selectedZodiac.id].archetype.toUpperCase()}
                  </p>
                  <small>{zodiacMottos[selectedZodiac.id].traits}</small>
                </div>
              </div>

              <svg className="constellation-map" viewBox="0 0 100 100" role="img">
                <defs>
                  <filter id="star-glow">
                    <feGaussianBlur stdDeviation="2.5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                {selectedZodiac.connections.map((connection) => {
                  const from = selectedZodiac.stars.find(
                    (star) => star.id === connection.from,
                  )
                  const to = selectedZodiac.stars.find((star) => star.id === connection.to)

                  if (!from || !to) {
                    return null
                  }

                  return (
                    <line
                      className="star-line"
                      key={connectionKey(selectedZodiac, connection)}
                      x1={from.x}
                      y1={from.y}
                      x2={to.x}
                      y2={to.y}
                    />
                  )
                })}
                {selectedZodiac.stars.map((star) => {
                  const state = getStarState(star.id)
                  const intensity = getStarIntensity(selectedZodiac.id, star.id)
                  const tone = intensity > 0 ? starTone(star.id) : ''
                  const radius =
                    state === 'lit'
                      ? Math.max(3.4, 7.4 - star.magnitude * 0.64)
                      : Math.max(1.4, 3.1 - star.magnitude * 0.24)

                  return (
                    <g
                      className={`star-node ${state} ${tone}`}
                      key={star.id}
                    >
                      <circle
                        className="star-hit-area"
                        cx={star.x}
                        cy={star.y}
                        r="10"
                        onClick={() => setSelectedStarId(star.id)}
                      />
                      <circle
                        className={selectedStar.id === star.id ? 'selected-star' : ''}
                        cx={star.x}
                        cy={star.y}
                        filter={state === 'lit' ? 'url(#star-glow)' : undefined}
                        r={radius}
                        style={{
                          '--star-opacity': `${Math.max(0.18, intensity / 100)}`,
                          '--star-glow': `${intensity}`,
                        } as CSSProperties}
                        onClick={() => setSelectedStarId(star.id)}
                      />
                      <text x={star.x + 4} y={star.y - 3}>
                        {star.label}
                      </text>
                    </g>
                  )
                })}
              </svg>
            </section>
          </div>

          <aside className="status-column" aria-label="Writing status">
            <section className="note-panel">
              <div>
                <small className="linked-note">▣ Linked Note</small>
                <span className={`status-pill ${getStarState(selectedStar.id)}`}>
                  {getStarState(selectedStar.id) === 'lit' ? 'Lit' : 'In Progress'}
                </span>
                <h2>{selectedPiece.title}</h2>
                <p>Novel Project</p>
              </div>
              <div className="metric">
                <strong>{formatNumber(selectedStats.effective)}</strong>
                <span>/ {formatNumber(selectedPiece.target)} WORDS</span>
              </div>
              <div className="meter">
                <i
                  style={{
                    width: `${Math.min(
                      100,
                      (selectedStats.effective / selectedPiece.target) * 100,
                    )}%`,
                  }}
                />
              </div>
              <button className="primary-action" type="button" onClick={() => navigateTo('editor')}>
                Start Writing
              </button>
              <button className="secondary-action" type="button" onClick={copyPiece}>
                {copyState === 'Copied' ? 'Copied to Clipboard' : 'Copy to Clipboard'}
              </button>
              <button className="secondary-action" type="button" onClick={savePieceAsMarkdown}>
                {saveState.startsWith('Saved') ? 'Saved Markdown' : saveState}
              </button>
            </section>
            <div className="quote-card">
              <textarea
                aria-label="Quote"
                value={appCopy.quote}
                onChange={(event) =>
                  setAppCopy((current) => ({
                    ...current,
                    quote: event.target.value,
                  }))
                }
              />
              <label>
                <span>-</span>
                <input
                  aria-label="Quote author"
                  value={appCopy.author}
                  onChange={(event) =>
                    setAppCopy((current) => ({
                      ...current,
                      author: event.target.value,
                    }))
                  }
                />
              </label>
            </div>
          </aside>
        </section>
      ) : viewMode === 'editor' ? (
        <section className="editor-layout" aria-label="Writing editor">
          <div className="editor-meta">
            <button type="button" onClick={() => navigateTo('galaxy')}>
              Back to Wheel
            </button>
            <div>
              <span>{selectedZodiac.latin} / {selectedStar.label}</span>
              <input
                aria-label="Title"
                value={selectedPiece.title}
                onChange={(event) => updateSelectedPiece({ title: event.target.value })}
              />
            </div>
          </div>

          {selectedPiece.dockLog ? (
            <aside className="dock-log-banner" aria-label="Last docking log">
              <span>Last orbit</span>
              <p>{selectedPiece.dockLog}</p>
            </aside>
          ) : null}

          <div className="editor-tools">
            <div className="segmented-control" aria-label="Paragraph indentation mode">
              {(['zh', 'en', 'none'] as ParagraphMode[]).map((mode) => (
                <button
                  className={selectedPiece.paragraphMode === mode ? 'active' : ''}
                  key={mode}
                  type="button"
                  onClick={() => updateSelectedPiece({ paragraphMode: mode })}
                >
                  {mode === 'zh' ? 'Chinese' : mode === 'en' ? 'English' : 'No Indent'}
                </button>
              ))}
            </div>
            <div className="editor-counts">
              <span>{formatNumber(selectedStats.characters)} chars</span>
              <span>{formatNumber(selectedStats.words)} words</span>
              <strong>
                {formatNumber(selectedStats.effective)}/{formatNumber(selectedPiece.target)}
              </strong>
            </div>
            <button className="copy-button" type="button" onClick={copyPiece}>
              {copyState}
            </button>
            <button className="copy-button" type="button" onClick={savePieceAsMarkdown}>
              {saveState.startsWith('Saved') ? 'Saved MD' : 'Save MD'}
            </button>
          </div>

          <div className="page-controls" aria-label="Editor pages">
            <button
              type="button"
              disabled={currentEditorPage === 0}
              onClick={() => setEditorPage((page) => Math.max(0, page - 1))}
            >
              Previous Page
            </button>
            <span>
              Page {currentEditorPage + 1} / {editorPages.length}
            </span>
            <button
              type="button"
              disabled={currentEditorPage >= editorPages.length - 1}
              onClick={() =>
                setEditorPage((page) => Math.min(editorPages.length - 1, page + 1))
              }
            >
              Next Page
            </button>
          </div>

          <textarea
            className={`writing-surface indent-${selectedPiece.paragraphMode}`}
            onKeyDown={handleWritingKeyDown}
            onChange={(event) => updateCurrentEditorPage(event.target.value)}
            onContextMenu={openAnchorMenu}
            ref={writingSurfaceRef}
            spellCheck="true"
            value={currentEditorText}
          />
          {selectedPiece.anchors.length > 0 ? (
            <div className="anchor-index" aria-label="Star anchors">
              <span>Star anchors</span>
              <div>
                {selectedPiece.anchors.map((anchor) => (
                  <button key={anchor.id} type="button" onClick={() => previewAnchor(anchor)}>
                    <strong>{anchor.tag}</strong>
                    <small>{selectedPiece.content.slice(anchor.start, anchor.end)}</small>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {anchorDraft ? (
            <div
              className="anchor-menu"
              style={{
                left: anchorDraft.x,
                top: anchorDraft.y,
              }}
            >
              <span>Set anchor</span>
              <input
                aria-label="Anchor tag"
                autoFocus
                value={anchorDraft.tag}
                onChange={(event) =>
                  setAnchorDraft((current) =>
                    current ? { ...current, tag: event.target.value } : current,
                  )
                }
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    createAnchor()
                  }
                }}
              />
              <div>
                <button type="button" onClick={createAnchor}>
                  Save
                </button>
                <button type="button" onClick={() => setAnchorDraft(null)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          {anchorPreview ? (
            <div className="anchor-preview" role="dialog" aria-label="Anchor preview">
              <button type="button" onClick={() => setAnchorPreview(null)}>
                Close
              </button>
              <span>{anchorPreview.tag}</span>
              <p>{anchorPreviewText}</p>
              <small>
                Index {anchorPreview.start} - {anchorPreview.end}
              </small>
            </div>
          ) : null}
        </section>
      ) : (
        <section className="utility-layout" aria-label={`${viewMode} view`}>
          {viewMode === 'notes' ? (
            <NotesView
              onTitleChange={(pieceId, title) => updatePiece(pieceId, { title })}
              pieces={pieces}
              selectedPieceId={selectedPiece.id}
              onOpen={(piece) => {
                const zodiacIndex = zodiacs.findIndex(
                  (zodiac) => zodiac.id === piece.zodiacId,
                )
                setSelectedIndex(zodiacIndex)
                setSelectedStarId(piece.starId)
                setViewMode('editor')
              }}
            />
          ) : null}
          {viewMode === 'statistics' ? (
            <StatisticsView pieces={pieces} totalProgress={totalProgress} />
          ) : null}
          {viewMode === 'calendar' ? <CalendarView pieces={pieces} /> : null}
          {viewMode === 'settings' ? (
            <SettingsView
              appCopy={appCopy}
              selectedPiece={selectedPiece}
              onCopyChange={setAppCopy}
              onSelectedPieceChange={updateSelectedPiece}
            />
          ) : null}
        </section>
      )}
      </section>
      {pendingViewMode ? (
        <div className="dock-log-modal" role="dialog" aria-modal="true">
          <form
            onSubmit={(event) => {
              event.preventDefault()
              submitDockLog()
            }}
          >
            <span>此刻星轨的尽头是？</span>
            <input
              aria-label="Docking log"
              autoFocus
              placeholder="over"
              value={dockLogDraft}
              onChange={(event) => setDockLogDraft(event.target.value)}
            />
            <button type="submit">Leave</button>
          </form>
        </div>
      ) : null}
    </main>
  )
}

function NotesView({
  onTitleChange,
  pieces,
  selectedPieceId,
  onOpen,
}: {
  onTitleChange: (pieceId: string, title: string) => void
  pieces: Record<string, WritingPiece>
  selectedPieceId: string
  onOpen: (piece: WritingPiece) => void
}) {
  const [query, setQuery] = useState('')
  const normalizedQuery = query.trim().toLowerCase()
  const noteList = Object.values(pieces)
    .filter((piece) => piece.title.toLowerCase().includes(normalizedQuery))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  return (
    <>
      <div className="utility-heading">
        <span>□ My Notes</span>
        <h1>Linked writing pieces</h1>
      </div>
      <div className="notes-search">
        <label>
          Search by title
          <input
            aria-label="Search notes by title"
            placeholder="Type a title..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <span>{noteList.length} notes</span>
      </div>
      <div className="notes-grid">
        {noteList.map((piece) => {
          const stats = countWriting(piece.content)
          const zodiac = zodiacs.find((item) => item.id === piece.zodiacId)
          const updatedAt = new Date(piece.updatedAt).toLocaleString('en-US', {
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })

          return (
            <article
              className={piece.id === selectedPieceId ? 'active' : ''}
              key={piece.id}
            >
              <small>{zodiac?.latin} · {piece.starId}</small>
              <input
                aria-label={`${piece.title} title`}
                value={piece.title}
                onChange={(event) => onTitleChange(piece.id, event.target.value)}
              />
              <span>{formatNumber(stats.effective)} / {formatNumber(piece.target)} words</span>
              <time dateTime={piece.updatedAt}>Modified {updatedAt}</time>
              <button type="button" onClick={() => onOpen(piece)}>
                Open
              </button>
            </article>
          )
        })}
      </div>
    </>
  )
}

function StatisticsView({
  pieces,
  totalProgress,
}: {
  pieces: Record<string, WritingPiece>
  totalProgress: { lit: number; total: number; percent: number }
}) {
  const allPieces = Object.values(pieces)
  const totalWords = allPieces.reduce(
    (sum, piece) => sum + countWriting(piece.content).effective,
    0,
  )
  const activeNotes = allPieces.filter((piece) => piece.content.trim()).length

  return (
    <>
      <div className="utility-heading">
        <span>▥ Statistics</span>
        <h1>Writing constellation health</h1>
      </div>
      <div className="stat-grid">
        <article>
          <span>Total Words</span>
          <strong>{formatNumber(totalWords)}</strong>
        </article>
        <article>
          <span>Lit Stars</span>
          <strong>{totalProgress.lit}/{totalProgress.total}</strong>
        </article>
        <article>
          <span>Completion</span>
          <strong>{totalProgress.percent}%</strong>
        </article>
        <article>
          <span>Active Notes</span>
          <strong>{activeNotes}</strong>
        </article>
      </div>
    </>
  )
}

function CalendarView({ pieces }: { pieces: Record<string, WritingPiece> }) {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const monthName = today.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const leadingBlanks = (firstDay.getDay() + 6) % 7
  const totalWords = Object.values(pieces).reduce(
    (sum, piece) => sum + countWriting(piece.content).effective,
    0,
  )
  const litZodiacIdsToday = Array.from(
    new Set(
      Object.values(pieces)
        .filter((piece) => countWriting(piece.content).effective >= piece.target)
        .map((piece) => piece.zodiacId),
    ),
  )
  const dailyWords = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1
    const wave = ((day * 37 + totalWords) % 210) + 40

    if (day > today.getDate()) {
      return 0
    }

    if (day === today.getDate()) {
      return totalWords
    }

    return day % 4 === 0 || day % 7 === 0 ? 0 : wave
  })
  const calendarCells = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...dailyWords.map((words, index) => ({
      day: index + 1,
      words,
      badges: index + 1 === today.getDate() ? litZodiacIdsToday : [],
    })),
  ]

  return (
    <>
      <div className="utility-heading">
        <span>☽ Calendar</span>
        <h1>{monthName} writing log</h1>
      </div>
      <div className="calendar-month">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <strong className="weekday" key={day}>
            {day}
          </strong>
        ))}
        {calendarCells.map((cell, index) =>
          cell ? (
            <article
              className={cell.words > 0 ? 'wrote' : ''}
              key={`${cell.day}-${index}`}
            >
              <span>{cell.day}</span>
              {cell.badges.length > 0 ? (
                <div className="calendar-badges" aria-label="Lit zodiac badges">
                  {cell.badges.map((zodiacId) => {
                    const zodiac = zodiacs.find((item) => item.id === zodiacId)

                    return zodiac ? (
                      <b key={zodiacId} title={`${zodiac.latin} lit`}>
                        {textSymbol(zodiac.symbol)}
                      </b>
                    ) : null
                  })}
                </div>
              ) : null}
              <strong>{formatNumber(cell.words)}</strong>
              <small>words</small>
            </article>
          ) : (
            <i aria-hidden="true" key={`blank-${index}`} />
          ),
        )}
      </div>
    </>
  )
}

function SettingsView({
  appCopy,
  selectedPiece,
  onCopyChange,
  onSelectedPieceChange,
}: {
  appCopy: AppCopy
  selectedPiece: WritingPiece
  onCopyChange: Dispatch<SetStateAction<AppCopy>>
  onSelectedPieceChange: (update: Partial<WritingPiece>) => void
}) {
  return (
    <>
      <div className="utility-heading">
        <span>⚙ Settings</span>
        <h1>Writing system controls</h1>
      </div>
      <div className="settings-panel">
        <label>
          Current note target
          <input
            min="100"
            step="100"
            type="number"
            value={selectedPiece.target}
            onChange={(event) =>
              onSelectedPieceChange({ target: Number(event.target.value) })
            }
          />
        </label>
        <label>
          Right quote
          <textarea
            value={appCopy.quote}
            onChange={(event) =>
              onCopyChange((current) => ({
                ...current,
                quote: event.target.value,
              }))
            }
          />
        </label>
        <label>
          Quote author
          <input
            value={appCopy.author}
            onChange={(event) =>
              onCopyChange((current) => ({
                ...current,
                author: event.target.value,
              }))
            }
          />
        </label>
      </div>
    </>
  )
}

export default App
