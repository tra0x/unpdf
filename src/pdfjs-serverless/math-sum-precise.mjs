// The finite summation algorithm is adapted from math.sumprecise v1.0.1,
// distributed under the MIT License. See THIRD_PARTY_LICENSES.md.
// https://github.com/es-shims/Math.sumPrecise

const MAX_DOUBLE = 1.7976931348623157e+308
const PENULTIMATE_DOUBLE = 1.7976931348623155e+308
const TWO_TO_1023 = 8.98846567431158e+307
const MAX_ULP = MAX_DOUBLE - PENULTIMATE_DOUBLE

function twoSum(x, y) {
  const hi = x + y
  const lo = y - (hi - x)
  return { hi, lo }
}

function sumFinite(values) {
  const partials = []
  let overflow = 0

  for (let x of values) {
    let usedPartials = 0

    for (let y of partials) {
      if (Math.abs(x) < Math.abs(y)) {
        [x, y] = [y, x]
      }

      let { hi, lo } = twoSum(x, y)
      if (Math.abs(hi) === Infinity) {
        const sign = hi === Infinity ? 1 : -1
        overflow += sign
        if (Math.abs(overflow) >= 2 ** 53) {
          throw new RangeError('Math.sumPrecise overflow')
        }

        x = (x - sign * TWO_TO_1023) - sign * TWO_TO_1023
        if (Math.abs(x) < Math.abs(y)) {
          [x, y] = [y, x]
        }
        ;({ hi, lo } = twoSum(x, y))
      }

      if (lo !== 0) {
        partials[usedPartials++] = lo
      }
      x = hi
    }

    partials.length = usedPartials
    if (x !== 0) {
      partials.push(x)
    }
  }

  let index = partials.length - 1
  let hi = 0
  let lo = 0

  if (overflow !== 0) {
    const next = index >= 0 ? partials[index--] : 0
    if (
      Math.abs(overflow) > 1
      || (overflow > 0 && next > 0)
      || (overflow < 0 && next < 0)
    ) {
      return overflow > 0 ? Infinity : -Infinity
    }

    ;({ hi, lo } = twoSum(overflow * TWO_TO_1023, next / 2))
    lo *= 2
    if (Math.abs(2 * hi) === Infinity) {
      if (hi > 0) {
        if (
          hi === TWO_TO_1023
          && lo === -(MAX_ULP / 2)
          && index >= 0
          && partials[index] < 0
        ) {
          return MAX_DOUBLE
        }
        return Infinity
      }
      if (
        hi === -TWO_TO_1023
        && lo === MAX_ULP / 2
        && index >= 0
        && partials[index] > 0
      ) {
        return -MAX_DOUBLE
      }
      return -Infinity
    }

    if (lo !== 0) {
      partials[++index] = lo
      lo = 0
    }
    hi *= 2
  }

  while (index >= 0) {
    ;({ hi, lo } = twoSum(hi, partials[index--]))
    if (lo !== 0) {
      break
    }
  }

  if (
    index >= 0
    && (
      (lo < 0 && partials[index] < 0)
      || (lo > 0 && partials[index] > 0)
    )
  ) {
    const twiceLo = lo * 2
    const rounded = hi + twiceLo
    if (twiceLo === rounded - hi) {
      hi = rounded
    }
  }

  return hi
}

export function sumPrecise(items) {
  const values = []
  let state = 'minus-zero'

  for (const value of items) {
    if (typeof value !== 'number') {
      throw new TypeError('Math.sumPrecise only accepts numbers')
    }

    if (state === 'not-a-number') {
      continue
    }
    if (Number.isNaN(value)) {
      state = 'not-a-number'
    }
    else if (value === Infinity) {
      state = state === 'minus-infinity' ? 'not-a-number' : 'plus-infinity'
    }
    else if (value === -Infinity) {
      state = state === 'plus-infinity' ? 'not-a-number' : 'minus-infinity'
    }
    else if (!Object.is(value, -0) && (state === 'minus-zero' || state === 'finite')) {
      state = 'finite'
      values.push(value)
    }
  }

  if (state === 'not-a-number')
    return NaN
  if (state === 'plus-infinity')
    return Infinity
  if (state === 'minus-infinity')
    return -Infinity
  if (state === 'minus-zero')
    return -0
  return sumFinite(values)
}
