// Cul-de-sac (loop) filler ported from mazelib CuldeSacFiller.py (MIT).

import type { Cell } from './intPairSet.ts'
import type { DotNetRandom } from './dotNetRandom.ts'
import { findUnblockedNeighbors, isEndCell, isStartCell } from './mazeTransmuteAlgo.ts'
import { createTransmuteRandom, type MazeTransmutationParams } from './mazeTransmutationParams.ts'
import { isWall, MAZE_WALL, setCell, type MazeGrid } from './mazeGrid.ts'

function tryFindNextIntersection(
  grid: MazeGrid,
  random: DotNetRandom,
  startX: number,
  startY: number,
  firstStep: Cell,
): Cell | null {
  let previousX = startX
  let previousY = startY
  let currentX = firstStep.x
  let currentY = firstStep.y
  const stepLimit = grid.width * grid.height
  let steps = 0
  let neighbors = findUnblockedNeighbors(grid, random, currentX, currentY)
  while (neighbors.length === 2) {
    steps += 1
    if (steps > stepLimit) return null
    const first = neighbors[0] as Cell
    const second = neighbors[1] as Cell
    if (first.x === previousX && first.y === previousY) {
      previousX = currentX
      previousY = currentY
      currentX = second.x
      currentY = second.y
    } else {
      previousX = currentX
      previousY = currentY
      currentX = first.x
      currentY = first.y
    }
    if (currentX === startX && currentY === startY) return { x: previousX, y: previousY }
    neighbors = findUnblockedNeighbors(grid, random, currentX, currentY)
  }
  return { x: currentX, y: currentY }
}

export function transmuteCuldeSacFiller(grid: MazeGrid, params: MazeTransmutationParams): void {
  const random = createTransmuteRandom(params)
  for (let y = 1; y < grid.height; y += 2) {
    for (let x = 1; x < grid.width; x += 2) {
      if (isStartCell(params, x, y) || isEndCell(params, x, y)) continue
      if (isWall(grid, x, y)) continue
      const neighbors = findUnblockedNeighbors(grid, random, x, y)
      if (neighbors.length !== 2) continue
      const end1 = tryFindNextIntersection(grid, random, x, y, neighbors[0] as Cell)
      const end2 = tryFindNextIntersection(grid, random, x, y, neighbors[1] as Cell)
      if (!end1 || !end2) continue
      if (end1.x === end2.x && end1.y === end2.y) setCell(grid, x, y, MAZE_WALL)
    }
  }
}
