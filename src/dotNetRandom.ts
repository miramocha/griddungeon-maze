// Legacy System.Random(int) subtractive generator (Knuth). Matches `new Random(seed)`
// on .NET, including the seeded constructor kept for compatibility after .NET 6.

const MBIG = 2147483647
const MSEED = 161803398
const INT32_MIN = -2147483648
const INT32_MAX = 2147483647

export interface DotNetRandom {
  next(): number
  nextMax(maxValue: number): number
  nextRange(minValue: number, maxValue: number): number
  nextDouble(): number
}

export function createDotNetRandom(seed: number): DotNetRandom {
  if (!Number.isInteger(seed) || seed < INT32_MIN || seed > INT32_MAX) {
    throw new Error('Seed must be a 32-bit integer.')
  }
  const seedArray = new Int32Array(56)
  const subtraction = seed === INT32_MIN ? MBIG : Math.abs(seed)
  let mj = MSEED - subtraction
  seedArray[55] = mj
  let mk = 1
  for (let i = 1; i < 55; i += 1) {
    const ii = (21 * i) % 55
    seedArray[ii] = mk
    mk = mj - mk
    if (mk < 0) mk += MBIG
    mj = seedArray[ii]!
  }
  for (let k = 1; k < 5; k += 1) {
    for (let i = 1; i < 56; i += 1) {
      seedArray[i] = (seedArray[i] ?? 0) - (seedArray[1 + ((i + 30) % 55)] ?? 0)
      if ((seedArray[i] ?? 0) < 0) seedArray[i] = (seedArray[i] ?? 0) + MBIG
    }
  }
  let inext = 0
  let inextp = 21

  function internalSample(): number {
    let locINext = inext
    let locINextp = inextp
    locINext += 1
    if (locINext >= 56) locINext = 1
    locINextp += 1
    if (locINextp >= 56) locINextp = 1
    let retVal = (seedArray[locINext] ?? 0) - (seedArray[locINextp] ?? 0)
    if (retVal === MBIG) retVal -= 1
    if (retVal < 0) retVal += MBIG
    seedArray[locINext] = retVal
    inext = locINext
    inextp = locINextp
    return retVal
  }

  function sample(): number {
    return internalSample() * (1 / MBIG)
  }

  return {
    next: () => internalSample(),
    nextMax(maxValue: number) {
      if (maxValue < 0) throw new Error('maxValue must be non-negative.')
      return Math.trunc(sample() * maxValue)
    },
    nextRange(minValue: number, maxValue: number) {
      if (minValue > maxValue) throw new Error('minValue must be less than or equal to maxValue.')
      const range = maxValue - minValue
      return Math.trunc(sample() * range) + minValue
    },
    nextDouble: () => sample(),
  }
}
