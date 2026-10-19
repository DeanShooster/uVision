export type Placed = { id: number; value: number | null };

export function placeBars(previous: Placed[] | null, values: Array<number | null>): Placed[] {
  if (!previous || previous.length !== values.length) {
    return values.map((value, index) => ({ id: index, value }));
  }

  const pools = new Map<string, number[]>();
  previous.forEach((bar) => {
    const key = bar.value == null ? 'x' : String(bar.value);
    const list = pools.get(key);
    if (list) list.push(bar.id);
    else pools.set(key, [bar.id]);
  });

  let nextId = previous.reduce((max, bar) => Math.max(max, bar.id), -1) + 1;
  let carried = 0;
  const placed: Placed[] = values.map((value) => {
    const key = value == null ? 'x' : String(value);
    const list = pools.get(key);
    const id = list?.shift();
    if (id == null) {
      const fresh = nextId;
      nextId += 1;
      return { id: fresh, value };
    }
    carried += 1;
    return { id, value };
  });

  if (carried < Math.ceil(values.length / 2)) {
    return values.map((value, index) => ({ id: nextId + index, value }));
  }
  return placed;
}
