import { writeFile, mkdir } from 'node:fs/promises';
import os from 'node:os';
import { runBenchmark } from '../src/utils/benchmark.js';
import { createFixture } from '../src/data/fixture.js';
import { summarizeLegacy } from '../src/legacy/legacyController.js';
import { summarizeOptimized } from '../src/controllers/optimizedController.js';
await mkdir('docs', { recursive: true });
const result = runBenchmark(5000, 11);
const fixture = createFixture(5000);
const memory = {};
for (const [name, fn] of Object.entries({ legacy: summarizeLegacy, optimized: summarizeOptimized })) {
  const samples = [];
  for (let i = 0; i < 7; i++) {
    global.gc?.(); const before = process.memoryUsage().heapUsed;
    const output = fn(fixture); const after = process.memoryUsage().heapUsed;
    samples.push({ heapBefore: before, heapAfter: after, heapDelta: after - before, rows: output.length });
  }
  memory[name] = samples;
}
const environment = { node: process.version, platform: `${os.platform()} ${os.release()} ${os.arch()}`, cpu: os.cpus()[0].model, explicitGC: Boolean(global.gc) };
await writeFile('docs/benchmark-results.json', JSON.stringify({ environment, ...result, memory }, null, 2) + '\n');
const avg = name => Math.round(memory[name].reduce((sum, sample) => sum + sample.heapDelta, 0) / memory[name].length);
const report = `# Performance report\n\nMeasured: ${result.timestamp}\n\n## Environment\n- Node: ${environment.node}\n- Platform: ${environment.platform}\n- CPU: ${environment.cpu}\n- Explicit garbage collection: ${environment.explicitGC}\n\n## Workload and baseline\nThis project starts with a deliberately preserved sample legacy commerce summarizer, not a refactor of a third-party production application. Both versions summarize ${result.size.toLocaleString('en-US')} customers and ${result.orders.toLocaleString('en-US')} deterministic orders. Pending orders are excluded and amounts use integer cents.\n\n| Metric | Legacy | Optimized |\n|---|---:|---:|\n| Median latency | ${result.legacy.toFixed(4)} ms | ${result.optimized.toFixed(4)} ms |\n| Complexity | O(customers × orders) | O(customers + orders) |\n| Mean observed heap delta | ${avg('legacy')} bytes | ${avg('optimized')} bytes |\n| Output rows | ${result.size} | ${result.size} |\n\nObserved speed multiplier: **${result.speedup.toFixed(2)}×**. Observed latency reduction: **${result.reduction.toFixed(2)}%**. All measured outputs are identical. These are measurements on this machine, not performance guarantees.\n\n## Methodology\nThree warm-ups per implementation, followed by ${result.rounds} measured rounds alternating execution order. Timing uses performance.now(). Fixture generation and serialized output comparison happen outside the timed interval. Median latency is reported; raw timing samples and all memory readings are in benchmark-results.json.\n\nMemory uses seven separate invocations per implementation, recording process.memoryUsage().heapUsed immediately before and after each call. Explicit GC runs before each memory sample when launched through npm run benchmark. Heap deltas reflect allocations and garbage collection; they are neither peak memory nor retained-memory measurements. A negative delta can occur due to runtime GC. The Map trades an O(customers) index for less repeated filtering; lower memory consumption is not guaranteed. Browser results intentionally omit memory.\n\n## Refactoring findings\n1. The baseline filters all orders once per customer and allocates temporary filtered arrays. The optimized controller aggregates paid orders into a Map in one pass and joins customers in a second pass.\n2. Nested repository callbacks are replaced by a reusable error-first callback adapter and async/await. Independent reads use Promise.all; both synchronous throws and callback errors become rejections.\n3. Fixture creation, orchestration, aggregation, timing and presentation have distinct modules.\n4. No live SQL database is used. A production query should aggregate with GROUP BY user_id and inspect an appropriate index using EXPLAIN; no database speed improvement is claimed here.\n\n## Reproduce\nRun npm ci, npm test, npm run lint, then npm run benchmark. Run npm run profile to produce a Node CPU profile under work/ for inspection in developer tools. Browser results vary with hardware, browser, thermal state and background activity. Correctness tests assert equivalence and edge cases; they deliberately do not assert a speed threshold.\n`;
await writeFile('docs/performance-report.md', report);
console.log(JSON.stringify({ legacyMs: result.legacy, optimizedMs: result.optimized, speedup: result.speedup, reduction: result.reduction, environment }, null, 2));
