const AVENUES = [70, 280, 900, 1120, 1370];
const STREETS = [60, 240, 490, 780];
const WORLD_W = 1440;
const WORLD_H = 840;
const ROAD = 52;
const LANE = 12;
const STOP = 36;
const DAY_SECONDS = 64;

type LightDir = 'ew' | 'ns';
type Phase = 'red' | 'yellow' | 'green';
type BuildingKind = 'house' | 'mid' | 'tower';
type BuildingRole = 'police' | 'fire' | 'hospital' | 'mall';
type VehicleKind = 'car' | 'bus' | 'van';

type Stop = { light: LightDir; ix: number; iy: number };
type Waypoint = { x: number; y: number; stop?: Stop; cross?: Stop; hold?: number };

type Building = {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: BuildingKind;
  number: number;
  roof: string;
  windows: Array<[number, number, number]>;
  role?: BuildingRole;
};

type Pond = { x: number; y: number; rx: number; ry: number };
type Statue = { x: number; y: number };
type Lamp = { x: number; y: number };
type Bench = { x: number; y: number; rot: number };
type Bin = { x: number; y: number };
type Yard = { x: number; y: number; w: number; h: number; gate: 'north' | 'south' };
type Tent = { x: number; y: number; w: number; h: number; color: string };
type RigMark = 'police' | 'fire' | 'ambulance';
type Rig = {
  x: number;
  y: number;
  heading: number;
  length: number;
  width: number;
  color: string;
  mark: RigMark;
};
type Site = {
  kind: 'police' | 'fire' | 'hospital' | 'mall' | 'play';
  pad?: Bounds;
  grass?: Bounds;
  rigs: Rig[];
  path: Waypoint[];
  people: number;
  coats: string[];
  scale: number;
  carpet?: Bounds;
  statues?: Array<{ x: number; y: number }>;
  guard?: { x: number; y: number };
};
type Carnival = {
  x: number;
  y: number;
  w: number;
  h: number;
  tents: Tent[];
  booth: { x: number; y: number; w: number; h: number };
  wheel: { x: number; y: number };
  carousel: { x: number; y: number };
  balloons: Array<{ x: number; y: number; colors: string[] }>;
  stalls: Array<{ x: number; y: number; w: number; h: number; color: string; trim: string }>;
  lamps: Lamp[];
  bins: Bin[];
  path: Waypoint[];
  inner: Waypoint[];
};
type RowDress = { yards: Yard[]; lamps: Lamp[]; bins: Bin[] };
type Spot = { x: number; y: number; aisleX: number; aisleY: number };
type Park = {
  x: number;
  y: number;
  w: number;
  h: number;
  trees: Array<[number, number, number]>;
  pond: Pond;
  statue: Statue;
  lamps: Lamp[];
  benches: Bench[];
  bins: Bin[];
  path: Waypoint[];
};
type YardTree = { x: number; y: number; r: number };
type Square = { x: number; y: number; w: number; h: number };
type Parked = { x: number; y: number; length: number; width: number; color: string; heading: number };
type Walker = {
  route: Waypoint[];
  seg: number;
  dist: number;
  speed: number;
  x: number;
  y: number;
  heading: number;
  coat: string;
  hair: string;
  waiting: boolean;
  scale: number;
};

type Vehicle = {
  route: Waypoint[];
  seg: number;
  dist: number;
  speed: number;
  max: number;
  kind: VehicleKind;
  color: string;
  length: number;
  width: number;
  x: number;
  y: number;
  heading: number;
  wait: number;
  once?: boolean;
  crown?: boolean;
  done?: boolean;
};

const HOUSE_ROOFS = ['#c45c48', '#d08a4a', '#a35448', '#c47a6a', '#8f6a4a', '#b85a3c'];
const MID_ROOFS = ['#6a7580', '#7d6a58', '#5e6a78', '#74685c'];
const TOWER_ROOFS = ['#3d4c5e', '#2e3c4c', '#4a5568', '#364556'];
const CAR_COLORS = ['#e15a38', '#3cbfb0', '#f2b427', '#f4f1ea', '#4a7fd0', '#d45d8c', '#2f9a55', '#8d5a2b'];

const BLOCK_STYLE = [
  ['scatter', 'park', 'court', 'clock'],
  ['campus', 'houses', 'square', 'parking'],
  ['park', 'terrace', 'court', 'scatter'],
] as const;

const OPEN_SQUARES = new Set(['1,1', '2,1']);

function isOpenSquare(ix: number, iy: number) {
  return OPEN_SQUARES.has(`${ix},${iy}`);
}

function hash(n: number) {
  let x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}

function lerp(from: number, to: number, t: number) {
  return from + (to - from) * t;
}

function smooth(t: number) {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function blockBounds(ix: number, iy: number) {
  return {
    x: AVENUES[ix] + ROAD / 2,
    y: STREETS[iy] + ROAD / 2,
    w: AVENUES[ix + 1] - AVENUES[ix] - ROAD,
    h: STREETS[iy + 1] - STREETS[iy] - ROAD,
  };
}

function windowGrid(x: number, y: number, w: number, h: number, seed: number, inset: number) {
  const windows: Array<[number, number, number]> = [];
  const cols = Math.max(2, Math.floor((w - inset * 2) / 11));
  const rows = Math.max(2, Math.floor((h - inset * 2) / 11));
  const cellW = (w - inset * 2) / cols;
  const cellH = (h - inset * 2) / rows;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const lit = hash(seed + row * 17 + col * 13) > 0.28 ? 0.55 + hash(seed + col + 40) * 0.45 : 0.12;
      windows.push([
        x + inset + col * cellW + cellW * 0.22,
        y + inset + row * cellH + cellH * 0.22,
        lit,
      ]);
    }
  }
  return windows;
}

type Counter = { value: number };
type Bounds = { x: number; y: number; w: number; h: number };

function addBuilding(
  buildings: Building[],
  number: Counter,
  x: number,
  y: number,
  w: number,
  h: number,
  kind: BuildingKind,
  seed: number,
) {
  if (w < 18 || h < 16) return;
  const palette = kind === 'tower' ? TOWER_ROOFS : kind === 'mid' ? MID_ROOFS : HOUSE_ROOFS;
  buildings.push({
    x,
    y,
    w,
    h,
    kind,
    number: number.value,
    roof: palette[Math.floor(hash(seed + 9) * palette.length)],
    windows: windowGrid(x, y, w, h, seed, kind === 'house' ? 5 : 4),
  });
  number.value += 2;
}

function overlaps(lots: Bounds[], next: Bounds, gap = 5) {
  return lots.some((lot) => !(
    next.x + next.w + gap < lot.x
    || lot.x + lot.w + gap < next.x
    || next.y + next.h + gap < lot.y
    || lot.y + lot.h + gap < next.y
  ));
}

function addHouseRow(
  buildings: Building[],
  number: Counter,
  bounds: Bounds,
  y: number,
  h: number,
  seed: number,
) {
  let x = bounds.x + 8;
  let index = 0;
  while (x < bounds.x + bounds.w - 32) {
    const w = 28 + hash(seed + index * 5) * 18;
    const gap = 5 + hash(seed + index + 3) * 7;
    if (x + w > bounds.x + bounds.w - 6) break;
    addBuilding(buildings, number, x, y + hash(seed + index) * 3, w, h, 'house', seed + index);
    x += w + gap;
    index += 1;
  }
}

function addTerrace(buildings: Building[], number: Counter, bounds: Bounds, seed: number) {
  const h = Math.min(42, bounds.h * 0.36);
  addHouseRow(buildings, number, bounds, bounds.y + 8, h, seed);
  if (bounds.h > 110) addHouseRow(buildings, number, bounds, bounds.y + bounds.h - h - 8, h, seed + 80);
}

function addHouses(buildings: Building[], number: Counter, bounds: Bounds, seed: number) {
  const h = Math.min(48, bounds.h * 0.3);
  addHouseRow(buildings, number, bounds, bounds.y + 12, h, seed);
  addHouseRow(buildings, number, bounds, bounds.y + bounds.h - h - 12, h, seed + 90);
}

function addScatter(buildings: Building[], trees: YardTree[], number: Counter, bounds: Bounds, seed: number) {
  const lots: Bounds[] = [];
  const count = bounds.h < 100 ? 3 : 5;
  for (let index = 0; index < count; index += 1) {
    const w = 28 + hash(seed + index * 7) * (bounds.w < 120 ? 14 : 24);
    const h = 24 + hash(seed + index * 3) * (bounds.h < 100 ? 12 : 20);
    let placed = false;
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const next = {
        x: bounds.x + 6 + hash(seed + index * 11 + attempt) * Math.max(8, bounds.w - w - 12),
        y: bounds.y + 6 + hash(seed + index * 13 + attempt + 4) * Math.max(8, bounds.h - h - 12),
        w,
        h,
      };
      if (!overlaps(lots, next)) {
        lots.push(next);
        addBuilding(buildings, number, next.x, next.y, next.w, next.h, 'house', seed + index + attempt);
        placed = true;
        break;
      }
    }
    if (!placed && index === 0) {
      addBuilding(buildings, number, bounds.x + 8, bounds.y + 8, Math.min(w, bounds.w - 16), Math.min(h, bounds.h - 16), 'house', seed);
    }
  }
  trees.push({
    x: bounds.x + bounds.w * (0.28 + hash(seed + 50) * 0.44),
    y: bounds.y + bounds.h * (0.28 + hash(seed + 51) * 0.44),
    r: 4 + hash(seed + 52) * 2,
  });
}

function addCourt(buildings: Building[], trees: YardTree[], number: Counter, bounds: Bounds, seed: number) {
  const pieces = [
    { x: 0.06, y: 0.08, w: 0.34 + hash(seed) * 0.1, h: 0.3 + hash(seed + 1) * 0.08 },
    { x: 0.56, y: 0.06, w: 0.34, h: 0.38 + hash(seed + 2) * 0.1 },
    { x: 0.07, y: 0.58, w: 0.38 + hash(seed + 3) * 0.1, h: 0.3 },
    { x: 0.55, y: 0.6, w: 0.36, h: 0.28 },
  ];
  pieces.forEach((piece, index) => {
    if (bounds.h < 110 && index > 1) return;
    addBuilding(
      buildings,
      number,
      bounds.x + bounds.w * piece.x,
      bounds.y + bounds.h * piece.y,
      bounds.w * piece.w,
      bounds.h * piece.h,
      index === 1 && bounds.h > 120 ? 'mid' : 'house',
      seed + index * 4,
    );
  });
  trees.push({ x: bounds.x + bounds.w * 0.48, y: bounds.y + bounds.h * 0.46, r: 5 });
}

function closeLane(points: Array<{ x: number; y: number }>): Waypoint[] {
  const back = [...points].reverse().map((point) => ({ x: point.x, y: point.y + 8 }));
  return [...points, ...back];
}

function addLane(
  buildings: Building[],
  trees: YardTree[],
  lanes: Waypoint[][],
  number: Counter,
  bounds: Bounds,
  seed: number,
) {
  const bend = bounds.y + bounds.h * (0.44 + hash(seed) * 0.06);
  const points = [
    { x: bounds.x + 12, y: bend - 6 },
    { x: bounds.x + bounds.w * 0.48, y: bend + bounds.h * 0.08 },
    { x: bounds.x + bounds.w - 12, y: bend - 2 },
  ];
  lanes.push(closeLane(points));
  let x = bounds.x + 8;
  let index = 0;
  const topH = Math.max(18, bend - bounds.y - 20);
  while (x < bounds.x + bounds.w - 30) {
    const w = 26 + hash(seed + index) * 12;
    if (x + w > bounds.x + bounds.w - 6) break;
    addBuilding(buildings, number, x, bounds.y + 6, w, topH, 'house', seed + index);
    x += w + 6 + hash(seed + index + 2) * 7;
    index += 1;
  }
  const lowY = bend + bounds.h * 0.14 + 8;
  const lowH = Math.max(18, bounds.y + bounds.h - lowY - 6);
  addBuilding(buildings, number, bounds.x + 8, lowY, bounds.w * 0.32, lowH, 'house', seed + 20);
  addBuilding(buildings, number, bounds.x + bounds.w * 0.55, lowY + 2, bounds.w * 0.32, lowH - 2, 'house', seed + 24);
  trees.push({ x: bounds.x + bounds.w * 0.4, y: bend + 2, r: 3.4 });
}

function makeParking(bounds: Bounds) {
  const parked: Parked[] = [];
  const spots: Spot[] = [];
  const bayH = bounds.h * 0.3;
  const aisleY = bounds.y + bounds.h * 0.5;
  const mouthX = bounds.x + 28;
  const mouthY = aisleY;
  const active = new Set([2, 7, 11]);
  let slot = 0;
  let x = bounds.x + 14;
  while (x + 16 < bounds.x + bounds.w - 10) {
    const bays = [
      { y: bounds.y + 8 + bayH * 0.42, aisleY: aisleY - 5 },
      { y: bounds.y + bounds.h - 8 - bayH * 0.42, aisleY: aisleY + 5 },
    ];
    bays.forEach((bay) => {
      const color = CAR_COLORS[Math.floor(hash(slot + 11) * CAR_COLORS.length)];
      const centerX = x + 9;
      if (active.has(slot)) {
        spots.push({ x: centerX, y: bay.y, aisleX: centerX, aisleY: bay.aisleY });
      } else if (hash(slot + 3) > 0.2) {
        parked.push({
          x: centerX,
          y: bay.y,
          length: 20,
          width: 10,
          heading: bay.y < aisleY ? Math.PI / 2 : -Math.PI / 2,
          color,
        });
      }
      slot += 1;
    });
    x += 22;
  }
  return { parked, spots, mouthX, mouthY };
}

