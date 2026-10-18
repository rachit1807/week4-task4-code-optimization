<div align="center">

# Refactor Lab ↗
### Make every operation count.

A performance workbench that turns code refactoring into a measurable experiment.

![JavaScript](https://img.shields.io/badge/JavaScript-ES_Modules-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-22%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS-663399?style=for-the-badge&logo=css&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-4B32C3?style=for-the-badge&logo=eslint&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)

**Week 4 · Task 4 — Code Refactoring and Optimization**

</div>

## What it does

Refactor Lab compares two implementations of a commerce backend operation: summarizing paid orders for each customer. A preserved legacy version repeatedly scans the order collection. The optimized version aggregates orders into a Map and joins customers in a separate pass.

The project includes a working Node.js server, shared ES modules, callback-to-async/await refactoring, unit tests, repeatable timing and memory reports, and a responsive browser workbench. The baseline is an intentionally inefficient sample created for this exercise; it is not a claimed refactor of an existing production system.

## Features

- **Live benchmarks:** choose 100–10,000 customers and 5, 7 or 11 rounds; four deterministic orders are generated per customer.
- **Responsive workbench:** desktop sidebar, compact mobile navigation, readable comparison charts and touch-friendly controls.
- **Light and dark themes:** theme preference persists locally.
- **Background execution:** a Web Worker runs benchmarks without blocking navigation.
- **Code explorer:** inspect the actual legacy and optimized source modules.
- **Run history:** the last 20 runs stay in local browser storage; export or clear them.
- **Markdown reports:** download timings, environment details, methodology and raw samples.
- **Correctness checks:** every benchmark compares complete outputs outside the timed interval.
- **Node profiling:** timing, observed heap deltas, and optional CPU profiles.
- **Accessible controls:** labeled inputs, keyboard focus, skip navigation, reduced-motion support and announced run status.

## Run locally

Requires **Node.js 22 or later** and npm.

```bash
git clone https://github.com/rachit1807/week4-task4-code-optimization.git
cd week4-task4-code-optimization
npm ci
npm start
```

Open **http://localhost:3000**. For automatic server restarts, use `npm run dev`. Set `PORT` to change the listening port.

There are no production package dependencies, database credentials, or API keys. Optional Google Fonts load over the network; system fonts are the fallback. Run data stays on the device.

## Quality and measurement

```bash
npm test                 # Unit tests and error propagation checks
npm run lint             # ESLint across the project
npm run benchmark        # Rebuild timing and memory reports
npm run profile          # Write a CPU profile under work/
```

The checked-in [performance report](docs/performance-report.md) records the exact environment and observed results. [Raw measurements](docs/benchmark-results.json) include every timing sample and heap reading. Rerunning the benchmark overwrites both reports with fresh results.

The measured reference run with 5,000 customers and 20,000 orders observed **73.7368 ms → 0.7017 ms** median latency, approximately **105.09×** faster and **99.05%** lower latency. Results vary by machine and runtime; these values are not service guarantees.

### Measurement method

1. Generate the same deterministic fixture for both implementations.
2. Warm up each implementation three times.
3. Alternate measured execution order for 11 Node rounds.
4. Time only the summarization with `performance.now()`.
5. Compare complete serialized outputs after timing.
6. Report medians and preserve raw samples.
7. Separately record seven heap samples per implementation, with explicit garbage collection before each sample when supported.

Heap deltas describe observed allocation changes, **not peak or retained memory**. The Map introduces its own index; lower memory usage is not guaranteed. Browser reports omit memory because portable, reliable browser heap measurements are unavailable.

## Refactoring decisions

| Area | Before | After |
|---|---|---|
| Order lookup | Full order scan per customer | One aggregation pass plus Map lookup |
| Runtime complexity | O(customers × orders) | O(customers + orders) |
| Async orchestration | Nested error-first callbacks | Reusable adapter, async/await, Promise.all |
| Error handling | Repeated callback branches | Rejections propagate to caller |
| Organization | Coupled data loading and calculation | Separate fixture, helpers, controllers and benchmark engine |
| Verification | Baseline output | Equivalence checks plus edge-case tests |

Independent repository reads start together. The adapter preserves the method receiver, converts callback errors to promise rejections, and catches synchronous throws through the Promise executor. Tests cover failures from both reads, empty collections, pending orders, missing customers, integer totals and input immutability.

### Database scope

This application uses in-memory fixtures and does not claim measured SQL optimization. In a production database, aggregate paid orders with `GROUP BY user_id`, select only needed columns, and inspect an index on user ID/status with the query planner. Measure actual query plans before adopting an index.

## Structure

```text
public/
  index.html               Responsive interface
  styles.css               Themes and responsive layout
  app.js                   Navigation, history, exports and controls
  worker.js                Background benchmark worker
src/
  controllers/optimizedController.js
  legacy/legacyController.js
  data/fixture.js
  utils/asyncHelpers.js
  utils/benchmark.js
scripts/benchmark.js       Node timing and memory report generator
tests/refactor.test.js      Regression and error-handling tests
docs/
  performance-report.md
  benchmark-results.json
server.js                  Dependency-free Node HTTP server
eslint.config.js
.github/workflows/ci.yml
```

## Deploy

The Node server binds to `0.0.0.0` and reads the platform-provided `PORT`.

| Setting | Value |
|---|---|
| Runtime | Node.js |
| Build | `npm ci` |
| Start | `npm start` |
| Health check | `/api/health` |

The health endpoint returns `{"status":"ok"}`. The browser loads shared source modules from `/src/`, so keep the Node server or preserve this route in an alternative host. History is browser-local; there is no cross-device account or database.

## Assignment checklist

- [x] Preserved, profiled legacy baseline
- [x] Modular optimized controller and async helpers
- [x] Reduced loop complexity
- [x] Before/after timing and memory report
- [x] Automated regression tests
- [x] Consistent ESLint configuration
- [x] Responsive interface and persistent theme toggle
- [x] Reproduction and deployment instructions

## Author

[Rachit Tripathi](https://github.com/rachit1807)

## License

MIT — see [LICENSE](LICENSE).
