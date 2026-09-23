// Hunt-and-Kill maze generator ported from mazelib HuntAndKill.py (MIT) —
// https://github.com/john-science/mazelib/blob/main/mazelib/generate/HuntAndKill.py

import type { Cell } from './intPairSet.ts'
import {
  carvePassageBetween,
  createMazeAlgo,
  findNeighbors,
  randomOddCorridorCell,
  type MazeAlgo,
} from './mazeGenAlgo.ts'
import { createSeededRandom, huntOrderOf, type MazeGenerationParams } from './mazeGenerationParams.ts'
import { mazeHuntOrders } from './mazeHuntOrder.ts'
import { createFilledWalls, isOpen, mazeOpen, setCell, type MazeGrid } from './mazeGrid.ts'

function walk(algo: MazeAlgo, grid: MazeGrid, startX: number, startY: number): void {
  if (!isOpen(grid, startX, startY)) return
  let currentX = startX
  let currentY = startY
  let unvisited = findNeighbors(algo, currentX, currentY, grid, true)
  while (unvisited.length > 0) {
    const neighbor = unvisited[algo.random.nextMax(unvisited.length)] as Cell
    setCell(grid, neighbor.x, neighbor.y, mazeOpen)
    carvePassageBetween(currentX, currentY, neighbor.x, neighbor.y, grid)
    currentX = neighbor.x
    currentY = neighbor.y
    unvisited = findNeighbors(algo, currentX, currentY, grid, true)
  }
}

function huntSerpentine(algo: MazeAlgo, grid: MazeGrid): Cell {
  let x = 1
  let y = 1
  while (true) {
    x += 2
    if (x > algo.physicalWidth - 2) {
      x = 1
      y += 2
    }
    if (y > algo.physicalHeight - 2) return { x: -1, y: -1 }
    if (isOpen(grid, x, y) && findNeighbors(algo, x, y, grid, true).length > 0) return { x, y }
  }
}

export function generateHuntAndKillMaze(params: MazeGenerationParams): MazeGrid {
  const algo = createMazeAlgo(params.hallwayWidth, params.hallwayHeight, createSeededRandom(params))
  const serpentine = huntOrderOf(params) === mazeHuntOrders.serpentine
  const grid = createFilledWalls(algo.hallwayWidth, algo.hallwayHeight)
  let current = randomOddCorridorCell(algo)
  setCell(grid, current.x, current.y, mazeOpen)
  let numTrials = 0
  while (current.x >= 0) {
    walk(algo, grid, current.x, current.y)
    if (serpentine) {
      current = huntSerpentine(algo, grid)
    } else if (numTrials >= algo.physicalHeight * algo.physicalWidth) {
      current = { x: -1, y: -1 }
    } else {
      current = randomOddCorridorCell(algo)
    }
    numTrials += 1
  }
  return grid
}
