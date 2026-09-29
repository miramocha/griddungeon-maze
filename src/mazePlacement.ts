import type { Cell } from './intPairSet.ts'
import { isOpen, type MazeGrid } from './mazeGrid.ts'
import { mazeCellPosition, mazeVertexPosition } from './mazeSpace.ts'
import { placedWallEdges, tileForOpenCell, TILE_EDGES, wallYawSteps, type TileEdge } from './mazeTileRecipe.ts'

export interface MazeVertex {
  i: number
  j: number
}

export type MazePlacementKind = 'floor' | 'wall' | 'column' | 'floorGap' | 'elevator'

export interface MazePlacement {
  kind: MazePlacementKind
  yawSteps: number
  position: [number, number, number]
}

function cellOpen(grid: MazeGrid, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= grid.width || y >= grid.height) return false
  return isOpen(grid, x, y)
}

/** Vertices where four open cells meet. */
export function floorGapVertices(grid: MazeGrid): MazeVertex[] {
  const vertices: MazeVertex[] = []
  for (let j = 0; j <= grid.height; j += 1) {
    for (let i = 0; i <= grid.width; i += 1) {
      if (
        cellOpen(grid, i - 1, j - 1) &&
        cellOpen(grid, i, j - 1) &&
        cellOpen(grid, i - 1, j) &&
        cellOpen(grid, i, j)
      ) {
        vertices.push({ i, j })
      }
    }
  }
  return vertices
}

function wallEndpoints(x: number, y: number, edge: TileEdge): [MazeVertex, MazeVertex] {
  if (edge === 'n') return [{ i: x, j: y + 1 }, { i: x + 1, j: y + 1 }]
  if (edge === 'e') return [{ i: x + 1, j: y }, { i: x + 1, j: y + 1 }]
  if (edge === 's') return [{ i: x, j: y }, { i: x + 1, j: y }]
  return [{ i: x, j: y }, { i: x, j: y + 1 }]
}

function vertexKey(vertex: MazeVertex, span: number): number {
  return vertex.i + vertex.j * span
}

/** One vertex per wall-segment endpoint. Sorted by north, then east. */
export function columnVertices(grid: MazeGrid): MazeVertex[] {
  const seen = new Set<number>()
  const span = grid.width + 1
  const vertices: MazeVertex[] = []
  for (let y = 0; y < grid.height; y += 1) {
    for (let x = 0; x < grid.width; x += 1) {
      const tile = tileForOpenCell(grid, x, y)
      if (!tile) continue
      for (const edge of placedWallEdges(tile)) {
        for (const vertex of wallEndpoints(x, y, edge)) {
          const key = vertexKey(vertex, span)
          if (seen.has(key)) continue
          seen.add(key)
          vertices.push(vertex)
        }
      }
    }
  }
  vertices.sort((left, right) => left.j - right.j || left.i - right.i)
  return vertices
}

function isPortalCell(cells: readonly Cell[], x: number, y: number): boolean {
  return cells.some((cell) => cell.x === x && cell.y === y)
}

function uniqueCells(cells: readonly Cell[]): Cell[] {
  const unique: Cell[] = []
  for (const cell of cells) {
    if (unique.some((kept) => kept.x === cell.x && kept.y === cell.y)) continue
    unique.push(cell)
  }
  return unique
}

/** Unshifted maze-space slots. Floor circle copies stay with the mesh adapter. */
export function planMazePlacements(
  grid: MazeGrid,
  cellM: number,
  wallRest: TileEdge | null,
  portalCells: readonly Cell[],
): MazePlacement[] {
  const placements: MazePlacement[] = []
  for (let y = 0; y < grid.height; y += 1) {
    for (let x = 0; x < grid.width; x += 1) {
      if (!isOpen(grid, x, y)) continue
      const tile = tileForOpenCell(grid, x, y)
      if (!tile) continue
      const position = mazeCellPosition(x, y, cellM)
      if (!isPortalCell(portalCells, x, y)) {
        placements.push({ kind: 'floor', yawSteps: 0, position })
      }
      if (!wallRest) continue
      for (const edge of placedWallEdges(tile)) {
        placements.push({
          kind: 'wall',
          yawSteps: wallYawSteps(TILE_EDGES.indexOf(edge), wallRest),
          position,
        })
      }
    }
  }
  for (const vertex of columnVertices(grid)) {
    placements.push({
      kind: 'column',
      yawSteps: 0,
      position: mazeVertexPosition(vertex.i, vertex.j, cellM),
    })
  }
  for (const vertex of floorGapVertices(grid)) {
    placements.push({
      kind: 'floorGap',
      yawSteps: 0,
      position: mazeVertexPosition(vertex.i, vertex.j, cellM),
    })
  }
  for (const cell of uniqueCells(portalCells)) {
    placements.push({
      kind: 'elevator',
      yawSteps: 0,
      position: mazeCellPosition(cell.x, cell.y, cellM),
    })
  }
  return placements
}
