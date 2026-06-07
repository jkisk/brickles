export type ColorName = 'red' | 'orange' | 'yellow' | 'green' | 'teal' | 'blue' | 'purple' | 'pink';
export type BrickKind = 'normal' | 'strong' | 'heart' | 'sprite';

export interface ColorEntry {
  fill: string;
  shade: string;
  light: string;
}

export interface BrickDef {
  color: ColorName;
  hits: number;
  kind: BrickKind;
  drop?: boolean;
}

export interface Level {
  name: string;
  grid: string[];
}

export const RB: Record<ColorName, ColorEntry> = {
  red:    { fill: '#ff5d6c', shade: '#c2364a', light: '#ffb3bb' },
  orange: { fill: '#ff9f43', shade: '#cf6f1e', light: '#ffd39e' },
  yellow: { fill: '#ffd93b', shade: '#d4a700', light: '#fff0a3' },
  green:  { fill: '#5fd97a', shade: '#2f9e4c', light: '#bdf3c8' },
  teal:   { fill: '#3fd0d6', shade: '#1c9aa0', light: '#a9eef0' },
  blue:   { fill: '#4db5ff', shade: '#1d7fcc', light: '#b3dcff' },
  purple: { fill: '#a87cff', shade: '#7148cc', light: '#dcc9ff' },
  pink:   { fill: '#ff7fc4', shade: '#cc4d93', light: '#ffc4e4' },
};

export const RB_ORDER: ColorName[] = ['red', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple', 'pink'];

export const INK = '#34215a';

export function brickFromChar(ch: string, row: number): BrickDef | null {
  const fixed: Record<string, ColorName> = {
    r: 'red', o: 'orange', y: 'yellow', g: 'green',
    t: 'teal', b: 'blue', u: 'purple', p: 'pink',
  };
  if (ch === '.' || ch === ' ') return null;
  if (ch === '#') return { color: RB_ORDER[row % RB_ORDER.length], hits: 1, kind: 'normal' };
  if (ch === '2') return { color: RB_ORDER[row % RB_ORDER.length], hits: 2, kind: 'strong' };
  if (ch === 'H') return { color: 'pink',  hits: 1, kind: 'heart',  drop: true };
  if (ch === 'S') return { color: RB_ORDER[row % RB_ORDER.length], hits: 1, kind: 'sprite', drop: true };
  if (fixed[ch]) return { color: fixed[ch], hits: 1, kind: 'normal' };
  return { color: RB_ORDER[row % RB_ORDER.length], hits: 1, kind: 'normal' };
}

export const LEVELS: Level[] = [
  // ── original 6 ──────────────────────────────────────────────────────
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
  // ── new levels ──────────────────────────────────────────────────────
  {
    name: 'Candy Stripe',
    // solid rainbow rows — a colourful breather before the harder stretch
    grid: [
      'rrrrrrrrrrrr',
      'oooooooooooo',
      'yyyyyyyyyyyy',
      'gggggggggggg',
      'bbbbbbbbbbbb',
      'uuuuuuuuuuuu',
      'pppppppppppp',
    ],
  },
  {
    name: 'Diamond Drop',
    // diamond shape; strong bricks on the facets, hearts/sprites in the core
    grid: [
      '.....SS.....',
      '....2HH2....',
      '...22##22...',
      '..22####22..',
      '...22##22...',
      '....2HH2....',
      '.....SS.....',
    ],
  },
  {
    name: 'Checkerboard',
    // sparse alternating grid — tricky angles, no safe lanes
    grid: [
      'r.o.y.g.t.b.',
      '.u.p.r.o.y.g',
      'r.o.y.g.t.b.',
      '.u.p.r.o.y.g',
      'r.o.y.g.t.b.',
      '.u.p.r.o.y.g',
    ],
  },
  {
    name: 'Final Flash',
    // dense fortress of 2-hit bricks; clear it to restore colour forever
    grid: [
      '222222222222',
      '2S22222222S2',
      '2222HHHH2222',
      '2S22222222S2',
      '222222222222',
      '2H22222222H2',
      '2222SSSS2222',
      '222222222222',
    ],
  },
];
