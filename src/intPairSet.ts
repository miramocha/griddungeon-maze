// Insertion-ordered int pair set. .NET 10 HashSet<(int,int)> enumerates entries
// in add order when cells are only added or unioned (no removals). Verified
// against dotnet 10.0.11.

export type Cell = { readonly x: number; readonly y: number }

export type IntPairSet = {
  size: number
  add(x: number, y: number): void
  has(x: number, y: number): boolean
  unionWith(other: IntPairSet): void
  toArray(): Cell[]
}

function key(x: number, y: number): string {
  return `${x},${y}`
}

export function createIntPairSet(cells: readonly Cell[] = []): IntPairSet {
  const order: Cell[] = []
  const index = new Map<string, number>()

  const set: IntPairSet = {
    get size() {
      return order.length
    },
    add(x: number, y: number) {
      const id = key(x, y)
      if (index.has(id)) return
      index.set(id, order.length)
      order.push({ x, y })
    },
    has(x: number, y: number) {
      return index.has(key(x, y))
    },
    unionWith(other: IntPairSet) {
      for (const cell of other.toArray()) set.add(cell.x, cell.y)
    },
    toArray() {
      return order.slice()
    },
  }

  for (const cell of cells) set.add(cell.x, cell.y)
  return set
}
