// Shared maze generator helpers ported from mazelib MazeGenAlgo.py (MIT) —
// https://github.com/john-science/mazelib/blob/main/mazelib/generate/MazeGenAlgo.py

import type { DotNetRandom } from './dotNetRandom.ts'
import type { Cell } from './intPairSet.ts'
import { physicalHeight, physicalWidth, validateHallway } from './mazeHallway.ts'
import { getCell, mazeOpen, mazeWall, setCell, type MazeGrid } from './mazeGrid.ts'

export type { Cell }

export type MazeAlgo = {
  hallwayWidth: number
  hallwayHeight: number
  physicalWidth: number
  physicalHeight: number
  random: DotNetRandom
}

export function createMazeAlgo(
  hallwayWidth: number,
  hallwayHeight: number,
  random: DotNetRandom,
): MazeAlgo {
  validateHallway(hallwayWidth, hallwayHeight)
  return {
    hallwayWidth,
    hallwayHeight,
    physicalWidth: physicalWidth(hallwayWidth),
    physicalHeight: physicalHeight(hallwayHeight),
    random,
  }
}

export function shuffle<T>(random: DotNetRandom, items: T[]): void {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const swapIndex = random.nextMax(i + 1)
    const swap = items[swapIndex] as T
    items[swapIndex] = items[i] as T
    items[i] = swap
  }
}

export function findNeighbors(
  algo: MazeAlgo,
  x: number,
  y: number,
  grid: MazeGrid,
  isWall: boolean,
): Cell[] {
  const target = isWall ? mazeWall : mazeOpen
  const neighbors: Cell[] = []
  if (y > 1 && getCell(grid, x, y - 2) === target) neighbors.push({ x, y: y - 2 })
  if (y < algo.physicalHeight - 2 && getCell(grid, x, y + 2) === target) {
    neighbors.push({ x, y: y + 2 })
  }
  if (x > 1 && getCell(grid, x - 2, y) === target) neighbors.push({ x: x - 2, y })
  if (x < algo.physicalWidth - 2 && getCell(grid, x + 2, y) === target) {
    neighbors.push({ x: x + 2, y })
  }
  shuffle(algo.random, neighbors)
  return neighbors
}

export function randomOddCorridorCell(algo: MazeAlgo): Cell {
  return {
    x: algo.random.nextMax(algo.hallwayWidth) * 2 + 1,
    y: algo.random.nextMax(algo.hallwayHeight) * 2 + 1,
  }
}

export function carvePassageBetween(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  grid: MazeGrid,
): void {
  setCell(grid, Math.trunc((fromX + toX) / 2), Math.trunc((fromY + toY) / 2), mazeOpen)
}
