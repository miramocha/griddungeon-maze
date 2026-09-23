export const mazeGeneratorIds = {
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

export const mazeTransmuterIds = {
  culdeSacFiller: 'cul-de-sac-filler',
  deadEndFiller: 'dead-end-filler',
  perturbation: 'perturbation',
} as const

export type MazeGeneratorId = (typeof mazeGeneratorIds)[keyof typeof mazeGeneratorIds]
export type MazeTransmuterId = (typeof mazeTransmuterIds)[keyof typeof mazeTransmuterIds]
