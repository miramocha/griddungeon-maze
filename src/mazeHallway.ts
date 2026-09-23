// Hallway counts map to the algorithm bitmap. Floor fitting stays out of this package.

export const minHallwayDimension = 3

export function physicalWidth(hallwayWidth: number): number {
  return 2 * hallwayWidth + 1
}

export function physicalHeight(hallwayHeight: number): number {
  return 2 * hallwayHeight + 1
}

export function validateHallway(hallwayWidth: number, hallwayHeight: number): void {
  if (hallwayWidth < minHallwayDimension) {
    throw new Error(`Hallway width must be at least ${minHallwayDimension}.`)
  }
  if (hallwayHeight < minHallwayDimension) {
    throw new Error(`Hallway height must be at least ${minHallwayDimension}.`)
  }
}