function dressRow(bounds: Bounds, buildings: Building[]): RowDress {
  const midY = bounds.y + bounds.h * 0.5;
  const yards: Yard[] = [];
  buildings.forEach((house) => {
    const cx = house.x + house.w / 2;
    const cy = house.y + house.h / 2;
    if (cx < bounds.x || cx > bounds.x + bounds.w || cy < bounds.y || cy > bounds.y + bounds.h) return;
    const yardH = 11;
    if (house.y + house.h < midY) {
      const y = house.y + house.h + 2;
      if (y + yardH < midY - 9) yards.push({ x: house.x + 1, y, w: Math.max(12, house.w - 2), h: yardH, gate: 'south' });
    } else if (house.y > midY) {
      const y = house.y - yardH - 2;
      if (y > midY + 9) yards.push({ x: house.x + 1, y, w: Math.max(12, house.w - 2), h: yardH, gate: 'north' });
    }
  });
  const lamps: Lamp[] = [];
  const bins: Bin[] = [];
  let index = 0;
  for (let x = bounds.x + 46; x < bounds.x + bounds.w - 28; x += 64) {
    lamps.push({ x, y: midY - 18 });
    if (index % 2 === 0) bins.push({ x: x + 12, y: midY + 17 });
    index += 1;
  }
  return { yards, lamps, bins };
}

function tag(buildings: Building[], role: BuildingRole, roof: string) {
  const building = buildings[buildings.length - 1];
  building.role = role;
  building.roof = roof;
}

function addPolice(buildings: Building[], number: Counter, bounds: Bounds): Site {
  const x = bounds.x + 8;
  const y = bounds.y + 8;
  const w = 90;
  const h = 88;
  addBuilding(buildings, number, x, y, w, h, 'mid', 11);
  tag(buildings, 'police', '#1e3a6e');
  number.value += 4;
  const pad = { x: x + w + 8, y: bounds.y + 24, w: 28, h: 58 };
  return {
    kind: 'police',
    pad,
    rigs: [
      { x: pad.x + pad.w * 0.5, y: pad.y + 16, heading: Math.PI / 2, length: 20, width: 10, color: '#f7f4ee', mark: 'police' },
      { x: pad.x + pad.w * 0.5, y: pad.y + pad.h - 16, heading: Math.PI / 2, length: 20, width: 10, color: '#d5deee', mark: 'police' },
    ],
    path: [
      { x: bounds.x + 20, y: bounds.y + bounds.h - 14 },
      { x: x + w * 0.7, y: bounds.y + bounds.h - 12 },
      { x: bounds.x + bounds.w - 12, y: bounds.y + bounds.h - 16 },
      { x: bounds.x + bounds.w - 12, y: pad.y + 6 },
      { x: pad.x + pad.w + 6, y: pad.y + pad.h * 0.5 },
    ],
    people: 3,
    coats: ['#1e3a6e', '#f4f1ea', '#243e73'],
    scale: 1,
  };
}

function addPlayCourt(buildings: Building[], number: Counter, bounds: Bounds): Site {
  const w = 50;
  const h = 40;
  const left = bounds.x + 6;
  const top = bounds.y + 6;
  const right = bounds.x + bounds.w - w - 16;
  const bottom = bounds.y + bounds.h - h - 8;
  [[left, top], [right, top], [left, bottom], [right, bottom]].forEach((spot, index) => {
    addBuilding(buildings, number, spot[0], spot[1], w, h, 'house', 40 + index);
  });
  const grass = {
    x: left + w + 7,
    y: top + h + 5,
    w: right - (left + w) - 14,
    h: bottom - (top + h) - 10,
  };
  return {
    kind: 'play',
    grass,
    rigs: [],
    path: loopAround(grass.x + grass.w / 2, grass.y + grass.h / 2, Math.max(4, grass.w * 0.16), Math.max(3, grass.h * 0.14)),
    people: 3,
    coats: ['#e2b423', '#d45d8c', '#3cbfb0'],
    scale: 0.68,
  };
}

function addMall(buildings: Building[], number: Counter, bounds: Bounds): Site {
  const x = bounds.x + 10;
  const y = bounds.y + 10;
  const w = bounds.w - 20;
  const h = bounds.h * 0.68;
  addBuilding(buildings, number, x, y, w, h, 'mid', 21);
  tag(buildings, 'mall', '#d9d0c2');
  number.value += 4;
  const doorX = x + w / 2;
  const doorY = y + h;
  return {
    kind: 'mall',
    rigs: [],
    carpet: { x: doorX - 8, y: doorY, w: 16, h: 16 },
    statues: [
      { x: doorX - 34, y: doorY + 8 },
      { x: doorX + 34, y: doorY + 8 },
    ],
    guard: { x: doorX, y: doorY + 8 },
    path: [
      { x: x + 16, y: doorY + 18 },
      { x: doorX - 48, y: doorY + 20 },
      { x: doorX + 48, y: doorY + 20 },
      { x: x + w - 16, y: doorY + 18 },
    ],
    people: 3,
    coats: ['#d45d8c', '#2c6fbe', '#f2b427'],
    scale: 1,
  };
}

function addFire(buildings: Building[], number: Counter, bounds: Bounds): Site {
  const x = bounds.x + 12;
  const y = bounds.y + 10;
  const w = bounds.w * 0.68;
  const h = bounds.h * 0.36;
  addBuilding(buildings, number, x, y, w, h, 'mid', 31);
  tag(buildings, 'fire', '#c23b2e');
  number.value += 10;
  const pad = { x, y: y + h + 8, w, h: 54 };
  return {
    kind: 'fire',
    pad,
    rigs: [0, 1].map((index) => ({
      x: pad.x + 28 + index * 38,
      y: pad.y + pad.h * 0.55,
      heading: Math.PI / 2,
      length: 32,
      width: 12,
      color: '#d3261e',
      mark: 'fire' as const,
    })),
    path: [
      { x: pad.x + 16, y: pad.y + pad.h + 14 },
      { x: pad.x + pad.w - 12, y: pad.y + pad.h + 16 },
      { x: pad.x + pad.w + 12, y: pad.y + 18 },
      { x: pad.x + pad.w + 12, y: pad.y + pad.h - 8 },
    ],
    people: 4,
    coats: ['#f2b427', '#1a1816', '#c23b2e', '#f6f1e6'],
    scale: 1,
  };
}

function addHospital(buildings: Building[], number: Counter, bounds: Bounds): Site {
  const x = bounds.x + 12;
  const y = bounds.y + 16;
  const w = bounds.w * 0.56;
  const h = bounds.h * 0.52;
  addBuilding(buildings, number, x, y, w, h, 'mid', 51);
  tag(buildings, 'hospital', '#e7eef4');
  number.value += 8;
  const pad = { x: bounds.x + bounds.w - 62, y: y + 12, w: 46, h: 118 };
  const grass = {
    x: bounds.x + 16,
    y: y + h + 18,
    w: bounds.w - 32,
    h: bounds.y + bounds.h - (y + h + 18) - 12,
  };
  return {
    kind: 'hospital',
    pad,
    grass,
    rigs: [0, 1].map((index) => ({
      x: pad.x + pad.w * 0.5,
      y: pad.y + 28 + index * 48,
      heading: Math.PI / 2,
      length: 24,
      width: 11,
      color: '#f7f4ee',
      mark: 'ambulance' as const,
    })),
    path: loopAround(grass.x + grass.w * 0.42, grass.y + grass.h * 0.55, grass.w * 0.28, grass.h * 0.22),
    people: 4,
    coats: ['#f7f4ee', '#3c8f9a', '#e7eef4', '#2c6fbe'],
    scale: 1,
  };
}

function makeCarnival(bounds: Bounds): Carnival {
  const x = bounds.x + 28;
  const y = bounds.y + 62;
  const w = bounds.w - 56;
  const h = 118;
  const tents: Tent[] = [
    { x: x + 78, y: y + 6, w: 34, h: 22, color: '#e15a38' },
    { x: x + 128, y: y + 8, w: 28, h: 20, color: '#f2b427' },
    { x: x + 188, y: y + 5, w: 36, h: 24, color: '#3cbfb0' },
    { x: x + w * 0.5, y: y + 7, w: 32, h: 22, color: '#d45d8c' },
    { x: x + w * 0.64, y: y + 6, w: 30, h: 22, color: '#6a4a8a' },
    { x: x + w - 150, y: y + 8, w: 34, h: 20, color: '#e23b4a' },
    { x: x + w - 96, y: y + 5, w: 32, h: 24, color: '#f2b427' },
  ];
  return {
    x,
    y,
    w,
    h,
    tents,
    booth: { x: x + w * 0.22, y: y + h - 30, w: 36, h: 18 },
    wheel: { x: x + 42, y: y + h - 30 },
    carousel: { x: x + w * 0.42, y: y + h * 0.64 },
    balloons: [
      { x: x + w * 0.58, y: y + h * 0.42, colors: ['#e15a38', '#f2b427', '#3cbfb0'] },
      { x: x + w * 0.78, y: y + 34, colors: ['#d45d8c', '#6a4a8a', '#f7f4ee'] },
    ],
    stalls: [
      { x: x + w * 0.62, y: y + h - 32, w: 40, h: 20, color: '#f4efe4', trim: '#e15a38' },
      { x: x + w - 78, y: y + h - 34, w: 44, h: 22, color: '#fff6ea', trim: '#3cbfb0' },
    ],
    lamps: [
      { x: x + 14, y: y + 8 },
      { x: x + w * 0.22, y: y + 6 },
      { x: x + w * 0.4, y: y + 8 },
      { x: x + w * 0.58, y: y + 6 },
      { x: x + w * 0.76, y: y + 8 },
      { x: x + w - 16, y: y + 6 },
      { x: x + 16, y: y + h - 8 },
      { x: x + w * 0.34, y: y + h - 6 },
      { x: x + w * 0.55, y: y + h - 8 },
      { x: x + w - 14, y: y + h - 6 },
    ],
    bins: [
      { x: x + 18, y: y + h * 0.46 },
      { x: x + w - 22, y: y + h * 0.48 },
    ],
    path: [
      { x: x + 18, y: y + 36 },
      { x: x + w * 0.32, y: y + 34 },
      { x: x + w * 0.58, y: y + 38 },
      { x: x + w - 18, y: y + 36 },
      { x: x + w - 16, y: y + h * 0.55 },
      { x: x + w * 0.72, y: y + h - 14 },
      { x: x + 96, y: y + h * 0.52 },
      { x: x + 16, y: y + h * 0.48 },
    ],
    inner: [
      { x: x + w * 0.24, y: y + h * 0.48 },
      { x: x + w * 0.55, y: y + h * 0.4 },
      { x: x + w * 0.8, y: y + h * 0.68 },
      { x: x + w * 0.5, y: y + h * 0.78 },
    ],
  };
}

function buildBlocks() {
  const buildings: Building[] = [];
  const parks: Park[] = [];
  const lanes: Waypoint[][] = [];
  const trees: YardTree[] = [];
  const squares: Square[] = [];
  const sites: Site[] = [];
  let clock: { x: number; y: number } | null = null;
  let parking: { bounds: Bounds; cars: Parked[]; spots: Spot[]; mouthX: number; mouthY: number } | null = null;
  let houses: Bounds | null = null;
  const number = { value: 12 };
  for (let iy = 0; iy < STREETS.length - 1; iy += 1) {
    for (let ix = 0; ix < AVENUES.length - 1; ix += 1) {
      const bounds = blockBounds(ix, iy);
      const style = BLOCK_STYLE[iy][ix];
      const seed = ix * 80 + iy * 23 + 5;
      if (style === 'park') {
        const wide = bounds.w > bounds.h;
        const pond = wide
          ? { x: bounds.x + bounds.w * 0.58, y: bounds.y + bounds.h * 0.34, rx: 40, ry: 15 }
          : { x: bounds.x + bounds.w * 0.52, y: bounds.y + bounds.h * 0.72, rx: 22, ry: 14 };
        const statue = wide
          ? { x: bounds.x + bounds.w * 0.28, y: bounds.y + bounds.h * 0.38 }
          : { x: bounds.x + bounds.w * 0.7, y: bounds.y + bounds.h * 0.24 };
        const lampSpots = wide
          ? [[0.16, 0.62], [0.34, 0.5], [0.48, 0.72], [0.66, 0.56], [0.8, 0.68], [0.4, 0.3]]
          : [[0.28, 0.18], [0.72, 0.36], [0.3, 0.48], [0.74, 0.58], [0.34, 0.86]];
        const lamps = lampSpots.map(([px, py]) => ({
          x: bounds.x + bounds.w * px,
          y: bounds.y + bounds.h * py,
        }));
        const path = wide
          ? [
            { x: bounds.x + bounds.w * 0.12, y: bounds.y + bounds.h * 0.68 },
            { x: bounds.x + bounds.w * 0.32, y: bounds.y + bounds.h * 0.54 },
            { x: bounds.x + bounds.w * 0.5, y: bounds.y + bounds.h * 0.74 },
            { x: bounds.x + bounds.w * 0.7, y: bounds.y + bounds.h * 0.58 },
            { x: bounds.x + bounds.w * 0.88, y: bounds.y + bounds.h * 0.7 },
          ]
          : [
            { x: bounds.x + bounds.w * 0.24, y: bounds.y + bounds.h * 0.16 },
            { x: bounds.x + bounds.w * 0.74, y: bounds.y + bounds.h * 0.34 },
            { x: bounds.x + bounds.w * 0.26, y: bounds.y + bounds.h * 0.5 },
            { x: bounds.x + bounds.w * 0.76, y: bounds.y + bounds.h * 0.6 },
            { x: bounds.x + bounds.w * 0.7, y: bounds.y + bounds.h * 0.9 },
            { x: bounds.x + bounds.w * 0.28, y: bounds.y + bounds.h * 0.88 },
          ];
        const canopy: Array<[number, number, number]> = [];
        for (let n = 0; canopy.length < 7 && n < 18; n += 1) {
          const tx = bounds.x + 16 + hash(seed + n) * (bounds.w - 32);
          const ty = bounds.y + 16 + hash(seed + n + 9) * (bounds.h - 32);
          const dx = (tx - pond.x) / pond.rx;
          const dy = (ty - pond.y) / pond.ry;
          if (dx * dx + dy * dy < 1.45) continue;
          if (Math.hypot(tx - statue.x, ty - statue.y) < 18) continue;
          canopy.push([tx, ty, 5 + hash(seed + n + 3) * 4]);
        }
        const benches: Bench[] = wide
          ? [
            { x: bounds.x + bounds.w * 0.22, y: bounds.y + bounds.h * 0.6, rot: -0.25 },
            { x: bounds.x + bounds.w * 0.46, y: bounds.y + bounds.h * 0.8, rot: 0.08 },
            { x: bounds.x + bounds.w * 0.76, y: bounds.y + bounds.h * 0.52, rot: 0.35 },
          ]
          : [
            { x: bounds.x + bounds.w * 0.32, y: bounds.y + bounds.h * 0.2, rot: 0.2 },
            { x: bounds.x + bounds.w * 0.7, y: bounds.y + bounds.h * 0.46, rot: -0.35 },
          ];
        const bins: Bin[] = wide
          ? [
            { x: bounds.x + bounds.w * 0.16, y: bounds.y + bounds.h * 0.78 },
            { x: bounds.x + bounds.w * 0.58, y: bounds.y + bounds.h * 0.66 },
            { x: bounds.x + bounds.w * 0.86, y: bounds.y + bounds.h * 0.58 },
          ]
          : [
            { x: bounds.x + bounds.w * 0.22, y: bounds.y + bounds.h * 0.4 },
            { x: bounds.x + bounds.w * 0.6, y: bounds.y + bounds.h * 0.86 },
          ];
        parks.push({ ...bounds, trees: canopy, pond, statue, lamps, benches, bins, path });
      } else if (style === 'clock') {
        clock = { x: bounds.x + bounds.w * 0.5, y: bounds.y + bounds.h * 0.52 };
      } else if (style === 'parking') {
        const lot = makeParking(bounds);
        parking = { bounds, cars: lot.parked, spots: lot.spots, mouthX: lot.mouthX, mouthY: lot.mouthY };
      } else if (style === 'houses') {
        houses = bounds;
        addHouses(buildings, number, bounds, seed);
      } else if (style === 'terrace') addTerrace(buildings, number, bounds, seed);
      else if (style === 'scatter') {
        if (ix === 0 && iy === 0) sites.push(addPolice(buildings, number, bounds));
        else if (ix === 3 && iy === 2) sites.push(addHospital(buildings, number, bounds));
        else addScatter(buildings, trees, number, bounds, seed);
      }
      else if (style === 'court') {
        if (ix === 2 && iy === 0) sites.push(addPlayCourt(buildings, number, bounds));
        else addCourt(buildings, trees, number, bounds, seed);
      }
      else if (style === 'campus') sites.push(addMall(buildings, number, bounds));
      else if (style === 'square') sites.push(addFire(buildings, number, bounds));
      else addLane(buildings, trees, lanes, number, bounds, seed);
    }
  }
  const street = houses ? dressRow(houses, buildings) : null;
  const carnival = makeCarnival(blockBounds(1, 2));
  return { buildings, parks, lanes, trees, squares, clock, parking, houses, street, carnival, sites };
}

