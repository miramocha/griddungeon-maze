import { describe, expect, it } from 'vitest'
import { fromNorthUpRows, toAscii } from './mazeAscii.ts'
import { generateMaze } from './mazeGeneratorRegistry.ts'
import { MAZE_GENERATOR_IDS, MAZE_TRANSMUTER_IDS } from './mazeIds.ts'
import { MAZE_HUNT_ORDERS } from './mazeHuntOrder.ts'
import { isOpen, isWall, MAZE_OPEN, type MazeGrid } from './mazeGrid.ts'
import fixture from './mazeGolden.fixture.json' with { type: 'json' }
import { transmuteMaze } from './mazeTransmuterRegistry.ts'

const hallway = { hallwayWidth: 8, hallwayHeight: 6, seed: 42 }

function openCount(grid: MazeGrid): number {
  let count = 0
  for (let y = 0; y < grid.height; y += 1) {
    for (let x = 0; x < grid.width; x += 1) if (isOpen(grid, x, y)) count += 1
  }
  return count
}

function reachableOpenCount(grid: MazeGrid): number {
  let start: { x: number; y: number } | null = null
  for (let y = 0; y < grid.height && !start; y += 1) {
    for (let x = 0; x < grid.width; x += 1) {
      if (isOpen(grid, x, y)) {
        start = { x, y }
        break
      }
    }
  }
  if (!start) return 0
  const seen = new Set<string>()
  const queue = [start]
  seen.add(`${start.x},${start.y}`)
  while (queue.length > 0) {
    const cell = queue.shift() as { x: number; y: number }
    for (const next of [
      { x: cell.x + 1, y: cell.y },
      { x: cell.x - 1, y: cell.y },
      { x: cell.x, y: cell.y + 1 },
      { x: cell.x, y: cell.y - 1 },
    ]) {
      if (next.x < 0 || next.y < 0 || next.x >= grid.width || next.y >= grid.height) continue
      if (!isOpen(grid, next.x, next.y)) continue
      const key = `${next.x},${next.y}`
      if (seen.has(key)) continue
      seen.add(key)
      queue.push(next)
    }
  }
  return seen.size
}

function expectOuterWall(grid: MazeGrid): void {
  for (let x = 0; x < grid.width; x += 1) {
    expect(isWall(grid, x, 0)).toBe(true)
    expect(isWall(grid, x, grid.height - 1)).toBe(true)
  }
  for (let y = 0; y < grid.height; y += 1) {
    expect(isWall(grid, 0, y)).toBe(true)
    expect(isWall(grid, grid.width - 1, y)).toBe(true)
  }
}

describe('maze ascii', () => {
  it('round-trips north-up rows', () => {
    const rows = ['#####', '#...#', '#.#.#', '#####']
    const grid = fromNorthUpRows(rows)
    expect(toAscii(grid)).toBe(rows.join('\n'))
    expect(grid.cells[0]).toBe(MAZE_OPEN === 0 ? 1 : 0)
  })
})

describe('maze generation', () => {
  it('rejects a hallway below 3', () => {
    expect(() =>
      generateMaze({ ...hallway, hallwayWidth: 2, algorithmId: MAZE_GENERATOR_IDS.backtracking }),
    ).toThrow(/at least 3/)
  })

  it('repeats the same grid for the same seed', () => {
    const first = toAscii(generateMaze({ ...hallway, algorithmId: MAZE_GENERATOR_IDS.wilsons }))
    const second = toAscii(generateMaze({ ...hallway, algorithmId: MAZE_GENERATOR_IDS.wilsons }))
    expect(first).toBe(second)
  })

  it('throws when seed is missing', () => {
    expect(() =>
      generateMaze({ hallwayWidth: 8, hallwayHeight: 6, algorithmId: MAZE_GENERATOR_IDS.prims }),
    ).toThrow(/seed/)
  })
})

describe('golden mazes', () => {
  const perfect = [
    MAZE_GENERATOR_IDS.prims,
    MAZE_GENERATOR_IDS.backtracking,
    MAZE_GENERATOR_IDS.wilsons,
    MAZE_GENERATOR_IDS.kruskals,
    MAZE_GENERATOR_IDS.ellers,
    MAZE_GENERATOR_IDS.growingTree,
    MAZE_GENERATOR_IDS.huntAndKill,
    MAZE_GENERATOR_IDS.sidewinder,
    MAZE_GENERATOR_IDS.binaryTree,
    MAZE_GENERATOR_IDS.recursiveDivision,
    MAZE_GENERATOR_IDS.aldousBroder,
    MAZE_GENERATOR_IDS.dungeonRooms,
  ]

  it.each(perfect)('matches %s and stays connected', (algorithmId) => {
    const grid = generateMaze({ ...hallway, algorithmId })
    expect(toAscii(grid)).toBe(fixture.mazes[algorithmId as keyof typeof fixture.mazes])
    expectOuterWall(grid)
    expect(reachableOpenCount(grid)).toBe(openCount(grid))
  })

  it('rejects a dungeon room outside the grid', () => {
    expect(() =>
      generateMaze({
        ...hallway,
        algorithmId: MAZE_GENERATOR_IDS.dungeonRooms,
        rooms: [{ minX: 1, minY: 1, maxX: 100, maxY: 100 }],
      }),
    ).toThrow(/do not fit the 17×13 grid/)
  })

  it('matches explicit dungeon rooms', () => {
    const grid = generateMaze({
      ...hallway,
      algorithmId: MAZE_GENERATOR_IDS.dungeonRooms,
      huntOrder: MAZE_HUNT_ORDERS.serpentine,
      rooms: [
        { minX: 1, minY: 1, maxX: 5, maxY: 5 },
        { minX: 9, minY: 3, maxX: 13, maxY: 7 },
      ],
    })
    expect(toAscii(grid)).toBe(fixture.mazes['dungeon-rooms-explicit'])
    expectOuterWall(grid)
    expect(reachableOpenCount(grid)).toBe(openCount(grid))
  })

  it('matches sidewinder with a 0.1 skew', () => {
    const grid = generateMaze({
      ...hallway,
      algorithmId: MAZE_GENERATOR_IDS.sidewinder,
      sidewinderSkew: 0.1,
    })
    expect(toAscii(grid)).toBe(fixture.mazes['sidewinder-skew'])
  })

  it('matches the cellular automaton ascii', () => {
    const grid = generateMaze({ ...hallway, algorithmId: MAZE_GENERATOR_IDS.cellularAutomaton })
    expect(toAscii(grid)).toBe(fixture.mazes['cellular-automaton'])
  })

  it('matches transmuters on a Wilson maze', () => {
    const cases = [
      { id: MAZE_TRANSMUTER_IDS.deadEndFiller, deadEndIterations: 3, key: 'dead-end-filler' },
      { id: MAZE_TRANSMUTER_IDS.culdeSacFiller, key: 'cul-de-sac-filler' },
      { id: MAZE_TRANSMUTER_IDS.perturbation, key: 'perturbation' },
    ]
    for (const entry of cases) {
      const grid = generateMaze({ ...hallway, algorithmId: MAZE_GENERATOR_IDS.wilsons })
      transmuteMaze(grid, { seed: 42, transmuterId: entry.id, deadEndIterations: entry.deadEndIterations })
      expect(toAscii(grid)).toBe(fixture.mazes[entry.key as keyof typeof fixture.mazes])
    }
  })
})
