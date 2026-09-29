import { placeFloorPortals, type FloorPortals } from './floorPortals.ts'
import type { Cell } from './intPairSet.ts'
import { generateMaze } from './mazeGeneratorRegistry.ts'
import { MAZE_TRANSMUTER_IDS } from './mazeIds.ts'
import type { MazeGenerationParams } from './mazeGenerationParams.ts'
import type { MazeGrid } from './mazeGrid.ts'
import type { MazeTransmutationParams } from './mazeTransmutationParams.ts'
import { transmuteMaze } from './mazeTransmuterRegistry.ts'

export interface MazeFloorPortalOverride {
  entrance: Cell
  exit: Cell
}

export interface MazeFloorRequest {
  generation: MazeGenerationParams
  transmutation?: MazeTransmutationParams | null
  portalOverride?: MazeFloorPortalOverride | null
}

export interface MazeFloor {
  grid: MazeGrid
  portals: FloorPortals
}

/** Generate, then perturbation, then portals, then any other transmute. */
export function buildMazeFloor(request: MazeFloorRequest): MazeFloor {
  const grid = generateMaze(request.generation)
  const transmute = request.transmutation
  if (transmute?.transmuterId === MAZE_TRANSMUTER_IDS.perturbation) transmuteMaze(grid, transmute)
  const placed = placeFloorPortals(grid)
  const override = request.portalOverride
  const portals: FloorPortals = override
    ? { entrance: { ...override.entrance }, exit: { ...override.exit }, distance: placed.distance }
    : placed
  if (transmute && transmute.transmuterId !== MAZE_TRANSMUTER_IDS.perturbation) {
    transmuteMaze(grid, {
      ...transmute,
      startX: portals.entrance.x,
      startY: portals.entrance.y,
      endX: portals.exit.x,
      endY: portals.exit.y,
    })
  }
  return { grid, portals }
}
