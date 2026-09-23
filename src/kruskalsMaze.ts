// Kruskal's maze generator ported from mazelib Kruskal.py (MIT) —
// https://github.com/john-science/mazelib/blob/main/mazelib/generate/Kruskal.py

import type { Cell } from './intPairSet.ts'
import { createMazeAlgo, shuffle } from './mazeGenAlgo.ts'
import { createSeededRandom, type MazeGenerationParams } from './mazeGenerationParams.ts'
import { createFilledWalls, mazeOpen, setCell, type MazeGrid } from './mazeGrid.ts'

export function generateKruskalsMaze(params: MazeGenerationParams): MazeGrid {
  const algo = createMazeAlgo(params.hallwayWidth, params.hallwayHeight, createSeededRandom(params))
  const cellCount = algo.hallwayWidth * algo.hallwayHeight
  const parent = new Int32Array(cellCount)
  const rank = new Int32Array(cellCount)
  for (let i = 0; i < cellCount; i += 1) parent[i] = i

  const grid = createFilledWalls(algo.hallwayWidth, algo.hallwayHeight)
  for (let y = 1; y < algo.physicalHeight - 1; y += 2) {
    for (let x = 1; x < algo.physicalWidth - 1; x += 2) setCell(grid, x, y, mazeOpen)
  }

  const edges: Cell[] = []
  for (let y = 2; y < algo.physicalHeight - 1; y += 2) {
    for (let x = 1; x < algo.physicalWidth - 1; x += 2) edges.push({ x, y })
  }
  for (let y = 1; y < algo.physicalHeight - 1; y += 2) {
    for (let x = 2; x < algo.physicalWidth - 1; x += 2) edges.push({ x, y })
  }
  shuffle(algo.random, edges)

  const cellIndex = (x: number, y: number) =>
    Math.trunc((y - 1) / 2) * algo.hallwayWidth + Math.trunc((x - 1) / 2)

  const find = (index: number): number => {
    const current = parent[index] ?? index
    if (current !== index) parent[index] = find(current)
    return parent[index] ?? index
  }

  const union = (leftRoot: number, rightRoot: number) => {
    const leftRank = rank[leftRoot] ?? 0
    const rightRank = rank[rightRoot] ?? 0
    if (leftRank < rightRank) {
      parent[leftRoot] = rightRoot
      return
    }
    if (leftRank > rightRank) {
      parent[rightRoot] = leftRoot
      return
    }
    parent[rightRoot] = leftRoot
    rank[leftRoot] = leftRank + 1
  }

  let disjointSets = cellCount
  for (const edge of edges) {
    const vertical = edge.y % 2 === 0
    const cellA = vertical
      ? { x: edge.x, y: edge.y - 1 }
      : { x: edge.x - 1, y: edge.y }
    const cellB = vertical
      ? { x: edge.x, y: edge.y + 1 }
      : { x: edge.x + 1, y: edge.y }
    const rootA = find(cellIndex(cellA.x, cellA.y))
    const rootB = find(cellIndex(cellB.x, cellB.y))
    if (rootA === rootB) continue
    union(rootA, rootB)
    disjointSets -= 1
    setCell(grid, edge.x, edge.y, mazeOpen)
    if (disjointSets <= 1) break
  }
  return grid
}
