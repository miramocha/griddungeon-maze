import { createDotNetRandom, type DotNetRandom } from './dotNetRandom.ts'

export interface MazeTransmutationParams {
  seed?: number | null
  transmuterId: string
  deadEndIterations?: number
  perturbationRepeat?: number
  perturbationNewWalls?: number
  startX?: number | null
  startY?: number | null
  endX?: number | null
  endY?: number | null
}

export function createTransmuteRandom(params: MazeTransmutationParams): DotNetRandom {
  if (params.seed == null) {
    throw new Error('MazeTransmutationParams.seed must be set for deterministic transmutation.')
  }
  return createDotNetRandom(params.seed)
}
