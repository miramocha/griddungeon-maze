import { describe, expect, it } from 'vitest'
import { createDotNetRandom } from './dotNetRandom.ts'
import { createIntPairSet } from './intPairSet.ts'
import fixture from './mazeGolden.fixture.json' with { type: 'json' }

describe('dotNetRandom', () => {
  it('matches dotnet 10.0.11 new Random(42)', () => {
    const random = createDotNetRandom(fixture.seed)
    expect(Array.from({ length: fixture.next.length }, () => random.next())).toEqual(fixture.next)
    expect(Array.from({ length: fixture.nextMax.length }, () => random.nextMax(10))).toEqual(fixture.nextMax)
    expect(Array.from({ length: fixture.nextRange.length }, () => random.nextRange(3, 9))).toEqual(
      fixture.nextRange,
    )
    for (const value of fixture.nextDouble) {
      expect(random.nextDouble()).toBe(Number(value))
    }
  })

  it('rejects a seed outside int32', () => {
    expect(() => createDotNetRandom(2147483648)).toThrow(/32-bit integer/)
    expect(() => createDotNetRandom(-2147483649)).toThrow(/32-bit integer/)
    expect(() => createDotNetRandom(1.5)).toThrow(/32-bit integer/)
    expect(() => createDotNetRandom(-2147483648)).not.toThrow()
  })
})

describe('int pair set', () => {
  it('enumerates in add order, including union', () => {
    const set = createIntPairSet([
      { x: 5, y: 1 },
      { x: 1, y: 9 },
      { x: 3, y: 3 },
    ])
    set.add(1, 9)
    set.add(8, 2)
    expect(set.toArray().map((cell) => [cell.x, cell.y])).toEqual(fixture.setOrder)
    const other = createIntPairSet([
      { x: 8, y: 2 },
      { x: 4, y: 4 },
      { x: 5, y: 1 },
      { x: 2, y: 6 },
    ])
    set.unionWith(other)
    expect(set.toArray().map((cell) => [cell.x, cell.y])).toEqual(fixture.unionOrder)
  })
})
