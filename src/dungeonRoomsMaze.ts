// Dungeon rooms maze generator ported from mazelib DungeonRooms.py (MIT) —
// https://github.com/john-science/mazelib/blob/main/mazelib/generate/DungeonRooms.py

import type { DotNetRandom } from './dotNetRandom.ts'
import { createIntPairSet, type Cell, type IntPairSet } from './intPairSet.ts'
import {
  carvePassageBetween,
  createMazeAlgo,
  findNeighbors,
  randomOddCorridorCell,
  shuffle,
  type MazeAlgo,
} from './mazeGenAlgo.ts'
import { createSeededRandom, huntOrderOf, type MazeGenerationParams } from './mazeGenerationParams.ts'
import { mazeHuntOrders } from './mazeHuntOrder.ts'
import { physicalHeight, physicalWidth } from './mazeHallway.ts'
import { createFilledWalls, isOpen, isWall, mazeOpen, setCell, type MazeGrid } from './mazeGrid.ts'
import type { MazeRoomRect } from './mazeRoomRect.ts'

function createDefaultRooms(hallwayWidth: number, hallwayHeight: number, random: DotNetRandom): MazeRoomRect[] {
  const width = physicalWidth(hallwayWidth)
  const height = physicalHeight(hallwayHeight)
  const roomCount = random.nextRange(2, 5)
  const rooms: MazeRoomRect[] = []
  let attempts = 0
  while (rooms.length < roomCount && attempts < 200) {
    attempts += 1
    const maxWidthCells = Math.min(7, hallwayWidth * 2 - 1)
    const maxHeightCells = Math.min(7, hallwayHeight * 2 - 1)
    if (maxWidthCells < 3 || maxHeightCells < 3) continue
    const widthCells = random.nextMax(Math.trunc((maxWidthCells - 1) / 2) + 1) * 2 + 1
    const heightCells = random.nextMax(Math.trunc((maxHeightCells - 1) / 2) + 1) * 2 + 1
    const maxMinX = width - widthCells - 1
    const maxMinY = height - heightCells - 1
    if (maxMinX < 1 || maxMinY < 1) continue
    const minX = random.nextMax(Math.trunc(maxMinX / 2) + 1) * 2 + 1
    const minY = random.nextMax(Math.trunc(maxMinY / 2) + 1) * 2 + 1
    const maxX = minX + widthCells - 1
    const maxY = minY + heightCells - 1
    if (maxX > width - 2 || maxY > height - 2) continue
    rooms.push({ minX, minY, maxX, maxY })
  }
  return rooms
}

function isInsideGrid(room: MazeRoomRect, grid: MazeGrid): boolean {
  return (
    room.minX >= 0 &&
    room.minY >= 0 &&
    room.maxX < grid.width &&
    room.maxY < grid.height &&
    room.minX <= room.maxX &&
    room.minY <= room.maxY
  )
}

function carveRoom(room: MazeRoomRect, grid: MazeGrid): void {
  for (let y = room.minY; y <= room.maxY; y += 1) {
    for (let x = room.minX; x <= room.maxX; x += 1) setCell(grid, x, y, mazeOpen)
  }
}

function collectOddValues(min: number, max: number): number[] {
  const values: number[] = []
  for (let value = min; value <= max; value += 1) {
    if (value % 2 === 1) values.push(value)
  }
  return values
}

function carveDoor(room: MazeRoomRect, grid: MazeGrid, random: DotNetRandom): void {
  if (room.minX % 2 === 0 || room.minY % 2 === 0 || room.maxX % 2 === 0 || room.maxY % 2 === 0) return
  const doors: Cell[] = []
  const oddXs = collectOddValues(room.minX - 1, room.maxX + 1)
  const oddYs = collectOddValues(room.minY - 1, room.maxY + 1)
  if (room.maxY < grid.height - 2) for (const x of oddXs) doors.push({ x, y: room.maxY + 1 })
  if (room.minY > 1) for (const x of oddXs) doors.push({ x, y: room.minY - 1 })
  if (room.minX > 1) for (const y of oddYs) doors.push({ x: room.minX - 1, y })
  if (room.maxX < grid.width - 2) for (const y of oddYs) doors.push({ x: room.maxX + 1, y })
  if (doors.length === 0) return
  const door = doors[random.nextMax(doors.length)] as Cell
  setCell(grid, door.x, door.y, mazeOpen)
}

function findUnblocked(algo: MazeAlgo, grid: MazeGrid, x: number, y: number): Cell[] {
  const neighbors: Cell[] = []
  if (y > 1 && isOpen(grid, x, y - 1) && isOpen(grid, x, y - 2)) neighbors.push({ x, y: y - 2 })
  if (y < algo.physicalHeight - 2 && isOpen(grid, x, y + 1) && isOpen(grid, x, y + 2)) {
    neighbors.push({ x, y: y + 2 })
  }
  if (x > 1 && isOpen(grid, x - 1, y) && isOpen(grid, x - 2, y)) neighbors.push({ x: x - 2, y })
  if (x < algo.physicalWidth - 2 && isOpen(grid, x + 1, y) && isOpen(grid, x + 2, y)) {
    neighbors.push({ x: x + 2, y })
  }
  shuffle(algo.random, neighbors)
  return neighbors
}

function intersects(left: IntPairSet, right: IntPairSet): boolean {
  for (const cell of right.toArray()) {
    if (left.has(cell.x, cell.y)) return true
  }
  return false
}

