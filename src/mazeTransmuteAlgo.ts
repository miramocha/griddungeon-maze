// Shared maze transmuter helpers ported from mazelib MazeTransmuteAlgo.py (MIT) —
// https://github.com/john-science/mazelib/blob/main/mazelib/transmute/MazeTransmuteAlgo.py

import type { DotNetRandom } from './dotNetRandom.ts'
import type { Cell } from './intPairSet.ts'
import { shuffle } from './mazeGenAlgo.ts'
import { isOpen, isWall, type MazeGrid } from './mazeGrid.ts'
import type { MazeTransmutationParams } from './mazeTransmutationParams.ts'

export function isWithinOne(
  x: number,
  y: number,
  targetX: number | null | undefined,
  targetY: number | null | undefined,
): boolean {
  if (targetX == null || targetY == null) return false
  if (x === targetX) return Math.abs(y - targetY) < 2
  if (y === targetY) return Math.abs(x - targetX) < 2
  return false
}

export function findUnblockedNeighbors(
  grid: MazeGrid,
  random: DotNetRandom,
  x: number,
  y: number,
): Cell[] {
  const neighbors: Cell[] = []
  if (y > 1 && isOpen(grid, x, y - 1) && isOpen(grid, x, y - 2)) neighbors.push({ x, y: y - 2 })
  if (y < grid.height - 2 && isOpen(grid, x, y + 1) && isOpen(grid, x, y + 2)) {
    neighbors.push({ x, y: y + 2 })
  }
  if (x > 1 && isOpen(grid, x - 1, y) && isOpen(grid, x - 2, y)) neighbors.push({ x: x - 2, y })
  if (x < grid.width - 2 && isOpen(grid, x + 1, y) && isOpen(grid, x + 2, y)) {
    neighbors.push({ x: x + 2, y })
  }
  shuffle(random, neighbors)
  return neighbors
}

export function findLatticeNeighbors(
  grid: MazeGrid,
  random: DotNetRandom,
  x: number,
  y: number,
  wantWall: boolean,
): Cell[] {
  const neighbors: Cell[] = []
  if (y > 1 && isWall(grid, x, y - 2) === wantWall) neighbors.push({ x, y: y - 2 })
  if (y < grid.height - 2 && isWall(grid, x, y + 2) === wantWall) neighbors.push({ x, y: y + 2 })
  if (x > 1 && isWall(grid, x - 2, y) === wantWall) neighbors.push({ x: x - 2, y })
  if (x < grid.width - 2 && isWall(grid, x + 2, y) === wantWall) neighbors.push({ x: x + 2, y })
  shuffle(random, neighbors)
  return neighbors
}

export function midpoint(a: Cell, b: Cell): Cell {
  return { x: Math.trunc((a.x + b.x) / 2), y: Math.trunc((a.y + b.y) / 2) }
}

export function isStartCell(params: MazeTransmutationParams, x: number, y: number): boolean {
  return params.startX === x && params.startY === y
}

export function isEndCell(params: MazeTransmutationParams, x: number, y: number): boolean {
  return params.endX === x && params.endY === y
}
