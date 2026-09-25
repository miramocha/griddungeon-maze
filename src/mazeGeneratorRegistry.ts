import { generateAldousBroderMaze } from './aldousBroderMaze.ts'
import { generateBacktrackingMaze } from './backtrackingMaze.ts'
import { generateBinaryTreeMaze } from './binaryTreeMaze.ts'
import { generateCellularAutomatonMaze } from './cellularAutomatonMaze.ts'
import { generateDungeonRoomsMaze } from './dungeonRoomsMaze.ts'
import { generateEllersMaze } from './ellersMaze.ts'
import { generateGrowingTreeMaze } from './growingTreeMaze.ts'
import { generateHuntAndKillMaze } from './huntAndKillMaze.ts'
import { MAZE_GENERATOR_IDS } from './mazeIds.ts'
import type { MazeGenerationParams } from './mazeGenerationParams.ts'
import type { MazeGrid } from './mazeGrid.ts'
import { generateKruskalsMaze } from './kruskalsMaze.ts'
import { generatePrimsMaze } from './primsMaze.ts'
import { generateRecursiveDivisionMaze } from './recursiveDivisionMaze.ts'
import { generateSidewinderMaze } from './sidewinderMaze.ts'
import { generateWilsonsMaze } from './wilsonsMaze.ts'

const GENERATORS = new Map<string, (params: MazeGenerationParams) => MazeGrid>([
  [MAZE_GENERATOR_IDS.prims, generatePrimsMaze],
  [MAZE_GENERATOR_IDS.backtracking, generateBacktrackingMaze],
  [MAZE_GENERATOR_IDS.dungeonRooms, generateDungeonRoomsMaze],
  [MAZE_GENERATOR_IDS.binaryTree, generateBinaryTreeMaze],
  [MAZE_GENERATOR_IDS.sidewinder, generateSidewinderMaze],
  [MAZE_GENERATOR_IDS.growingTree, generateGrowingTreeMaze],
  [MAZE_GENERATOR_IDS.kruskals, generateKruskalsMaze],
  [MAZE_GENERATOR_IDS.ellers, generateEllersMaze],
  [MAZE_GENERATOR_IDS.huntAndKill, generateHuntAndKillMaze],
  [MAZE_GENERATOR_IDS.wilsons, generateWilsonsMaze],
  [MAZE_GENERATOR_IDS.aldousBroder, generateAldousBroderMaze],
  [MAZE_GENERATOR_IDS.recursiveDivision, generateRecursiveDivisionMaze],
  [MAZE_GENERATOR_IDS.cellularAutomaton, generateCellularAutomatonMaze],
])

export function registeredAlgorithmIds(): string[] {
  return [...GENERATORS.keys()]
}

export function generateMaze(params: MazeGenerationParams): MazeGrid {
  const generator = GENERATORS.get(params.algorithmId)
  if (!generator) {
    throw new Error(`No maze generator registered for algorithm id '${params.algorithmId}'.`)
  }
  return generator(params)
}
