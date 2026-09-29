import { isOpen, isWall, type MazeGrid } from './mazeGrid.ts'

export const TILE_EDGES = ['n', 'e', 's', 'w'] as const
export type TileEdge = (typeof TILE_EDGES)[number]

export type TileRecipeId = 'floor' | 'edge' | 'straight' | 'corner' | 'deadEnd'

const CANONICAL_EDGES: Record<TileRecipeId, readonly TileEdge[]> = {
  floor: [],
  edge: ['n'],
  straight: ['n', 's'],
  corner: ['n', 'e'],
  deadEnd: ['n', 'e', 'w'],
}

export interface OpenCellTile {
  recipe: TileRecipeId
  /** Quarter-turns of −90° around up. 0 keeps a north-authored wall. */
  yawSteps: number
}

function rotateEdge(edge: TileEdge, steps: number): TileEdge {
  const index = TILE_EDGES.indexOf(edge)
  const next = (index + ((steps % 4) + 4)) % 4
  return TILE_EDGES[next] ?? 'n'
}

function sameEdges(left: readonly TileEdge[], right: ReadonlySet<TileEdge>): boolean {
  if (left.length !== right.size) return false
  return left.every((edge) => right.has(edge))
}

function oppositeEdges(blocked: ReadonlySet<TileEdge>): boolean {
  return (blocked.has('n') && blocked.has('s')) || (blocked.has('e') && blocked.has('w'))
}

/** Map blocked neighbor edges to one canonical recipe and a single wall yaw. */
export function openCellTile(blocked: ReadonlySet<TileEdge>): OpenCellTile {
  const count = blocked.size
  if (count === 0 || count > 3) return { recipe: 'floor', yawSteps: 0 }
  const recipe: TileRecipeId =
    count === 1 ? 'edge' : count === 3 ? 'deadEnd' : oppositeEdges(blocked) ? 'straight' : 'corner'
  const canonical = CANONICAL_EDGES[recipe]
  for (let steps = 0; steps < 4; steps += 1) {
    const turned = canonical.map((edge) => rotateEdge(edge, steps))
    if (sameEdges(turned, blocked)) return { recipe, yawSteps: steps }
  }
  return { recipe: 'floor', yawSteps: 0 }
}

export function placedWallEdges(tile: OpenCellTile): TileEdge[] {
  return CANONICAL_EDGES[tile.recipe].map((edge) => rotateEdge(edge, tile.yawSteps))
}

function neighborBlocked(grid: MazeGrid, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= grid.width || y >= grid.height) return true
  return isWall(grid, x, y)
}

export function blockedEdges(grid: MazeGrid, x: number, y: number): Set<TileEdge> {
  const blocked = new Set<TileEdge>()
  if (neighborBlocked(grid, x, y + 1)) blocked.add('n')
  if (neighborBlocked(grid, x + 1, y)) blocked.add('e')
  if (neighborBlocked(grid, x, y - 1)) blocked.add('s')
  if (neighborBlocked(grid, x - 1, y)) blocked.add('w')
  return blocked
}

export function tileForOpenCell(grid: MazeGrid, x: number, y: number): OpenCellTile | null {
  if (!isOpen(grid, x, y)) return null
  return openCellTile(blockedEdges(grid, x, y))
}

/** Quarter-turns of −90° around up so a wall authored on `rest` lands on the recipe edge. */
export function wallYawSteps(recipeYawSteps: number, rest: TileEdge): number {
  const restIndex = TILE_EDGES.indexOf(rest)
  return (recipeYawSteps - restIndex + 4) % 4
}
