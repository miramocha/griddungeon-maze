// Sidewinder maze generator ported from mazelib Sidewinder.py (MIT) —
// https://github.com/john-science/mazelib/blob/main/mazelib/generate/Sidewinder.py

import type { Cell } from './intPairSet.ts'
import { createMazeAlgo } from './mazeGenAlgo.ts'
import { clamp01f, createSeededRandom, type MazeGenerationParams } from './mazeGenerationParams.ts'
import { createFilledWalls, MAZE_OPEN, setCell, type MazeGrid } from './mazeGrid.ts'

export function generateSidewinderMaze(params: MazeGenerationParams): MazeGrid {
  const algo = createMazeAlgo(params.hallwayWidth, params.hallwayHeight, createSeededRandom(params))
  const skew = clamp01f(params.sidewinderSkew ?? 0.5)
  const grid = createFilledWalls(algo.hallwayWidth, algo.hallwayHeight)

  for (let x = 1; x < algo.physicalWidth - 1; x += 1) setCell(grid, x, 1, MAZE_OPEN)

  for (let y = 3; y < algo.physicalHeight; y += 2) {
    const run: Cell[] = []
    for (let x = 1; x < algo.physicalWidth; x += 2) {
      setCell(grid, x, y, MAZE_OPEN)
      run.push({ x, y })
      const carveEast = algo.random.nextDouble() > skew
      if (carveEast && x < algo.physicalWidth - 2) {
        setCell(grid, x + 1, y, MAZE_OPEN)
      } else {
        const north = run[algo.random.nextMax(run.length)] as Cell
        setCell(grid, north.x, north.y - 1, MAZE_OPEN)
        run.length = 0
      }
    }
  }
  return grid
}
