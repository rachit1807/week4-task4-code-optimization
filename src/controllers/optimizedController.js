import { loadData } from '../utils/asyncHelpers.js';
/** One pass builds an index; another joins customers, avoiding repeated scans. */
export function summarizeOptimized({ users, orders }) {
  const totals = new Map();
  for (const order of orders) {
    if (order.status !== 'paid') continue;
    const entry = totals.get(order.userId) ?? { orderCount: 0, totalCents: 0 };
    entry.orderCount += 1;
    entry.totalCents += order.amount;
    totals.set(order.userId, entry);
  }
  return users.map(user => ({ id: user.id, name: user.name, ...(totals.get(user.id) ?? { orderCount: 0, totalCents: 0 }) }));
}
export async function loadOptimized(repository) {
  return summarizeOptimized(await loadData(repository));
}