function joinIntersectingSets(sets: Array<IntPairSet | null>): IntPairSet[] {
  for (let i = 0; i < sets.length - 1; i += 1) {
    const left = sets[i]
    if (!left) continue
    for (let j = i + 1; j < sets.length; j += 1) {
      const right = sets[j]
      if (!right) continue
      if (!intersects(left, right)) continue
      left.unionWith(right)
      sets[j] = null
    }
  }
  return sets.filter((set): set is IntPairSet => set != null)
}

function findAllPassages(algo: MazeAlgo, grid: MazeGrid): IntPairSet[] {
  const passages: IntPairSet[] = []
  for (let y = 1; y < algo.physicalHeight; y += 2) {
    for (let x = 1; x < algo.physicalWidth; x += 2) {
      const current = createIntPairSet([{ x, y }])
      for (const neighbor of findUnblocked(algo, grid, x, y)) current.add(neighbor.x, neighbor.y)
      let found = false
      for (const passage of passages) {
        if (!intersects(passage, current)) continue
        passage.unionWith(current)
        found = true
        break
      }
      if (!found) passages.push(current)
    }
  }
  return joinIntersectingSets(passages)
}

function pickRandomCell(algo: MazeAlgo, cells: IntPairSet): Cell {
  let pick = algo.random.nextMax(cells.size)
  for (const cell of cells.toArray()) {
    if (pick === 0) return cell
    pick -= 1
  }
  throw new Error('Passage set was empty.')
}

function fixDisjointPassages(algo: MazeAlgo, grid: MazeGrid, disjointPassages: IntPairSet[]): void {
  while (disjointPassages.length > 1) {
    const first = disjointPassages[0] as IntPairSet
    const attemptLimit = first.size * disjointPassages.length
    let attempts = 0
    let found = false
    while (!found) {
      attempts += 1
      if (attempts > attemptLimit) {
        throw new Error(
          `DungeonRooms reconnect exhausted after ${attemptLimit} attempts (${algo.physicalWidth}x${algo.physicalHeight}, ${disjointPassages.length} disjoint passages).`,
        )
      }
      const cell = pickRandomCell(algo, first)
      const neighbors = findNeighbors(algo, cell.x, cell.y, grid, false)
      for (let passageIndex = 1; passageIndex < disjointPassages.length; passageIndex += 1) {
        const passage = disjointPassages[passageIndex] as IntPairSet
        for (const neighbor of neighbors) {
          if (!passage.has(neighbor.x, neighbor.y)) continue
          setCell(
            grid,
            Math.trunc((neighbor.x + cell.x) / 2),
            Math.trunc((neighbor.y + cell.y) / 2),
            mazeOpen,
          )
          first.unionWith(passage)
          disjointPassages.splice(passageIndex, 1)
          found = true
          break
        }
        if (found) break
      }
    }
  }
}

export function generateDungeonRoomsMaze(params: MazeGenerationParams): MazeGrid {
  const random = createSeededRandom(params)
  const rooms =
    params.rooms && params.rooms.length > 0
      ? params.rooms
      : createDefaultRooms(params.hallwayWidth, params.hallwayHeight, random)
  const algo = createMazeAlgo(params.hallwayWidth, params.hallwayHeight, random)
  const serpentine = huntOrderOf(params) === mazeHuntOrders.serpentine
  const grid = createFilledWalls(algo.hallwayWidth, algo.hallwayHeight)

  for (const [index, room] of rooms.entries()) {
    if (!isInsideGrid(room, grid)) {
      throw new Error(
        `Room ${index + 1} bounds (${room.minX}, ${room.minY})–(${room.maxX}, ${room.maxY}) do not fit the ${grid.width}×${grid.height} grid.`,
      )
    }
    carveRoom(room, grid)
    carveDoor(room, grid, algo.random)
  }

  let current = { x: -1, y: -1 }
  const limit = algo.physicalHeight * algo.physicalWidth * 2
  for (let attempt = 0; attempt < limit; attempt += 1) {
    const cell = randomOddCorridorCell(algo)
    if (isWall(grid, cell.x, cell.y)) {
      current = cell
      break
    }
  }
  if (current.x < 0) throw new Error('DungeonRooms could not find a wall cell outside carved rooms.')
  setCell(grid, current.x, current.y, mazeOpen)

  let huntTrials = 0
  while (current.x >= 0) {
    if (isOpen(grid, current.x, current.y)) {
      let x = current.x
      let y = current.y
      let unvisited = findNeighbors(algo, x, y, grid, true)
      while (unvisited.length > 0) {
        const neighbor = unvisited[0] as Cell
        setCell(grid, neighbor.x, neighbor.y, mazeOpen)
        carvePassageBetween(x, y, neighbor.x, neighbor.y, grid)
        x = neighbor.x
        y = neighbor.y
        unvisited = findNeighbors(algo, x, y, grid, true)
      }
    }
    const trial = huntTrials
    huntTrials += 1
    if (serpentine) {
      let x = 1
      let y = 1
      let next = { x: -1, y: -1 }
      while (true) {
        x += 2
        if (x > algo.physicalWidth - 2) {
          x = 1
          y += 2
        }
        if (y > algo.physicalHeight - 2) break
        if (isOpen(grid, x, y) && findNeighbors(algo, x, y, grid, true).length > 0) {
          next = { x, y }
          break
        }
      }
      current = next
    } else if (trial >= algo.physicalHeight * algo.physicalWidth) {
      current = { x: -1, y: -1 }
    } else {
      current = randomOddCorridorCell(algo)
    }
  }

  fixDisjointPassages(algo, grid, findAllPassages(algo, grid))
  return grid
}
