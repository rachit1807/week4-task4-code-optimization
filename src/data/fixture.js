export function createFixture(size = 2000) {
  const users = Array.from({ length: size }, (_, i) => ({ id: i + 1, name: `Customer ${i + 1}` }));
  const orders = Array.from({ length: size * 4 }, (_, i) => ({ id: i + 1, userId: (i % size) + 1, amount: ((i * 17) % 10000) + 100, status: i % 3 ? 'paid' : 'pending' }));
  return { users, orders };
}
