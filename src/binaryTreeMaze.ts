// Binary Tree maze generator ported from mazelib BinaryTree.py (MIT) —
// https://github.com/john-science/mazelib/blob/main/mazelib/generate/BinaryTree.py

import type { Cell } from './intPairSet.ts'
import { mazeBinaryTreeSkews, type MazeBinaryTreeSkew } from './mazeBinaryTreeSkew.ts'
import { createMazeAlgo } from './mazeGenAlgo.ts'
import { binaryTreeSkewOf, createSeededRandom, type MazeGenerationParams } from './mazeGenerationParams.ts'
import { createFilledWalls, mazeOpen, setCell, type MazeGrid } from './mazeGrid.ts'

function skewOffsets(skew: MazeBinaryTreeSkew): Cell[] {
  if (skew === mazeBinaryTreeSkews.northEast) return [{ x: 1, y: 0 }, { x: 0, y: 1 }]
  if (skew === mazeBinaryTreeSkews.southWest) return [{ x: -1, y: 0 }, { x: 0, y: -1 }]
  if (skew === mazeBinaryTreeSkews.southEast) return [{ x: 1, y: 0 }, { x: 0, y: -1 }]
  return [{ x: -1, y: 0 }, { x: 0, y: 1 }]
}

export function generateBinaryTreeMaze(params: MazeGenerationParams): MazeGrid {
  const algo = createMazeAlgo(params.hallwayWidth, params.hallwayHeight, createSeededRandom(params))
  const offsets = skewOffsets(binaryTreeSkewOf(params))
  const grid = createFilledWalls(algo.hallwayWidth, algo.hallwayHeight)

  for (let y = 1; y < algo.physicalHeight; y += 2) {
    for (let x = 1; x < algo.physicalWidth; x += 2) {
      setCell(grid, x, y, mazeOpen)
      const neighbors: Cell[] = []
      for (const delta of offsets) {
        const neighborX = x + delta.x
        const neighborY = y + delta.y
        if (
          neighborX > 0 &&
          neighborX < algo.physicalWidth - 1 &&
          neighborY > 0 &&
          neighborY < algo.physicalHeight - 1
        ) {
          neighbors.push({ x: neighborX, y: neighborY })
        }
      }
      const neighbor =
        neighbors.length === 0 ? { x, y } : (neighbors[algo.random.nextMax(neighbors.length)] as Cell)
      setCell(grid, neighbor.x, neighbor.y, mazeOpen)
    }
  }
  return grid
}
