export const MAZE_GENERATOR_IDS = {
  prims: 'prims',
  backtracking: 'backtracking',
  dungeonRooms: 'dungeon-rooms',
  ellers: 'ellers',
  huntAndKill: 'hunt-and-kill',
  wilsons: 'wilsons',
  kruskals: 'kruskals',
  growingTree: 'growing-tree',
  sidewinder: 'sidewinder',
  binaryTree: 'binary-tree',
  recursiveDivision: 'recursive-division',
  aldousBroder: 'aldous-broder',
  cellularAutomaton: 'cellular-automaton',
} as const

export const MAZE_TRANSMUTER_IDS = {
  culdeSacFiller: 'cul-de-sac-filler',
  deadEndFiller: 'dead-end-filler',
  perturbation: 'perturbation',
} as const

export type MazeGeneratorId = (typeof MAZE_GENERATOR_IDS)[keyof typeof MAZE_GENERATOR_IDS]
export type MazeTransmuterId = (typeof MAZE_TRANSMUTER_IDS)[keyof typeof MAZE_TRANSMUTER_IDS]
