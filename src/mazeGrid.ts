// Maze grid layout inspired by mazelib (MIT) — https://github.com/john-science/mazelib
// Y = 0 is the south edge. Y increases north.

import { physicalHeight, physicalWidth } from './mazeHallway.ts'

export const MAZE_WALL = 1
export const MAZE_OPEN = 0

export interface MazeGrid {
  hallwayWidth: number
  hallwayHeight: number
  width: number
  height: number
  cells: Int32Array
}

export function createMazeGrid(hallwayWidth: number, hallwayHeight: number): MazeGrid {
  if (hallwayWidth < 1) throw new Error('Hallway width must be at least 1.')
  if (hallwayHeight < 1) throw new Error('Hallway height must be at least 1.')
  const width = physicalWidth(hallwayWidth)
  const height = physicalHeight(hallwayHeight)
  return {
    hallwayWidth,
    hallwayHeight,
    width,
    height,
    cells: new Int32Array(width * height),
  }
}

export function createFilledWalls(hallwayWidth: number, hallwayHeight: number): MazeGrid {
  const grid = createMazeGrid(hallwayWidth, hallwayHeight)
  fill(grid, MAZE_WALL)
  return grid
}

export function fromPhysicalDimensions(physicalW: number, physicalH: number): MazeGrid {
  if (physicalW < 1) throw new Error('Physical width must be at least 1.')
  if (physicalH < 1) throw new Error('Physical height must be at least 1.')
  const grid = createMazeGrid(1, 1)
  grid.width = physicalW
  grid.height = physicalH
  grid.hallwayWidth = Math.max(1, Math.trunc((physicalW - 1) / 2))
  grid.hallwayHeight = Math.max(1, Math.trunc((physicalH - 1) / 2))
  grid.cells = new Int32Array(physicalW * physicalH)
  return grid
}

export function fill(grid: MazeGrid, value: number): void {
  grid.cells.fill(value)
}

export function getCell(grid: MazeGrid, x: number, y: number): number {
  return grid.cells[toIndex(grid, x, y)] ?? 0
}

export function setCell(grid: MazeGrid, x: number, y: number, value: number): void {
  grid.cells[toIndex(grid, x, y)] = value
}

export function isWall(grid: MazeGrid, x: number, y: number): boolean {
  return getCell(grid, x, y) === MAZE_WALL
}

export function isOpen(grid: MazeGrid, x: number, y: number): boolean {
  return getCell(grid, x, y) === MAZE_OPEN
}

function toIndex(grid: MazeGrid, x: number, y: number): number {
  if (x < 0 || y < 0 || x >= grid.width || y >= grid.height) {
    throw new Error(`Cell (${x},${y}) is outside maze bounds ${grid.width}×${grid.height}.`)
  }
  return y * grid.width + x
}
