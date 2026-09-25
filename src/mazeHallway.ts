// Hallway counts map to the algorithm bitmap. Floor fitting stays out of this package.

export const MIN_HALLWAY_DIMENSION = 3

export function physicalWidth(hallwayWidth: number): number {
  return 2 * hallwayWidth + 1
}

export function physicalHeight(hallwayHeight: number): number {
  return 2 * hallwayHeight + 1
}

export function validateHallway(hallwayWidth: number, hallwayHeight: number): void {
  if (hallwayWidth < MIN_HALLWAY_DIMENSION) {
    throw new Error(`Hallway width must be at least ${MIN_HALLWAY_DIMENSION}.`)
  }
  if (hallwayHeight < MIN_HALLWAY_DIMENSION) {
    throw new Error(`Hallway height must be at least ${MIN_HALLWAY_DIMENSION}.`)
  }
}
