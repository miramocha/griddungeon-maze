import { isOpen, type MazeGrid } from './mazeGrid.ts'
import { mazeCenter, type MazeShift } from './mazeSpace.ts'
import type { Cell } from './intPairSet.ts'

interface XZ {
  x: number
  z: number
}

const STEP_GUARD = 64
const CROSS_EPS = 1e-4

function openCell(grid: MazeGrid, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= grid.width || y >= grid.height) return false
  return isOpen(grid, x, y)
}

function cellAt(shift: MazeShift, cellM: number, point: XZ): Cell {
  const localX = point.x + shift.x
  const gyFloat = (-point.z - shift.z) / cellM
  return {
    x: Math.floor(localX / cellM + 0.5),
    y: Math.floor(gyFloat + 0.5),
  }
}

function centerOf(shift: MazeShift, cellM: number, cell: Cell): XZ {
  return {
    x: cell.x * cellM - shift.x,
    z: -cell.y * cellM - shift.z,
  }
}

function edgeBlocked(grid: MazeGrid, cell: Cell, axis: 'x' | 'z', dir: number): boolean {
  if (axis === 'x') return !openCell(grid, cell.x + (dir > 0 ? 1 : -1), cell.y)
  return !openCell(grid, cell.x, cell.y + (dir > 0 ? -1 : 1))
}

