/**
 * Renders one SVG poster per catalogue entry into `public/posters/`.
 *
 * The bundled catalogue is invented, so there is no artwork to license or fetch.
 * Generating typographic posters from the catalogue itself keeps the repo free of
 * binary assets and network calls while still giving the grid something to show.
 *
 *   node scripts/generate-posters.mjs
 */
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const outDir = resolve(root, 'public/posters')

const WIDTH = 600
const HEIGHT = 900
const MAX_TITLE_CHARS_PER_LINE = 13
const SIDE_MARGIN = 56
/** Rough advance width of Helvetica Bold as a fraction of the font size. */
const BOLD_CHAR_WIDTH_RATIO = 0.6

/** Gradient stops keyed by the movie's first genre. */
const PALETTE = {
  'Sci-Fi': ['#101a3a', '#2f5fb8'],
  Thriller: ['#1b1b24', '#5a3a6e'],
  Drama: ['#23201c', '#8a5a3c'],
  Comedy: ['#2a2410', '#c08a1e'],
  Documentary: ['#12231f', '#2f7f6a'],
  Animation: ['#221436', '#7a3fa8'],
  Horror: ['#1a0f11', '#7a2130'],
  Romance: ['#2b1220', '#a8436a'],
  Action: ['#241208', '#b8532a'],
}
const DEFAULT_STOPS = ['#1c1c22', '#4a4a58']

function escapeXml(value) {
  return String(value).replace(
    /[<>&'"]/g,
    (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c],
  )
}

/** Greedy word wrap so long titles stay inside the poster. */
function wrapTitle(title) {
  const lines = []
  let line = ''
  for (const word of title.split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word
    if (candidate.length > MAX_TITLE_CHARS_PER_LINE && line) {
      lines.push(line)
      line = word
    } else {
      line = candidate
    }
  }
  if (line) lines.push(line)
  return lines
}

function poster(movie) {
  const [from, to] = PALETTE[movie.genres[0]] ?? DEFAULT_STOPS
  const lines = wrapTitle(movie.title)
  const longest = Math.max(...lines.map((line) => line.length))
  const fontSize = Math.min(
    lines.length > 3 ? 62 : 74,
    Math.floor((WIDTH - SIDE_MARGIN * 2) / (longest * BOLD_CHAR_WIDTH_RATIO)),
  )
  const blockHeight = lines.length * fontSize * 1.15
  const firstBaseline = HEIGHT * 0.62 - blockHeight + fontSize
  const tspans = lines
    .map(
      (line, i) =>
        `<tspan x="${SIDE_MARGIN}" y="${Math.round(firstBaseline + i * fontSize * 1.15)}">${escapeXml(line)}</tspan>`,
    )
    .join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}" role="img" aria-label="${escapeXml(movie.title)}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0" stop-color="${to}"/>
      <stop offset="1" stop-color="${from}"/>
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${from}"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#g)"/>
  <circle cx="${WIDTH - 130}" cy="180" r="96" fill="#ffffff" opacity="0.10"/>
  <circle cx="${WIDTH - 130}" cy="180" r="150" fill="none" stroke="#ffffff" stroke-opacity="0.14" stroke-width="2"/>
  <rect x="0" y="${HEIGHT - 200}" width="${WIDTH}" height="200" fill="#000000" opacity="0.22"/>
  <g font-family="Helvetica Neue, Helvetica, Arial, sans-serif" fill="#ffffff">
    <text x="56" y="96" font-size="26" letter-spacing="6" opacity="0.72">${escapeXml(
      movie.genres[0].toUpperCase(),
    )}</text>
    <text font-size="${fontSize}" font-weight="700">${tspans}</text>
    <text x="56" y="${HEIGHT - 116}" font-size="40" opacity="0.88">${movie.year}</text>
    <text x="56" y="${HEIGHT - 64}" font-size="26" opacity="0.66" letter-spacing="3">${escapeXml(
      movie.genres.join(' · ').toUpperCase(),
    )}</text>
  </g>
</svg>
`
}

const catalog = JSON.parse(readFileSync(resolve(root, 'src/data/catalog.json'), 'utf8'))
mkdirSync(outDir, { recursive: true })

let written = 0
for (const movie of catalog.movies) {
  if (movie.posterPath === null) continue
  writeFileSync(resolve(outDir, `${movie.id}.svg`), poster(movie), 'utf8')
  written += 1
}
console.log(`wrote ${written} posters to public/posters/`)
