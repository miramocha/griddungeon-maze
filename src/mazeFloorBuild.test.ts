import { describe, expect, it } from 'vitest'
import { buildMazeFloor } from './mazeFloorBuild.ts'
import { MAZE_GENERATOR_IDS, MAZE_TRANSMUTER_IDS } from './mazeIds.ts'
import { isOpen } from './mazeGrid.ts'
import { placeFloorPortals } from './floorPortals.ts'

const generation = {
  algorithmId: MAZE_GENERATOR_IDS.backtracking,
  seed: 7,
  hallwayWidth: 5,
  hallwayHeight: 5,
}

describe('buildMazeFloor', () => {
  it('matches generate then place when nothing else is set', () => {
    const floor = buildMazeFloor({ generation })
    expect(floor.portals).toEqual(placeFloorPortals(floor.grid))
    expect(isOpen(floor.grid, floor.portals.entrance.x, floor.portals.entrance.y)).toBe(true)
  })

  it('keeps an entrance and exit override and the placed distance', () => {
    const plain = buildMazeFloor({ generation })
    const floor = buildMazeFloor({
      generation,
      portalOverride: { entrance: { x: 1, y: 1 }, exit: { x: 3, y: 1 } },
    })
    expect(floor.portals.entrance).toEqual({ x: 1, y: 1 })
    expect(floor.portals.exit).toEqual({ x: 3, y: 1 })
    expect(floor.portals.distance).toBe(plain.portals.distance)
  })

  it('runs perturbation before portals and fillers after', () => {
    const perturbed = buildMazeFloor({
      generation,
      transmutation: {
        seed: 7,
        transmuterId: MAZE_TRANSMUTER_IDS.perturbation,
        perturbationRepeat: 1,
        perturbationNewWalls: 1,
      },
    })
    const filled = buildMazeFloor({
      generation,
      transmutation: { seed: 7, transmuterId: MAZE_TRANSMUTER_IDS.deadEndFiller, deadEndIterations: 1 },
    })
    expect(isOpen(perturbed.grid, perturbed.portals.entrance.x, perturbed.portals.entrance.y)).toBe(true)
    expect(isOpen(perturbed.grid, perturbed.portals.exit.x, perturbed.portals.exit.y)).toBe(true)
    expect(isOpen(filled.grid, filled.portals.entrance.x, filled.portals.entrance.y)).toBe(true)
    expect(isOpen(filled.grid, filled.portals.exit.x, filled.portals.exit.y)).toBe(true)
  })
})
