export const MAZE_HUNT_ORDERS = {
  random: 'random',
  serpentine: 'serpentine',
} as const

export type MazeHuntOrder = (typeof MAZE_HUNT_ORDERS)[keyof typeof MAZE_HUNT_ORDERS]
