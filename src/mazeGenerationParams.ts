import { createDotNetRandom, type DotNetRandom } from './dotNetRandom.ts'
import { MAZE_BINARY_TREE_SKEWS, type MazeBinaryTreeSkew } from './mazeBinaryTreeSkew.ts'
import { MAZE_HUNT_ORDERS, type MazeHuntOrder } from './mazeHuntOrder.ts'
import type { MazeRoomRect } from './mazeRoomRect.ts'

export interface MazeGenerationParams {
  seed?: number | null
  hallwayWidth: number
  hallwayHeight: number
  algorithmId: string
  rooms?: readonly MazeRoomRect[]
  huntOrder?: MazeHuntOrder
  binaryTreeSkew?: MazeBinaryTreeSkew
  xSkew?: number
  ySkew?: number
  backtrackChance?: number
  sidewinderSkew?: number
  cellularComplexity?: number
  cellularDensity?: number
}

export function createSeededRandom(params: MazeGenerationParams): DotNetRandom {
  if (params.seed == null) {
    throw new Error('MazeGenerationParams.seed must be set for deterministic generation.')
  }
  return createDotNetRandom(params.seed)
}

export function huntOrderOf(params: MazeGenerationParams): MazeHuntOrder {
  return params.huntOrder ?? MAZE_HUNT_ORDERS.random
}

export function binaryTreeSkewOf(params: MazeGenerationParams): MazeBinaryTreeSkew {
  return params.binaryTreeSkew ?? MAZE_BINARY_TREE_SKEWS.northWest
}

export function clamp01f(value: number): number {
  const rounded = Math.fround(value)
  if (rounded < 0) return 0
  if (rounded > 1) return 1
  return rounded
}
