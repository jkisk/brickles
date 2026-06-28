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
  world: number; // 1-based world id
}

export interface World {
  id: number;
  name: string;
  mood: string;                  // label only
  sky: [string, string, string]; // gradient stops, top → bottom
  night: boolean;                // moon instead of sun
  cloudFill: string;
  accent: string;                // world badge colour on the level-select screen
  twinkles: number;              // decor density
}

export const WORLDS: World[] = [
  { id: 1, name: 'Meadow & Sky', mood: 'daytime',
    sky: ['#9ed8ff', '#c5ecff', '#eafff4'], night: false,
    cloudFill: 'rgba(255,255,255,0.9)', accent: '#4db5ff', twinkles: 18 },
  { id: 2, name: 'Starlight & Sugar', mood: 'candy-night',
    sky: ['#4a3b8f', '#8a5fc0', '#d98fd0'], night: true,
    cloudFill: 'rgba(199,182,238,0.85)', accent: '#a87cff', twinkles: 40 },
  { id: 3, name: 'Chromatica', mood: 'greyscale-to-rainbow',
    sky: ['#6A1B9A', '#E91E63', '#FFD600'], night: false,
    cloudFill: 'rgba(255,200,150,0.88)', accent: '#E91E63', twinkles: 28 },
];

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
export const INK_DK = '#1d1336'; // darker shadow ink

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
    world: 1,
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
    world: 1,
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
    world: 1,
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
    world: 1,
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
    world: 1,
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
    world: 2,
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
    world: 2,
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
    world: 2,
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
    world: 2,
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
    world: 2,
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
  // ── World 3: Chromatica — starts in greyscale, restores to full colour ──
  {
    name: 'Fog of Gray',
    world: 3,
    grid: [
      '..#.#...#.#.',
      '....##.##...',
      '...######...',
      '....##.##...',
      '..#.#...#.#.',
    ],
  },
  {
    name: 'Shadow Steps',
    world: 3,
    grid: [
      '##########..',
      '..########..',
      '....######..',
      '......####..',
      '........####',
      '..........##',
    ],
  },
  {
    name: 'The Veil',
    world: 3,
    grid: [
      'rr..oo..yy..',
      '..gg..tt..bb',
      'uu..pp..rr..',
      '..oo..yy..gg',
      'tt..bb..uu..',
      '..pp..rr..oo',
    ],
  },
  {
    name: 'Chromastorm',
    world: 3,
    grid: [
      '222222222222',
      '2.r.y.g.b.u2',
      '2H.2.2.2.2H2',
      '2.S.S.S.S.S2',
      '2H.2.2.2.2H2',
      '2.r.y.g.b.u2',
      '222222222222',
    ],
  },
  {
    name: 'Rainbow Reborn',
    world: 3,
    grid: [
      'rrrrrrrrrrrr',
      'SoooooooooSo',
      'yyyyyyyyyyyy',
      'gggggggggggg',
      'tttHtttHtttt',
      'bbbbbbbbbbbb',
      'uuuuuuuuuuuu',
      'pSpSpSpSpSpS',
    ],
  },
];
