// Dead-end filler ported from mazelib DeadEndFiller.py (MIT).

import type { DotNetRandom } from './dotNetRandom.ts'
import { findUnblockedNeighbors, isWithinOne } from './mazeTransmuteAlgo.ts'
import { createTransmuteRandom, type MazeTransmutationParams } from './mazeTransmutationParams.ts'
import { getCell, isWall, mazeOpen, mazeWall, setCell, type MazeGrid } from './mazeGrid.ts'

function isDeadEnd(grid: MazeGrid, random: DotNetRandom, x: number, y: number): boolean {
  if (isWall(grid, x, y)) return false
  return findUnblockedNeighbors(grid, random, x, y).length < 2
}

function tryFindDeadEnd(
  grid: MazeGrid,
  random: DotNetRandom,
  params: MazeTransmutationParams,
): { x: number; y: number } | null {
  for (let y = 1; y < grid.height; y += 2) {
    for (let x = 1; x < grid.width; x += 2) {
      if (isWithinOne(x, y, params.startX, params.startY)) continue
      if (isWithinOne(x, y, params.endX, params.endY)) continue
      if (isDeadEnd(grid, random, x, y)) return { x, y }
    }
  }
  return null
}

export function transmuteDeadEndFiller(grid: MazeGrid, params: MazeTransmutationParams): void {
  const random = createTransmuteRandom(params)
  const startX = params.startX
  const startY = params.startY
  const endX = params.endX
  const endY = params.endY
  let startSave = 0
  let endSave = 0
  if (startX != null && startY != null) {
    startSave = getCell(grid, startX, startY)
    setCell(grid, startX, startY, mazeOpen)
  }
  if (endX != null && endY != null) {
    endSave = getCell(grid, endX, endY)
    setCell(grid, endX, endY, mazeOpen)
  }

  const iterations = (params.deadEndIterations ?? 1) > 0 ? (params.deadEndIterations ?? 1) : 100
  let found = true
  for (let i = 0; i < iterations && found; i += 1) {
    const first = tryFindDeadEnd(grid, random, params)
    if (!first) {
      found = false
      break
    }
    found = false
    let deadEnd: { x: number; y: number } | null = first
    while (deadEnd && deadEnd.x >= 0) {
      found = true
      const x = deadEnd.x
      const y = deadEnd.y
      setCell(grid, x, y, mazeWall)
      setCell(grid, x, y - 1, mazeWall)
      setCell(grid, x, y + 1, mazeWall)
      setCell(grid, x - 1, y, mazeWall)
      setCell(grid, x + 1, y, mazeWall)
      const neighbors = findUnblockedNeighbors(grid, random, x, y)
      if (neighbors.length === 0) break
      const only = neighbors[0]
      if (neighbors.length === 1 && only && isDeadEnd(grid, random, only.x, only.y)) {
        deadEnd = only
        continue
      }
      deadEnd = tryFindDeadEnd(grid, random, params)
    }
  }

  if (startX != null && startY != null) setCell(grid, startX, startY, startSave)
  if (endX != null && endY != null) setCell(grid, endX, endY, endSave)
}
