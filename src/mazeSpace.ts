import type { MazeGrid } from './mazeGrid.ts'

export interface MazeShift {
  x: number
  z: number
}

/** +X east, +Y up, −Z north. */
export function mazeCellPosition(x: number, y: number, cellM: number): [number, number, number] {
  return [x * cellM, 0, -y * cellM]
}

/** Grid corner in maze space, before the center shift. */
export function mazeVertexPosition(i: number, j: number, cellM: number): [number, number, number] {
  return [(i - 0.5) * cellM, 0, -(j - 0.5) * cellM]
}

/** World offset that puts the maze center on the origin. */
export function mazeCenter(grid: MazeGrid, cellM: number): MazeShift {
  return {
    x: ((grid.width - 1) * cellM) / 2,
    z: (-(grid.height - 1) * cellM) / 2,
  }
}
