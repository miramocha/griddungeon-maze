import { describe, expect, it } from 'vitest'
import { createMazeGrid, MAZE_WALL, setCell } from './mazeGrid.ts'
import { mazeCenter } from './mazeSpace.ts'
import { clampMazeStep, mazeBlocksCircle, mazeSegmentBlocked } from './mazeWalk.ts'

const CELL = 2
const SKIRT = 0.11

function walledHall(): ReturnType<typeof createMazeGrid> {
  const grid = createMazeGrid(3, 3)
  for (let y = 0; y < grid.height; y += 1) {
    for (let x = 0; x < grid.width; x += 1) setCell(grid, x, y, MAZE_WALL)
  }
  setCell(grid, 1, 1, 0)
  setCell(grid, 3, 1, 0)
  return grid
}

function cellCenter(grid: ReturnType<typeof createMazeGrid>, gx: number, gy: number) {
  const shift = mazeCenter(grid, CELL)
  return { x: gx * CELL - shift.x, z: -gy * CELL - shift.z }
}

describe('clampMazeStep', () => {
  it('stops a 4.5 m dash on the near blocked edge', () => {
    const grid = walledHall()
    const from = cellCenter(grid, 1, 1)
    const landed = clampMazeStep(grid, CELL, SKIRT, from, { x: from.x + 4.5, z: from.z }, 0.32)
    const wall = cellCenter(grid, 3, 1)
    expect(landed.x).toBeCloseTo(from.x + 1 - (0.32 + 0.11), 4)
    expect(landed.z).toBeCloseTo(from.z, 4)
    expect(landed.x).toBeLessThan(wall.x - 1)
  })

  it('snaps a wall-cell start onto the nearest open cell', () => {
    const grid = walledHall()
    const wall = cellCenter(grid, 2, 1)
    const landed = clampMazeStep(grid, CELL, SKIRT, wall, wall, 0.32)
    const left = cellCenter(grid, 1, 1)
    const right = cellCenter(grid, 3, 1)
    const onOpenCenter =
      (Math.abs(landed.x - left.x) < 1e-3 && Math.abs(landed.z - left.z) < 1e-3) ||
      (Math.abs(landed.x - right.x) < 1e-3 && Math.abs(landed.z - right.z) < 1e-3)
    expect(onOpenCenter).toBe(true)
    expect(mazeBlocksCircle(grid, CELL, SKIRT, landed.x, landed.z, 0.32)).toBe(false)
  })

  it('crosses open cells along a hall', () => {
    const grid = walledHall()
    setCell(grid, 2, 1, 0)
    const from = cellCenter(grid, 1, 1)
    const to = cellCenter(grid, 3, 1)
    const landed = clampMazeStep(grid, CELL, SKIRT, from, to, 0.32)
    expect(landed.x).toBeCloseTo(to.x, 3)
    expect(landed.z).toBeCloseTo(to.z, 3)
  })
})

describe('mazeBlocksCircle', () => {
  it('is true inside an open cell when the circle reaches the blocked edge', () => {
    const grid = walledHall()
    const center = cellCenter(grid, 1, 1)
    const skirt = { x: center.x + 1 - 0.05, z: center.z }
    expect(mazeBlocksCircle(grid, CELL, SKIRT, skirt.x, skirt.z, 0.2)).toBe(true)
    expect(mazeBlocksCircle(grid, CELL, SKIRT, center.x, center.z, 0.2)).toBe(false)
    expect(mazeSegmentBlocked(grid, CELL, SKIRT, center, skirt, 0.2)).toBe(true)
    const insideSkirt = { x: center.x + 1 - 0.15, z: center.z }
    expect(mazeBlocksCircle(grid, CELL, SKIRT, insideSkirt.x, insideSkirt.z, 0.05)).toBe(true)
  })
})
