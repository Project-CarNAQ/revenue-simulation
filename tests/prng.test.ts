import { describe, it, expect } from "vitest";
import { fnv1a32, SeededPRNG, createPRNG } from "../src/lib/prng";

describe("Seeded PRNG", () => {
  it("fnv1a32 generates consistent 32-bit hashes", () => {
    const hash1 = fnv1a32("test-seed-1");
    const hash2 = fnv1a32("test-seed-1");
    const hash3 = fnv1a32("test-seed-2");

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(typeof hash1).toBe("number");
  });

  it("produces identical random sequences for the same seed", () => {
    const prng1 = new SeededPRNG("seed-alpha");
    const prng2 = new SeededPRNG("seed-alpha");

    const seq1 = [prng1.next(), prng1.next(), prng1.next()];
    const seq2 = [prng2.next(), prng2.next(), prng2.next()];

    expect(seq1).toEqual(seq2);
  });

  it("produces different random sequences for different seeds", () => {
    const prng1 = new SeededPRNG("seed-alpha");
    const prng2 = new SeededPRNG("seed-beta");

    expect(prng1.next()).not.toEqual(prng2.next());
  });

  it("createPRNG consistently keys on (vehicle_id, day_index, trip_index)", () => {
    const vId = "11111111-2222-3333-4444-555555555555";
    const p1 = createPRNG(vId, 14, 2);
    const p2 = createPRNG(vId, 14, 2);
    const p3 = createPRNG(vId, 14, 3);

    expect(p1.next()).toEqual(p2.next());
    expect(p1.next()).not.toEqual(p3.next());
  });

  it("range, int, and weightedChoice respect bounds and weights", () => {
    const prng = new SeededPRNG(42);

    for (let i = 0; i < 50; i++) {
      const val = prng.range(5, 10);
      expect(val).toBeGreaterThanOrEqual(5);
      expect(val).toBeLessThanOrEqual(10);

      const intVal = prng.int(1, 4);
      expect([1, 2, 3, 4]).toContain(intVal);
    }

    const choice = prng.weightedChoice([
      { item: "rare", weight: 0 },
      { item: "always", weight: 100 },
    ]);
    expect(choice).toBe("always");
  });
});
