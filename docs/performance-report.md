# Performance report

Measured: 2026-10-18T04:32:10.625Z

## Environment
- Node: v24.19.0
- Platform: darwin 27.0.0 arm64
- CPU: Apple M4
- Explicit garbage collection: true

## Workload and baseline
This project starts with a deliberately preserved sample legacy commerce summarizer, not a refactor of a third-party production application. Both versions summarize 5,000 customers and 20,000 deterministic orders. Pending orders are excluded and amounts use integer cents.

| Metric | Legacy | Optimized |
|---|---:|---:|
| Median latency | 73.7368 ms | 0.7017 ms |
| Complexity | O(customers × orders) | O(customers + orders) |
| Mean observed heap delta | 2050167 bytes | 1922744 bytes |
| Output rows | 5000 | 5000 |

Observed speed multiplier: **105.09×**. Observed latency reduction: **99.05%**. All measured outputs are identical. These are measurements on this machine, not performance guarantees.

## Methodology
Three warm-ups per implementation, followed by 11 measured rounds alternating execution order. Timing uses performance.now(). Fixture generation and serialized output comparison happen outside the timed interval. Median latency is reported; raw timing samples and all memory readings are in benchmark-results.json.

Memory uses seven separate invocations per implementation, recording process.memoryUsage().heapUsed immediately before and after each call. Explicit GC runs before each memory sample when launched through npm run benchmark. Heap deltas reflect allocations and garbage collection; they are neither peak memory nor retained-memory measurements. A negative delta can occur due to runtime GC. The Map trades an O(customers) index for less repeated filtering; lower memory consumption is not guaranteed. Browser results intentionally omit memory.

## Refactoring findings
1. The baseline filters all orders once per customer and allocates temporary filtered arrays. The optimized controller aggregates paid orders into a Map in one pass and joins customers in a second pass.
2. Nested repository callbacks are replaced by a reusable error-first callback adapter and async/await. Independent reads use Promise.all; both synchronous throws and callback errors become rejections.
3. Fixture creation, orchestration, aggregation, timing and presentation have distinct modules.
4. No live SQL database is used. A production query should aggregate with GROUP BY user_id and inspect an appropriate index using EXPLAIN; no database speed improvement is claimed here.

## Reproduce
Run npm ci, npm test, npm run lint, then npm run benchmark. Run npm run profile to produce a Node CPU profile under work/ for inspection in developer tools. Browser results vary with hardware, browser, thermal state and background activity. Correctness tests assert equivalence and edge cases; they deliberately do not assert a speed threshold.
