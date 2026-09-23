// Wilson's maze generator ported from mazelib Wilsons.py (MIT) —
// https://github.com/john-science/mazelib/blob/main/mazelib/generate/Wilsons.py

import type { Cell } from './intPairSet.ts'
import {
  carvePassageBetween,
  createMazeAlgo,
  randomOddCorridorCell,
  type MazeAlgo,
} from './mazeGenAlgo.ts'
import { createSeededRandom, huntOrderOf, type MazeGenerationParams } from './mazeGenerationParams.ts'
import { mazeHuntOrders } from './mazeHuntOrder.ts'
import { createFilledWalls, isOpen, isWall, mazeOpen, setCell, type MazeGrid } from './mazeGrid.ts'

function move(x: number, y: number, deltaX: number, deltaY: number): Cell {
  return { x: x + deltaX, y: y + deltaY }
}

function randomDirection(algo: MazeAlgo, current: Cell): Cell {
  const options: Cell[] = []
  if (current.y > 1) options.push({ x: 0, y: -2 })
  if (current.y < algo.physicalHeight - 2) options.push({ x: 0, y: 2 })
  if (current.x > 1) options.push({ x: -2, y: 0 })
  if (current.x < algo.physicalWidth - 2) options.push({ x: 2, y: 0 })
  return options[algo.random.nextMax(options.length)] as Cell
}

function walkKey(cell: Cell): string {
  return `${cell.x},${cell.y}`
}

function generateRandomWalk(algo: MazeAlgo, grid: MazeGrid, start: Cell): Map<string, Cell> {
  const walk = new Map<string, Cell>()
  let delta = randomDirection(algo, start)
  walk.set(walkKey(start), delta)
  let current = move(start.x, start.y, delta.x, delta.y)
  while (isWall(grid, current.x, current.y)) {
    delta = randomDirection(algo, current)
    walk.set(walkKey(current), delta)
    current = move(current.x, current.y, delta.x, delta.y)
  }
  return walk
}

function solveRandomWalk(grid: MazeGrid, walk: Map<string, Cell>, start: Cell): number {
  let visits = 0
  let current = start
  while (!isOpen(grid, current.x, current.y)) {
    setCell(grid, current.x, current.y, mazeOpen)
    const delta = walk.get(walkKey(current)) as Cell
    const next = move(current.x, current.y, delta.x, delta.y)
    carvePassageBetween(current.x, current.y, next.x, next.y, grid)
    visits += 1
    current = next
  }
  return visits
}

function huntSerpentine(algo: MazeAlgo, grid: MazeGrid): Cell {
  let x = -1
  let y = 1
  while (true) {
    x += 2
    if (x > algo.physicalWidth - 2) {
      x = 1
      y += 2
    }
    if (y > algo.physicalHeight - 2) return { x: -1, y: -1 }
    if (isWall(grid, x, y)) return { x, y }
  }
}

export function generateWilsonsMaze(params: MazeGenerationParams): MazeGrid {
  const algo = createMazeAlgo(params.hallwayWidth, params.hallwayHeight, createSeededRandom(params))
  const serpentine = huntOrderOf(params) === mazeHuntOrders.serpentine
  const grid = createFilledWalls(algo.hallwayWidth, algo.hallwayHeight)
  const start = randomOddCorridorCell(algo)
  setCell(grid, start.x, start.y, mazeOpen)
  let numVisited = 1
  let current =
    serpentine
      ? huntSerpentine(algo, grid)
      : numVisited >= algo.hallwayWidth * algo.hallwayHeight
        ? { x: -1, y: -1 }
        : randomOddCorridorCell(algo)

  while (current.x >= 0) {
    const walk = generateRandomWalk(algo, grid, current)
    numVisited += solveRandomWalk(grid, walk, current)
    if (serpentine) {
      current = huntSerpentine(algo, grid)
    } else if (numVisited >= algo.hallwayWidth * algo.hallwayHeight) {
      current = { x: -1, y: -1 }
    } else {
      current = randomOddCorridorCell(algo)
    }
  }
  return grid
}