function buildLamps(): Lamp[] {
  const lamps: Lamp[] = [];
  STREETS.forEach((y, iy) => {
    for (let x = 46; x < WORLD_W; x += 78) {
      const onAvenue = AVENUES.some((avenue) => Math.abs(avenue - x) < ROAD);
      if (onAvenue) continue;
      if (iy > 0) lamps.push({ x, y: y - ROAD / 2 - 7 });
      if (iy === STREETS.length - 1) lamps.push({ x: x + 24, y: y + ROAD / 2 + 7 });
    }
  });
  AVENUES.forEach((x) => {
    for (let y = 54; y < WORLD_H; y += 84) {
      const onStreet = STREETS.some((street) => Math.abs(street - y) < ROAD);
      if (onStreet) continue;
      lamps.push({ x: x + ROAD / 2 + 7, y });
    }
  });
  return lamps;
}

function horizontalLoop(top: number, bottom: number): Waypoint[] {
  const yEast = STREETS[top] + LANE;
  const yWest = STREETS[bottom] - LANE;
  const points: Waypoint[] = [];
  const last = AVENUES.length - 1;
  for (let i = 0; i < last; i += 1) {
    points.push({ x: AVENUES[i] + STOP, y: yEast });
    points.push({
      x: AVENUES[i + 1] - STOP,
      y: yEast,
      ...(isOpenSquare(i + 1, top) ? {} : { stop: { light: 'ew' as const, ix: i + 1, iy: top } }),
    });
  }
  points.push({ x: AVENUES[last] + LANE, y: yEast });
  points.push({ x: AVENUES[last] + LANE, y: yWest });
  for (let i = last; i > 0; i -= 1) {
    points.push({ x: AVENUES[i] - STOP, y: yWest });
    points.push({
      x: AVENUES[i - 1] + STOP,
      y: yWest,
      ...(isOpenSquare(i - 1, bottom) ? {} : { stop: { light: 'ew' as const, ix: i - 1, iy: bottom } }),
    });
  }
  points.push({ x: AVENUES[0] - LANE, y: yWest });
  points.push({ x: AVENUES[0] - LANE, y: yEast });
  return points.filter((point, index, list) => {
    const prev = list[(index + list.length - 1) % list.length];
    return Math.hypot(point.x - prev.x, point.y - prev.y) > 6;
  });
}

function verticalLoop(left: number, right: number): Waypoint[] {
  const xSouth = AVENUES[right] + LANE;
  const xNorth = AVENUES[left] - LANE;
  const points: Waypoint[] = [];
  const last = STREETS.length - 1;
  for (let i = 0; i < last; i += 1) {
    points.push({ x: xSouth, y: STREETS[i] + STOP });
    points.push({
      x: xSouth,
      y: STREETS[i + 1] - STOP,
      ...(isOpenSquare(right, i + 1) ? {} : { stop: { light: 'ns' as const, ix: right, iy: i + 1 } }),
    });
  }
  points.push({ x: xSouth, y: STREETS[last] - LANE });
  points.push({ x: xNorth, y: STREETS[last] - LANE });
  for (let i = last; i > 0; i -= 1) {
    points.push({ x: xNorth, y: STREETS[i] - STOP });
    points.push({
      x: xNorth,
      y: STREETS[i - 1] + STOP,
      ...(isOpenSquare(left, i - 1) ? {} : { stop: { light: 'ns' as const, ix: left, iy: i - 1 } }),
    });
  }
  points.push({ x: xNorth, y: STREETS[0] + LANE });
  points.push({ x: xSouth, y: STREETS[0] + LANE });
  return points.filter((point, index, list) => {
    const prev = list[(index + list.length - 1) % list.length];
    return Math.hypot(point.x - prev.x, point.y - prev.y) > 6;
  });
}

function segmentLength(route: Waypoint[], seg: number) {
  const from = route[seg];
  const to = route[(seg + 1) % route.length];
  return Math.hypot(to.x - from.x, to.y - from.y) || 1;
}

function routeLength(route: Waypoint[]) {
  return route.reduce((sum, _, index) => sum + segmentLength(route, index), 0);
}

function sync(vehicle: Vehicle) {
  const from = vehicle.route[vehicle.seg];
  const to = vehicle.route[(vehicle.seg + 1) % vehicle.route.length];
  const span = segmentLength(vehicle.route, vehicle.seg);
  const t = vehicle.dist / span;
  vehicle.x = from.x + (to.x - from.x) * t;
  vehicle.y = from.y + (to.y - from.y) * t;
  vehicle.heading = Math.atan2(to.y - from.y, to.x - from.x);
}

function placeOnRoute(route: Waypoint[], distance: number, spec: Omit<Vehicle, 'route' | 'seg' | 'dist' | 'x' | 'y' | 'heading' | 'speed' | 'wait'>) {
  let remain = distance % routeLength(route);
  let seg = 0;
  for (let index = 0; index < route.length; index += 1) {
    const span = segmentLength(route, index);
    if (remain <= span) {
      seg = index;
      break;
    }
    remain -= span;
  }
  const vehicle: Vehicle = {
    ...spec,
    route,
    seg,
    dist: remain,
    speed: spec.max,
    wait: 0,
    x: 0,
    y: 0,
    heading: 0,
  };
  sync(vehicle);
  return vehicle;
}

const CITY = buildBlocks();
const LAMPS = buildLamps();

const ROUTES: Waypoint[][] = [
  horizontalLoop(0, 1),
  horizontalLoop(1, 2),
  horizontalLoop(2, 3),
  verticalLoop(1, 2),
  verticalLoop(2, 3),
  verticalLoop(3, 4),
];

function parkingCircuit(spot: Spot, mouthX: number, mouthY: number, hold: number): Waypoint[] {
  const roadX = AVENUES[3] + LANE;
  const loop = verticalLoop(2, 3);
  let from = -1;
  for (let index = 0; index < loop.length; index += 1) {
    const start = loop[index];
    const end = loop[(index + 1) % loop.length];
    if (Math.abs(start.x - roadX) < 3 && Math.abs(end.x - roadX) < 3 && start.y < mouthY && end.y > mouthY) {
      from = index;
      break;
    }
  }
  const entry = { x: roadX, y: mouthY };
  const around: Waypoint[] = [];
  if (from >= 0) {
    for (let step = 1; step <= loop.length; step += 1) around.push(loop[(from + step) % loop.length]);
  } else {
    around.push({ x: roadX, y: mouthY + 90 }, { x: roadX, y: mouthY + 180 }, { x: roadX, y: mouthY + 90 });
  }
  return [
    { x: spot.x, y: spot.y, hold },
    { x: spot.aisleX, y: spot.aisleY },
    { x: mouthX, y: mouthY },
    entry,
    ...around,
    entry,
    { x: mouthX, y: mouthY },
    { x: spot.aisleX, y: spot.aisleY },
  ];
}

function spawn(): Vehicle[] {
  const fleet: Vehicle[] = [];
  ROUTES.forEach((route, index) => {
    const span = routeLength(route);
    const cars = index < 3 ? 3 : 2;
    const slot = span / cars;
    for (let car = 0; car < cars; car += 1) {
      fleet.push(placeOnRoute(route, slot * car, {
        max: 48 + hash(index * 9 + car) * 16,
        kind: 'car',
        color: CAR_COLORS[Math.floor(hash(index * 5 + car + 2) * CAR_COLORS.length)],
        length: 20,
        width: 10,
      }));
    }
    if (index === 1 || index === 3 || index === 5 || index === 7) {
      fleet.push(placeOnRoute(route, slot * 0.5, {
        max: 34,
        kind: 'bus',
        color: index % 2 === 1 ? '#e2b423' : '#2c6fbe',
        length: 40,
        width: 12,
      }));
    }
    if (index === 2 || index === 4 || index === 6) {
      fleet.push(placeOnRoute(route, slot * 1.5, {
        max: 42,
        kind: 'van',
        color: '#f7f4ee',
        length: 24,
        width: 11,
      }));
    }
  });
  CITY.lanes.forEach((lane, index) => {
    fleet.push(placeOnRoute(lane, routeLength(lane) * 0.2, {
      max: 28,
      kind: 'car',
      color: CAR_COLORS[(index + 3) % CAR_COLORS.length],
      length: 16,
      width: 8,
    }));
  });
  const lot = CITY.parking;
  lot?.spots.forEach((spot, index) => {
    const vehicle = placeOnRoute(parkingCircuit(spot, lot.mouthX, lot.mouthY, 3.2), 0, {
      max: 62,
      kind: 'car',
      color: CAR_COLORS[(index + 4) % CAR_COLORS.length],
      length: 20,
      width: 10,
    });
    vehicle.wait = 0.4 + index * 3.2;
    vehicle.speed = 0;
    fleet.push(vehicle);
  });
  return fleet;
}

const COATS = ['#2c6fbe', '#c45c48', '#e2b423', '#3c8f48', '#f6f1e6', '#6a4a8a', '#d45d8c'];
const HAIR = ['#241c18', '#4a3428', '#1a1816', '#6b4e32', '#c6a15a'];

function loopAround(x: number, y: number, rx: number, ry: number): Waypoint[] {
  return [
    { x: x - rx, y: y - ry },
    { x: x + rx, y: y - ry },
    { x: x + rx, y: y + ry },
    { x: x - rx, y: y + ry },
  ];
}

function placeWalker(route: Waypoint[], distance: number, speed: number, coat: string, hair: string, scale = 1): Walker {
  let remain = distance % routeLength(route);
  let seg = 0;
  for (let index = 0; index < route.length; index += 1) {
    const span = segmentLength(route, index);
    if (remain <= span) {
      seg = index;
      break;
    }
    remain -= span;
  }
  const walker: Walker = { route, seg, dist: remain, speed, x: 0, y: 0, heading: 0, coat, hair, waiting: false, scale };
  if (route[seg].cross) {
    walker.seg = (seg + route.length - 1) % route.length;
    walker.dist = segmentLength(route, walker.seg) * 0.35;
  }
  const from = walker.route[walker.seg];
  const to = walker.route[(walker.seg + 1) % walker.route.length];
  const span = segmentLength(walker.route, walker.seg);
  const t = walker.dist / span;
  walker.x = from.x + (to.x - from.x) * t;
  walker.y = from.y + (to.y - from.y) * t;
  walker.heading = Math.atan2(to.y - from.y, to.x - from.x);
  return walker;
}

function courtMarketCrossing(): Waypoint[] {
  const cross = { light: 'ew' as const, ix: 3, iy: 1 };
  return [
    { x: 1088, y: 128 },
    { x: 1088, y: 186 },
    { x: 1088, y: 206, cross },
    { x: 1088, y: 274 },
    { x: 1088, y: 330 },
    { x: 1088, y: 274, cross },
    { x: 1088, y: 206 },
  ];
}

function campusParkCrossing(): Waypoint[] {
  const cross = { light: 'ew' as const, ix: 0, iy: 2 };
  return [
    { x: 148, y: 448 },
    { x: 224, y: 452 },
    { x: 160, y: 446 },
    { x: 118, y: 448 },
    { x: 106, y: 446, cross },
    { x: 106, y: 534 },
    { x: 156, y: 568 },
    { x: 196, y: 610 },
    { x: 132, y: 648 },
    { x: 118, y: 560 },
    { x: 106, y: 534, cross },
    { x: 106, y: 446 },
  ];
}

