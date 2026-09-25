// Recursive division maze generator ported from mazelib Division.py (MIT) —
// https://github.com/john-science/mazelib/blob/main/mazelib/generate/Division.py

import type { DotNetRandom } from './dotNetRandom.ts'
import { createMazeAlgo } from './mazeGenAlgo.ts'
import { createSeededRandom, type MazeGenerationParams } from './mazeGenerationParams.ts'
import { createMazeGrid, MAZE_OPEN, MAZE_WALL, setCell, type MazeGrid } from './mazeGrid.ts'

const VERTICAL = 0
const HORIZONTAL = 1

interface Region {
  minY: number
  minX: number
  maxY: number
  maxX: number
}

function randomOddInRange(random: DotNetRandom, minInclusive: number, maxInclusive: number): number {
  const span = Math.trunc((maxInclusive - minInclusive) / 2) + 1
  return minInclusive + random.nextMax(span) * 2
}

function randomEvenInRange(random: DotNetRandom, minInclusive: number, maxInclusive: number): number {
  return minInclusive + random.nextMax(Math.trunc((maxInclusive - minInclusive) / 2) + 1) * 2
}

export function generateRecursiveDivisionMaze(params: MazeGenerationParams): MazeGrid {
  const algo = createMazeAlgo(params.hallwayWidth, params.hallwayHeight, createSeededRandom(params))
  const grid = createMazeGrid(algo.hallwayWidth, algo.hallwayHeight)
  grid.cells.fill(MAZE_OPEN)
  for (let x = 0; x < algo.physicalWidth; x += 1) {
    setCell(grid, x, 0, MAZE_WALL)
    setCell(grid, x, algo.physicalHeight - 1, MAZE_WALL)
  }
  for (let y = 0; y < algo.physicalHeight; y += 1) {
    setCell(grid, 0, y, MAZE_WALL)
    setCell(grid, algo.physicalWidth - 1, y, MAZE_WALL)
  }

  const regionStack: Region[] = [
    { minY: 1, minX: 1, maxY: algo.physicalHeight - 2, maxX: algo.physicalWidth - 2 },
  ]
  while (regionStack.length > 0) {
    const region = regionStack.pop() as Region
    const height = region.maxY - region.minY + 1
    const width = region.maxX - region.minX + 1
    if (height <= 1 || width <= 1) continue

    let cutDirection: number
    if (width < height) cutDirection = HORIZONTAL
    else if (width > height) cutDirection = VERTICAL
    else if (width === 2) continue
    else cutDirection = algo.random.nextMax(2)

    const cutLength = cutDirection === VERTICAL ? height : width
    if (cutLength < 3) continue
    const cutPosition = randomOddInRange(algo.random, 1, cutLength - 1)
    const doorPosition = randomEvenInRange(
      algo.random,
      0,
      (cutDirection === VERTICAL ? height : width) - 1,
    )

    if (cutDirection === VERTICAL) {
      const wallX = region.minX + cutPosition
      for (let y = region.minY; y <= region.maxY; y += 1) setCell(grid, wallX, y, MAZE_WALL)
      setCell(grid, wallX, region.minY + doorPosition, MAZE_OPEN)
      regionStack.push({ minY: region.minY, minX: region.minX, maxY: region.maxY, maxX: wallX - 1 })
      regionStack.push({ minY: region.minY, minX: wallX + 1, maxY: region.maxY, maxX: region.maxX })
    } else {
      const wallY = region.minY + cutPosition
      for (let x = region.minX; x <= region.maxX; x += 1) setCell(grid, x, wallY, MAZE_WALL)
      setCell(grid, region.minX + doorPosition, wallY, MAZE_OPEN)
      regionStack.push({ minY: region.minY, minX: region.minX, maxY: wallY - 1, maxX: region.maxX })
      regionStack.push({ minY: wallY + 1, minX: region.minX, maxY: region.maxY, maxX: region.maxX })
    }
  }
  return grid
}