interface Inset {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

function insetOf(
  grid: MazeGrid,
  shift: MazeShift,
  cellM: number,
  wallSkirt: number,
  cell: Cell,
  bodyRadius: number,
): Inset {
  const center = centerOf(shift, cellM, cell)
  const half = cellM / 2
  const west = !openCell(grid, cell.x - 1, cell.y)
  const east = !openCell(grid, cell.x + 1, cell.y)
  const north = !openCell(grid, cell.x, cell.y + 1)
  const south = !openCell(grid, cell.x, cell.y - 1)
  const pad = bodyRadius + wallSkirt
  let minX = center.x - half + (west ? pad : 0)
  let maxX = center.x + half - (east ? pad : 0)
  let minZ = center.z - half + (north ? pad : 0)
  let maxZ = center.z + half - (south ? pad : 0)
  if (minX > maxX) {
    minX = center.x
    maxX = center.x
  }
  if (minZ > maxZ) {
    minZ = center.z
    maxZ = center.z
  }
  return { minX, maxX, minZ, maxZ }
}

function clampToInset(point: XZ, inset: Inset): XZ {
  return {
    x: Math.min(inset.maxX, Math.max(inset.minX, point.x)),
    z: Math.min(inset.maxZ, Math.max(inset.minZ, point.z)),
  }
}

function nearestOpenCellCenter(
  grid: MazeGrid,
  shift: MazeShift,
  cellM: number,
  wallSkirt: number,
  point: XZ,
  bodyRadius: number,
): XZ {
  let best: XZ | null = null
  let bestCell: Cell | null = null
  let bestDistance = Infinity
  for (let y = 0; y < grid.height; y += 1) {
    for (let x = 0; x < grid.width; x += 1) {
      if (!openCell(grid, x, y)) continue
      const center = centerOf(shift, cellM, { x, y })
      const dx = center.x - point.x
      const dz = center.z - point.z
      const distance = dx * dx + dz * dz
      if (distance < bestDistance) {
        bestDistance = distance
        best = center
        bestCell = { x, y }
      }
    }
  }
  if (!best || !bestCell) return { x: point.x, z: point.z }
  return clampToInset(best, insetOf(grid, shift, cellM, wallSkirt, bestCell, bodyRadius))
}

function settle(
  grid: MazeGrid,
  shift: MazeShift,
  cellM: number,
  wallSkirt: number,
  point: XZ,
  bodyRadius: number,
): XZ {
  const cell = cellAt(shift, cellM, point)
  if (!openCell(grid, cell.x, cell.y)) {
    return nearestOpenCellCenter(grid, shift, cellM, wallSkirt, point, bodyRadius)
  }
  return clampToInset(point, insetOf(grid, shift, cellM, wallSkirt, cell, bodyRadius))
}

function slide(
  grid: MazeGrid,
  shift: MazeShift,
  cellM: number,
  wallSkirt: number,
  pos: XZ,
  delta: number,
  axis: 'x' | 'z',
  bodyRadius: number,
): XZ {
  let cursor = pos
  let remaining = delta
  for (let guard = 0; guard < STEP_GUARD && Math.abs(remaining) > 1e-6; guard += 1) {
    const cell = cellAt(shift, cellM, cursor)
    if (!openCell(grid, cell.x, cell.y)) return settle(grid, shift, cellM, wallSkirt, cursor, bodyRadius)
    const inset = insetOf(grid, shift, cellM, wallSkirt, cell, bodyRadius)
    const dir = Math.sign(remaining)
    const value = axis === 'x' ? cursor.x : cursor.z
    const limit = axis === 'x' ? (dir > 0 ? inset.maxX : inset.minX) : dir > 0 ? inset.maxZ : inset.minZ
    const target = value + remaining
    const hitsLimit = dir > 0 ? target > limit : target < limit
    if (!hitsLimit) {
      return axis === 'x' ? { x: target, z: cursor.z } : { x: cursor.x, z: target }
    }
    if (edgeBlocked(grid, cell, axis, dir)) {
      return axis === 'x' ? { x: limit, z: cursor.z } : { x: cursor.x, z: limit }
    }
    const center = centerOf(shift, cellM, cell)
    const half = cellM / 2
    const edge = axis === 'x' ? center.x + dir * half : center.z + dir * half
    const next = edge + dir * CROSS_EPS
    const crossed = next - value
    if (Math.abs(crossed) > Math.abs(remaining)) {
      return axis === 'x' ? { x: target, z: cursor.z } : { x: cursor.x, z: target }
    }
    cursor = axis === 'x' ? { x: next, z: cursor.z } : { x: cursor.x, z: next }
    remaining -= crossed
  }
  return cursor
}

/** Slide `from` toward `to`, stopping on the near blocked edge. `wallSkirt` is meters. */
export function clampMazeStep(
  grid: MazeGrid,
  cellM: number,
  wallSkirt: number,
  from: XZ,
  to: XZ,
  bodyRadius: number,
): XZ {
  const shift = mazeCenter(grid, cellM)
  const origin = cellAt(shift, cellM, from)
  const start = settle(grid, shift, cellM, wallSkirt, from, bodyRadius)
  if (!openCell(grid, origin.x, origin.y) && from.x === to.x && from.z === to.z) return start
  const afterX = slide(grid, shift, cellM, wallSkirt, start, to.x - start.x, 'x', bodyRadius)
  return slide(grid, shift, cellM, wallSkirt, afterX, to.z - afterX.z, 'z', bodyRadius)
}

/** True when the circle reaches a blocked edge, including from inside an open cell. */
export function mazeBlocksCircle(
  grid: MazeGrid,
  cellM: number,
  wallSkirt: number,
  x: number,
  z: number,
  radius: number,
): boolean {
  const shift = mazeCenter(grid, cellM)
  const cell = cellAt(shift, cellM, { x, z })
  if (!openCell(grid, cell.x, cell.y)) return true
  const center = centerOf(shift, cellM, cell)
  const half = cellM / 2
  const reach = radius + wallSkirt
  if (!openCell(grid, cell.x + 1, cell.y) && center.x + half - x < reach) return true
  if (!openCell(grid, cell.x - 1, cell.y) && x - (center.x - half) < reach) return true
  if (!openCell(grid, cell.x, cell.y - 1) && center.z + half - z < reach) return true
  if (!openCell(grid, cell.x, cell.y + 1) && z - (center.z - half) < reach) return true
  return false
}

export function mazeSegmentBlocked(
  grid: MazeGrid,
  cellM: number,
  wallSkirt: number,
  from: XZ,
  to: XZ,
  radius: number,
): boolean {
  if (mazeBlocksCircle(grid, cellM, wallSkirt, from.x, from.z, radius)) return true
  if (mazeBlocksCircle(grid, cellM, wallSkirt, to.x, to.z, radius)) return true
  const dx = to.x - from.x
  const dz = to.z - from.z
  const length = Math.hypot(dx, dz)
  if (length < 1e-6) return false
  const step = Math.min(0.05, Math.max(radius, 0.02))
  const count = Math.ceil(length / step)
  for (let index = 1; index < count; index += 1) {
    const t = index / count
    if (mazeBlocksCircle(grid, cellM, wallSkirt, from.x + dx * t, from.z + dz * t, radius)) return true
  }
  return false
}
