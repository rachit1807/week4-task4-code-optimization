import { runBenchmark } from '/src/utils/benchmark.js';
self.onmessage = ({ data }) => {
  try { self.postMessage({ result: runBenchmark(data.size, data.rounds) }); }
  catch (error) { self.postMessage({ error: error.message }); }
};
