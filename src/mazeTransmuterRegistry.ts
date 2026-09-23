import { transmuteCuldeSacFiller } from './culdeSacFiller.ts'
import { transmuteDeadEndFiller } from './deadEndFiller.ts'
import { mazeTransmuterIds } from './mazeIds.ts'
import type { MazeGrid } from './mazeGrid.ts'
import type { MazeTransmutationParams } from './mazeTransmutationParams.ts'
import { transmutePerturbation } from './perturbationMaze.ts'

const transmuters = new Map<string, (grid: MazeGrid, params: MazeTransmutationParams) => void>([
  [mazeTransmuterIds.culdeSacFiller, transmuteCuldeSacFiller],
  [mazeTransmuterIds.deadEndFiller, transmuteDeadEndFiller],
  [mazeTransmuterIds.perturbation, transmutePerturbation],
])

export function registeredTransmuterIds(): string[] {
  return [...transmuters.keys()]
}

export function transmuteMaze(grid: MazeGrid, params: MazeTransmutationParams): void {
  const transmuter = transmuters.get(params.transmuterId)
  if (!transmuter) {
    throw new Error(`No maze transmuter registered for id '${params.transmuterId}'.`)
  }
  transmuter(grid, params)
}
