import type { SnapshotExtras, SortAux, SortFrame, SortRole } from './types';

export function range(start: number, end: number) {
  const indexes = [];
  for (let index = start; index < end; index += 1) indexes.push(index);
  return indexes;
}

export function formatNum(value: number | null | undefined) {
  if (value == null || Number.isNaN(Number(value))) return '';
  const number = Number(value);
  if (Number.isInteger(number)) return String(number);
  return number.toFixed(2).replace(/0$/, '').replace(/\.0$/, '');
}

function cloneAux(aux: SortAux | null | undefined): SortAux | null {
  if (!aux) return null;
  if (aux.kind === 'count') return { ...aux, cells: [...aux.cells] };
  return { ...aux, buckets: aux.buckets.map((bucket) => [...bucket]) };
}

export function snapshot(values: Array<number | null | string>, extras: SnapshotExtras = {}): SortFrame {
  return {
    values: values.map((value) => {
      if (value == null || value === '') return null;
      const number = Number(value);
      return Number.isNaN(number) ? null : number;
    }),
    roles: { ...(extras.roles ?? {}) },
    sorted: [...(extras.sorted ?? [])],
    note: extras.note ?? '',
    caption: extras.caption ?? '',
    aux: cloneAux(extras.aux),
    shape: extras.shape,
  };
}

export function markRange(start: number, end: number, role: SortRole, extra: Partial<Record<number, SortRole>> = {}) {
  const roles = { ...extra };
  for (let index = start; index < end; index += 1) {
    if (roles[index] == null) roles[index] = role;
  }
  return roles;
}

const ROLE_TONE: Record<SortRole, string> = {
  compare: 'compare',
  read: 'compare',
  min: 'min',
  pivot: 'pivot',
  swap: 'swap',
  write: 'write',
  region: 'region',
  sorted: 'sorted',
};

export function toneAt(frame: Pick<SortFrame, 'roles' | 'sorted'> | null | undefined, index: number) {
  const role = frame?.roles?.[index];
  if (role && ROLE_TONE[role]) return ROLE_TONE[role];
  if (frame?.sorted?.includes(index)) return 'sorted';
  return 'idle';
}
