// Entrance and exit for one maze. Two BFS sweeps approximate the long route.
// No random stream: the same grid always returns the same cells.

import type { Cell } from './intPairSet.ts'
import { isOpen, type MazeGrid } from './mazeGrid.ts'

export interface FloorPortals {
  entrance: Cell
  exit: Cell
  distance: number
}

const NEIGHBORS = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
] as const

export function placeFloorPortals(grid: MazeGrid): FloorPortals {
  const origin = firstOpen(grid)
  if (!origin) throw new Error('Maze has no open cell.')
  const entrance = farthestOpen(grid, origin)
  const exit = farthestOpen(grid, entrance.cell)
  return { entrance: entrance.cell, exit: exit.cell, distance: exit.distance }
}

/** Open-cell steps from `from` to `to`. Closed, out of range, or unreachable cells are 0. */
export function cellDistance(grid: MazeGrid, from: Cell, to: Cell): number {
  if (!inside(grid, from.x, from.y) || !inside(grid, to.x, to.y)) return 0
  if (!isOpen(grid, from.x, from.y) || !isOpen(grid, to.x, to.y)) return 0
  if (from.x === to.x && from.y === to.y) return 0
  const seen = new Uint8Array(grid.width * grid.height)
  const queue: Array<{ x: number; y: number; distance: number }> = [{ x: from.x, y: from.y, distance: 0 }]
  seen[indexOf(grid, from.x, from.y)] = 1
  let head = 0
  while (head < queue.length) {
    const current = queue[head]
    head += 1
    if (!current) continue
    if (current.x === to.x && current.y === to.y) return current.distance
    for (const step of NEIGHBORS) {
      const x = current.x + step.x
      const y = current.y + step.y
      if (!inside(grid, x, y) || !isOpen(grid, x, y)) continue
      const index = indexOf(grid, x, y)
      if (seen[index]) continue
      seen[index] = 1
      queue.push({ x, y, distance: current.distance + 1 })
    }
  }
  return 0
}

function inside(grid: MazeGrid, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < grid.width && y < grid.height
}

function firstOpen(grid: MazeGrid): Cell | null {
  // Y = 0 is south. Row-major order picks the south-most open cell, then the west-most.
  for (let y = 0; y < grid.height; y += 1) {
    for (let x = 0; x < grid.width; x += 1) {
      if (isOpen(grid, x, y)) return { x, y }
    }
  }
  return null
}

function farthestOpen(grid: MazeGrid, origin: Cell): { cell: Cell; distance: number } {
  const seen = new Uint8Array(grid.width * grid.height)
  const distances = new Int32Array(grid.width * grid.height)
  const queue: Cell[] = [origin]
  seen[indexOf(grid, origin.x, origin.y)] = 1
  let head = 0
  let best = origin
  let bestDistance = 0
  while (head < queue.length) {
    const current = queue[head] as Cell
    const currentDistance = distances[indexOf(grid, current.x, current.y)]
    head += 1
    if (prefers(grid, current, currentDistance, best, bestDistance)) {
      best = current
      bestDistance = currentDistance
    }
    for (const step of NEIGHBORS) {
      const x = current.x + step.x
      const y = current.y + step.y
      if (x < 0 || y < 0 || x >= grid.width || y >= grid.height) continue
      if (!isOpen(grid, x, y)) continue
      const index = indexOf(grid, x, y)
      if (seen[index]) continue
      seen[index] = 1
      distances[index] = currentDistance + 1
      queue.push({ x, y })
    }
  }
  return { cell: best, distance: bestDistance }
}

function prefers(
  grid: MazeGrid,
  current: Cell,
  currentDistance: number,
  best: Cell,
  bestDistance: number,
): boolean {
  if (currentDistance > bestDistance) return true
  if (currentDistance < bestDistance) return false
  const currentNeighbors = openNeighborCount(grid, current)
  const bestNeighbors = openNeighborCount(grid, best)
  if (currentNeighbors !== bestNeighbors) return currentNeighbors < bestNeighbors
  if (current.y !== best.y) return current.y < best.y
  return current.x < best.x
}

function openNeighborCount(grid: MazeGrid, cell: Cell): number {
  let count = 0
  for (const step of NEIGHBORS) {
    const x = cell.x + step.x
    const y = cell.y + step.y
    if (x < 0 || y < 0 || x >= grid.width || y >= grid.height) continue
    if (isOpen(grid, x, y)) count += 1
  }
  return count
}

function indexOf(grid: MazeGrid, x: number, y: number): number {
  return y * grid.width + x
}
