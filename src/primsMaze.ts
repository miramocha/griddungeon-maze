// Prim's maze generator ported from mazelib Prims.py (MIT) —
// https://github.com/john-science/mazelib/blob/main/mazelib/generate/Prims.py

import type { Cell } from './intPairSet.ts'
import {
  carvePassageBetween,
  createMazeAlgo,
  findNeighbors,
  randomOddCorridorCell,
} from './mazeGenAlgo.ts'
import { createSeededRandom, type MazeGenerationParams } from './mazeGenerationParams.ts'
import { createFilledWalls, mazeOpen, setCell, type MazeGrid } from './mazeGrid.ts'

function sameCell(left: Cell, right: Cell): boolean {
  return left.x === right.x && left.y === right.y
}

export function generatePrimsMaze(params: MazeGenerationParams): MazeGrid {
  const algo = createMazeAlgo(params.hallwayWidth, params.hallwayHeight, createSeededRandom(params))
  const grid = createFilledWalls(algo.hallwayWidth, algo.hallwayHeight)
  let current = randomOddCorridorCell(algo)
  setCell(grid, current.x, current.y, mazeOpen)
  const neighbors = findNeighbors(algo, current.x, current.y, grid, true)
  let visited = 1
  const targetVisited = algo.hallwayWidth * algo.hallwayHeight

  while (visited < targetVisited) {
    if (neighbors.length === 0) {
      throw new Error(`Prims frontier exhausted at visited=${visited}/${targetVisited}.`)
    }
    const pickIndex = algo.random.nextMax(neighbors.length)
    current = neighbors[pickIndex] as Cell
    neighbors.splice(pickIndex, 1)
    visited += 1
    setCell(grid, current.x, current.y, mazeOpen)

    const openNeighbors = findNeighbors(algo, current.x, current.y, grid, false)
    if (openNeighbors.length === 0) {
      throw new Error(`Prims cell (${current.x},${current.y}) has no open neighbor to carve toward.`)
    }
    const open = openNeighbors[0] as Cell
    carvePassageBetween(current.x, current.y, open.x, open.y, grid)

    const unvisited = findNeighbors(algo, current.x, current.y, grid, true)
    for (const cell of unvisited) {
      if (!neighbors.some((neighbor) => sameCell(neighbor, cell))) neighbors.push(cell)
    }
  }
  return grid
}
