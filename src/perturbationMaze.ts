// Perturbation transmuter ported from mazelib Perturbation.py (MIT).

import { createIntPairSet, type Cell, type IntPairSet } from './intPairSet.ts'
import { findLatticeNeighbors, findUnblockedNeighbors, midpoint } from './mazeTransmuteAlgo.ts'
import { createTransmuteRandom, type MazeTransmutationParams } from './mazeTransmutationParams.ts'
import { isOpen, mazeOpen, mazeWall, setCell, type MazeGrid } from './mazeGrid.ts'

function intersects(left: IntPairSet, right: IntPairSet): boolean {
  for (const cell of right.toArray()) {
    if (left.has(cell.x, cell.y)) return true
  }
  return false
}

function joinIntersectingSets(sets: Array<IntPairSet | null>): IntPairSet[] {
  let mergedAny = true
  while (mergedAny) {
    mergedAny = false
    for (let i = 0; i < sets.length - 1; i += 1) {
      const left = sets[i]
      if (!left) continue
      for (let j = i + 1; j < sets.length; j += 1) {
        const right = sets[j]
        if (!right) continue
        if (!intersects(left, right)) continue
        left.unionWith(right)
        sets[j] = null
        mergedAny = true
      }
    }
  }
  return sets.filter((set): set is IntPairSet => set != null)
}

function findAllPassages(grid: MazeGrid, random: ReturnType<typeof createTransmuteRandom>): IntPairSet[] {
  const passages: IntPairSet[] = []
  for (let y = 1; y < grid.height; y += 2) {
    for (let x = 1; x < grid.width; x += 2) {
      const current = createIntPairSet([{ x, y }])
      for (const neighbor of findUnblockedNeighbors(grid, random, x, y)) current.add(neighbor.x, neighbor.y)
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

function tryForceMerge(grid: MazeGrid, random: ReturnType<typeof createTransmuteRandom>, passages: IntPairSet[]): boolean {
  const first = passages[0] as IntPairSet
  for (const cell of first.toArray()) {
    for (const neighbor of findLatticeNeighbors(grid, random, cell.x, cell.y, false)) {
      for (let passageIndex = 1; passageIndex < passages.length; passageIndex += 1) {
        const passage = passages[passageIndex] as IntPairSet
        if (!passage.has(neighbor.x, neighbor.y)) continue
        const mid = midpoint(neighbor, cell)
        setCell(grid, mid.x, mid.y, mazeOpen)
        first.unionWith(passage)
        passages.splice(passageIndex, 1)
        return true
      }
    }
  }
  return false
}

function reconnect(grid: MazeGrid, random: ReturnType<typeof createTransmuteRandom>, passages: IntPairSet[]): void {
  let reconnectAttempts = 0
  const attemptLimit = grid.width * grid.height * 8
  while (passages.length > 1) {
    if (reconnectAttempts > attemptLimit) {
      throw new Error('Perturbation could not reconnect maze passages; grid may not be a valid hallway maze.')
    }
    reconnectAttempts += 1
    let found = false
    const first = passages[0] as IntPairSet
    const cells = first.toArray()
    const cell = cells[random.nextMax(cells.length)] as Cell
    const neighbors = findLatticeNeighbors(grid, random, cell.x, cell.y, false)
    for (let passageIndex = 1; passageIndex < passages.length; passageIndex += 1) {
      const passage = passages[passageIndex] as IntPairSet
      for (const neighbor of neighbors) {
        if (!passage.has(neighbor.x, neighbor.y)) continue
        const mid = midpoint(neighbor, cell)
        setCell(grid, mid.x, mid.y, mazeOpen)
        first.unionWith(passage)
        passages.splice(passageIndex, 1)
        found = true
        break
      }
      if (found) break
    }
    if (!found && !tryForceMerge(grid, random, passages)) {
      throw new Error('Perturbation could not reconnect maze passages; grid may not be a valid hallway maze.')
    }
  }
}

function addRandomWall(grid: MazeGrid, random: ReturnType<typeof createTransmuteRandom>): void {
  const limit = 2 * grid.width * grid.height
  for (let tries = 0; tries <= limit; tries += 1) {
    const y = random.nextRange(1, grid.height - 1)
    let x: number
    if (y % 2 === 0) {
      const oddCount = Math.trunc((grid.width - 2 + 1) / 2)
      x = random.nextMax(oddCount) * 2 + 1
    } else {
      const evenCount = Math.trunc((grid.width - 3) / 2)
      x = evenCount > 0 ? random.nextMax(evenCount) * 2 + 2 : 2
    }
    if (isOpen(grid, x, y)) {
      setCell(grid, x, y, mazeWall)
      return
    }
  }
}

export function transmutePerturbation(grid: MazeGrid, params: MazeTransmutationParams): void {
  const random = createTransmuteRandom(params)
  const repeat = Math.max(1, params.perturbationRepeat ?? 1)
  const newWalls = Math.max(1, params.perturbationNewWalls ?? 1)
  for (let i = 0; i < repeat; i += 1) {
    for (let j = 0; j < newWalls; j += 1) addRandomWall(grid, random)
    reconnect(grid, random, findAllPassages(grid, random))
  }
}
