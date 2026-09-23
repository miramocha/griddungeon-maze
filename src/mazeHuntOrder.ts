export const mazeHuntOrders = {
  random: 'random',
  serpentine: 'serpentine',
} as const

export type MazeHuntOrder = (typeof mazeHuntOrders)[keyof typeof mazeHuntOrders]
