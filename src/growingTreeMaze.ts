// Growing Tree maze generator ported from mazelib GrowingTree.py (MIT) —
// https://github.com/john-science/mazelib/blob/main/mazelib/generate/GrowingTree.py

import type { Cell } from './intPairSet.ts'
import {
  carvePassageBetween,
  createMazeAlgo,
  findNeighbors,
  randomOddCorridorCell,
} from './mazeGenAlgo.ts'
import { clamp01f, createSeededRandom, type MazeGenerationParams } from './mazeGenerationParams.ts'
import { createFilledWalls, MAZE_OPEN, setCell, type MazeGrid } from './mazeGrid.ts'

function removeActiveCell(active: Cell[], x: number, y: number): void {
  for (let i = active.length - 1; i >= 0; i -= 1) {
    const cell = active[i]
    if (cell && cell.x === x && cell.y === y) active.splice(i, 1)
  }
}

export function generateGrowingTreeMaze(params: MazeGenerationParams): MazeGrid {
  const algo = createMazeAlgo(params.hallwayWidth, params.hallwayHeight, createSeededRandom(params))
  const backtrackChance = clamp01f(params.backtrackChance ?? 1)
  const grid = createFilledWalls(algo.hallwayWidth, algo.hallwayHeight)
  let current = randomOddCorridorCell(algo)
  setCell(grid, current.x, current.y, MAZE_OPEN)
  const active: Cell[] = [current]

  while (active.length > 0) {
    if (algo.random.nextDouble() < backtrackChance) {
      current = active[active.length - 1] as Cell
    } else {
      current = active[algo.random.nextMax(active.length)] as Cell
    }
    const nextNeighbors = findNeighbors(algo, current.x, current.y, grid, true)
    if (nextNeighbors.length === 0) {
      removeActiveCell(active, current.x, current.y)
      continue
    }
    const next = nextNeighbors[algo.random.nextMax(nextNeighbors.length)] as Cell
    active.push(next)
    setCell(grid, next.x, next.y, MAZE_OPEN)
    carvePassageBetween(current.x, current.y, next.x, next.y, grid)
  }
  return grid
}
