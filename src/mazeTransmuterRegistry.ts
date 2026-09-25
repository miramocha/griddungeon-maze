import { transmuteCuldeSacFiller } from './culdeSacFiller.ts'
import { transmuteDeadEndFiller } from './deadEndFiller.ts'
import { MAZE_TRANSMUTER_IDS } from './mazeIds.ts'
import type { MazeGrid } from './mazeGrid.ts'
import type { MazeTransmutationParams } from './mazeTransmutationParams.ts'
import { transmutePerturbation } from './perturbationMaze.ts'

const TRANSMUTERS = new Map<string, (grid: MazeGrid, params: MazeTransmutationParams) => void>([
  [MAZE_TRANSMUTER_IDS.culdeSacFiller, transmuteCuldeSacFiller],
  [MAZE_TRANSMUTER_IDS.deadEndFiller, transmuteDeadEndFiller],
  [MAZE_TRANSMUTER_IDS.perturbation, transmutePerturbation],
])

export function registeredTransmuterIds(): string[] {
  return [...TRANSMUTERS.keys()]
}

export function transmuteMaze(grid: MazeGrid, params: MazeTransmutationParams): void {
  const transmuter = TRANSMUTERS.get(params.transmuterId)
  if (!transmuter) {
    throw new Error(`No maze transmuter registered for id '${params.transmuterId}'.`)
  }
  transmuter(grid, params)
}
