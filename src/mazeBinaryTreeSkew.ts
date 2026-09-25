export const MAZE_BINARY_TREE_SKEWS = {
  northWest: 'north-west',
  northEast: 'north-east',
  southWest: 'south-west',
  southEast: 'south-east',
} as const

export type MazeBinaryTreeSkew = (typeof MAZE_BINARY_TREE_SKEWS)[keyof typeof MAZE_BINARY_TREE_SKEWS]
