export type DiffStatus = 'added' | 'removed' | 'changed' | 'unchanged';

export interface DiffNode {
  key: string;
  status: DiffStatus;
  oldValue?: unknown;
  newValue?: unknown;
  children?: DiffNode[];
}

function isObject(val: unknown): val is Record<string, unknown> {
  return val !== null && typeof val === 'object';
}

export function computeDiff(oldObj: unknown, newObj: unknown, key: string = 'root'): DiffNode {
  if (oldObj === newObj) {
    return { key, status: 'unchanged', oldValue: oldObj, newValue: newObj };
  }

  if (!isObject(oldObj) || !isObject(newObj)) {
    if (oldObj === undefined) {
      return { key, status: 'added', newValue: newObj };
    }
    if (newObj === undefined) {
      return { key, status: 'removed', oldValue: oldObj };
    }
    return { key, status: 'changed', oldValue: oldObj, newValue: newObj };
  }


  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
  const children: DiffNode[] = [];
  let allUnchanged = true;

  for (const k of Array.from(allKeys).sort()) {
    const oldVal = (oldObj as Record<string, unknown>)[k];
    const newVal = (newObj as Record<string, unknown>)[k];

    if (oldVal === undefined && newVal !== undefined) {
      children.push({ key: k, status: 'added', newValue: newVal });
      allUnchanged = false;
    } else if (oldVal !== undefined && newVal === undefined) {
      children.push({ key: k, status: 'removed', oldValue: oldVal });
      allUnchanged = false;
    } else {
      const childDiff = computeDiff(oldVal, newVal, k);
      children.push(childDiff);
      if (childDiff.status !== 'unchanged') {
        allUnchanged = false;
      }
    }
  }

  return {
    key,
    status: allUnchanged ? 'unchanged' : 'changed',
    children
  };
}
