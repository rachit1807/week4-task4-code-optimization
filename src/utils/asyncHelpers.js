/** Adapt an error-first callback while preserving thrown errors and receiver context. */
export function promisifyCallback(fn, receiver) {
  return (...args) => new Promise((resolve, reject) => {
    fn.call(receiver, ...args, (error, value) => error ? reject(error) : resolve(value));
  });
}
export async function loadData(repository) {
  const getUsers = promisifyCallback(repository.getUsers, repository);
  const getOrders = promisifyCallback(repository.getOrders, repository);
  const [users, orders] = await Promise.all([getUsers(), getOrders()]);
  return { users, orders };
}
