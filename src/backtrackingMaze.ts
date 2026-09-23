// Recursive backtracking maze generator ported from mazelib BacktrackingGenerator.py (MIT) —
// https://github.com/john-science/mazelib/blob/main/mazelib/generate/BacktrackingGenerator.py

import type { Cell } from './intPairSet.ts'
import {
  carvePassageBetween,
  createMazeAlgo,
  findNeighbors,
  randomOddCorridorCell,
} from './mazeGenAlgo.ts'
import { createSeededRandom, type MazeGenerationParams } from './mazeGenerationParams.ts'
import { createFilledWalls, mazeOpen, setCell, type MazeGrid } from './mazeGrid.ts'

export function generateBacktrackingMaze(params: MazeGenerationParams): MazeGrid {
  const algo = createMazeAlgo(params.hallwayWidth, params.hallwayHeight, createSeededRandom(params))
  const grid = createFilledWalls(algo.hallwayWidth, algo.hallwayHeight)
  let current = randomOddCorridorCell(algo)
  const track: Cell[] = [current]
  setCell(grid, current.x, current.y, mazeOpen)

  while (track.length > 0) {
    current = track[track.length - 1] as Cell
    const neighbors = findNeighbors(algo, current.x, current.y, grid, true)
    if (neighbors.length === 0) {
      track.pop()
    } else {
      const next = neighbors[0] as Cell
      setCell(grid, next.x, next.y, mazeOpen)
      carvePassageBetween(current.x, current.y, next.x, next.y, grid)
      track.push(next)
    }
  }
  return grid
}
