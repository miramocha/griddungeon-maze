export const mazeBinaryTreeSkews = {
  northWest: 'north-west',
  northEast: 'north-east',
  southWest: 'south-west',
  southEast: 'south-east',
} as const

export type MazeBinaryTreeSkew = (typeof mazeBinaryTreeSkews)[keyof typeof mazeBinaryTreeSkews]
