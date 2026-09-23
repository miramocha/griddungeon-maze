// Eller's maze generator ported from mazelib Ellers.py (MIT) —
// https://github.com/john-science/mazelib/blob/main/mazelib/generate/Ellers.py

import { createMazeAlgo, type MazeAlgo } from './mazeGenAlgo.ts'
import { clamp01f, createSeededRandom, type MazeGenerationParams } from './mazeGenerationParams.ts'
import { createMazeGrid, mazeOpen, mazeWall, setCell, type MazeGrid } from './mazeGrid.ts'

function at(sets: Int32Array, width: number, y: number, x: number): number {
  return sets[y * width + x] ?? -1
}

function put(sets: Int32Array, width: number, y: number, x: number, value: number): void {
  sets[y * width + x] = value
}

function mergeSets(
  algo: MazeAlgo,
  sets: Int32Array,
  fromSet: number,
  toSet: number,
  maxRow = -1,
): void {
  const limit = maxRow < 0 ? algo.physicalHeight - 1 : maxRow
  for (let y = 1; y <= limit; y += 1) {
    for (let x = 1; x < algo.physicalWidth - 1; x += 1) {
      if (at(sets, algo.physicalWidth, y, x) === fromSet) put(sets, algo.physicalWidth, y, x, toSet)
    }
  }
}

export function generateEllersMaze(params: MazeGenerationParams): MazeGrid {
  const algo = createMazeAlgo(params.hallwayWidth, params.hallwayHeight, createSeededRandom(params))
  const xSkew = clamp01f(params.xSkew ?? 0.5)
  const ySkew = clamp01f(params.ySkew ?? 0.5)
  const sets = new Int32Array(algo.physicalHeight * algo.physicalWidth)
  sets.fill(-1)
  let maxSetNumber = 0

  const initRow = (y: number) => {
    for (let x = 1; x < algo.physicalWidth; x += 2) {
      if (at(sets, algo.physicalWidth, y, x) < 0) {
        put(sets, algo.physicalWidth, y, x, maxSetNumber)
        maxSetNumber += 1
      }
    }
  }

  const mergeOneRow = (y: number) => {
    for (let x = 1; x < algo.physicalWidth - 2; x += 2) {
      if (algo.random.nextDouble() >= xSkew) continue
      const left = at(sets, algo.physicalWidth, y, x)
      const right = at(sets, algo.physicalWidth, y, x + 2)
      if (left === right) continue
      put(sets, algo.physicalWidth, y, x + 1, left)
      mergeSets(algo, sets, right, left, y)
    }
  }

  const mergeDownARow = (startY: number) => {
    if (startY === algo.physicalHeight - 2) return
    const setCounts = new Map<number, number[]>()
    for (let x = 1; x < algo.physicalWidth; x += 2) {
      const setId = at(sets, algo.physicalWidth, startY, x)
      const columns = setCounts.get(setId)
      if (columns) columns.push(x)
      else setCounts.set(setId, [x])
    }
    for (const [setId, columns] of setCounts) {
      const column = columns[algo.random.nextMax(columns.length)] as number
      put(sets, algo.physicalWidth, startY + 1, column, setId)
      put(sets, algo.physicalWidth, startY + 2, column, setId)
    }
    for (let x = 1; x < algo.physicalWidth - 2; x += 2) {
      if (algo.random.nextDouble() >= ySkew) continue
      const setId = at(sets, algo.physicalWidth, startY, x)
      if (at(sets, algo.physicalWidth, startY + 1, x) !== -1) continue
      put(sets, algo.physicalWidth, startY + 1, x, setId)
      put(sets, algo.physicalWidth, startY + 2, x, setId)
    }
  }

  for (let y = 1; y < algo.physicalHeight - 1; y += 2) {
    initRow(y)
    mergeOneRow(y)
    mergeDownARow(y)
  }
  initRow(algo.physicalHeight - 2)
  const lastY = algo.physicalHeight - 2
  for (let x = 1; x < algo.physicalWidth - 2; x += 2) {
    const left = at(sets, algo.physicalWidth, lastY, x)
    const right = at(sets, algo.physicalWidth, lastY, x + 2)
    if (left === right) continue
    put(sets, algo.physicalWidth, lastY, x + 1, left)
    mergeSets(algo, sets, right, left)
  }

  const grid = createMazeGrid(algo.hallwayWidth, algo.hallwayHeight)
  grid.cells.fill(mazeOpen)
  for (let y = 0; y < algo.physicalHeight; y += 1) {
    for (let x = 0; x < algo.physicalWidth; x += 1) {
      if (at(sets, algo.physicalWidth, y, x) === -1) setCell(grid, x, y, mazeWall)
    }
  }
  return grid
}
