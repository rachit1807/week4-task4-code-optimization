import test from 'node:test';
import assert from 'node:assert/strict';
import { createFixture } from '../src/data/fixture.js';
import { summarizeLegacy, loadLegacy } from '../src/legacy/legacyController.js';
import { summarizeOptimized, loadOptimized } from '../src/controllers/optimizedController.js';
import { promisifyCallback } from '../src/utils/asyncHelpers.js';
import { median, runBenchmark } from '../src/utils/benchmark.js';
test('optimized summaries preserve baseline for multiple dataset sizes', () => {
  for (const size of [1, 10, 100, 1000]) { const data = createFixture(size); assert.deepEqual(summarizeOptimized(data), summarizeLegacy(data)); }
});
test('handles empty data, pending orders, missing customers and integer cents', () => {
  assert.deepEqual(summarizeOptimized({ users: [], orders: [] }), []);
  const data = { users: [{ id: 1, name: 'A' }, { id: 2, name: 'B' }], orders: [{ userId: 1, status: 'paid', amount: 1299 }, { userId: 1, status: 'paid', amount: 100 }, { userId: 2, status: 'pending', amount: 999 }, { userId: 99, status: 'paid', amount: 200 }] };
  assert.deepEqual(summarizeOptimized(data), [{ id: 1, name: 'A', orderCount: 2, totalCents: 1399 }, { id: 2, name: 'B', orderCount: 0, totalCents: 0 }]);
});
test('does not mutate input', () => { const data = createFixture(20); const copy = structuredClone(data); summarizeOptimized(data); assert.deepEqual(data, copy); });
test('async adapter preserves receiver and propagates synchronous exceptions', async () => {
  const receiver = { value: 42, read(callback) { callback(null, this.value); } };
  assert.equal(await promisifyCallback(receiver.read, receiver)(), 42);
  await assert.rejects(promisifyCallback(() => { throw new Error('sync'); })(), /sync/);
});
test('async refactor matches legacy repository output', async () => {
  const data = createFixture(30); const repository = { getUsers(cb) { queueMicrotask(() => cb(null, data.users)); }, getOrders(cb) { queueMicrotask(() => cb(null, data.orders)); } };
  const legacy = await new Promise((resolve, reject) => loadLegacy(repository, (err, value) => err ? reject(err) : resolve(value)));
  assert.deepEqual(await loadOptimized(repository), legacy);
});
test('rejects failures from either repository method', async () => {
  for (const fail of ['getUsers', 'getOrders']) { const repository = { getUsers(cb) { cb(null, []); }, getOrders(cb) { cb(null, []); } }; repository[fail] = cb => cb(new Error('repository failed')); await assert.rejects(loadOptimized(repository), /repository failed/); }
});
test('both independent reads start before either completes', async () => {
  const pending = []; const repository = { getUsers(cb) { pending.push(() => cb(null, [])); }, getOrders(cb) { pending.push(() => cb(null, [])); } };
  const promise = loadOptimized(repository); assert.equal(pending.length, 2); pending.forEach(done => done()); await promise;
});
test('benchmark validates input and records real equivalent samples', () => {
  assert.throws(() => runBenchmark(0), RangeError); assert.throws(() => runBenchmark(100, 0), RangeError);
  assert.equal(median([9, 1, 3]), 3); const result = runBenchmark(100, 3); assert.equal(result.samples.legacy.length, 3); assert.equal(result.equivalent, true); assert.ok(result.legacy > 0); assert.ok(result.optimized > 0);
});
