/* ============================================================
   Brickles — palette + level layouts
   ============================================================ */

// Saturated, bold-cartoon rainbow. Each entry: base fill + a darker
// shade for the thick outline + a light tint for the glossy highlight.
const RB = {
  red:    { fill: '#ff5d6c', shade: '#c2364a', light: '#ffb3bb' },
  orange: { fill: '#ff9f43', shade: '#cf6f1e', light: '#ffd39e' },
  yellow: { fill: '#ffd93b', shade: '#d4a700', light: '#fff0a3' },
  green:  { fill: '#5fd97a', shade: '#2f9e4c', light: '#bdf3c8' },
  teal:   { fill: '#3fd0d6', shade: '#1c9aa0', light: '#a9eef0' },
  blue:   { fill: '#4db5ff', shade: '#1d7fcc', light: '#b3dcff' },
  purple: { fill: '#a87cff', shade: '#7148cc', light: '#dcc9ff' },
  pink:   { fill: '#ff7fc4', shade: '#cc4d93', light: '#ffc4e4' },
};

// Ordered rainbow used for "#" auto-color-by-row bricks
const RB_ORDER = ['red', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple', 'pink'];

// Deep plum ink used for every thick outline + faces
const INK = '#34215a';

// Map single chars -> { color, hits, kind }
//   '.'  empty
//   '#'  auto rainbow-by-row, 1 hit, normal
//   r o y g t b u p  -> fixed color, 1 hit, normal   (u = purple, p = pink)
//   '2'  strong brick (2 hits) — silver/rainbow, auto color
//   'H'  heart brick — always drops a power-up
//   'S'  sprite brick — twinkly character, drops a power-up
function brickFromChar(ch, row) {
  const fixed = { r:'red', o:'orange', y:'yellow', g:'green', t:'teal', b:'blue', u:'purple', p:'pink' };
  if (ch === '.' || ch === ' ') return null;
  if (ch === '#') return { color: RB_ORDER[row % RB_ORDER.length], hits: 1, kind: 'normal' };
  if (ch === '2') return { color: RB_ORDER[row % RB_ORDER.length], hits: 2, kind: 'strong' };
  if (ch === 'H') return { color: 'pink',  hits: 1, kind: 'heart',  drop: true };
  if (ch === 'S') return { color: RB_ORDER[row % RB_ORDER.length], hits: 1, kind: 'sprite', drop: true };
  if (fixed[ch]) return { color: fixed[ch], hits: 1, kind: 'normal' };
  return { color: RB_ORDER[row % RB_ORDER.length], hits: 1, kind: 'normal' };
}

// Each level: a name and a grid (array of equal-ish length strings).
// 12 columns is the comfortable width.
const LEVELS = [
  {
    name: 'Rainbow Land',
    grid: [
      '############',
      '############',
      '####HSSH####',
      '############',
      '....####....',
    ],
  },
  {
    name: 'Sprite Meadow',
    grid: [
      '..S......S..',
      '.##########.',
      '.#rrggbbrr#.',
      '.#rrggbbrr#.',
      '.##########.',
      '..H......H..',
    ],
  },
  {
    name: 'Twin Hearts',
    grid: [
      '.HH....HH...',
      'HHHH..HHHH..',
      'HHHHHHHHHHHH',
      '.HHHHHHHHHH.',
      '..HHHHHHHH..',
      '...HHHHHH...',
      '....HHHH....',
      '.....SS.....',
    ],
  },
  {
    name: 'Color Castle',
    grid: [
      '2..2..2..2.2',
      '############',
      '2##S####S##2',
      '############',
      '2##H####H##2',
      '############',
      '2.2..22..2.2',
    ],
  },
  {
    name: 'Sky Sprinkle',
    grid: [
      'S.#.#.#.#.#S',
      '.#.#.#.#.#.#',
      '#.H.#.#.H.#.',
      '.#.#.#.#.#.#',
      '#.#.S..S.#.#',
      '.#.#.#.#.#.#',
      '2..2..2..2.2',
    ],
  },
  {
    name: 'Star Burst',
    grid: [
      '.....HH.....',
      '....#SS#....',
      '...##rr##...',
      '..##2gg2##..',
      '.##bb22bb##.',
      '##uu2222uu##',
      '.SS......SS.',
    ],
  },
];

window.RB = RB;
window.RB_ORDER = RB_ORDER;
window.INK = INK;
window.brickFromChar = brickFromChar;
window.LEVELS = LEVELS;
