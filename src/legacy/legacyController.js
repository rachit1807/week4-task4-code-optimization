/** Preserved baseline: repeatedly scans all orders for each customer. */
export function summarizeLegacy({ users, orders }) {
  return users.map(user => {
    const paid = orders.filter(order => order.userId === user.id && order.status === 'paid');
    return { id: user.id, name: user.name, orderCount: paid.length, totalCents: paid.reduce((sum, order) => sum + order.amount, 0) };
  });
}
export function loadLegacy(repository, callback) {
  repository.getUsers((error, users) => {
    if (error) return callback(error);
    repository.getOrders((error, orders) => {
      if (error) return callback(error);
      callback(null, summarizeLegacy({ users, orders }));
    });
  });
}
