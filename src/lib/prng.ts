/**
 * Deterministic Seeded Pseudo-Random Number Generator (PRNG)
 * Uses FNV-1a 32-bit hashing combined with Mulberry32.
 * Keyed strictly on (vehicle_id, day_index, trip_index, salt).
 */

export function fnv1a32(str: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export class SeededPRNG {
  private state: number;

  constructor(seed: number | string) {
    if (typeof seed === "string") {
      this.state = fnv1a32(seed);
    } else {
      this.state = seed >>> 0;
    }
  }

  /**
   * Produces a pseudo-random float in [0, 1)
   */
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Random float between [min, max]
   */
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /**
   * Random integer between [min, max] (inclusive)
   */
  int(min: number, max: number): number {
    const minInt = Math.ceil(min);
    const maxInt = Math.floor(max);
    return Math.floor(minInt + this.next() * (maxInt - minInt + 1));
  }

  /**
   * Pick one item from an array with uniform probability
   */
  pick<T>(items: T[]): T {
    if (items.length === 0) {
      throw new Error("Cannot pick from empty array");
    }
    const idx = Math.floor(this.next() * items.length);
    return items[idx];
  }

  /**
   * Weighted random choice among items with associated weights
   */
  weightedChoice<T>(choices: { item: T; weight: number }[]): T {
    const totalWeight = choices.reduce((acc, c) => acc + c.weight, 0);
    if (totalWeight <= 0) {
      return choices[0].item;
    }
    let threshold = this.next() * totalWeight;
    for (const choice of choices) {
      if (threshold <= choice.weight) {
        return choice.item;
      }
      threshold -= choice.weight;
    }
    return choices[choices.length - 1].item;
  }
}

/**
 * Creates a PRNG instance for a vehicle on a specific day and optional trip index
 */
export function createPRNG(
  vehicleId: string,
  dayIndex: number,
  tripIndex: number = 0,
  salt: string = ""
): SeededPRNG {
  const seedString = `${vehicleId}:${dayIndex}:${tripIndex}:${salt}`;
  return new SeededPRNG(seedString);
}
