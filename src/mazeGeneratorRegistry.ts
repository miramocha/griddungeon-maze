import { generateAldousBroderMaze } from './aldousBroderMaze.ts'
import { generateBacktrackingMaze } from './backtrackingMaze.ts'
import { generateBinaryTreeMaze } from './binaryTreeMaze.ts'
import { generateCellularAutomatonMaze } from './cellularAutomatonMaze.ts'
import { generateDungeonRoomsMaze } from './dungeonRoomsMaze.ts'
import { generateEllersMaze } from './ellersMaze.ts'
import { generateGrowingTreeMaze } from './growingTreeMaze.ts'
import { generateHuntAndKillMaze } from './huntAndKillMaze.ts'
import { mazeGeneratorIds } from './mazeIds.ts'
import type { MazeGenerationParams } from './mazeGenerationParams.ts'
import type { MazeGrid } from './mazeGrid.ts'
import { generateKruskalsMaze } from './kruskalsMaze.ts'
import { generatePrimsMaze } from './primsMaze.ts'
import { generateRecursiveDivisionMaze } from './recursiveDivisionMaze.ts'
import { generateSidewinderMaze } from './sidewinderMaze.ts'
import { generateWilsonsMaze } from './wilsonsMaze.ts'

const generators = new Map<string, (params: MazeGenerationParams) => MazeGrid>([
  [mazeGeneratorIds.prims, generatePrimsMaze],
  [mazeGeneratorIds.backtracking, generateBacktrackingMaze],
  [mazeGeneratorIds.dungeonRooms, generateDungeonRoomsMaze],
  [mazeGeneratorIds.binaryTree, generateBinaryTreeMaze],
  [mazeGeneratorIds.sidewinder, generateSidewinderMaze],
  [mazeGeneratorIds.growingTree, generateGrowingTreeMaze],
  [mazeGeneratorIds.kruskals, generateKruskalsMaze],
  [mazeGeneratorIds.ellers, generateEllersMaze],
  [mazeGeneratorIds.huntAndKill, generateHuntAndKillMaze],
  [mazeGeneratorIds.wilsons, generateWilsonsMaze],
  [mazeGeneratorIds.aldousBroder, generateAldousBroderMaze],
  [mazeGeneratorIds.recursiveDivision, generateRecursiveDivisionMaze],
  [mazeGeneratorIds.cellularAutomaton, generateCellularAutomatonMaze],
])

export function registeredAlgorithmIds(): string[] {
  return [...generators.keys()]
}

export function generateMaze(params: MazeGenerationParams): MazeGrid {
  const generator = generators.get(params.algorithmId)
  if (!generator) {
    throw new Error(`No maze generator registered for algorithm id '${params.algorithmId}'.`)
  }
  return generator(params)
}
