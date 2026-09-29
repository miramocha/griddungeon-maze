import { describe, expect, it } from 'vitest'
import { createMazeGrid, MAZE_OPEN, MAZE_WALL, setCell, type MazeGrid } from './mazeGrid.ts'
import {
  blockedEdges,
  openCellTile,
  placedWallEdges,
  tileForOpenCell,
  wallYawSteps,
} from './mazeTileRecipe.ts'
import { mazeCellPosition, mazeVertexPosition } from './mazeSpace.ts'
import { columnVertices, floorGapVertices } from './mazePlacement.ts'

describe('openCellTile', () => {
  it('keeps an open room as floor', () => {
    expect(openCellTile(new Set())).toEqual({ recipe: 'floor', yawSteps: 0 })
  })

  it('yaws an east wall from the north-authored edge', () => {
    expect(openCellTile(new Set(['e']))).toEqual({ recipe: 'edge', yawSteps: 1 })
    expect(wallYawSteps(1, 'n')).toBe(1)
  })

  it('matches a north-south straight hall with no yaw', () => {
    expect(openCellTile(new Set(['n', 's']))).toEqual({ recipe: 'straight', yawSteps: 0 })
  })

  it('turns a corner onto west and north', () => {
    expect(openCellTile(new Set(['w', 'n']))).toEqual({ recipe: 'corner', yawSteps: 3 })
  })

  it('opens a dead end toward south', () => {
    expect(openCellTile(new Set(['n', 'e', 'w']))).toEqual({ recipe: 'deadEnd', yawSteps: 0 })
  })

  it('places an east-west hall on east and west', () => {
    const tile = openCellTile(new Set(['e', 'w']))
    expect(placedWallEdges(tile).sort()).toEqual(['e', 'w'])
  })
})

describe('tileForOpenCell', () => {
  it('reads blocked neighbors and skips wall cells', () => {
    const grid = createMazeGrid(1, 1)
    setCell(grid, 0, 0, MAZE_WALL)
    setCell(grid, 1, 2, MAZE_WALL)
    expect(blockedEdges(grid, 1, 1)).toEqual(new Set(['n']))
    expect(tileForOpenCell(grid, 1, 1)).toEqual({ recipe: 'edge', yawSteps: 0 })
    expect(tileForOpenCell(grid, 0, 0)).toBeNull()
  })
})

describe('maze space', () => {
  it('puts maze north on −Z', () => {
    expect(mazeCellPosition(1, 2, 2)).toEqual([2, 0, -4])
  })

  it('puts vertex (1, 1) on the authored northeast corner', () => {
    expect(mazeVertexPosition(1, 1, 2)).toEqual([1, 0, -1])
  })
})

function grid(width: number, height: number, open: Array<[number, number]>): MazeGrid {
  const cells = new Int32Array(width * height)
  cells.fill(MAZE_WALL)
  for (const [x, y] of open) cells[y * width + x] = MAZE_OPEN
  return { hallwayWidth: width, hallwayHeight: height, width, height, cells }
}

describe('floorGapVertices', () => {
  it('fills the single cross of a 2x2 open room', () => {
    const room = grid(2, 2, [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ])
    expect(floorGapVertices(room)).toEqual([{ i: 1, j: 1 }])
  })

  it('skips a single open cell', () => {
    expect(floorGapVertices(grid(1, 1, [[0, 0]]))).toEqual([])
  })

  it('skips a 2x1 hall', () => {
    expect(
      floorGapVertices(
        grid(2, 1, [
          [0, 0],
          [1, 0],
        ]),
      ),
    ).toEqual([])
  })

  it('skips a 3-open corner', () => {
    const room = grid(2, 2, [
      [0, 0],
      [1, 0],
      [0, 1],
    ])
    expect(floorGapVertices(room)).toEqual([])
  })
})

describe('columnVertices', () => {
  it('places eight columns around a 2x2 open room', () => {
    const room = grid(2, 2, [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ])
    expect(columnVertices(room)).toEqual([
      { i: 0, j: 0 },
      { i: 1, j: 0 },
      { i: 2, j: 0 },
      { i: 0, j: 1 },
      { i: 2, j: 1 },
      { i: 0, j: 2 },
      { i: 1, j: 2 },
      { i: 2, j: 2 },
    ])
  })

  it('places no columns on a fully enclosed cell', () => {
    expect(columnVertices(grid(1, 1, [[0, 0]]))).toEqual([])
  })

  it('places columns along a 2x1 hall', () => {
    expect(
      columnVertices(
        grid(2, 1, [
          [0, 0],
          [1, 0],
        ]),
      ),
    ).toEqual([
      { i: 0, j: 0 },
      { i: 1, j: 0 },
      { i: 2, j: 0 },
      { i: 0, j: 1 },
      { i: 1, j: 1 },
      { i: 2, j: 1 },
    ])
  })

  it('keeps a T junction post off the floor gap', () => {
    const room = grid(2, 2, [
      [0, 0],
      [1, 0],
      [0, 1],
    ])
    expect(columnVertices(room)).toContainEqual({ i: 1, j: 1 })
    expect(floorGapVertices(room)).not.toContainEqual({ i: 1, j: 1 })
  })
})
