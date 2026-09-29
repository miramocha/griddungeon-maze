import type { FloorPortals } from './floorPortals.ts'
import { isOpen, type MazeGrid } from './mazeGrid.ts'
import type { MazeShift } from './mazeSpace.ts'

export interface MazeMinimapBits {
  width: number
  height: number
  /** 1 = open. Row-major, index = y * width + x. */
  open: Uint8Array
  entrance: { x: number; y: number }
  exit: { x: number; y: number }
}

export interface MazeMapPoint {
  x: number
  y: number
}

export function mazeMinimapBits(grid: MazeGrid, portals: FloorPortals): MazeMinimapBits {
  const open = new Uint8Array(grid.width * grid.height)
  for (let y = 0; y < grid.height; y += 1) {
    for (let x = 0; x < grid.width; x += 1) {
      if (isOpen(grid, x, y)) open[y * grid.width + x] = 1
    }
  }
  return {
    width: grid.width,
    height: grid.height,
    open,
    entrance: { x: portals.entrance.x, y: portals.entrance.y },
    exit: { x: portals.exit.x, y: portals.exit.y },
  }
}

/** Normalized map point. North is the top. Cell origins sit on the painted cell center. */
export function mazeMinimapPoint(
  map: Pick<MazeMinimapBits, 'width' | 'height'>,
  cellM: number,
  shift: MazeShift,
  x: number,
  z: number,
): MazeMapPoint {
  const gx = (x + shift.x) / cellM
  const gy = (-z - shift.z) / cellM
  return {
    x: (gx + 0.5) / map.width,
    y: (map.height - gy - 0.5) / map.height,
  }
}
