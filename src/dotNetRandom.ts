// Legacy System.Random(int) subtractive generator (Knuth). Matches `new Random(seed)`
// on .NET, including the seeded constructor kept for compatibility after .NET 6.

const mbig = 2147483647
const mseed = 161803398

export type DotNetRandom = {
  next(): number
  nextMax(maxValue: number): number
  nextRange(minValue: number, maxValue: number): number
  nextDouble(): number
}

export function createDotNetRandom(seed: number): DotNetRandom {
  const seedArray = new Int32Array(56)
  const subtraction = seed === -2147483648 ? mbig : Math.abs(seed)
  let mj = mseed - subtraction
  seedArray[55] = mj
  let mk = 1
  for (let i = 1; i < 55; i += 1) {
    const ii = (21 * i) % 55
    seedArray[ii] = mk
    mk = mj - mk
    if (mk < 0) mk += mbig
    mj = seedArray[ii]!
  }
  for (let k = 1; k < 5; k += 1) {
    for (let i = 1; i < 56; i += 1) {
      seedArray[i] = (seedArray[i] ?? 0) - (seedArray[1 + ((i + 30) % 55)] ?? 0)
      if ((seedArray[i] ?? 0) < 0) seedArray[i] = (seedArray[i] ?? 0) + mbig
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
    if (retVal === mbig) retVal -= 1
    if (retVal < 0) retVal += mbig
    seedArray[locINext] = retVal
    inext = locINext
    inextp = locINextp
    return retVal
  }

  function sample(): number {
    return internalSample() * (1 / mbig)
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
