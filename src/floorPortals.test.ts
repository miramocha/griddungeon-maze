import { describe, expect, it } from 'vitest'
import { cellDistance, placeFloorPortals } from './floorPortals.ts'
import { fromNorthUpRows } from './mazeAscii.ts'
import { generateMaze } from './mazeGeneratorRegistry.ts'
import { createFilledWalls, isOpen, type MazeGrid } from './mazeGrid.ts'
import { MAZE_GENERATOR_IDS } from './mazeIds.ts'
import type { Cell } from './intPairSet.ts'

const hallway = { hallwayWidth: 8, hallwayHeight: 6, seed: 42, algorithmId: MAZE_GENERATOR_IDS.backtracking }

function farthestReach(grid: MazeGrid, from: Cell): { distance: number; at: Cell[] } {
  const queue: Array<{ cell: Cell; distance: number }> = [{ cell: from, distance: 0 }]
  const seen = new Set<string>([`${from.x},${from.y}`])
  let head = 0
  let distance = -1
  const at: Cell[] = []
  while (head < queue.length) {
    const current = queue[head] as { cell: Cell; distance: number }
    head += 1
    if (current.distance > distance) {
      distance = current.distance
      at.length = 0
    }
    if (current.distance === distance) at.push(current.cell)
    for (const step of [
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 },
    ]) {
      const x = current.cell.x + step.x
      const y = current.cell.y + step.y
      if (x < 0 || y < 0 || x >= grid.width || y >= grid.height) continue
      if (!isOpen(grid, x, y)) continue
      const key = `${x},${y}`
      if (seen.has(key)) continue
      seen.add(key)
      queue.push({ cell: { x, y }, distance: current.distance + 1 })
    }
  }
  return { distance, at }
}

describe('placeFloorPortals', () => {
  it('picks open cells a BFS apart', () => {
    const grid = generateMaze(hallway)
    const portals = placeFloorPortals(grid)
    expect(isOpen(grid, portals.entrance.x, portals.entrance.y)).toBe(true)
    expect(isOpen(grid, portals.exit.x, portals.exit.y)).toBe(true)
    expect(portals.entrance).not.toEqual(portals.exit)
    const reach = farthestReach(grid, portals.entrance)
    expect(portals.distance).toBe(reach.distance)
    expect(portals.distance).toBe(cellDistance(grid, portals.entrance, portals.exit))
    expect(reach.at).toContainEqual(portals.exit)
    expect(portals.distance).toBeGreaterThan(0)
  })

  it('reports 0 when either cell is closed', () => {
    const grid = createFilledWalls(3, 3)
    expect(cellDistance(grid, { x: 0, y: 0 }, { x: 1, y: 1 })).toBe(0)
    expect(cellDistance(grid, { x: -1, y: 0 }, { x: 1, y: 1 })).toBe(0)
  })

  it('prefers the dead end when two cells share the max distance', () => {
    const grid = fromNorthUpRows(['#######', '#....##', '#.....#', '#######'])
    const portals = placeFloorPortals(grid)
    expect(portals.entrance).toEqual({ x: 5, y: 1 })
    expect(portals.exit).toEqual({ x: 1, y: 2 })
    expect(portals.distance).toBe(5)
  })

  it('lands on the same cells for the same seed', () => {
    const first = placeFloorPortals(generateMaze(hallway))
    const second = placeFloorPortals(generateMaze(hallway))
    expect(second).toEqual(first)
  })

  it('throws when the maze has no open cell', () => {
    expect(() => placeFloorPortals(createFilledWalls(3, 3))).toThrow(/no open cell/)
  })
})
