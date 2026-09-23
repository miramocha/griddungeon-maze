// Aldous-Broder maze generator ported from mazelib AldousBroder.py (MIT) —
// https://github.com/john-science/mazelib/blob/main/mazelib/generate/AldousBroder.py

import type { Cell } from './intPairSet.ts'
import {
  carvePassageBetween,
  createMazeAlgo,
  findNeighbors,
  randomOddCorridorCell,
} from './mazeGenAlgo.ts'
import { createSeededRandom, type MazeGenerationParams } from './mazeGenerationParams.ts'
import { createFilledWalls, isWall, mazeOpen, setCell, type MazeGrid } from './mazeGrid.ts'

export function generateAldousBroderMaze(params: MazeGenerationParams): MazeGrid {
  const algo = createMazeAlgo(params.hallwayWidth, params.hallwayHeight, createSeededRandom(params))
  const grid = createFilledWalls(algo.hallwayWidth, algo.hallwayHeight)
  let current = randomOddCorridorCell(algo)
  setCell(grid, current.x, current.y, mazeOpen)
  let numVisited = 1

  while (numVisited < algo.hallwayWidth * algo.hallwayHeight) {
    const neighbors = findNeighbors(algo, current.x, current.y, grid, true)
    if (neighbors.length === 0) {
      const visitedNeighbors = findNeighbors(algo, current.x, current.y, grid, false)
      current = visitedNeighbors[algo.random.nextMax(visitedNeighbors.length)] as Cell
      continue
    }
    for (const neighbor of neighbors) {
      if (!isWall(grid, neighbor.x, neighbor.y)) continue
      carvePassageBetween(current.x, current.y, neighbor.x, neighbor.y, grid)
      setCell(grid, neighbor.x, neighbor.y, mazeOpen)
      numVisited += 1
      current = neighbor
      break
    }
  }
  return grid
}