function buildWalkers(): Walker[] {
  const paths: Array<{ route: Waypoint[]; count: number; pace: number; coats?: string[]; scale?: number }> = [];
  if (CITY.houses) {
    const midY = CITY.houses.y + CITY.houses.h * 0.5;
    paths.push({
      route: loopAround(CITY.houses.x + CITY.houses.w * 0.5, midY, CITY.houses.w * 0.4, 3),
      count: 3,
      pace: 15,
    });
  }
  paths.push({ route: CITY.carnival.path, count: 8, pace: 16 });
  paths.push({ route: CITY.carnival.inner, count: 4, pace: 13 });
  CITY.sites.forEach((site) => {
    paths.push({ route: site.path, count: site.people, pace: 14, coats: site.coats, scale: site.scale });
  });
  CITY.parks.forEach((park) => {
    paths.push({ route: park.path, count: 2, pace: 16 });
  });
  paths.push({ route: loopAround(342, 190, 10, 7), count: 1, pace: 12 });
  paths.push({ route: loopAround(838, 190, 10, 7), count: 1, pace: 12 });
  paths.push({ route: courtMarketCrossing(), count: 2, pace: 32 });
  paths.push({ route: campusParkCrossing(), count: 2, pace: 32 });
  const people: Walker[] = [];
  paths.forEach((path, index) => {
    const span = routeLength(path.route);
    for (let step = 0; step < path.count; step += 1) {
      const coats = path.coats ?? COATS;
      people.push(placeWalker(
        path.route,
        (span / path.count) * step + 4,
        path.pace + hash(index * 7 + step) * 6,
        coats[(index + step * 3) % coats.length],
        HAIR[(index * 2 + step) % HAIR.length],
        path.scale ?? 1,
      ));
    }
  });
  return people;
}

let vehicles: Vehicle[] | null = null;
let walkers: Walker[] | null = null;
let previousTime = -1;

const LIGHT_CYCLE = 9.6;

function lightLocal(stop: Stop, time: number) {
  const offset = (stop.ix * 1.7 + stop.iy * 2.3) % LIGHT_CYCLE;
  return (time + offset) % LIGHT_CYCLE;
}

function phaseOf(stop: Stop, time: number): Phase {
  const local = lightLocal(stop, time);
  if (stop.light === 'ew') {
    if (local < 4.15) return 'green';
    if (local < 4.85) return 'yellow';
    return 'red';
  }
  if (local >= 4.85 && local < 9) return 'green';
  if (local >= 9) return 'yellow';
  return 'red';
}

function redRemaining(stop: Stop, time: number) {
  const local = lightLocal(stop, time);
  if (stop.light === 'ew') return local >= 4.85 ? LIGHT_CYCLE - local : 0;
  return local < 4.85 ? 4.85 - local : 0;
}

function stepWalkers(dt: number, time: number) {
  walkers?.forEach((walker) => {
    let left = walker.speed * dt;
    let guard = 0;
    walker.waiting = false;
    while (left > 0.02 && guard < 4) {
      guard += 1;
      const from = walker.route[walker.seg];
      if (from.cross && walker.dist < 1.2 && redRemaining(from.cross, time) < 3.2) {
        walker.dist = 0;
        walker.waiting = true;
        left = 0;
        break;
      }
      const span = segmentLength(walker.route, walker.seg);
      const room = span - walker.dist;
      if (left < room) {
        walker.dist += left;
        left = 0;
      } else {
        left -= room;
        walker.seg = (walker.seg + 1) % walker.route.length;
        walker.dist = 0;
      }
    }
    const from = walker.route[walker.seg];
    const to = walker.route[(walker.seg + 1) % walker.route.length];
    const span = segmentLength(walker.route, walker.seg);
    const t = walker.dist / span;
    walker.x = from.x + (to.x - from.x) * t;
    walker.y = from.y + (to.y - from.y) * t;
    walker.heading = Math.atan2(to.y - from.y, to.x - from.x);
  });
}

function holding(stop: Stop, time: number, room: number) {
  const phase = phaseOf(stop, time);
  if (phase === 'red') return true;
  return phase === 'yellow' && room > 22;
}

function gapAhead(self: Vehicle) {
  const forwardX = Math.cos(self.heading);
  const forwardY = Math.sin(self.heading);
  let best = 110;
  vehicles?.forEach((other) => {
    if (other === self) return;
    const dx = other.x - self.x;
    const dy = other.y - self.y;
    const forward = dx * forwardX + dy * forwardY;
    const side = Math.abs(dx * -forwardY + dy * forwardX);
    const clearance = (self.width + other.width) * 0.42 + other.length * 0.2;
    if (forward > 0 && forward < best && side < clearance) best = forward;
  });
  return best;
}

function arrive(vehicle: Vehicle) {
  if (vehicle.once && vehicle.seg >= vehicle.route.length - 2) {
    vehicle.dist = segmentLength(vehicle.route, vehicle.seg);
    vehicle.speed = 0;
    vehicle.done = true;
    return true;
  }
  vehicle.seg = (vehicle.seg + 1) % vehicle.route.length;
  vehicle.dist = 0;
  const here = vehicle.route[vehicle.seg];
  if (here.hold) {
    vehicle.wait = here.hold;
    vehicle.speed = 0;
    return true;
  }
  return false;
}

function step(dt: number, time: number) {
  if (!vehicles || dt <= 0) return;
  const wants = vehicles.map((vehicle) => {
    if (vehicle.done || vehicle.wait > 0) return 0;
    const next = vehicle.route[(vehicle.seg + 1) % vehicle.route.length];
    const span = segmentLength(vehicle.route, vehicle.seg);
    const room = span - vehicle.dist;
    let speed = vehicle.max;
    if (next.stop && holding(next.stop, time, room)) {
      const nose = room - vehicle.length * 0.5;
      speed = Math.min(speed, Math.max(0, nose / 26) * vehicle.max);
    }
    const gap = vehicle.crown && run.pulling ? 110 : gapAhead(vehicle);
    const need = vehicle.crown ? 12 : vehicle.length * 0.62 + 14;
    if (gap < need + 30) speed = Math.min(speed, Math.max(0, (gap - need) / 24) * vehicle.max);
    return speed;
  });
  vehicles.forEach((vehicle, index) => {
    if (vehicle.done) {
      vehicle.speed = 0;
      return;
    }
    if (vehicle.wait > 0) {
      vehicle.wait = Math.max(0, vehicle.wait - dt);
      vehicle.speed = 0;
      sync(vehicle);
      return;
    }
    const want = wants[index];
    const rate = want < vehicle.speed ? 5 : 2.4;
    vehicle.speed += (want - vehicle.speed) * Math.min(1, dt * rate);
    let left = vehicle.speed * dt;
    let guard = 0;
    while (left > 0.02 && guard < 5) {
      guard += 1;
      const next = vehicle.route[(vehicle.seg + 1) % vehicle.route.length];
      const span = segmentLength(vehicle.route, vehicle.seg);
      const mustWait = Boolean(next.stop && holding(next.stop, time, span - vehicle.dist));
      const limit = mustWait ? Math.max(0, span - vehicle.length * 0.5) : span;
      const room = limit - vehicle.dist;
      if (room <= 0.35) {
        if (mustWait) {
          vehicle.dist = limit;
          vehicle.speed = 0;
          break;
        }
        left -= Math.max(room, 0);
        if (arrive(vehicle)) {
          left = 0;
          break;
        }
        continue;
      }
      if (left < room) {
        vehicle.dist += left;
        left = 0;
      } else if (mustWait) {
        vehicle.dist = limit;
        vehicle.speed = 0;
        left = 0;
      } else {
        left -= room;
        if (arrive(vehicle)) left = 0;
      }
    }
    sync(vehicle);
  });
}

function daySample(time: number) {
  const t = ((time + DAY_SECONDS * 0.28) % DAY_SECONDS) / DAY_SECONDS;
  const night = t < 0.1 ? 1
    : t < 0.22 ? 1 - smooth((t - 0.1) / 0.12)
      : t < 0.58 ? 0
        : t < 0.74 ? smooth((t - 0.58) / 0.16)
          : 1;
  const warm = Math.max(
    t > 0.08 && t < 0.28 ? smooth(1 - Math.abs(t - 0.18) / 0.1) : 0,
    t > 0.56 && t < 0.78 ? smooth(1 - Math.abs(t - 0.67) / 0.11) : 0,
  );
  const sun = 1 - night;
  const across = t < 0.22 || t > 0.8 ? 0.5 : (t - 0.22) / 0.58;
  return {
    night,
    warm,
    shadowX: Math.cos(lerp(-0.4, 2.6, across)) * 8 * sun,
    shadowY: (2 + Math.sin(across * Math.PI) * 3) * sun,
  };
}

function fit(width: number, height: number) {
  const pad = 18;
  const scale = Math.min((width - pad * 2) / WORLD_W, (height - pad * 2) / WORLD_H);
  return {
    scale,
    ox: (width - WORLD_W * scale) / 2,
    oy: (height - WORLD_H * scale) / 2,
  };
}

