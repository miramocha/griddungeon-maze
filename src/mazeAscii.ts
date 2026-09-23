import { fromPhysicalDimensions, isWall, mazeOpen, mazeWall, setCell, type MazeGrid } from './mazeGrid.ts'

export const defaultWallChar = '#'
export const defaultOpenChar = '.'

export function toAsciiRows(
  grid: MazeGrid,
  wallChar = defaultWallChar,
  openChar = defaultOpenChar,
): string[] {
  const rows: string[] = []
  for (let rowFromNorth = 0; rowFromNorth < grid.height; rowFromNorth += 1) {
    const y = grid.height - 1 - rowFromNorth
    let line = ''
    for (let x = 0; x < grid.width; x += 1) {
      line += isWall(grid, x, y) ? wallChar : openChar
    }
    rows.push(line)
  }
  return rows
}

export function toAscii(
  grid: MazeGrid,
  wallChar = defaultWallChar,
  openChar = defaultOpenChar,
): string {
  return toAsciiRows(grid, wallChar, openChar).join('\n')
}

export function fromNorthUpRows(
  rowsNorthUp: readonly string[],
  wallChar = defaultWallChar,
  openChar = defaultOpenChar,
): MazeGrid {
  if (rowsNorthUp.length === 0) throw new Error('At least one row is required.')
  const height = rowsNorthUp.length
  const width = rowsNorthUp[0]?.length ?? 0
  if (width === 0) throw new Error('Rows must not be empty.')
  const grid = fromPhysicalDimensions(width, height)
  for (let row = 0; row < height; row += 1) {
    const line = rowsNorthUp[row] ?? ''
    if (line.length !== width) {
      throw new Error(`Row ${row} must be ${width} characters (got ${line.length}).`)
    }
    const y = height - 1 - row
    for (let x = 0; x < width; x += 1) {
      const cell = line[x]
      if (cell !== wallChar && cell !== openChar) {
        throw new Error(`Unexpected character '${cell}' at row ${row}, column ${x}.`)
      }
      setCell(grid, x, y, cell === wallChar ? mazeWall : mazeOpen)
    }
  }
  return grid
}
