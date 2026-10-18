import { createFixture } from '../data/fixture.js';
import { summarizeLegacy } from '../legacy/legacyController.js';
import { summarizeOptimized } from '../controllers/optimizedController.js';
export function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}
export function runBenchmark(size = 2000, rounds = 7) {
  if (!Number.isInteger(size) || size < 100 || size > 10000) throw new RangeError('Customer count must be 100–10,000.');
  if (!Number.isInteger(rounds) || rounds < 3 || rounds > 15) throw new RangeError('Rounds must be 3–15.');
  const data = createFixture(size);
  const functions = { legacy: summarizeLegacy, optimized: summarizeOptimized };
  for (const fn of Object.values(functions)) for (let i = 0; i < 3; i++) fn(data);
  const samples = { legacy: [], optimized: [] };
  let expected;
  for (let round = 0; round < rounds; round++) {
    for (const name of round % 2 ? ['optimized', 'legacy'] : ['legacy', 'optimized']) {
      const start = performance.now();
      const result = functions[name](data);
      samples[name].push(performance.now() - start);
      const serialized = JSON.stringify(result);
      expected ??= serialized;
      if (serialized !== expected) throw new Error('Output equivalence failed');
    }
  }
  const legacy = median(samples.legacy);
  const optimized = median(samples.optimized);
  return { id: Date.now(), timestamp: new Date().toISOString(), size, orders: data.orders.length, rounds, legacy, optimized, speedup: legacy / optimized, reduction: (1 - optimized / legacy) * 100, equivalent: true, samples };
}
