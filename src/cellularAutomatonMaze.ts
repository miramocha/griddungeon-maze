// Cellular Automaton maze generator ported from mazelib CellularAutomaton.py (MIT) —
// https://github.com/john-science/mazelib/blob/main/mazelib/generate/CellularAutomaton.py

import type { DotNetRandom } from './dotNetRandom.ts'
import { carvePassageBetween, createMazeAlgo, findNeighbors } from './mazeGenAlgo.ts'
import { createSeededRandom, type MazeGenerationParams } from './mazeGenerationParams.ts'
import { createMazeGrid, isOpen, mazeOpen, mazeWall, setCell, type MazeGrid } from './mazeGrid.ts'

function randomEvenCoordinate(random: DotNetRandom, minInclusive: number, maxInclusive: number): number {
  return minInclusive + random.nextMax(Math.trunc((maxInclusive - minInclusive) / 2) + 1) * 2
}

export function generateCellularAutomatonMaze(params: MazeGenerationParams): MazeGrid {
  const algo = createMazeAlgo(params.hallwayWidth, params.hallwayHeight, createSeededRandom(params))
  let complexity = Math.fround(params.cellularComplexity ?? 1)
  let density = Math.fround(params.cellularDensity ?? 1)
  const grid = createMazeGrid(algo.hallwayWidth, algo.hallwayHeight)
  grid.cells.fill(mazeOpen)
  for (let x = 0; x < algo.physicalWidth; x += 1) {
    setCell(grid, x, 0, mazeWall)
    setCell(grid, x, algo.physicalHeight - 1, mazeWall)
  }
  for (let y = 0; y < algo.physicalHeight; y += 1) {
    setCell(grid, 0, y, mazeWall)
    setCell(grid, algo.physicalWidth - 1, y, mazeWall)
  }

  if (complexity <= 1) complexity = Math.fround(complexity * (algo.hallwayHeight + algo.hallwayWidth))
  if (density <= 1) density = Math.fround(density * (algo.hallwayWidth * algo.hallwayHeight))
  const densityIterations = Math.trunc(Math.fround(2 * density))
  const complexitySteps = Math.trunc(complexity)

  for (let i = 0; i < densityIterations; i += 1) {
    let x: number
    let y: number
    if (i < density) {
      if (algo.random.nextMax(2) === 0) {
        y = algo.random.nextMax(2) === 0 ? 0 : algo.physicalHeight - 1
        x = randomEvenCoordinate(algo.random, 0, algo.physicalWidth - 1)
      } else {
        x = algo.random.nextMax(2) === 0 ? 0 : algo.physicalWidth - 1
        y = randomEvenCoordinate(algo.random, 0, algo.physicalHeight - 1)
      }
    } else {
      y = randomEvenCoordinate(algo.random, 0, algo.physicalHeight - 1)
      x = randomEvenCoordinate(algo.random, 0, algo.physicalWidth - 1)
    }
    setCell(grid, x, y, mazeWall)
    for (let j = 0; j < complexitySteps; j += 1) {
      const wallNeighbors = findNeighbors(algo, x, y, grid, true)
      if (wallNeighbors.length > 0 && wallNeighbors.length < 4) {
        const openNeighbors = findNeighbors(algo, x, y, grid, false)
        if (openNeighbors.length === 0) continue
        const next = openNeighbors[algo.random.nextMax(openNeighbors.length)] as { x: number; y: number }
        if (isOpen(grid, next.x, next.y)) {
          setCell(grid, next.x, next.y, mazeWall)
          carvePassageBetween(x, y, next.x, next.y, grid)
          x = next.x
          y = next.y
        }
      }
    }
  }
  return grid
}