function drawPond(ctx: CanvasRenderingContext2D, pond: Pond) {
  ctx.fillStyle = '#214e3a';
  ctx.beginPath();
  ctx.ellipse(pond.x, pond.y, pond.rx + 4, pond.ry + 3.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2f86a0';
  ctx.beginPath();
  ctx.ellipse(pond.x, pond.y, pond.rx, pond.ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#7ec4d2';
  ctx.beginPath();
  ctx.ellipse(pond.x - pond.rx * 0.22, pond.y - pond.ry * 0.2, pond.rx * 0.36, pond.ry * 0.32, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(214, 240, 244, 0.55)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(pond.x + pond.rx * 0.12, pond.y + pond.ry * 0.08, pond.rx * 0.42, pond.ry * 0.26, 0.4, 0.3, 2.4);
  ctx.stroke();
}

function drawDucks(ctx: CanvasRenderingContext2D, pond: Pond, time: number) {
  const count = pond.rx > 30 ? 3 : 2;
  for (let index = 0; index < count; index += 1) {
    const angle = time * 0.18 + index * 2.15;
    const x = pond.x + Math.cos(angle) * pond.rx * 0.42;
    const y = pond.y + Math.sin(angle) * pond.ry * 0.32;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle + Math.PI / 2);
    ctx.fillStyle = index % 2 === 0 ? '#f4efe4' : '#c9a24a';
    ctx.beginPath();
    ctx.ellipse(-0.4, 0, 3.1, 1.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2c261c';
    ctx.beginPath();
    ctx.arc(2.2, 0, 1.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e15a38';
    ctx.beginPath();
    ctx.moveTo(3.1, -0.45);
    ctx.lineTo(4.3, 0);
    ctx.lineTo(3.1, 0.45);
    ctx.fill();
    ctx.restore();
  }
}

function drawStatue(ctx: CanvasRenderingContext2D, statue: Statue) {
  ctx.fillStyle = 'rgba(20, 16, 12, 0.22)';
  ctx.beginPath();
  ctx.ellipse(statue.x + 1.4, statue.y + 9, 10, 3.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d9d0c2';
  roundRect(ctx, statue.x - 9, statue.y - 9, 18, 18, 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(92, 78, 60, 0.4)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = '#b5894a';
  ctx.beginPath();
  ctx.arc(statue.x, statue.y - 1.6, 3.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(statue.x - 2.6, statue.y + 1.4, 5.2, 2.6);
}

function drawParkLamp(ctx: CanvasRenderingContext2D, lamp: Lamp, night: number) {
  ctx.strokeStyle = '#3a342c';
  ctx.lineWidth = 1.3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(lamp.x, lamp.y + 6);
  ctx.lineTo(lamp.x, lamp.y - 5);
  ctx.stroke();
  const glow = ctx.createRadialGradient(lamp.x, lamp.y - 5, 0.4, lamp.x, lamp.y - 5, 16);
  glow.addColorStop(0, `rgba(255, 210, 130, ${0.22 + night * 0.5})`);
  glow.addColorStop(1, 'rgba(255, 210, 130, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(lamp.x, lamp.y - 5, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = night > 0.25 ? '#ffe7b8' : '#f0d48a';
  ctx.beginPath();
  ctx.arc(lamp.x, lamp.y - 5, 2.4, 0, Math.PI * 2);
  ctx.fill();
}

function drawCarnivalLights(ctx: CanvasRenderingContext2D, carnival: Carnival, night: number) {
  const bulbs = ['#ff5a4a', '#f2b427', '#3cbfb0', '#d45d8c', '#fff6ea', '#8d6bff'];
  if (night > 0.12) {
    ctx.fillStyle = `rgba(255, 150, 60, ${0.22 * night})`;
    roundRect(ctx, carnival.x, carnival.y, carnival.w, carnival.h, 8);
    ctx.fill();
  }
  const strings = [carnival.lamps.slice(0, 6), carnival.lamps.slice(6)];
  strings.forEach((row, rowIndex) => {
    for (let index = 0; index < row.length - 1; index += 1) {
      const from = row[index];
      const to = row[index + 1];
      for (let step = 1; step <= 3; step += 1) {
        const t = step / 4;
        const x = from.x + (to.x - from.x) * t;
        const y = from.y + (to.y - from.y) * t + (step % 2 === 0 ? 5 : 2);
        const color = bulbs[(rowIndex * 3 + index + step) % bulbs.length];
        const glow = ctx.createRadialGradient(x, y, 0.4, x, y, 8);
        glow.addColorStop(0, color);
        glow.addColorStop(1, 'rgba(255, 180, 80, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff6ea';
        ctx.beginPath();
        ctx.arc(x, y, 1.7, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  });
  carnival.lamps.forEach((lamp, index) => {
    const color = bulbs[index % bulbs.length];
    const glow = ctx.createRadialGradient(lamp.x, lamp.y, 1, lamp.x, lamp.y, 16);
    glow.addColorStop(0, color);
    glow.addColorStop(1, 'rgba(255, 180, 80, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, 2.8, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawYard(ctx: CanvasRenderingContext2D, yard: Yard) {
  ctx.fillStyle = '#8fbf6a';
  ctx.fillRect(yard.x, yard.y, yard.w, yard.h);
  ctx.strokeStyle = '#6b4a32';
  ctx.lineWidth = 1.3;
  ctx.strokeRect(yard.x, yard.y, yard.w, yard.h);
  ctx.fillStyle = '#6b4a32';
  ctx.fillRect(yard.x - 0.6, yard.y - 0.6, 1.6, 1.6);
  ctx.fillRect(yard.x + yard.w - 1, yard.y - 0.6, 1.6, 1.6);
  ctx.fillRect(yard.x - 0.6, yard.y + yard.h - 1, 1.6, 1.6);
  ctx.fillRect(yard.x + yard.w - 1, yard.y + yard.h - 1, 1.6, 1.6);
  const gateX = yard.x + yard.w * 0.5 - 3.5;
  const gateY = yard.gate === 'south' ? yard.y + yard.h : yard.y;
  ctx.strokeStyle = '#8fbf6a';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(gateX, gateY);
  ctx.lineTo(gateX + 7, gateY);
  ctx.stroke();
}

function drawBin(ctx: CanvasRenderingContext2D, bin: Bin) {
  ctx.fillStyle = '#2f6b45';
  ctx.fillRect(bin.x - 2.3, bin.y - 2.5, 4.6, 5.2);
  ctx.fillStyle = '#1c3d28';
  ctx.fillRect(bin.x - 2.8, bin.y - 3.3, 5.6, 1.4);
}

function drawBench(ctx: CanvasRenderingContext2D, bench: Bench) {
  ctx.save();
  ctx.translate(bench.x, bench.y);
  ctx.rotate(bench.rot);
  ctx.fillStyle = '#8d6b45';
  ctx.fillRect(-7, -1.7, 14, 3.4);
  ctx.fillStyle = '#5c4630';
  ctx.fillRect(-6.2, -2.5, 1.5, 5);
  ctx.fillRect(4.7, -2.5, 1.5, 5);
  ctx.restore();
}

function drawCarnival(ctx: CanvasRenderingContext2D, carnival: Carnival) {
  const bands = ['#f6d37a', '#f3b84a', '#f7e2a0', '#f0c36a'];
  const band = carnival.h / bands.length;
  bands.forEach((color, index) => {
    ctx.fillStyle = color;
    ctx.fillRect(carnival.x, carnival.y + index * band, carnival.w, band + 0.5);
  });
  ctx.strokeStyle = '#e23b4a';
  ctx.lineWidth = 3;
  roundRect(ctx, carnival.x, carnival.y, carnival.w, carnival.h, 8);
  ctx.stroke();
  const pennants = ['#e15a38', '#f2b427', '#3cbfb0', '#d45d8c', '#6a4a8a', '#f7f4ee'];
  for (let x = carnival.x + 8; x < carnival.x + carnival.w - 8; x += 12) {
    ctx.fillStyle = pennants[((x / 12) | 0) % pennants.length];
    ctx.beginPath();
    ctx.moveTo(x, carnival.y + 3);
    ctx.lineTo(x + 8, carnival.y + 3);
    ctx.lineTo(x + 4, carnival.y + 10);
    ctx.closePath();
    ctx.fill();
  }
  const { wheel } = carnival;
  ctx.strokeStyle = '#c23b2e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(wheel.x, wheel.y, 18, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#f7f4ee';
  ctx.beginPath();
  ctx.arc(wheel.x, wheel.y, 3, 0, Math.PI * 2);
  ctx.fill();
  const gondolas = ['#e15a38', '#f2b427', '#3cbfb0', '#d45d8c', '#6a4a8a', '#f7f4ee'];
  for (let spoke = 0; spoke < 6; spoke += 1) {
    const angle = (spoke / 6) * Math.PI * 2;
    ctx.strokeStyle = '#e2b423';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(wheel.x, wheel.y);
    ctx.lineTo(wheel.x + Math.cos(angle) * 18, wheel.y + Math.sin(angle) * 18);
    ctx.stroke();
    ctx.fillStyle = gondolas[spoke];
    ctx.beginPath();
    ctx.arc(wheel.x + Math.cos(angle) * 16, wheel.y + Math.sin(angle) * 16, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
  const { carousel } = carnival;
  const wedges = ['#e15a38', '#f2b427', '#3cbfb0', '#d45d8c', '#6a4a8a', '#f7f4ee'];
  wedges.forEach((color, index) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(carousel.x, carousel.y);
    ctx.arc(carousel.x, carousel.y, 16, (index / 6) * Math.PI * 2, ((index + 1) / 6) * Math.PI * 2);
    ctx.closePath();
    ctx.fill();
  });
  ctx.fillStyle = '#c23b2e';
  ctx.beginPath();
  ctx.arc(carousel.x, carousel.y, 5, 0, Math.PI * 2);
  ctx.fill();
  carnival.balloons.forEach((cluster) => {
    ctx.strokeStyle = '#6b4a32';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(cluster.x, cluster.y + 10);
    ctx.lineTo(cluster.x, cluster.y - 2);
    ctx.stroke();
    cluster.colors.forEach((color, index) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(cluster.x + (index - 1) * 6, cluster.y - 8, 4.2, 0, Math.PI * 2);
      ctx.fill();
    });
  });
  carnival.bins.forEach((bin) => drawBin(ctx, bin));
  carnival.tents.forEach((tent) => {
    ctx.fillStyle = tent.color;
    ctx.beginPath();
    ctx.moveTo(tent.x, tent.y + tent.h);
    ctx.lineTo(tent.x + tent.w * 0.5, tent.y);
    ctx.lineTo(tent.x + tent.w, tent.y + tent.h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 248, 236, 0.7)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(tent.x + tent.w * 0.5, tent.y + 2);
    ctx.lineTo(tent.x + tent.w * 0.5, tent.y + tent.h);
    ctx.stroke();
  });
  const { booth } = carnival;
  ctx.fillStyle = '#6a4a8a';
  roundRect(ctx, booth.x, booth.y, booth.w, booth.h, 2);
  ctx.fill();
  ctx.fillStyle = '#f2b427';
  ctx.fillRect(booth.x - 2, booth.y - 4, booth.w + 4, 5);
  carnival.stalls.forEach((stall) => {
    ctx.fillStyle = stall.color;
    roundRect(ctx, stall.x, stall.y, stall.w, stall.h, 2);
    ctx.fill();
    ctx.fillStyle = stall.trim;
    ctx.fillRect(stall.x - 2, stall.y - 4, stall.w + 4, 5);
  });
  const games = [
    { x: carnival.x + carnival.w * 0.3, y: carnival.y + carnival.h * 0.5, color: '#e15a38' },
    { x: carnival.x + carnival.w * 0.5, y: carnival.y + carnival.h * 0.46, color: '#3cbfb0' },
    { x: carnival.x + carnival.w * 0.68, y: carnival.y + carnival.h * 0.52, color: '#d45d8c' },
  ];
  games.forEach((game) => {
    ctx.fillStyle = game.color;
    ctx.beginPath();
    ctx.arc(game.x, game.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff6ea';
    ctx.beginPath();
    ctx.arc(game.x, game.y, 3.2, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = '#6a4a8a';
  roundRect(ctx, carnival.x + carnival.w * 0.78, carnival.y + carnival.h * 0.4, 28, 16, 2);
  ctx.fill();
  ctx.fillStyle = '#f2b427';
  ctx.fillRect(carnival.x + carnival.w * 0.78 - 2, carnival.y + carnival.h * 0.4 - 3, 32, 4);
}

function drawSiteGround(ctx: CanvasRenderingContext2D, site: Site) {
  if (site.pad) {
    ctx.fillStyle = '#3a414c';
    roundRect(ctx, site.pad.x, site.pad.y, site.pad.w, site.pad.h, 4);
    ctx.fill();
    ctx.strokeStyle = 'rgba(236, 228, 214, 0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(site.pad.x + 3, site.pad.y + 3, site.pad.w - 6, site.pad.h - 6);
  }
  if (!site.grass) return;
  const grass = site.grass;
  ctx.fillStyle = site.kind === 'hospital' ? '#4ea25a' : '#3f9a4e';
  roundRect(ctx, grass.x, grass.y, grass.w, grass.h, 6);
  ctx.fill();
  if (site.kind === 'hospital') {
    ctx.strokeStyle = 'rgba(236, 224, 196, 0.85)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(grass.x + 16, grass.y + grass.h * 0.62);
    ctx.quadraticCurveTo(grass.x + grass.w * 0.4, grass.y + grass.h * 0.28, grass.x + grass.w * 0.72, grass.y + grass.h * 0.58);
    ctx.stroke();
    drawBench(ctx, { x: grass.x + 28, y: grass.y + grass.h * 0.38, rot: 0.15 });
    drawBench(ctx, { x: grass.x + grass.w * 0.78, y: grass.y + grass.h * 0.72, rot: -0.2 });
    drawTree(ctx, grass.x + 18, grass.y + grass.h - 14, 5);
    drawTree(ctx, grass.x + grass.w - 22, grass.y + 16, 4.5);
    const blooms = ['#f4efe4', '#e15a38', '#f2b427', '#d45d8c'];
    blooms.forEach((color, index) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(grass.x + 48 + index * 16, grass.y + 14 + (index % 2) * 6, 2.2, 0, Math.PI * 2);
      ctx.fill();
    });
    return;
  }
  ctx.save();
  ctx.translate(grass.x + grass.w / 2, grass.y + grass.h / 2);
  ctx.scale(Math.min(grass.w / 44, grass.h / 32), Math.min(grass.w / 44, grass.h / 32));
  ctx.fillStyle = '#e6c98a';
  ctx.beginPath();
  ctx.ellipse(8, 4, 7, 4.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#6b4a32';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(-12, 6);
  ctx.lineTo(-8, -7);
  ctx.lineTo(-4, 6);
  ctx.moveTo(0, 6);
  ctx.lineTo(4, -7);
  ctx.lineTo(8, 6);
  ctx.moveTo(-8, -7);
  ctx.lineTo(4, -7);
  ctx.stroke();
  ctx.fillStyle = '#e15a38';
  ctx.beginPath();
  ctx.moveTo(-16, 8);
  ctx.lineTo(-6, -8);
  ctx.lineTo(2, 8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawRoofSign(ctx: CanvasRenderingContext2D, building: Building, mark: 'police' | 'fire' | 'hospital') {
  const w = Math.min(40, building.w * 0.46);
  const h = 16;
  const x = building.x + (building.w - w) / 2;
  const y = building.y + 4;
  ctx.fillStyle = '#f7f4ee';
  roundRect(ctx, x, y, w, h, 2);
  ctx.fill();
  ctx.strokeStyle = mark === 'fire' ? '#c23b2e' : mark === 'hospital' ? '#e15a38' : '#1e3a6e';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  const cx = x + w / 2;
  const cy = y + h / 2;
  if (mark === 'police') {
    ctx.fillStyle = '#1e3a6e';
    ctx.beginPath();
    ctx.moveTo(cx - 4.2, cy - 4);
    ctx.lineTo(cx + 4.2, cy - 4);
    ctx.quadraticCurveTo(cx + 4.6, cy + 1, cx, cy + 5);
    ctx.quadraticCurveTo(cx - 4.6, cy + 1, cx - 4.2, cy - 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f7f4ee';
    ctx.fillRect(cx - 0.7, cy - 2.4, 1.4, 4.2);
    ctx.fillRect(cx - 2.1, cy - 1, 4.2, 1.4);
  } else if (mark === 'fire') {
    ctx.fillStyle = '#c23b2e';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 5);
    ctx.bezierCurveTo(cx + 4.4, cy - 1.2, cx + 3.2, cy + 2.4, cx, cy + 5);
    ctx.bezierCurveTo(cx - 3.2, cy + 2.4, cx - 4.4, cy - 1.2, cx, cy - 5);
    ctx.fill();
    ctx.fillStyle = '#f2b427';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 1.4);
    ctx.bezierCurveTo(cx + 1.8, cy + 0.4, cx + 1.3, cy + 2.2, cx, cy + 3.6);
    ctx.bezierCurveTo(cx - 1.3, cy + 2.2, cx - 1.8, cy + 0.4, cx, cy - 1.4);
    ctx.fill();
  } else {
    ctx.fillStyle = '#e15a38';
    ctx.fillRect(cx - 1.7, cy - 4.6, 3.4, 9.2);
    ctx.fillRect(cx - 4.6, cy - 1.7, 9.2, 3.4);
  }
}

function drawMallFront(ctx: CanvasRenderingContext2D, site: Site) {
  if (!site.carpet) return;
  const carpet = site.carpet;
  ctx.fillStyle = '#c23b2e';
  ctx.fillRect(carpet.x, carpet.y, carpet.w, carpet.h);
  ctx.fillStyle = '#f2b427';
  ctx.fillRect(carpet.x, carpet.y, 1.4, carpet.h);
  ctx.fillRect(carpet.x + carpet.w - 1.4, carpet.y, 1.4, carpet.h);
  site.statues?.forEach((statue) => drawStatue(ctx, statue));
}

function drawRig(ctx: CanvasRenderingContext2D, rig: Rig) {
  drawVehicle(ctx, {
    x: rig.x,
    y: rig.y,
    heading: rig.heading,
    color: rig.color,
    length: rig.length,
    width: rig.width,
    kind: 'car',
    speed: 20,
    max: 20,
    wait: 1,
    route: [],
    seg: 0,
    dist: 0,
  });
  ctx.save();
  ctx.translate(rig.x, rig.y);
  ctx.rotate(rig.heading);
  if (rig.mark === 'police') {
    ctx.fillStyle = '#2c6fbe';
    ctx.fillRect(rig.length * 0.04, -rig.width * 0.22, 5, rig.width * 0.44);
    ctx.fillStyle = '#ff5a4a';
    ctx.fillRect(rig.length * 0.04 + 5, -rig.width * 0.16, 2.2, rig.width * 0.32);
  } else if (rig.mark === 'fire') {
    ctx.fillStyle = '#f7f4ee';
    ctx.fillRect(-rig.length * 0.08, -rig.width * 0.12, rig.length * 0.46, rig.width * 0.24);
    ctx.strokeStyle = '#f7f4ee';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(-rig.length * 0.32, -rig.width * 0.38);
    ctx.lineTo(rig.length * 0.3, -rig.width * 0.38);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#e15a38';
    ctx.fillRect(-1.1, -4.5, 2.2, 9);
    ctx.fillRect(-4.5, -1.1, 9, 2.2);
  }
  ctx.restore();
}

function drawZebra(ctx: CanvasRenderingContext2D, x: number, y0: number, y1: number) {
  ctx.fillStyle = 'rgba(236, 228, 214, 0.62)';
  const top = Math.min(y0, y1);
  const bottom = Math.max(y0, y1);
  for (let y = top + 2; y < bottom - 2; y += 8) ctx.fillRect(x - 5, y, 10, 3.6);
}

function drawWalker(ctx: CanvasRenderingContext2D, walker: Walker, time: number) {
  ctx.save();
  const bob = walker.waiting ? 0 : Math.sin(time * 8 + walker.x * 0.15) * 0.3;
  ctx.translate(walker.x, walker.y + bob);
  ctx.rotate(walker.heading - Math.PI / 2);
  ctx.scale(walker.scale, walker.scale);
  ctx.fillStyle = 'rgba(20, 16, 12, 0.28)';
  ctx.beginPath();
  ctx.ellipse(0.2, 1.5, 3.6, 1.6, 0, 0, Math.PI * 2);
  ctx.fill();
  const stride = walker.waiting ? 0.2 : Math.sin(time * 9 + walker.y);
  ctx.strokeStyle = '#241c18';
  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-1.8, -1.05);
  ctx.lineTo(-5.4, -1.7 - stride * 1.3);
  ctx.moveTo(-1.8, 1.05);
  ctx.lineTo(-5.4, 1.7 + stride * 1.3);
  ctx.stroke();
  ctx.fillStyle = walker.coat;
  ctx.beginPath();
  ctx.ellipse(-0.2, 0, 3.3, 1.9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f0d2b0';
  ctx.beginPath();
  ctx.arc(3.3, 0, 2.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = walker.hair;
  ctx.beginPath();
  ctx.arc(3.15, -0.45, 1.75, Math.PI, 0);
  ctx.fill();
  ctx.restore();
}

function drawTree(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  ctx.fillStyle = 'rgba(20, 50, 24, 0.28)';
  ctx.beginPath();
  ctx.ellipse(x + 2, y + radius * 0.35, radius * 0.7, radius * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2f7a3c';
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#67b85a';
  ctx.beginPath();
  ctx.arc(x - radius * 0.28, y - radius * 0.22, radius * 0.48, 0, Math.PI * 2);
  ctx.fill();
}

function drawBuilding(ctx: CanvasRenderingContext2D, building: Building, shadowX: number, shadowY: number) {
  ctx.fillStyle = 'rgba(12, 14, 18, 0.28)';
  roundRect(ctx, building.x + shadowX, building.y + shadowY, building.w, building.h, 3);
  ctx.fill();
  ctx.fillStyle = building.roof;
  roundRect(ctx, building.x, building.y, building.w, building.h, 3);
  ctx.fill();
  if (building.kind === 'house') {
    ctx.strokeStyle = 'rgba(255, 244, 230, 0.28)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(building.x + 3, building.y + building.h / 2);
    ctx.lineTo(building.x + building.w - 3, building.y + building.h / 2);
    ctx.stroke();
    ctx.fillStyle = '#6a5344';
    ctx.fillRect(building.x + building.w * 0.72, building.y + building.h * 0.18, 4, 4);
  } else if (building.kind === 'tower') {
    ctx.fillStyle = 'rgba(232, 226, 214, 0.14)';
    roundRect(ctx, building.x + 5, building.y + 5, building.w - 10, building.h - 10, 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(236, 228, 214, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(building.x + building.w * 0.5, building.y + building.h * 0.42, Math.min(building.w, building.h) * 0.16, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.fillStyle = 'rgba(20, 24, 28, 0.28)';
    ctx.fillRect(building.x + building.w * 0.62, building.y + building.h * 0.18, building.w * 0.18, building.h * 0.16);
  }
  if (building.role === 'police') {
    drawRoofSign(ctx, building, 'police');
  } else if (building.role === 'fire') {
    drawRoofSign(ctx, building, 'fire');
    ctx.fillStyle = '#f4efe4';
    const doorW = building.w * 0.22;
    const doorH = building.h * 0.32;
    ctx.fillRect(building.x + building.w * 0.16, building.y + building.h - doorH - 4, doorW, doorH);
    ctx.fillRect(building.x + building.w * 0.56, building.y + building.h - doorH - 4, doorW, doorH);
  } else if (building.role === 'hospital') {
    drawRoofSign(ctx, building, 'hospital');
  } else if (building.role === 'mall') {
    ctx.fillStyle = 'rgba(176, 210, 222, 0.72)';
    roundRect(ctx, building.x + building.w * 0.3, building.y + 8, building.w * 0.4, building.h * 0.18, 3);
    ctx.fill();
    const colors = ['#e15a38', '#f2b427', '#3cbfb0', '#d45d8c', '#6a4a8a'];
    const stripe = building.w / colors.length;
    const shopH = Math.min(22, building.h * 0.16);
    const shopY = building.y + building.h - shopH - 8;
    colors.forEach((color, index) => {
      ctx.fillStyle = color;
      roundRect(ctx, building.x + index * stripe + 3, shopY, stripe - 6, shopH, 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 248, 236, 0.55)';
      ctx.fillRect(building.x + index * stripe + 6, shopY + 3, stripe - 12, 4);
    });
    ctx.fillStyle = '#2c343c';
    ctx.fillRect(building.x + building.w * 0.4, building.y + building.h - 8, building.w * 0.2, 8);
  }
}

function drawCrown(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#ffe056';
  ctx.beginPath();
  ctx.moveTo(-7.2, 2.2);
  ctx.lineTo(-7.2, -0.6);
  ctx.lineTo(-4.6, -5.2);
  ctx.lineTo(-2.2, -1.1);
  ctx.lineTo(0, -6.2);
  ctx.lineTo(2.2, -1.1);
  ctx.lineTo(4.6, -5.2);
  ctx.lineTo(7.2, -0.6);
  ctx.lineTo(7.2, 2.2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fff8d0';
  ctx.beginPath();
  ctx.arc(0, -0.2, 1.45, 0, Math.PI * 2);
  ctx.fill();
  [-4.6, 0, 4.6].forEach((x) => {
    ctx.beginPath();
    ctx.arc(x, x === 0 ? -5.4 : -4.5, 0.9, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawDeliveryMark(ctx: CanvasRenderingContext2D, vehicle: Vehicle, time: number) {
  const pulse = 0.55 + Math.sin(time * 7) * 0.35;
  const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, 28);
  glow.addColorStop(0, `rgba(255, 80, 140, ${0.42 * pulse})`);
  glow.addColorStop(0.55, `rgba(255, 210, 70, ${0.2 * pulse})`);
  glow.addColorStop(1, 'rgba(255, 80, 140, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = `rgba(255, 224, 86, ${0.55 + pulse * 0.35})`;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(0, 0, 16 + pulse * 3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = vehicle.color;
  roundRect(ctx, -vehicle.length / 2, -vehicle.width / 2, vehicle.length, vehicle.width, 3);
  ctx.fill();
  ctx.fillStyle = '#1a1020';
  roundRect(ctx, vehicle.length * 0.12, -vehicle.width * 0.34, vehicle.length * 0.28, vehicle.width * 0.68, 1.6);
  ctx.fill();
  ctx.fillStyle = '#ffe056';
  ctx.fillRect(-vehicle.length * 0.42, -vehicle.width * 0.42, vehicle.length * 0.16, vehicle.width * 0.84);
  ctx.fillRect(vehicle.length * 0.02, -vehicle.width * 0.42, vehicle.length * 0.08, vehicle.width * 0.84);
  ctx.fillStyle = '#fff6ea';
  ctx.fillRect(-vehicle.length * 0.08, -vehicle.width * 0.22, vehicle.length * 0.14, vehicle.width * 0.44);
  drawCrown(ctx);
}

function drawVehicle(ctx: CanvasRenderingContext2D, vehicle: Vehicle, time = 0) {
  ctx.save();
  ctx.translate(vehicle.x, vehicle.y);
  ctx.rotate(vehicle.heading);
  const { length, width } = vehicle;
  if (vehicle.crown) {
    drawDeliveryMark(ctx, vehicle, time);
  } else {
    ctx.fillStyle = vehicle.color;
    roundRect(ctx, -length / 2, -width / 2, length, width, vehicle.kind === 'bus' ? 2 : 2.4);
    ctx.fill();
    if (vehicle.kind === 'car') {
      ctx.fillStyle = 'rgba(16, 22, 30, 0.55)';
      roundRect(ctx, -length * 0.08, -width * 0.34, length * 0.36, width * 0.68, 1.4);
      ctx.fill();
    } else if (vehicle.kind === 'bus') {
      ctx.fillStyle = 'rgba(214, 232, 242, 0.78)';
      for (let index = 0; index < 4; index += 1) {
        ctx.fillRect(-length * 0.32 + index * length * 0.16, -width * 0.28, length * 0.1, width * 0.56);
      }
    } else {
      ctx.fillStyle = '#e09a12';
      ctx.fillRect(-length * 0.18, -width * 0.34, length * 0.42, width * 0.68);
    }
  }
  if (vehicle.wait <= 0 && vehicle.speed < vehicle.max * 0.35) {
    ctx.fillStyle = '#ff5a4a';
    ctx.fillRect(-length / 2 + 1, -width * 0.34, 2.2, 2.2);
    ctx.fillRect(-length / 2 + 1, width * 0.34 - 2.2, 2.2, 2.2);
  }
  ctx.restore();
}

function drawHeadlights(ctx: CanvasRenderingContext2D, vehicle: Vehicle, night: number) {
  if (night < 0.25) return;
  ctx.save();
  ctx.translate(vehicle.x, vehicle.y);
  ctx.rotate(vehicle.heading);
  const glow = ctx.createRadialGradient(vehicle.length * 0.45, 0, 1, vehicle.length * 0.7, 0, 16);
  glow.addColorStop(0, `rgba(255, 236, 190, ${0.45 * night})`);
  glow.addColorStop(1, 'rgba(255, 236, 190, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.ellipse(vehicle.length * 0.55, 0, 14, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSignal(ctx: CanvasRenderingContext2D, x: number, y: number, phase: Phase) {
  ctx.fillStyle = 'rgba(8, 10, 14, 0.82)';
  roundRect(ctx, x - 3.2, y - 7.2, 6.4, 14.4, 2);
  ctx.fill();
  const colors = ['#ff5a4a', '#f2b427', '#3dce6e'] as const;
  const names: Phase[] = ['red', 'yellow', 'green'];
  names.forEach((name, index) => {
    ctx.beginPath();
    ctx.arc(x, y - 4.6 + index * 4.6, name === phase ? 1.7 : 1.25, 0, Math.PI * 2);
    ctx.fillStyle = name === phase ? colors[index] : 'rgba(80, 84, 90, 0.7)';
    ctx.fill();
  });
}

function drawNumber(ctx: CanvasRenderingContext2D, building: Building) {
  const label = String(building.number);
  const size = Math.min(13, Math.max(8, Math.min(building.w, building.h) * 0.24));
  ctx.font = `600 ${size}px Figtree, "Segoe UI", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 2.4;
  ctx.strokeStyle = 'rgba(8, 10, 14, 0.78)';
  ctx.strokeText(label, building.x + building.w / 2, building.y + building.h / 2);
  ctx.fillStyle = '#f6f1e6';
  ctx.fillText(label, building.x + building.w / 2, building.y + building.h / 2);
}

type Dir = 'n' | 'e' | 's' | 'w';
type LaneNode = { ix: number; iy: number; dir: Dir };
type Point = { x: number; y: number };
type Courier = {
  x: number;
  y: number;
  heading: number;
  from: Point;
  to: Point;
  dist: number;
  span: number;
};
type DeliveryPhase = 'to-stop' | 'dropoff' | 'leaving' | 'idle';
type ParkSpot = {
  goal: LaneNode;
  lane: Point;
  park: Point;
  door: Point;
};
type DeliveryRun = {
  phase: DeliveryPhase;
  truck: Vehicle | null;
  target: number | null;
  queue: number[];
  pause: number;
  leg: 'out' | 'back';
  courier: Courier | null;
  door: Point;
  spot: ParkSpot | null;
  pulling: boolean;
};

const ENTRY: Point = { x: AVENUES[0] - LANE, y: WORLD_H + 40 };
const EXIT: Point = { x: AVENUES[0] + LANE, y: WORLD_H + 48 };

let run: DeliveryRun = {
  phase: 'idle',
  truck: null,
  target: null,
  queue: [],
  pause: 0,
  leg: 'out',
  courier: null,
  door: { x: 0, y: 0 },
  spot: null,
  pulling: false,
};

function leftOf(dir: Dir): Dir {
  if (dir === 'n') return 'w';
  if (dir === 'w') return 's';
  if (dir === 's') return 'e';
  return 'n';
}

function rightOf(dir: Dir): Dir {
  if (dir === 'n') return 'e';
  if (dir === 'e') return 's';
  if (dir === 's') return 'w';
  return 'n';
}

function opposite(dir: Dir): Dir {
  if (dir === 'n') return 's';
  if (dir === 's') return 'n';
  if (dir === 'e') return 'w';
  return 'e';
}

function headingDir(heading: number): Dir {
  const east = Math.cos(heading);
  const south = Math.sin(heading);
  if (Math.abs(east) > Math.abs(south)) return east > 0 ? 'e' : 'w';
  return south > 0 ? 's' : 'n';
}

function lanePoint(node: LaneNode): Point {
  const x = AVENUES[node.ix];
  const y = STREETS[node.iy];
  if (node.dir === 'e') return { x, y: y + LANE };
  if (node.dir === 'w') return { x, y: y - LANE };
  if (node.dir === 's') return { x: x + LANE, y };
  return { x: x - LANE, y };
}

function approachOf(node: LaneNode): Waypoint {
  const x = AVENUES[node.ix];
  const y = STREETS[node.iy];
  const stop = isOpenSquare(node.ix, node.iy)
    ? undefined
    : { light: (node.dir === 'e' || node.dir === 'w' ? 'ew' : 'ns') as LightDir, ix: node.ix, iy: node.iy };
  const point = node.dir === 'e'
    ? { x: x - STOP, y: y + LANE }
    : node.dir === 'w'
      ? { x: x + STOP, y: y - LANE }
      : node.dir === 's'
        ? { x: x + LANE, y: y - STOP }
        : { x: x - LANE, y: y + STOP };
  return stop ? { ...point, stop } : point;
}

function nodeKey(node: LaneNode) {
  return `${node.ix},${node.iy},${node.dir}`;
}

function forward(node: LaneNode): LaneNode | null {
  if (node.dir === 'n' && node.iy > 0) return { ...node, iy: node.iy - 1 };
  if (node.dir === 's' && node.iy < STREETS.length - 1) return { ...node, iy: node.iy + 1 };
  if (node.dir === 'e' && node.ix < AVENUES.length - 1) return { ...node, ix: node.ix + 1 };
  if (node.dir === 'w' && node.ix > 0) return { ...node, ix: node.ix - 1 };
  return null;
}

function links(node: LaneNode) {
  const edges = [
    { node: { ...node, dir: leftOf(node.dir) }, cost: 16 },
    { node: { ...node, dir: rightOf(node.dir) }, cost: 16 },
    { node: { ...node, dir: opposite(node.dir) }, cost: 48 },
  ];
  const next = forward(node);
  if (next) {
    const span = Math.hypot(AVENUES[next.ix] - AVENUES[node.ix], STREETS[next.iy] - STREETS[node.iy]) || 40;
    edges.push({ node: next, cost: span });
  }
  return edges;
}

function routeNodes(from: LaneNode, to: LaneNode) {
  const goal = nodeKey(to);
  if (nodeKey(from) === goal) return [from];
  const dist = new Map<string, number>([[nodeKey(from), 0]]);
  const prev = new Map<string, LaneNode | null>([[nodeKey(from), null]]);
  const queue: LaneNode[] = [from];
  const seen = new Set<string>();
  while (queue.length) {
    queue.sort((a, b) => (dist.get(nodeKey(a)) ?? 1e9) - (dist.get(nodeKey(b)) ?? 1e9));
    const current = queue.shift();
    if (!current) break;
    const id = nodeKey(current);
    if (id === goal) break;
    if (seen.has(id)) continue;
    seen.add(id);
    links(current).forEach((edge) => {
      const nextId = nodeKey(edge.node);
      const cost = (dist.get(id) ?? 1e9) + edge.cost;
      if (cost < (dist.get(nextId) ?? 1e9)) {
        dist.set(nextId, cost);
        prev.set(nextId, current);
        queue.push(edge.node);
      }
    });
  }
  if (!prev.has(goal)) return [from];
  const path: LaneNode[] = [];
  let cursor: LaneNode | null | undefined = to;
  while (cursor) {
    path.push(cursor);
    cursor = prev.get(nodeKey(cursor)) ?? null;
  }
  path.reverse();
  return path;
}

function trace(nodes: LaneNode[], final: Point): Waypoint[] {
  const points: Waypoint[] = [];
  nodes.forEach((node, index) => {
    const previous = nodes[index - 1];
    const turned = previous && previous.ix === node.ix && previous.iy === node.iy;
    if (!turned && index > 0) points.push(approachOf(node));
    points.push(lanePoint(node));
  });
  points.push(final);
  return points;
}

function nearestNode(x: number, y: number, dir: Dir): LaneNode {
  let best: LaneNode = { ix: 0, iy: STREETS.length - 1, dir };
  let bestScore = Infinity;
  const fx = Math.cos(dir === 'e' ? 0 : dir === 'w' ? Math.PI : dir === 's' ? Math.PI / 2 : -Math.PI / 2);
  const fy = Math.sin(dir === 'e' ? 0 : dir === 'w' ? Math.PI : dir === 's' ? Math.PI / 2 : -Math.PI / 2);
  AVENUES.forEach((_, ix) => {
    STREETS.forEach((__, iy) => {
      (['n', 'e', 's', 'w'] as const).forEach((lane) => {
        const point = lanePoint({ ix, iy, dir: lane });
        const ahead = (point.x - x) * fx + (point.y - y) * fy;
        const score = Math.hypot(point.x - x, point.y - y) + (ahead < -12 ? 360 : 0) + (lane === dir ? 0 : 70);
        if (score < bestScore) {
          bestScore = score;
          best = { ix, iy, dir: lane };
        }
      });
    });
  });
  return best;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function blockOf(x: number, y: number) {
  let ix = 0;
  let iy = 0;
  for (let index = 0; index < AVENUES.length - 1; index += 1) if (x >= AVENUES[index]) ix = index;
  for (let index = 0; index < STREETS.length - 1; index += 1) if (y >= STREETS[index]) iy = index;
  return { ix, iy };
}

function buildingByNumber(number: number) {
  return CITY.buildings.find((building) => building.number === number) ?? null;
}

function parkFor(building: Building) {
  const cx = building.x + building.w / 2;
  const cy = building.y + building.h / 2;
  const { ix, iy } = blockOf(cx, cy);
  const alongX = clamp(cx, AVENUES[ix] + 52, AVENUES[ix + 1] - 52);
  const alongY = clamp(cy, STREETS[iy] + 52, STREETS[iy + 1] - 52);
  const curbs: Array<Omit<ParkSpot, 'door'> & { dist: number }> = [
    {
      dist: Math.abs(cy - (STREETS[iy] + LANE)),
      goal: { ix, iy, dir: 'e' },
      lane: { x: alongX, y: STREETS[iy] + LANE },
      park: { x: alongX, y: STREETS[iy] + ROAD / 2 - 2 },
    },
    {
      dist: Math.abs(cy - (STREETS[iy + 1] - LANE)),
      goal: { ix: ix + 1, iy: iy + 1, dir: 'w' },
      lane: { x: alongX, y: STREETS[iy + 1] - LANE },
      park: { x: alongX, y: STREETS[iy + 1] - ROAD / 2 + 2 },
    },
    {
      dist: Math.abs(cx - (AVENUES[ix] + LANE)),
      goal: { ix, iy, dir: 's' },
      lane: { x: AVENUES[ix] + LANE, y: alongY },
      park: { x: AVENUES[ix] + ROAD / 2 - 2, y: alongY },
    },
    {
      dist: Math.abs(cx - (AVENUES[ix + 1] - LANE)),
      goal: { ix: ix + 1, iy: iy + 1, dir: 'n' },
      lane: { x: AVENUES[ix + 1] - LANE, y: alongY },
      park: { x: AVENUES[ix + 1] - ROAD / 2 + 2, y: alongY },
    },
  ];
  curbs.sort((a, b) => a.dist - b.dist);
  const curb = curbs[0];
  const doorX = clamp(curb.park.x, building.x, building.x + building.w);
  const doorY = clamp(curb.park.y, building.y, building.y + building.h);
  const pull = Math.hypot(curb.park.x - doorX, curb.park.y - doorY) || 1;
  return {
    goal: curb.goal,
    lane: curb.lane,
    park: curb.park,
    door: {
      x: doorX + ((curb.park.x - doorX) / pull) * 6,
      y: doorY + ((curb.park.y - doorY) / pull) * 6,
    },
  };
}

function assignRoute(truck: Vehicle, points: Waypoint[]) {
  const route = points.filter((point, index, list) => {
    if (index === 0) return true;
    const previous = list[index - 1];
    return Math.hypot(point.x - previous.x, point.y - previous.y) > 4;
  });
  if (route.length < 2) route.push({ x: route[0].x + 0.5, y: route[0].y });
  truck.route = route;
  truck.seg = 0;
  truck.dist = 0;
  truck.wait = 0;
  truck.done = false;
  truck.speed = 0;
  truck.once = true;
  sync(truck);
}

function makeTruck(): Vehicle {
  return {
    route: [ENTRY, { x: ENTRY.x, y: ENTRY.y - 8 }],
    seg: 0,
    dist: 0,
    speed: 0,
    max: 58,
    kind: 'van',
    color: '#ff2f6d',
    length: 34,
    width: 16,
    x: ENTRY.x,
    y: ENTRY.y,
    heading: -Math.PI / 2,
    wait: 0,
    once: true,
    crown: true,
    done: false,
  };
}

function dispatch(truck: Vehicle, spot: ParkSpot, fromOutside: boolean) {
  const start = fromOutside
    ? { ix: 0, iy: STREETS.length - 1, dir: 'n' as const }
    : nearestNode(truck.x, truck.y, headingDir(truck.heading));
  const nodes = routeNodes(start, spot.goal);
  const traced = trace(nodes, spot.lane);
  const points = fromOutside
    ? [ENTRY, approachOf(start), ...traced, spot.park]
    : [{ x: truck.x, y: truck.y }, ...traced, spot.park];
  assignRoute(truck, points);
}

function curbNudge(dir: Dir): Point {
  if (dir === 'e') return { x: 8, y: 0 };
  if (dir === 'w') return { x: -8, y: 0 };
  if (dir === 's') return { x: 0, y: 8 };
  return { x: 0, y: -8 };
}

function onDeliveryBlock(truck: Vehicle, spot: ParkSpot) {
  const { ix, iy, dir } = spot.goal;
  const along = dir === 'e' || dir === 'w'
    ? Math.abs(truck.x - spot.park.x)
    : Math.abs(truck.y - spot.park.y);
  const across = dir === 'e' || dir === 'w'
    ? Math.abs(truck.y - spot.lane.y)
    : Math.abs(truck.x - spot.lane.x);
  if (along > 72 || across > 18) return false;
  if (dir === 'e') return truck.x > AVENUES[ix] + 14 && truck.x < AVENUES[ix + 1] - 6;
  if (dir === 'w') return truck.x < AVENUES[ix] - 14 && truck.x > AVENUES[ix - 1] + 6;
  if (dir === 's') return truck.y > STREETS[iy] + 14 && truck.y < STREETS[iy + 1] - 6;
  return truck.y < STREETS[iy] - 14 && truck.y > STREETS[iy - 1] + 6;
}

function sendToHouse(truck: Vehicle, number: number, fromOutside: boolean) {
  const building = buildingByNumber(number);
  if (!building) return false;
  const spot = parkFor(building);
  dispatch(truck, spot, fromOutside);
  run.phase = 'to-stop';
  run.target = number;
  run.door = spot.door;
  run.spot = spot;
  run.pulling = false;
  run.courier = null;
  run.pause = 0;
  run.leg = 'out';
  return true;
}

function sendOutside(truck: Vehicle) {
  run.pulling = false;
  const start = nearestNode(truck.x, truck.y, headingDir(truck.heading));
  const exit = { ix: 0, iy: STREETS.length - 1, dir: 's' as const };
  assignRoute(truck, [{ x: truck.x, y: truck.y }, ...trace(routeNodes(start, exit), EXIT)]);
  run.phase = 'leaving';
  run.target = null;
  run.courier = null;
}

function beginCourier(from: Point, to: Point): Courier {
  const span = Math.hypot(to.x - from.x, to.y - from.y) || 1;
  return {
    x: from.x,
    y: from.y,
    heading: Math.atan2(to.y - from.y, to.x - from.x),
    from,
    to,
    dist: 0,
    span,
  };
}

function moveCourier(courier: Courier, dt: number) {
  const speed = Math.min(28, Math.max(16, courier.span / 1.05));
  courier.dist = Math.min(courier.span, courier.dist + speed * dt);
  const t = courier.dist / courier.span;
  courier.x = courier.from.x + (courier.to.x - courier.from.x) * t;
  courier.y = courier.from.y + (courier.to.y - courier.from.y) * t;
  return courier.dist >= courier.span - 0.4;
}

function stepDelivery(dt: number) {
  if (run.phase === 'idle' || !run.truck) return;
  const truck = run.truck;
  if (run.phase === 'to-stop' && !truck.done && run.spot) {
    const spot = run.spot;
    if (Math.hypot(truck.x - spot.park.x, truck.y - spot.park.y) < 18) {
      truck.x = spot.park.x;
      truck.y = spot.park.y;
      truck.speed = 0;
      truck.done = true;
    } else if (!run.pulling && onDeliveryBlock(truck, spot)) {
      run.pulling = true;
      const nudge = curbNudge(spot.goal.dir);
      assignRoute(truck, [
        { x: truck.x, y: truck.y },
        spot.park,
        { x: spot.park.x + nudge.x, y: spot.park.y + nudge.y },
      ]);
    }
  }
  if (run.phase === 'to-stop' && truck.done) {
    run.phase = 'dropoff';
    run.pause = 0.45;
    run.leg = 'out';
    run.courier = null;
  }
  if (run.phase === 'dropoff') {
    if (run.pause > 0) {
      run.pause = Math.max(0, run.pause - dt);
      return;
    }
    if (!run.courier) run.courier = beginCourier({ x: truck.x, y: truck.y }, run.door);
    if (!moveCourier(run.courier, dt)) return;
    if (run.leg === 'out') {
      run.leg = 'back';
      run.pause = 0.7;
      return;
    }
    run.courier = null;
    const next = run.queue.shift();
    if (next === undefined) sendOutside(truck);
    else sendToHouse(truck, next, false);
    return;
  }
  if (run.phase === 'leaving' && truck.done) {
    vehicles = vehicles?.filter((vehicle) => vehicle !== truck) ?? null;
    run.phase = 'idle';
    run.truck = null;
    run.target = null;
    run.queue = [];
    run.spot = null;
    run.pulling = false;
  }
}

export function deliveryNote() {
  if (run.phase === 'idle' || !run.truck) return '';
  if (run.phase === 'leaving') return 'Heading out';
  const current = run.phase === 'to-stop' ? `On the way to ${run.target}` : `At ${run.target}`;
  return [current, ...run.queue.map((number) => `Then ${number}`)].join('\n');
}

export function requestDelivery(number: number) {
  if (!buildingByNumber(number)) return { ok: false, note: 'No house with that number.' };
  if (!vehicles) vehicles = spawn();
  if (run.phase === 'idle' || !run.truck) {
    const truck = makeTruck();
    vehicles.push(truck);
    run.truck = truck;
    run.queue = [];
    sendToHouse(truck, number, true);
    return { ok: true, note: deliveryNote() };
  }
  if (run.phase === 'leaving') {
    sendToHouse(run.truck, number, false);
    return { ok: true, note: deliveryNote() };
  }
  if (run.target === number && run.queue.length === 0) return { ok: true, note: deliveryNote() };
  if (run.queue[run.queue.length - 1] === number) return { ok: true, note: deliveryNote() };
  run.queue.push(number);
  return { ok: true, note: deliveryNote() };
}

export function paintCity(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
) {
  if (width < 2 || height < 2) return;
  if (!vehicles) vehicles = spawn();
  if (!walkers) walkers = buildWalkers();
  const dt = previousTime < 0 || time + 0.001 < previousTime ? 0 : Math.min(0.05, time - previousTime);
  previousTime = time;
  step(dt, time);
  stepWalkers(dt, time);
  stepDelivery(dt);
  const light = daySample(time);
  const view = fit(width, height);

  const margin = lerp(28, 10, light.night);
  ctx.fillStyle = `rgb(${Math.round(lerp(22, 8, light.night))}, ${Math.round(lerp(margin, 12, light.night))}, ${Math.round(lerp(18, 16, light.night))})`;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.translate(view.ox, view.oy);
  ctx.scale(view.scale, view.scale);

  ctx.fillStyle = '#b7aa96';
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);

  CITY.parks.forEach((park) => {
    const { x, y, w, h } = park;
    ctx.fillStyle = '#3c8f48';
    ctx.beginPath();
    ctx.moveTo(x + w * 0.2, y + h * 0.12);
    ctx.quadraticCurveTo(x + w * 0.55, y + h * 0.03, x + w * 0.84, y + h * 0.18);
    ctx.quadraticCurveTo(x + w * 0.97, y + h * 0.5, x + w * 0.76, y + h * 0.84);
    ctx.quadraticCurveTo(x + w * 0.4, y + h * 0.97, x + w * 0.16, y + h * 0.72);
    ctx.quadraticCurveTo(x + w * 0.03, y + h * 0.36, x + w * 0.2, y + h * 0.12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(236, 224, 196, 0.8)';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(park.path[0].x, park.path[0].y);
    park.path.forEach((point) => ctx.lineTo(point.x, point.y));
    ctx.closePath();
    ctx.stroke();
    drawPond(ctx, park.pond);
    drawDucks(ctx, park.pond, time);
    drawStatue(ctx, park.statue);
    park.benches.forEach((bench) => drawBench(ctx, bench));
    park.bins.forEach((bin) => drawBin(ctx, bin));
    park.trees.forEach(([tx, ty, radius]) => drawTree(ctx, tx, ty, radius));
  });

  ctx.fillStyle = '#3c4450';
  STREETS.forEach((y) => {
    ctx.fillRect(24, y - ROAD / 2, WORLD_W - 48, ROAD);
  });
  AVENUES.forEach((x) => {
    ctx.fillRect(x - ROAD / 2, 24, ROAD, WORLD_H - 48);
  });

  [[1, 1], [2, 1]].forEach(([ix, iy]) => {
    const x = AVENUES[ix];
    const y = STREETS[iy];
    ctx.fillStyle = '#efe3c8';
    roundRect(ctx, x - 86, y - 86, 172, 172, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(120, 96, 62, 0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#3c4450';
    ctx.fillRect(x - ROAD / 2, y - 86, ROAD, 172);
    ctx.fillRect(x - 86, y - ROAD / 2, 172, ROAD);
    ctx.fillStyle = '#8d6b45';
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => {
      ctx.save();
      ctx.translate(x + sx * 58, y + sy * 58);
      ctx.rotate(sx === sy ? 0.5 : -0.5);
      ctx.fillRect(-9, -2.2, 18, 4.4);
      ctx.restore();
      drawTree(ctx, x + sx * 46, y + sy * 46, 5.2);
    });
  });

  if (CITY.street) CITY.street.yards.forEach((yard) => drawYard(ctx, yard));

  if (CITY.houses) {
    const row = CITY.houses;
    ctx.fillStyle = 'rgba(236, 224, 196, 0.55)';
    ctx.fillRect(row.x + 12, row.y + row.h * 0.5 - 7, row.w - 24, 14);
  }

  if (CITY.street) CITY.street.bins.forEach((bin) => drawBin(ctx, bin));

  if (CITY.parking) {
    const lot = CITY.parking.bounds;
    ctx.fillStyle = '#343b46';
    ctx.fillRect(AVENUES[3] + LANE - 6, CITY.parking.mouthY - 13, lot.x + 22 - (AVENUES[3] + LANE - 6), 26);
    roundRect(ctx, lot.x + 6, lot.y + 6, lot.w - 12, lot.h - 12, 6);
    ctx.fill();
    ctx.fillStyle = '#4a5360';
    ctx.fillRect(lot.x + 10, lot.y + lot.h * 0.5 - 16, lot.w - 20, 32);
    ctx.strokeStyle = 'rgba(236, 228, 214, 0.45)';
    ctx.lineWidth = 1;
    const bayH = lot.h * 0.3;
    for (let x = lot.x + 14; x < lot.x + lot.w - 16; x += 22) {
      ctx.strokeRect(x, lot.y + 8, 18, bayH);
      ctx.strokeRect(x, lot.y + lot.h - 8 - bayH, 18, bayH);
    }
  }

  if (CITY.clock) {
    ctx.fillStyle = '#d7c4a4';
    ctx.beginPath();
    ctx.arc(CITY.clock.x, CITY.clock.y, 40, 0, Math.PI * 2);
    ctx.fill();
  }

  CITY.squares.forEach((square) => {
    ctx.fillStyle = '#cbbba2';
    roundRect(ctx, square.x + 4, square.y + 4, square.w - 8, square.h - 8, 10);
    ctx.fill();
    ctx.fillStyle = '#8fb7c9';
    ctx.beginPath();
    ctx.arc(square.x + square.w * 0.5, square.y + square.h * 0.48, 9, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.strokeStyle = '#4c5662';
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  CITY.lanes.forEach((lane) => {
    ctx.beginPath();
    ctx.moveTo(lane[0].x, lane[0].y);
    lane.forEach((point) => ctx.lineTo(point.x, point.y));
    ctx.closePath();
    ctx.stroke();
  });

  drawCarnival(ctx, CITY.carnival);
  CITY.sites.forEach((site) => drawSiteGround(ctx, site));
  CITY.trees.forEach((tree) => drawTree(ctx, tree.x, tree.y, tree.r));
  CITY.buildings.forEach((building) => drawBuilding(ctx, building, light.shadowX, light.shadowY));
  CITY.sites.forEach((site) => drawMallFront(ctx, site));
  ctx.restore();

  if (light.warm > 0.04) {
    ctx.fillStyle = `rgba(214, 112, 48, ${light.warm * 0.2})`;
    ctx.fillRect(0, 0, width, height);
  }
  if (light.night > 0.02) {
    ctx.fillStyle = `rgba(6, 10, 22, ${light.night * 0.62})`;
    ctx.fillRect(0, 0, width, height);
  }

  ctx.save();
  ctx.translate(view.ox, view.oy);
  ctx.scale(view.scale, view.scale);

  ctx.strokeStyle = 'rgba(236, 228, 214, 0.35)';
  ctx.lineWidth = 1.2;
  ctx.setLineDash([8, 10]);
  STREETS.forEach((y) => {
    ctx.beginPath();
    ctx.moveTo(36, y);
    ctx.lineTo(WORLD_W - 36, y);
    ctx.stroke();
  });
  AVENUES.forEach((x) => {
    ctx.beginPath();
    ctx.moveTo(x, 36);
    ctx.lineTo(x, WORLD_H - 36);
    ctx.stroke();
  });
  ctx.setLineDash([]);

  ctx.fillStyle = 'rgba(236, 228, 214, 0.55)';
  AVENUES.forEach((x, ix) => {
    STREETS.forEach((y, iy) => {
      if (isOpenSquare(ix, iy)) return;
      for (let stripe = 0; stripe < 4; stripe += 1) {
        const offset = -16 + stripe * 9;
        ctx.fillRect(x + offset, y - ROAD / 2 - 5, 4, 5);
        ctx.fillRect(x + offset, y + ROAD / 2, 4, 5);
        ctx.fillRect(x - ROAD / 2 - 5, y + offset, 5, 4);
        ctx.fillRect(x + ROAD / 2, y + offset, 5, 4);
      }
    });
  });

  drawZebra(ctx, 106, STREETS[2] - ROAD / 2, STREETS[2] + ROAD / 2);
  drawZebra(ctx, 1084, STREETS[1] - ROAD / 2, STREETS[1] + ROAD / 2);

  CITY.parks.forEach((park) => {
    park.lamps.forEach((lamp) => drawParkLamp(ctx, lamp, light.night));
  });
  CITY.street?.lamps.forEach((lamp) => drawParkLamp(ctx, lamp, light.night));
  CITY.carnival.lamps.forEach((lamp) => drawParkLamp(ctx, lamp, light.night));
  ctx.strokeStyle = `rgba(255, 214, 140, ${0.45 + light.night * 0.4})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  CITY.carnival.lamps.slice(0, 6).forEach((lamp, index) => {
    const sag = index % 2 === 0 ? 0 : 5;
    if (index === 0) ctx.moveTo(lamp.x, lamp.y);
    else ctx.lineTo(lamp.x, lamp.y + sag);
  });
  ctx.moveTo(CITY.carnival.lamps[6].x, CITY.carnival.lamps[6].y);
  CITY.carnival.lamps.slice(6).forEach((lamp, index) => {
    const sag = index % 2 === 0 ? 0 : 4;
    ctx.lineTo(lamp.x, lamp.y + sag);
  });
  ctx.stroke();
  drawCarnivalLights(ctx, CITY.carnival, light.night);

  if (light.night > 0.2) {
    CITY.buildings.forEach((building) => {
      const pane = building.kind === 'house' ? 2.2 : 2.6;
      building.windows.forEach(([x, y, lit]) => {
        ctx.fillStyle = `rgba(255, 214, 150, ${lit * light.night})`;
        ctx.fillRect(x, y, pane, pane);
      });
    });
    LAMPS.forEach((lamp) => {
      const glow = ctx.createRadialGradient(lamp.x, lamp.y, 0.5, lamp.x, lamp.y, 9);
      glow.addColorStop(0, `rgba(255, 214, 140, ${0.32 * light.night})`);
      glow.addColorStop(1, 'rgba(255, 214, 140, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(lamp.x, lamp.y, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffe1a8';
      ctx.beginPath();
      ctx.arc(lamp.x, lamp.y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  vehicles.forEach((vehicle) => {
    if (!vehicle.crown) drawHeadlights(ctx, vehicle, light.night);
  });
  vehicles.forEach((vehicle) => {
    if (!vehicle.crown) drawVehicle(ctx, vehicle, time);
  });
  CITY.parking?.cars.forEach((car) => {
    drawVehicle(ctx, {
      x: car.x,
      y: car.y,
      heading: car.heading,
      color: car.color,
      length: car.length,
      width: car.width,
      kind: 'car',
      speed: 20,
      max: 20,
      wait: 1,
      route: [],
      seg: 0,
      dist: 0,
    }, time);
  });
  CITY.sites.forEach((site) => site.rigs.forEach((rig) => drawRig(ctx, rig)));

  AVENUES.forEach((x, ix) => {
    STREETS.forEach((y, iy) => {
      if (isOpenSquare(ix, iy)) return;
      const ew = phaseOf({ light: 'ew', ix, iy }, time);
      const ns = phaseOf({ light: 'ns', ix, iy }, time);
      drawSignal(ctx, x - 22, y + ROAD / 2 + 6, ew);
      drawSignal(ctx, x + 22, y - ROAD / 2 - 6, ew);
      drawSignal(ctx, x + ROAD / 2 + 6, y - 22, ns);
      drawSignal(ctx, x - ROAD / 2 - 6, y + 22, ns);
    });
  });

  walkers?.forEach((walker) => drawWalker(ctx, walker, time));
  vehicles.forEach((vehicle) => {
    if (!vehicle.crown) return;
    drawHeadlights(ctx, vehicle, light.night);
    drawVehicle(ctx, vehicle, time);
  });
  if (run.courier) {
    drawWalker(ctx, {
      route: [],
      seg: 0,
      dist: 0,
      speed: 0,
      x: run.courier.x,
      y: run.courier.y,
      heading: run.courier.heading,
      coat: '#ff2f6d',
      hair: '#241c18',
      waiting: false,
      scale: 1.15,
    }, time);
  }
  CITY.sites.forEach((site) => {
    if (!site.guard) return;
    drawWalker(ctx, {
      route: [],
      seg: 0,
      dist: 0,
      speed: 0,
      x: site.guard.x,
      y: site.guard.y,
      heading: Math.PI,
      coat: '#243044',
      hair: '#1a1816',
      waiting: true,
      scale: 1,
    }, time);
  });

  if (CITY.clock) {
    const { x, y } = CITY.clock;
    ctx.fillStyle = '#f7f1e4';
    ctx.beginPath();
    ctx.arc(x, y, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2c261c';
    ctx.lineWidth = 1.4;
    for (let tick = 0; tick < 12; tick += 1) {
      const angle = (tick / 12) * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(angle) * 18, y + Math.sin(angle) * 18);
      ctx.lineTo(x + Math.cos(angle) * 23, y + Math.sin(angle) * 23);
      ctx.stroke();
    }
    const minute = ((time / 20) % 1) * Math.PI * 2 - Math.PI / 2;
    const hour = ((time / 240) % 1) * Math.PI * 2 - Math.PI / 2;
    ctx.lineCap = 'round';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(hour) * 12, y + Math.sin(hour) * 12);
    ctx.stroke();
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(minute) * 18, y + Math.sin(minute) * 18);
    ctx.stroke();
    ctx.fillStyle = '#2c261c';
    ctx.beginPath();
    ctx.arc(x, y, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }

  CITY.buildings.forEach((building) => drawNumber(ctx, building));
  ctx.restore();
}
